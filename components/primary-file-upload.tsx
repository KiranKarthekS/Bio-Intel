"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FastaFile } from "@/components/fasta-context"

interface PrimaryFileUploadProps {
  onFileUploaded: (file: File, content: string) => void
  currentFile?: FastaFile | null
  onFileRemoved?: () => void
}

export function PrimaryFileUpload({ onFileUploaded, currentFile, onFileRemoved }: PrimaryFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".fasta") && !file.name.toLowerCase().endsWith(".fa")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a FASTA file (.fasta or .fa)",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const content = await file.text()
      onFileUploaded(file, content)
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is now available for all analysis tools`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleRemoveFile = () => {
    if (onFileRemoved) {
      onFileRemoved()
      toast({
        title: "File removed",
        description: "Primary file has been removed successfully",
      })
    }
  }

  return (
    <Card className="mb-8 border-2 border-dashed border-primary/20 bg-card">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Upload className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-xl">Primary DNA Sequence</CardTitle>
            <CardDescription className="text-foreground/70">
              Upload your main FASTA file to use across all analysis tools
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentFile ? (
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">{currentFile.name}</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {(currentFile.size / 1024).toFixed(1)} KB • Ready for analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => document.getElementById("file-input")?.click()}>
                Replace File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Primary FASTA File</h3>
            <p className="text-foreground/70 mb-4">Drag and drop your FASTA file here, or click to browse</p>
            <Button onClick={() => document.getElementById("file-input")?.click()} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Choose File"}
            </Button>
          </div>
        )}

        <Input id="file-input" type="file" accept=".fasta,.fa" onChange={handleFileSelect} className="hidden" />

        <div className="mt-4 text-sm text-foreground/70">
          <p>• This file will be automatically used in all analysis tools</p>
          <p>• Each tool allows you to override with a different file if needed</p>
          <p>• Supported formats: .fasta, .fa</p>
        </div>
      </CardContent>
    </Card>
  )
}
