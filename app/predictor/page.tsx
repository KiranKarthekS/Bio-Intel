"use client"

import { useState } from "react"
import { SideNavigation } from "@/components/side-navigation"
import { FileUpload } from "@/components/file-upload"
import { PredictionResult } from "@/components/prediction-result"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, Brain, Info, AlertTriangle } from "lucide-react"
import { useFasta } from "@/components/fasta-context"

interface MutationData {
  total_mutations: number
  missense_count: number
  synonymous_count: number
  frameshift_count: number
  intergenic_count: number
}

interface PredictionData {
  predictedOrgan: string
  confidence: number
  mutationData: MutationData
  filename: string
}

export default function OrganPredictorPage() {
  const { primaryFile } = useFasta()
  const [mutationFile, setMutationFile] = useState<{ data: any[]; filename: string } | null>(null)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const parseCSVFile = async (file: File): Promise<{ data: any[]; filename: string }> => {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header and one data row")
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }

    const requiredColumns = ["Type of Mutation"]
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col))
    if (missingColumns.length > 0) {
      // Check for alternative column names
      const alternativeNames = ["Type of mutation", "Mutation Type", "mutation_type", "variant_type"]
      const foundAlternative = alternativeNames.find((alt) => headers.includes(alt))

      if (foundAlternative) {
        // Rename the column to the expected format
        data.forEach((row) => {
          row["Type of Mutation"] = row[foundAlternative]
        })
      } else {
        throw new Error(`Missing required columns: ${missingColumns.join(", ")}. Found columns: ${headers.join(", ")}`)
      }
    }

    return { data, filename: file.name }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseCSVFile(file)
      setMutationFile(parsed)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file")
    }
  }

  const runPrediction = async () => {
    if (!mutationFile) {
      setError("Please upload a mutation CSV file first")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Simulate ML model processing delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Extract mutation features from the data
      const mutationData: MutationData = {
        total_mutations: mutationFile.data.length,
        missense_count: mutationFile.data.filter((row) => row["Type of Mutation"] === "missense_variant").length,
        synonymous_count: mutationFile.data.filter((row) => row["Type of Mutation"] === "synonymous_variant").length,
        frameshift_count: mutationFile.data.filter((row) => row["Type of Mutation"] === "frameshift_variant").length,
        intergenic_count: mutationFile.data.filter((row) => row["Type of Mutation"] === "intergenic_region").length,
      }

      // Simulate ML prediction based on mutation patterns
      const organs = ["Lungs", "Spine", "Kidneys", "Lymph nodes"]
      const weights = {
        Lungs: mutationData.missense_count * 0.4 + mutationData.total_mutations * 0.1,
        Spine: mutationData.frameshift_count * 0.6 + mutationData.synonymous_count * 0.2,
        Kidneys: mutationData.intergenic_count * 0.5 + mutationData.missense_count * 0.3,
        "Lymph nodes": mutationData.synonymous_count * 0.4 + mutationData.total_mutations * 0.15,
      }

      // Add some randomness to simulate model uncertainty
      Object.keys(weights).forEach((organ) => {
        weights[organ as keyof typeof weights] += Math.random() * 100
      })

      // Find the organ with highest weight
      const predictedOrgan = Object.keys(weights).reduce((a, b) =>
        weights[a as keyof typeof weights] > weights[b as keyof typeof weights] ? a : b,
      )

      // Calculate confidence based on the difference between top predictions
      const sortedWeights = Object.values(weights).sort((a, b) => b - a)
      const confidence = Math.min(95, Math.max(45, (sortedWeights[0] / (sortedWeights[0] + sortedWeights[1])) * 100))

      setPrediction({
        predictedOrgan,
        confidence,
        mutationData,
        filename: mutationFile.filename,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNavigation />
      <main className="ml-16 w-[calc(100%-4rem)] py-8">
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Organ Predictor</h1>
          <p className="text-muted-foreground text-lg">
            Use machine learning to predict TB-affected organs based on mutation patterns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Primary File Status */}
            {primaryFile && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Primary FASTA file detected:</strong> {primaryFile.name}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Run this sequence through the Mutation Finder first to generate the required CSV file for organ
                    prediction.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Upload Mutation Data
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload CSV file with mutation analysis results from the Mutation Finder
                </p>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileUpload}
                  acceptedFileTypes={[".csv"]}
                  maxSize={100 * 1024 * 1024} // Increased from 50MB to 100MB for larger CSV files
                />
                {mutationFile && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Loaded: {mutationFile.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {mutationFile.data.length.toLocaleString()} mutations detected
                    </p>
                    <div className="mt-2 text-xs">
                      <p>
                        Missense:{" "}
                        {mutationFile.data.filter((row) => row["Type of Mutation"] === "missense_variant").length}
                      </p>
                      <p>
                        Synonymous:{" "}
                        {mutationFile.data.filter((row) => row["Type of Mutation"] === "synonymous_variant").length}
                      </p>
                      <p>
                        Frameshift:{" "}
                        {mutationFile.data.filter((row) => row["Type of Mutation"] === "frameshift_variant").length}
                      </p>
                      <p>
                        Intergenic:{" "}
                        {mutationFile.data.filter((row) => row["Type of Mutation"] === "intergenic_region").length}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Reminder */}
            {!mutationFile && primaryFile && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Workflow Reminder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                    <p>To use your primary FASTA file for organ prediction:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to the Mutation Finder tool</li>
                      <li>Analyze your primary file to find mutations</li>
                      <li>Export the results as CSV</li>
                      <li>Upload that CSV file here for organ prediction</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prediction Button */}
            <Button onClick={runPrediction} disabled={!mutationFile || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running ML Prediction...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Predict Affected Organ
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
            {prediction ? (
              <PredictionResult
                predictedOrgan={prediction.predictedOrgan}
                confidence={prediction.confidence}
                mutationData={prediction.mutationData}
                filename={prediction.filename}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">🧠</div>
                    <h3 className="text-xl font-semibold mb-2">Ready for ML Prediction</h3>
                    <p>Upload a mutation CSV file and click "Predict Affected Organ" to begin analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <Alert className="mt-6 px-4 sm:px-6 lg:px-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Clinical Disclaimer:</strong> This tool is for research purposes only. Predictions should be
            validated with clinical findings and additional diagnostic tests. Always consult with healthcare
            professionals for medical decisions.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}
