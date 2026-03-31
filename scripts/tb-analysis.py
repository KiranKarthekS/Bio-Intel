from flask import Flask, request, jsonify
import os
import tempfile
from Bio import SeqIO
from Bio.Seq import Seq
from Bio.SeqUtils import GC
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import streamlit as st

app = Flask(__name__)

def get_first_sequence(uploaded_file, max_bases=100000):
    """
    Extract first DNA sequence from FASTA or FASTQ file uploaded in Streamlit.
    Reads only the first record (to handle very large files).
    """
    try:
        # Save uploaded file to a temporary path
        with tempfile.NamedTemporaryFile(delete=False, suffix=".seq") as tmp:
            tmp.write(uploaded_file.getvalue())
            tmp_path = tmp.name

        # Detect file format
        with open(tmp_path, "r") as f:
            first_line = f.readline().strip()

        if first_line.startswith(">"):  # FASTA
            for record in SeqIO.parse(tmp_path, "fasta"):
                return str(record.seq)[:max_bases].upper()

        elif first_line.startswith("@"):  # FASTQ
            for record in SeqIO.parse(tmp_path, "fastq"):
                return str(record.seq)[:max_bases].upper()

        else:  # Plain sequence fallback
            with open(tmp_path, "r") as f:
                content = f.read(max_bases).strip()
                sequence = re.sub(r"[^ATGCN]", "", content.upper())
                if sequence:
                    return sequence
                else:
                    raise ValueError("No valid DNA sequence found in file")

    except Exception as e:
        raise ValueError(f"Error reading sequence file: {str(e)}")

# ===============================
# Streamlit UI
# ===============================
st.set_page_config(page_title="TB Genome Analysis", page_icon="🧬", layout="centered")

st.markdown(
    """
    <style>
    .upload-box {
        border: 2px dashed #ccc;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        background-color: #fafafa;
    }
    .stButton>button {
        width: 100%;
        border-radius: 8px;
        background-color: #4CB6B6;
        color: white;
        font-size: 16px;
        padding: 10px;
    }
    .stButton>button:hover {
        background-color: #3aa1a1;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown("### Reference File")
st.write("Upload TB reference genome sequence")

uploaded_file = st.file_uploader("Upload Reference File", type=["fasta", "fa", "fastq"], label_visibility="collapsed")

if uploaded_file is not None:
    st.markdown(f"""
        <div class="upload-box">
            <b>{uploaded_file.name}</b><br>
            {round(len(uploaded_file.getvalue())/1e9,2)} GB
        </div>
    """, unsafe_allow_html=True)

    if st.button("▶ Run TB Analysis"):
        try:
            seq = get_first_sequence(uploaded_file)
            st.success(f"✅ Sequence loaded successfully (length: {len(seq)} bases shown: {seq[:50]}...)")
        except Exception as e:
            st.error(f"❌ Unable to read file: {str(e)}")

else:
    st.info("Please upload a FASTA/FASTQ reference file.")

def calculate_sequence_features(sequence):
    """
    Calculate various features from a DNA sequence
    """
    features = {}
    
    # Basic composition
    features['length'] = len(sequence)
    features['gc_content'] = GC(Seq(sequence))
    
    # Nucleotide counts
    features['a_count'] = sequence.count('A')
    features['t_count'] = sequence.count('T')
    features['g_count'] = sequence.count('G')
    features['c_count'] = sequence.count('C')
    features['n_count'] = sequence.count('N')
    
    # Dinucleotide frequencies
    dinucleotides = ['AA', 'AT', 'AG', 'AC', 'TA', 'TT', 'TG', 'TC',
                     'GA', 'GT', 'GG', 'GC', 'CA', 'CT', 'CG', 'CC']
    
    for dinuc in dinucleotides:
        features[f'{dinuc.lower()}_freq'] = sequence.count(dinuc) / max(1, len(sequence) - 1)
    
    return features

def calculate_similarity(seq1, seq2):
    """
    Calculate similarity between two sequences using multiple methods
    """
    # Method 1: Simple nucleotide matching
    min_length = min(len(seq1), len(seq2))
    if min_length == 0:
        return 0.0
    
    matches = sum(1 for i in range(min_length) if seq1[i] == seq2[i])
    nucleotide_similarity = (matches / min_length) * 100
    
    # Method 2: K-mer based similarity (using 3-mers)
    def get_kmers(sequence, k=3):
        return [sequence[i:i+k] for i in range(len(sequence) - k + 1)]
    
    kmers1 = get_kmers(seq1)
    kmers2 = get_kmers(seq2)
    
    if len(kmers1) == 0 or len(kmers2) == 0:
        kmer_similarity = 0.0
    else:
        # Use CountVectorizer for k-mer frequency comparison
        vectorizer = CountVectorizer(analyzer='word', token_pattern=r'\b\w+\b')
        try:
            kmer_matrix = vectorizer.fit_transform([' '.join(kmers1), ' '.join(kmers2)])
            kmer_similarity = cosine_similarity(kmer_matrix[0:1], kmer_matrix[1:2])[0][0] * 100
        except:
            kmer_similarity = 0.0
    
    # Method 3: Feature-based similarity
    features1 = calculate_sequence_features(seq1)
    features2 = calculate_sequence_features(seq2)
    
    # Compare GC content
    gc_diff = abs(features1['gc_content'] - features2['gc_content'])
    gc_similarity = max(0, 100 - gc_diff * 2)  # Scale difference
    
    # Weighted average of different similarity measures
    final_similarity = (nucleotide_similarity * 0.5 + 
                       kmer_similarity * 0.3 + 
                       gc_similarity * 0.2)
    
    return final_similarity

def classify_tb_result(similarity_score):
    """
    Classify TB detection result based on similarity score
    """
    if similarity_score >= 80:
        return {
            'classification': 'Strong Evidence',
            'confidence': 'High',
            'recommendation': 'Strong evidence of TB. Consider immediate treatment protocols and infection control measures.',
            'icon': '✅'
        }
    elif similarity_score >= 50:
        return {
            'classification': 'Possible TB Strain',
            'confidence': 'Moderate',
            'recommendation': 'Moderate confidence. Additional confirmatory testing recommended before treatment decisions.',
            'icon': '⚠️'
        }
    else:
        return {
            'classification': 'Unlikely TB',
            'confidence': 'Low',
            'recommendation': 'Low confidence for TB. Consider alternative diagnoses and standard clinical evaluation.',
            'icon': '❌'
        }

@app.route('/analyze', methods=['POST'])
def analyze_sequences():
    """
    Main endpoint for TB sequence analysis
    """
    try:
        # Check if files are provided
        if 'sample' not in request.files or 'reference' not in request.files:
            return jsonify({'error': 'Both sample and reference files are required'}), 400
        
        sample_file = request.files['sample']
        reference_file = request.files['reference']
        
        if sample_file.filename == '' or reference_file.filename == '':
            return jsonify({'error': 'No files selected'}), 400
        
        # Save uploaded files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fasta') as sample_temp:
            sample_file.save(sample_temp.name)
            sample_path = sample_temp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fasta') as ref_temp:
            reference_file.save(ref_temp.name)
            ref_path = ref_temp.name
        
        try:
            # Extract sequences
            sample_sequence = get_first_sequence(sample_path)
            reference_sequence = get_first_sequence(ref_path)
            
            # Calculate similarity
            similarity_score = calculate_similarity(sample_sequence, reference_sequence)
            
            # Get classification
            classification = classify_tb_result(similarity_score)
            
            # Calculate additional metrics
            sample_features = calculate_sequence_features(sample_sequence)
            reference_features = calculate_sequence_features(reference_sequence)
            
            # Prepare response
            result = {
                'similarity_score': round(similarity_score, 2),
                'classification': classification,
                'sample_info': {
                    'filename': sample_file.filename,
                    'length': sample_features['length'],
                    'gc_content': round(sample_features['gc_content'], 2)
                },
                'reference_info': {
                    'filename': reference_file.filename,
                    'length': reference_features['length'],
                    'gc_content': round(reference_features['gc_content'], 2)
                },
                'analysis_details': {
                    'method': 'Multi-method similarity analysis',
                    'features_compared': ['nucleotide_matching', 'kmer_similarity', 'gc_content'],
                    'confidence_threshold': {
                        'high': '≥80%',
                        'moderate': '50-79%',
                        'low': '<50%'
                    }
                }
            }
            
            return jsonify(result)
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(sample_path)
                os.unlink(ref_path)
            except:
                pass
                
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'healthy', 'service': 'TB Analysis API'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
