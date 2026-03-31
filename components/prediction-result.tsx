"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Bone, Key as Kidney, Shield } from "lucide-react"

interface PredictionResultProps {
  predictedOrgan: string
  confidence: number
  mutationData: {
    total_mutations: number
    missense_count: number
    synonymous_count: number
    frameshift_count: number
    intergenic_count: number
  }
  filename: string
}

const organIcons = {
  Lungs: Heart,
  Spine: Bone,
  Kidneys: Kidney,
  "Lymph nodes": Shield,
}

const organColors = {
  Lungs: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200",
  Spine: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
  Kidneys: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200",
  "Lymph nodes": "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200",
}

export function PredictionResult({ predictedOrgan, confidence, mutationData, filename }: PredictionResultProps) {
  const Icon = organIcons[predictedOrgan as keyof typeof organIcons] || Heart
  const colorClass = organColors[predictedOrgan as keyof typeof organColors] || "text-gray-600"

  const getConfidenceLevel = () => {
    if (confidence >= 80) return { level: "High", color: "text-green-600" }
    if (confidence >= 60) return { level: "Moderate", color: "text-orange-600" }
    return { level: "Low", color: "text-red-600" }
  }

  const confidenceInfo = getConfidenceLevel()

  return (
    <Card>
      <CardHeader>
        <CardTitle>TB Organ Prediction Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Prediction */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Icon className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Predicted Affected Organ</h3>
            <Badge className={`text-lg px-4 py-2 ${colorClass}`}>{predictedOrgan}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prediction Confidence:</span>
              <span className={`font-bold ${confidenceInfo.color}`}>
                {confidence.toFixed(1)}% ({confidenceInfo.level})
              </span>
            </div>
            <Progress value={confidence} className="w-full h-2" />
          </div>
        </div>

        {/* Mutation Analysis Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Mutation Pattern Analysis</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Mutations:</span>
                <Badge variant="outline">{mutationData.total_mutations.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Missense Variants:</span>
                <Badge variant="outline">{mutationData.missense_count.toLocaleString()}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Synonymous Variants:</span>
                <Badge variant="outline">{mutationData.synonymous_count.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Frameshift Variants:</span>
                <Badge variant="outline">{mutationData.frameshift_count.toLocaleString()}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-sm">Intergenic Regions:</span>
            <Badge variant="outline">{mutationData.intergenic_count.toLocaleString()}</Badge>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="space-y-4">
          <h4 className="font-semibold">Clinical Information</h4>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            {predictedOrgan === "Lungs" && (
              <div>
                <h5 className="font-semibold mb-2">Pulmonary Tuberculosis</h5>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Most common form of TB (85% of cases)</li>
                  <li>Symptoms: persistent cough, chest pain, hemoptysis</li>
                  <li>Highly contagious through airborne transmission</li>
                  <li>Requires immediate isolation and treatment</li>
                </ul>
              </div>
            )}
            {predictedOrgan === "Spine" && (
              <div>
                <h5 className="font-semibold mb-2">Spinal Tuberculosis (Pott's Disease)</h5>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Most common form of skeletal TB</li>
                  <li>Symptoms: back pain, neurological deficits, deformity</li>
                  <li>Can cause vertebral collapse and spinal cord compression</li>
                  <li>Requires prolonged treatment and possible surgical intervention</li>
                </ul>
              </div>
            )}
            {predictedOrgan === "Kidneys" && (
              <div>
                <h5 className="font-semibold mb-2">Renal Tuberculosis</h5>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Second most common extrapulmonary TB site</li>
                  <li>Symptoms: dysuria, hematuria, flank pain</li>
                  <li>Can cause chronic kidney disease if untreated</li>
                  <li>May require urological evaluation and intervention</li>
                </ul>
              </div>
            )}
            {predictedOrgan === "Lymph nodes" && (
              <div>
                <h5 className="font-semibold mb-2">Lymph Node Tuberculosis</h5>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Most common extrapulmonary TB in children</li>
                  <li>Symptoms: painless lymph node enlargement</li>
                  <li>Commonly affects cervical and mediastinal nodes</li>
                  <li>Good prognosis with appropriate treatment</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Treatment Recommendations */}
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Treatment Recommendations</h4>
          <div className="text-sm space-y-2">
            <p>
              <strong>Standard Treatment Duration:</strong> {predictedOrgan === "Lungs" ? "6 months" : "9-12 months"} of
              anti-TB therapy
            </p>
            <p>
              <strong>First-line Drugs:</strong> Isoniazid, Rifampin, Ethambutol, Pyrazinamide
            </p>
            <p>
              <strong>Monitoring:</strong> Regular clinical assessment, drug susceptibility testing, treatment response
              evaluation
            </p>
            {predictedOrgan !== "Lungs" && (
              <p>
                <strong>Specialist Referral:</strong> Consider consultation with relevant specialists for optimal
                management
              </p>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Analysis File:</strong> {filename}
          </p>
          <p>
            <strong>Prediction Model:</strong> Random Forest Classifier trained on mutation patterns
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
