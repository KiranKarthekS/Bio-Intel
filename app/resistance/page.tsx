"use client"

import { SideNavigation } from "@/components/side-navigation"
import { ResistancePredictor } from "@/components/resistance-predictor"
import { DatasetViewer } from "@/components/dataset-viewer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useFasta } from "@/components/fasta-context"

export default function ResistancePage() {
  const { primaryFile } = useFasta()

  return (
    <div className="min-h-screen bg-background">
      <SideNavigation />
      <main className="ml-16 w-[calc(100%-4rem)] py-8">
        {/* Header */}
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resistance Analysis</h1>
          <p className="text-muted-foreground text-lg">
            Advanced machine learning-powered analysis for predicting drug resistance patterns in{" "}
            <em>Mycobacterium tuberculosis</em> mutations
          </p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {/* Primary File Status and Workflow Guidance */}
          {primaryFile && (
            <Alert className="mb-8">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Primary FASTA file detected:</strong> {primaryFile.name}
                <br />
                <span className="text-sm text-muted-foreground">
                  To analyze resistance patterns from your primary file, first run it through the Mutation Finder to
                  identify specific mutations, then use the individual mutation parameters below for detailed resistance
                  analysis.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {!primaryFile && (
            <Alert className="mb-8">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>No primary FASTA file uploaded.</strong> Upload a primary sequence on the dashboard for
                integrated workflow, or use the manual mutation input below for individual resistance analysis.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Analysis Tool */}
          <div className="mb-8">
            <ResistancePredictor />
          </div>

          {/* Dataset Viewer */}
          <div className="mb-8">
            <DatasetViewer />
          </div>

          {/* Clinical Disclaimer */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Clinical Disclaimer:</strong> This resistance analysis tool is for research purposes only.
              Predictions should be validated with clinical findings, laboratory testing, and additional diagnostic
              methods. Always consult with healthcare professionals and follow established clinical guidelines for
              treatment decisions.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  )
}
