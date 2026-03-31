"use client"

import { useState, useEffect } from "react"
import { SideNavigation } from "@/components/side-navigation"
import { FileUpload } from "@/components/file-upload"
import { SimilarityResult } from "@/components/similarity-result"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, RefreshCw, CheckCircle } from "lucide-react"
import { useFasta } from "@/components/fasta-context"

interface AnalysisResult {
  similarity: number
  sampleFilename: string
  referenceFilename: string
  sampleLength: number
  referenceLength: number
  classification: string
}

export default function TBCheckerPage() {
  const { primaryFile, parseFastaContent } = useFasta()
  const [sampleFile, setSampleFile] = useState<{ sequence: string; filename: string } | null>(null)
  const [referenceFile, setReferenceFile] = useState<{ sequence: string; filename: string } | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [usingPrimaryFile, setUsingPrimaryFile] = useState(false)

  useEffect(() => {
    if (primaryFile && !sampleFile) {
      loadPrimaryFile()
    }
  }, [primaryFile])

  const loadPrimaryFile = () => {
    if (!primaryFile) return

    try {
      const { sequence: parsedSequence, isValid, error: parseError } = parseFastaContent(primaryFile.content)

      if (!isValid) {
        setError(parseError || "Failed to parse primary FASTA file")
        return
      }

      setSampleFile({ sequence: parsedSequence, filename: primaryFile.name })
      setUsingPrimaryFile(true)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load primary file")
    }
  }

  const getFirstSequence = async (file: File): Promise<{ sequence: string; filename: string }> => {
    try {
      if (!file) {
        throw new Error("No file provided")
      }

      if (file.size === 0) {
        throw new Error("File is empty")
      }

      if (file.size > 3 * 1024 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 3GB.")
      }

      let text: string
      try {
        text = await file.text()
      } catch (readError) {
        throw new Error("Unable to read file. Please try selecting the file again.")
      }

      if (!text || text.trim().length === 0) {
        throw new Error("File appears to be empty")
      }

      const trimmedText = text.trim()
      const firstChar = trimmedText.charAt(0)
      let sequence = ""

      if (firstChar === ">") {
        // FASTA format - extract first sequence only
        const lines = trimmedText.split(/\r?\n/)
        let foundSequence = false

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          if (trimmedLine.startsWith(">")) {
            if (foundSequence) break // Stop at second sequence header
            foundSequence = true
            continue
          }

          if (foundSequence) {
            // Clean sequence - replace invalid characters with N
            sequence += trimmedLine.replace(/[^ATGCN]/gi, "N")
          }
        }
      } else if (firstChar === "@") {
        // FASTQ format - extract first sequence only
        const lines = trimmedText.split(/\r?\n/).filter((line) => line.trim())
        if (lines.length >= 4) {
          sequence = lines[1].replace(/[^ATGCN]/gi, "N")
        }
      } else {
        throw new Error("File must be FASTA (starts with >) or FASTQ (starts with @)")
      }

      if (!sequence || sequence.length < 10) {
        throw new Error("No valid sequence found or sequence too short")
      }

      return { sequence: sequence.toUpperCase(), filename: file.name }
    } catch (err) {
      if (err instanceof Error) {
        throw err
      }
      throw new Error("Unable to read file. Please try selecting the file again.")
    }
  }

  const handleSampleUpload = async (file: File) => {
    try {
      const parsed = await getFirstSequence(file)
      setSampleFile(parsed)
      setUsingPrimaryFile(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse sample file")
    }
  }

  const handleReferenceUpload = async (file: File) => {
    try {
      const parsed = await getFirstSequence(file)
      setReferenceFile(parsed)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse reference file")
    }
  }

  const calculateSimilarity = (seq1: string, seq2: string): number => {
    const length = Math.min(seq1.length, seq2.length)
    if (length === 0) return 0

    let matches = 0
    for (let i = 0; i < length; i++) {
      if (seq1[i] === seq2[i]) {
        matches++
      }
    }

    return (matches / length) * 100
  }

  const classifyTB = (matchPercent: number): string => {
    if (matchPercent >= 80) {
      return `✅ ${matchPercent.toFixed(2)}% match → Strong evidence of TB`
    } else if (matchPercent >= 50) {
      return `⚠️ ${matchPercent.toFixed(2)}% match → Possible TB-related strain (confirm in lab)`
    } else {
      return `❌ ${matchPercent.toFixed(2)}% match → Not TB`
    }
  }

  const runAnalysis = async () => {
    if (!sampleFile || !referenceFile) {
      setError("Please upload both sample and reference files")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const similarity = calculateSimilarity(sampleFile.sequence, referenceFile.sequence)

      setResult({
        similarity,
        sampleFilename: sampleFile.filename,
        referenceFilename: referenceFile.filename,
        sampleLength: sampleFile.sequence.length,
        referenceLength: referenceFile.sequence.length,
        classification: classifyTB(similarity),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNavigation />
      <main className="ml-16 w-[calc(100%-4rem)] py-8">
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TB Checker</h1>
          <p className="text-muted-foreground text-lg">
            Analyze sample sequences against TB reference genomes to detect tuberculosis evidence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            {primaryFile && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    Primary File Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">{primaryFile.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {(primaryFile.size / 1024).toFixed(1)} KB • Ready for analysis
                    </p>
                    {!usingPrimaryFile && (
                      <Button onClick={loadPrimaryFile} size="sm" className="w-full mt-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Use as Sample File
                      </Button>
                    )}
                    {usingPrimaryFile && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-2">
                        <CheckCircle className="h-3 w-3" />
                        Currently using as sample file
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sample File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>{primaryFile ? "Replace Sample File" : "Sample File"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {primaryFile
                    ? "Upload a different file to override the primary sequence for this analysis"
                    : "Upload the sequence to be analyzed"}
                </p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleSampleUpload}
                  acceptedFileTypes={[".fasta", ".fa", ".fas", ".fastq", ".fq"]}
                  maxSize={3 * 1024 * 1024 * 1024}
                />
                {sampleFile && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Loaded: {sampleFile.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      Length: {sampleFile.sequence.length.toLocaleString()} bp
                    </p>
                    <div className="mt-2">
                      <code className="text-xs font-mono break-all">
                        {sampleFile.sequence.substring(0, 60)}
                        {sampleFile.sequence.length > 60 && "..."}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reference File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Reference File</CardTitle>
                <p className="text-sm text-muted-foreground">Upload TB reference genome sequence</p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleReferenceUpload}
                  acceptedFileTypes={[".fasta", ".fa", ".fas", ".fastq", ".fq"]}
                  maxSize={3 * 1024 * 1024 * 1024}
                />
                {referenceFile && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Loaded: {referenceFile.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      Length: {referenceFile.sequence.length.toLocaleString()} bp
                    </p>
                    <div className="mt-2">
                      <code className="text-xs font-mono break-all">
                        {referenceFile.sequence.substring(0, 60)}
                        {referenceFile.sequence.length > 60 && "..."}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Button */}
            <Button
              onClick={runAnalysis}
              disabled={!sampleFile || !referenceFile || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing Similarity...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run TB Analysis
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {result ? (
              <SimilarityResult
                similarity={result.similarity}
                sampleFilename={result.sampleFilename}
                referenceFilename={result.referenceFilename}
                sampleLength={result.sampleLength}
                referenceLength={result.referenceLength}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">🔬</div>
                    <h3 className="text-xl font-semibold mb-2">Ready for TB Analysis</h3>
                    <p>
                      {primaryFile
                        ? "Upload a reference file and click 'Run TB Analysis' to begin"
                        : "Upload both sample and reference files, then click 'Run TB Analysis' to begin"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Clinical Guidelines */}
        <Card className="mt-6 px-4 sm:px-6 lg:px-8">
          <CardHeader>
            <CardTitle>Clinical Guidelines & Interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">≥80%</div>
                <h4 className="font-semibold mb-2">Strong Evidence</h4>
                <p className="text-sm text-muted-foreground">
                  High confidence TB detection. Consider immediate treatment protocols and infection control measures.
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">50-79%</div>
                <h4 className="font-semibold mb-2">Possible TB Strain</h4>
                <p className="text-sm text-muted-foreground">
                  Moderate confidence. Additional confirmatory testing recommended before treatment decisions.
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-2">&lt;50%</div>
                <h4 className="font-semibold mb-2">Unlikely TB</h4>
                <p className="text-sm text-muted-foreground">
                  Low confidence for TB. Consider alternative diagnoses and standard clinical evaluation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
