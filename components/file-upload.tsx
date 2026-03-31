"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedFileTypes?: string[]
  maxSize?: number
  className?: string
}

export function FileUpload({
  onFileSelect,
  acceptedFileTypes = [".fasta", ".fa", ".fas"],
  maxSize = 100 * 1024 * 1024, // Reduced default from 3GB to 100MB for better browser performance
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("")

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e: any) => e.code === "file-too-large")) {
          const maxSizeGB = maxSize / (1024 * 1024 * 1024)
          const maxSizeMB = maxSize / (1024 * 1024)

          if (maxSizeGB >= 1) {
            setError(`File too large. Maximum size is ${maxSizeGB.toFixed(1)}GB`)
          } else {
            setError(`File too large. Maximum size is ${Math.round(maxSizeMB)}MB`)
          }
        } else {
          setError(`Please upload a valid file (${acceptedFileTypes.join(", ")})`)
        }
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setSelectedFile(file)
        try {
          onFileSelect(file)
        } catch (err) {
          setError("Failed to process the selected file. Please try again.")
          setSelectedFile(null)
        }
      }
    },
    [onFileSelect, acceptedFileTypes, maxSize],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": acceptedFileTypes,
      "application/octet-stream": acceptedFileTypes.filter((type) => type.includes(".fastq") || type.includes(".fq")),
    },
    maxSize,
    multiple: false,
  })

  const removeFile = () => {
    setSelectedFile(null)
    setError("")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } else {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
  }

  return (
    <div className={className}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">{isDragActive ? "Drop your file here" : "Upload file"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop or click to select ({acceptedFileTypes.join(", ")} files)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size:{" "}
                  {maxSize >= 1024 * 1024 * 1024
                    ? `${(maxSize / (1024 * 1024 * 1024)).toFixed(1)}GB`
                    : `${Math.round(maxSize / (1024 * 1024))}MB`}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
