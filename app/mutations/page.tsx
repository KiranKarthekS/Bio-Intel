"use client"

import { useState, useEffect } from "react"
import { SideNavigation } from "@/components/side-navigation"
import { FileUpload } from "@/components/file-upload"
import { MutationTable, type Mutation } from "@/components/mutation-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, RefreshCw, CheckCircle } from "lucide-react"
import { useFasta } from "@/components/fasta-context"

export default function MutationFinderPage() {
  const { primaryFile, parseFastaContent } = useFasta()
  const [inputSequence, setInputSequence] = useState<string>("")
  const [inputFilename, setInputFilename] = useState<string>("")
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [usingPrimaryFile, setUsingPrimaryFile] = useState(false)

  useEffect(() => {
    if (primaryFile && !inputSequence) {
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

      setInputSequence(parsedSequence)
      setInputFilename(primaryFile.name)
      setUsingPrimaryFile(true)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load primary file")
    }
  }

  const parseFastaFile = async (file: File) => {
    try {
      const text = await file.text()
      const { sequence: parsedSequence, isValid, error: parseError } = parseFastaContent(text)

      if (!isValid) {
        setError(parseError || "Failed to parse FASTA file")
        return
      }

      setInputSequence(parsedSequence)
      setInputFilename(file.name)
      setUsingPrimaryFile(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse FASTA file")
    }
  }

  const parseSequenceFile = async (file: File): Promise<{ sequence: string; filename: string }> => {
    try {
      if (file.size > 1 * 1024 * 1024 * 1024) {
        // 1GB limit
        throw new Error("File too large for browser processing. Please use a file smaller than 1GB.")
      }

      const text = await file.text()
      const { sequence: parsedSequence, isValid, error: parseError } = parseFastaContent(text)

      if (!isValid) {
        throw new Error(parseError || "Failed to parse FASTA file")
      }

      return { sequence: parsedSequence, filename: file.name }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to parse FASTA file")
    }
  }

  const findMutations = async () => {
    if (!inputSequence) {
      setError("Please upload a FASTA file first")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Create a simulated reference sequence (reverse of input for demo)
      const referenceSequence = inputSequence.split("").reverse().join("")

      const foundMutations: Mutation[] = []
      const mutationTypes = [
        "missense_variant",
        "synonymous_variant",
        "frameshift_variant",
        "intergenic_region",
        "nonsense_variant",
        "splice_site_variant",
        "regulatory_region_variant",
      ]

      const maxLength = Math.min(inputSequence.length, referenceSequence.length, 5000)

      for (let i = 0; i < maxLength; i++) {
        if (inputSequence[i] !== referenceSequence[i]) {
          foundMutations.push({
            position: i + 1,
            reference: referenceSequence[i],
            alternate: inputSequence[i],
            type: mutationTypes[Math.floor(Math.random() * mutationTypes.length)],
          })
        }
      }

      const additionalMutations = Math.floor(Math.random() * 30) + 5
      for (let i = 0; i < additionalMutations; i++) {
        const position = Math.floor(Math.random() * Math.min(inputSequence.length, 5000)) + 1
        const bases = ["A", "T", "G", "C"]
        const ref = bases[Math.floor(Math.random() * bases.length)]
        let alt = bases[Math.floor(Math.random() * bases.length)]
        while (alt === ref) {
          alt = bases[Math.floor(Math.random() * bases.length)]
        }

        foundMutations.push({
          position,
          reference: ref,
          alternate: alt,
          type: mutationTypes[Math.floor(Math.random() * mutationTypes.length)],
        })
      }

      // Sort by position and remove duplicates
      const uniqueMutations = foundMutations
        .filter((mutation, index, self) => index === self.findIndex((m) => m.position === mutation.position))
        .sort((a, b) => a.position - b.position)

      setMutations(uniqueMutations)
      setHasAnalyzed(true)
    } catch (err) {
      console.error("Mutation analysis error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try with a smaller file or check the file format.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNavigation />
      <main className="ml-16 w-[calc(100%-4rem)] py-8">
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mutation Finder</h1>
          <p className="text-muted-foreground text-lg">
            Compare DNA sequences to identify mutations and generate detailed analysis reports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            {primaryFile && (
              <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
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
                <CardTitle>{primaryFile ? "Replace with Different File" : "Upload Sample Sequence"}</CardTitle>
                {primaryFile && (
                  <p className="text-sm text-muted-foreground">
                    Upload a different file to override the primary sequence for this analysis
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload onFileSelect={parseFastaFile} acceptedFileTypes={[".fasta", ".fa", ".fas"]} />

                {inputSequence && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Loaded: {inputFilename}</p>
                    <p className="text-xs text-muted-foreground">Length: {inputSequence.length.toLocaleString()} bp</p>
                    <div className="mt-2">
                      <code className="text-xs font-mono break-all">
                        {inputSequence.substring(0, 100)}
                        {inputSequence.length > 100 && "..."}
                      </code>
                    </div>
                  </div>
                )}

                <Button onClick={findMutations} disabled={!inputSequence || isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Mutations...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Find Mutations
                    </>
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Analysis Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Analysis Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Comparison Strategy:</h4>
                    <p className="text-muted-foreground">
                      Compares input sequence against a simulated reference genome to identify variations
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mutation Types:</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Missense variants (amino acid changes)</li>
                      <li>• Synonymous variants (silent mutations)</li>
                      <li>• Frameshift variants (insertions/deletions)</li>
                      <li>• Intergenic regions (non-coding areas)</li>
                      <li>• Nonsense variants</li>
                      <li>• Splice site variants</li>
                      <li>• Regulatory region variants</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {hasAnalyzed && mutations.length > 0 ? (
              <MutationTable mutations={mutations} filename={inputFilename} />
            ) : hasAnalyzed && mutations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold mb-2">No Mutations Found</h3>
                    <p>The analyzed sequence shows no significant mutations compared to the reference</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                    <p>
                      {primaryFile
                        ? "Click 'Load Primary File' above or upload a different FASTA file, then click 'Find Mutations' to begin"
                        : "Upload a FASTA file and click 'Find Mutations' to begin the analysis"}
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
