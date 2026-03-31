"use client"

import { useAuth } from "@/components/auth-provider"
import { useFasta } from "@/components/fasta-context"
import { LoginForm } from "@/components/login-form"
import { PrimaryFileUpload } from "@/components/primary-file-upload"
import { SideNavigation } from "@/components/side-navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Search, Dna, Microscope, Target, Shield } from "lucide-react"
import Link from "next/link"

function Dashboard() {
  const { user } = useAuth()
  const { primaryFile, setPrimaryFile, isValidFastaFile, parseFastaContent } = useFasta()

  const handlePrimaryFileUpload = async (file: File, content: string) => {
    if (!isValidFastaFile(file.name)) {
      console.error("Invalid file type")
      return
    }

    const { sequence, isValid, error } = parseFastaContent(content)

    if (!isValid) {
      console.error("Invalid FASTA content:", error)
      return
    }

    const fastaFile = {
      name: file.name,
      size: file.size,
      content: content,
      uploadedAt: new Date(),
    }

    setPrimaryFile(fastaFile)
  }

  const handlePrimaryFileRemove = () => {
    setPrimaryFile(null)
  }

  const workflowSteps = [
    {
      id: 1,
      title: "Upload Primary Sequence",
      description: "Start by uploading your FASTA file containing the DNA sequence to analyze",
      icon: Upload,
      href: "/",
      status: primaryFile ? "completed" : "current",
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "Visualize DNA Structure",
      description: "Explore your sequence with interactive 3D visualization and composition analysis",
      icon: Dna,
      href: "/dna",
      status: primaryFile ? "available" : "pending",
      color: "bg-green-500",
    },
    {
      id: 3,
      title: "Check for TB",
      description: "Compare against TB reference genomes to detect tuberculosis evidence",
      icon: Microscope,
      href: "/checker",
      status: primaryFile ? "available" : "pending",
      color: "bg-purple-500",
    },
    {
      id: 4,
      title: "Find Mutations",
      description: "Identify and classify mutations in your sequence for detailed analysis",
      icon: Search,
      href: "/mutations",
      status: primaryFile ? "available" : "pending",
      color: "bg-orange-500",
    },
    {
      id: 5,
      title: "Predict Organ Impact",
      description: "Analyze mutation effects on different organs and biological systems",
      icon: Target,
      href: "/predictor",
      status: primaryFile ? "available" : "pending",
      color: "bg-red-500",
    },
    {
      id: 6,
      title: "Analyze Drug Resistance",
      description: "Evaluate resistance patterns for tuberculosis treatment planning",
      icon: Shield,
      href: "/resistance",
      status: primaryFile ? "available" : "pending",
      color: "bg-indigo-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SideNavigation />

      <main className="ml-16 w-[calc(100%-4rem)] py-8 transition-all duration-300">
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">TB Mutation Analysis Platform</h1>
              <p className="text-muted-foreground text-lg">
                Professional tools for DNA analysis, mutation detection, and tuberculosis research
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="text-lg font-semibold text-foreground">{user?.username}</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 space-y-8">
          <PrimaryFileUpload
            onFileUploaded={handlePrimaryFileUpload}
            currentFile={primaryFile}
            onFileRemoved={handlePrimaryFileRemove}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Analysis Workflow</CardTitle>
              <p className="text-muted-foreground">
                Follow this step-by-step process to analyze your DNA sequence for tuberculosis research
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon
                  const isCompleted = step.status === "completed"
                  const isAvailable = step.status === "available" || step.status === "current"
                  const isPending = step.status === "pending"

                  return (
                    <div key={step.id} className="flex items-center gap-4 relative">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isAvailable
                              ? `${step.color} text-white`
                              : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-grow">
                        <h3
                          className={`font-semibold ${
                            isCompleted
                              ? "text-green-700 dark:text-green-300"
                              : isAvailable
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {isCompleted && <div className="text-green-500 text-sm font-medium">✓ Complete</div>}
                        {isAvailable && !isCompleted && (
                          <Button asChild size="sm">
                            <Link href={step.href}>
                              Start <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                        {isPending && <div className="text-muted-foreground text-sm">Upload file first</div>}
                      </div>

                      {index < workflowSteps.length - 1 && (
                        <div className="absolute left-10 mt-16 w-0.5 h-6 bg-border"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}
