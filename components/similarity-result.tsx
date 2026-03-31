"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface SimilarityResultProps {
  similarity: number
  sampleFilename: string
  referenceFilename: string
  sampleLength: number
  referenceLength: number
}

export function SimilarityResult({
  similarity,
  sampleFilename,
  referenceFilename,
  sampleLength,
  referenceLength,
}: SimilarityResultProps) {
  const getResultIcon = () => {
    if (similarity >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />
    if (similarity >= 50) return <AlertTriangle className="h-8 w-8 text-orange-600" />
    return <XCircle className="h-8 w-8 text-red-600" />
  }

  const getResultText = () => {
    if (similarity >= 80) return "Strong TB Evidence"
    if (similarity >= 50) return "Possible TB-Related Strain"
    return "Not TB"
  }

  const getResultColor = () => {
    if (similarity >= 80) return "text-green-600"
    if (similarity >= 50) return "text-orange-600"
    return "text-red-600"
  }

  const getProgressColor = () => {
    if (similarity >= 80) return "bg-green-600"
    if (similarity >= 50) return "bg-orange-600"
    return "bg-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TB Analysis Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Result */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">{getResultIcon()}</div>
          <div>
            <p className="text-3xl font-bold mb-2">{similarity.toFixed(2)}%</p>
            <p className={`text-lg font-semibold ${getResultColor()}`}>{getResultText()}</p>
          </div>
          <Progress value={similarity} className="w-full h-3" />
        </div>

        {/* Interpretation */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Interpretation:</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            {similarity >= 80 && (
              <p>
                High similarity ({similarity.toFixed(2)}%) indicates strong evidence of tuberculosis. The sample shows
                significant genetic similarity to known TB reference sequences.
              </p>
            )}
            {similarity >= 50 && similarity < 80 && (
              <p>
                Moderate similarity ({similarity.toFixed(2)}%) suggests possible TB-related strain or mycobacterial
                infection. Further analysis recommended.
              </p>
            )}
            {similarity < 50 && (
              <p>
                Low similarity ({similarity.toFixed(2)}%) indicates the sample is unlikely to be tuberculosis. Consider
                alternative diagnoses.
              </p>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Sample File</h4>
            <div className="text-sm">
              <p className="font-mono text-xs break-all">{sampleFilename}</p>
              <p className="text-muted-foreground">Length: {sampleLength.toLocaleString()} bp</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Reference File</h4>
            <div className="text-sm">
              <p className="font-mono text-xs break-all">{referenceFilename}</p>
              <p className="text-muted-foreground">Length: {referenceLength.toLocaleString()} bp</p>
            </div>
          </div>
        </div>

        {/* Confidence Levels */}
        <div className="space-y-3">
          <h4 className="font-semibold">Confidence Levels</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">High Confidence (≥80%)</span>
              <Badge variant={similarity >= 80 ? "default" : "secondary"}>
                {similarity >= 80 ? "✓ Met" : "Not Met"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Moderate Confidence (50-79%)</span>
              <Badge variant={similarity >= 50 && similarity < 80 ? "default" : "secondary"}>
                {similarity >= 50 && similarity < 80 ? "✓ Met" : "Not Met"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Confidence (&lt;50%)</span>
              <Badge variant={similarity < 50 ? "default" : "secondary"}>{similarity < 50 ? "✓ Met" : "Not Met"}</Badge>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Clinical Recommendations:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {similarity >= 80 && (
              <>
                <li>Consider immediate TB treatment protocols</li>
                <li>Implement infection control measures</li>
                <li>Conduct drug susceptibility testing</li>
                <li>Contact tracing may be warranted</li>
              </>
            )}
            {similarity >= 50 && similarity < 80 && (
              <>
                <li>Additional confirmatory testing recommended</li>
                <li>Consider mycobacterial culture</li>
                <li>Monitor patient closely</li>
                <li>Repeat analysis with additional samples</li>
              </>
            )}
            {similarity < 50 && (
              <>
                <li>TB unlikely based on genetic analysis</li>
                <li>Consider alternative diagnoses</li>
                <li>Standard clinical evaluation recommended</li>
                <li>Re-test if clinical suspicion remains high</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
