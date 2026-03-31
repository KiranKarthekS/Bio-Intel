from flask import Flask, request, render_template_string
from Bio import SeqIO
import tempfile
import os

app = Flask(__name__)

# ===============================
# Helper function
# ===============================
def get_first_sequence(file_storage):
    """Extract first DNA sequence from FASTA or FASTQ file."""
    with tempfile.NamedTemporaryFile(delete=False, mode="wb") as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name

    # Detect format (FASTA starts with '>', FASTQ starts with '@')
    with open(tmp_path, "r") as f:
        first_char = f.read(1)

    file_format = "fasta" if first_char == ">" else "fastq"

    record = next(SeqIO.parse(tmp_path, file_format))

    try:
        os.remove(tmp_path)
    except PermissionError:
        pass

    return str(record.seq)


def calculate_similarity(seq1, seq2):
    """Return % similarity between two DNA sequences."""
    length = min(len(seq1), len(seq2))
    matches = sum(a == b for a, b in zip(seq1[:length], seq2[:length]))
    return (matches / length) * 100 if length > 0 else 0


def classify_tb(match_percent):
    """Classify based on match %."""
    if match_percent >= 80:
        return f"✅ {match_percent:.2f}% match → Strong evidence of TB"
    elif 50 <= match_percent < 80:
        return f"⚠️ {match_percent:.2f}% match → Possible TB-related strain (confirm in lab)"
    else:
        return f"❌ {match_percent:.2f}% match → Not TB"


# ===============================
# Flask Routes
# ===============================
@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    if request.method == "POST":
        try:
            sample_file = request.files["sample_file"]
            ref_file = request.files["ref_file"]

            sample_seq = get_first_sequence(sample_file)
            ref_seq = get_first_sequence(ref_file)

            match_percent = calculate_similarity(sample_seq, ref_seq)
            result = classify_tb(match_percent)

        except Exception as e:
            result = f"❌ Error: {str(e)}"

    return render_template_string(TEMPLATE, result=result)


# ===============================
# Professional Dark Mode Template
# ===============================
TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>TB Checker</title>
    <style>
        body {
            background-color: #121212;
            color: #e0e0e0;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            text-align: center;
            padding: 40px;
        }
        h1 {
            color: #4da6ff;
            margin-bottom: 20px;
        }
        .card {
            background: #1e1e1e;
            border-radius: 12px;
            padding: 25px;
            margin: auto;
            width: 420px;
            box-shadow: 0px 4px 20px rgba(0,0,0,0.6);
        }
        input[type=file] {
            margin: 12px 0;
            padding: 10px;
            background: #2a2a2a;
            color: #ddd;
            border: 1px solid #444;
            border-radius: 6px;
            width: 90%;
        }
        input[type=submit] {
            margin-top: 20px;
            padding: 12px 25px;
            background: #4da6ff;
            color: #fff;
            font-weight: bold;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.3s;
        }
        input[type=submit]:hover {
            background: #3399ff;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            background: #2a2a2a;
            border: 1px solid #444;
        }
    </style>
</head>
<body>
    <h1>🧬 TB Checker</h1>
    <div class="card">
        <form method="POST" enctype="multipart/form-data">
            <p>Upload Sample File (FASTA/FASTQ):</p>
            <input type="file" name="sample_file" required><br>
            <p>Upload Reference TB Genome (FASTA/FASTQ):</p>
            <input type="file" name="ref_file" required><br>
            <input type="submit" value="Check TB">
        </form>
        {% if result %}
            <div class="result">{{ result }}</div>
        {% endif %}
    </div>
</body>
</html>
"""

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)
