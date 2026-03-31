"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface PredictionResult {
  pos: number
  ref: string
  alt: string
  mutationType: string
  resistance: string
  antibody: string
  confidence: number
}

interface PredictionHistory extends PredictionResult {
  timestamp: string
}

export function ResistancePredictor() {
  const [pos, setPos] = useState("467")
  const [ref, setRef] = useState("A")
  const [alt, setAlt] = useState("G")
  const [mutationType, setMutationType] = useState("missense_variant")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [history, setHistory] = useState<PredictionHistory[]>([])

  // Simulated ML prediction based on the provided dataset patterns
  const predictResistance = async () => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple rule-based prediction logic based on common patterns
    let resistance = "Not Resistant"
    let antibody = "Isoniazid"
    let confidence = 0.85

    const position = Number.parseInt(pos)

    // Common resistance patterns from TB research
    if (position >= 4400000 && position <= 4410000) {
      if (ref === "C" && alt === "T") {
        resistance = "Resistant"
        antibody = "Streptomycin"
        confidence = 0.92
      }
    } else if (position >= 760000 && position <= 770000) {
      if (mutationType.includes("missense")) {
        resistance = "Resistant"
        antibody = "Rifampin"
        confidence = 0.88
      }
    } else if (ref === "G" && alt === "A" && mutationType.includes("missense")) {
      resistance = "Resistant"
      antibody = "Ethambutol"
      confidence = 0.79
    }

    // Random variation for demonstration
    if (Math.random() > 0.7) {
      resistance = resistance === "Resistant" ? "Not Resistant" : "Resistant"
      confidence = Math.random() * 0.3 + 0.7
    }

    const prediction: PredictionResult = {
      pos: position,
      ref,
      alt,
      mutationType,
      resistance,
      antibody: resistance === "Resistant" ? "None" : antibody,
      confidence,
    }

    setResult(prediction)

    // Add to history
    const historyEntry: PredictionHistory = {
      ...prediction,
      timestamp: new Date().toLocaleString(),
    }
    setHistory((prev) => [historyEntry, ...prev.slice(0, 9)]) // Keep last 10

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Mutation Details
            </CardTitle>
            <CardDescription>Enter mutation parameters to predict drug resistance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pos">Position (POS)</Label>
                <Input
                  id="pos"
                  type="number"
                  value={pos}
                  onChange={(e) => setPos(e.target.value)}
                  placeholder="e.g., 467"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference (REF)</Label>
                <Input
                  id="ref"
                  value={ref}
                  onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="e.g., A"
                  maxLength={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alt">Alternate (ALT)</Label>
                <Input
                  id="alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value.toUpperCase())}
                  placeholder="e.g., G"
                  maxLength={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mutationType">Mutation Type</Label>
                <Input
                  id="mutationType"
                  value={mutationType}
                  onChange={(e) => setMutationType(e.target.value)}
                  placeholder="e.g., missense_variant"
                />
              </div>
            </div>

            <Button onClick={predictResistance} disabled={isLoading || !pos || !ref || !alt} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Predict Resistance
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>AI-powered resistance and treatment recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Resistance Status:</span>
                  <Badge
                    variant={result.resistance === "Resistant" ? "destructive" : "default"}
                    className="flex items-center gap-1"
                  >
                    {result.resistance === "Resistant" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {result.resistance}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Suggested Treatment:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {result.antibody}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence:</span>
                  <span className="text-sm font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {result.resistance === "Resistant"
                      ? "This mutation shows resistance patterns. Consider alternative treatments and consult with specialists."
                      : "This mutation does not show significant resistance patterns. Standard treatment protocols may be effective."}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter mutation details and click "Predict Resistance" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prediction History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction History</CardTitle>
            <CardDescription>Recent resistance analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-mono">
                      {item.pos}:{item.ref}→{item.alt}
                    </div>
                    <Badge variant={item.resistance === "Resistant" ? "destructive" : "default"} size="sm">
                      {item.resistance}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.antibody}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
