"use client"

import { useState, useEffect } from "react"
import { SideNavigation } from "@/components/side-navigation"
import { FileUpload } from "@/components/file-upload"
import { DNAHelixPlotly } from "@/components/dna-helix-plotly"
import { SequenceInfo } from "@/components/sequence-info"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, RefreshCw, CheckCircle } from "lucide-react"
import { useFasta } from "@/components/fasta-context"

export default function DNAVisualizerPage() {
  const { primaryFile, parseFastaContent } = useFasta()
  const [sequence, setSequence] = useState<string>("")
  const [filename, setFilename] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [usingPrimaryFile, setUsingPrimaryFile] = useState(false)

  useEffect(() => {
    if (primaryFile && !sequence) {
      loadPrimaryFile()
    }
  }, [primaryFile])

  const loadPrimaryFile = () => {
    if (!primaryFile) return

    setIsLoading(true)
    setError("")

    try {
      const { sequence: parsedSequence, isValid, error: parseError } = parseFastaContent(primaryFile.content)

      if (!isValid) {
        setError(parseError || "Failed to parse primary FASTA file")
        return
      }

      setSequence(parsedSequence)
      setFilename(primaryFile.name)
      setUsingPrimaryFile(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load primary file")
    } finally {
      setIsLoading(false)
    }
  }

  const parseFastaFile = async (file: File) => {
    setIsLoading(true)
    setError("")

    try {
      const text = await file.text()
      const { sequence: parsedSequence, isValid, error: parseError } = parseFastaContent(text)

      if (!isValid) {
        setError(parseError || "Failed to parse FASTA file")
        return
      }

      setSequence(parsedSequence)
      setFilename(file.name)
      setUsingPrimaryFile(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse FASTA file")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadSequenceData = () => {
    if (!sequence) return

    const data = {
      filename,
      sequence,
      length: sequence.length,
      composition: {
        A: (sequence.match(/A/g) || []).length,
        T: (sequence.match(/T/g) || []).length,
        G: (sequence.match(/G/g) || []).length,
        C: (sequence.match(/C/g) || []).length,
      },
      gcContent: (((sequence.match(/[GC]/g) || []).length / sequence.length) * 100).toFixed(1),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename.replace(/\.[^/.]+$/, "")}_analysis.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNavigation />
      <main className="ml-16 w-[calc(100%-4rem)] py-8">
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">DNA Visualizer</h1>
          <p className="text-muted-foreground text-lg">
            Upload FASTA files and explore DNA sequences with interactive 3D visualization
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8">
          {/* Sidebar with Upload and Sequence Analysis - 20% width */}
          <div className="lg:w-1/5 lg:min-w-[300px] lg:max-w-[400px] lg:flex-shrink-0 space-y-6">
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
                      <Button onClick={loadPrimaryFile} size="sm" className="w-full mt-2" disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load Primary File
                      </Button>
                    )}
                    {usingPrimaryFile && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-2">
                        <CheckCircle className="h-3 w-3" />
                        Currently using primary file
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{primaryFile ? "Replace with Different File" : "Upload FASTA File"}</CardTitle>
                {primaryFile && (
                  <p className="text-sm text-muted-foreground">
                    Upload a different file to override the primary sequence for this analysis
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={parseFastaFile}
                  acceptedFileTypes={[".fasta", ".fa", ".fas"]}
                  className="mb-4"
                />

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Processing FASTA file...</span>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {sequence && (
                  <Button onClick={downloadSequenceData} className="w-full mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download Analysis
                  </Button>
                )}
              </CardContent>
            </Card>

            {sequence && <SequenceInfo sequence={sequence} filename={filename} />}
          </div>

          <div className="lg:w-4/5 min-h-[800px] lg:min-h-[900px]">
            {sequence ? (
              <DNAHelixPlotly sequence={sequence} className="h-full" />
            ) : (
              <Card className="h-full">
                <CardContent className="p-12 text-center h-full flex flex-col justify-center">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">🧬</div>
                    <h3 className="text-xl font-semibold mb-2">No Sequence Loaded</h3>
                    <p>
                      {primaryFile
                        ? "Click 'Load Primary File' above or upload a different FASTA file to visualize the DNA sequence in 3D"
                        : "Upload a FASTA file to visualize the DNA sequence in 3D"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
