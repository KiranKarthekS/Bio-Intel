"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface FastaFile {
  name: string
  size: number
  content: string
  uploadedAt: Date
}

interface FastaContextType {
  primaryFile: FastaFile | null
  setPrimaryFile: (file: FastaFile | null) => void
  isValidFastaFile: (filename: string) => boolean
  parseFastaContent: (content: string) => { sequence: string; isValid: boolean; error?: string }
}

const FastaContext = createContext<FastaContextType | undefined>(undefined)

export function useFasta() {
  const context = useContext(FastaContext)
  if (context === undefined) {
    throw new Error("useFasta must be used within a FastaProvider")
  }
  return context
}

interface FastaProviderProps {
  children: ReactNode
}

export function FastaProvider({ children }: FastaProviderProps) {
  const [primaryFile, setPrimaryFileState] = useState<FastaFile | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("primaryDnaFile")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert uploadedAt back to Date object
        if (parsed.uploadedAt) {
          parsed.uploadedAt = new Date(parsed.uploadedAt)
        }
        setPrimaryFileState(parsed)
      } catch (error) {
        console.error("Failed to parse stored FASTA file:", error)
        localStorage.removeItem("primaryDnaFile")
      }
    }
  }, [])

  // Save to localStorage whenever primaryFile changes
  const setPrimaryFile = (file: FastaFile | null) => {
    setPrimaryFileState(file)
    if (file) {
      localStorage.setItem("primaryDnaFile", JSON.stringify(file))
    } else {
      localStorage.removeItem("primaryDnaFile")
    }
  }

  // Utility function to validate FASTA file extensions
  const isValidFastaFile = (filename: string): boolean => {
    const validExtensions = [".fasta", ".fa", ".fas"]
    return validExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  }

  // Utility function to parse and validate FASTA content
  const parseFastaContent = (content: string): { sequence: string; isValid: boolean; error?: string } => {
    try {
      const lines = content.split("\n")
      const sequenceLines: string[] = []
      let foundSequence = false

      for (const line of lines) {
        if (line.startsWith(">")) {
          if (foundSequence) break // Stop at next sequence
          foundSequence = true
          continue
        }
        if (foundSequence && line.trim()) {
          sequenceLines.push(line.trim().toUpperCase())
        }
      }

      if (sequenceLines.length === 0) {
        return {
          sequence: "",
          isValid: false,
          error: "No valid DNA sequence found in file",
        }
      }

      const parsedSequence = sequenceLines.join("")

      // Validate sequence (should only contain A, T, G, C, N)
      const validBases = /^[ATGCN]+$/
      if (!validBases.test(parsedSequence)) {
        return {
          sequence: parsedSequence,
          isValid: false,
          error: "Invalid DNA sequence. Only A, T, G, C, N bases are allowed.",
        }
      }

      return {
        sequence: parsedSequence,
        isValid: true,
      }
    } catch (error) {
      return {
        sequence: "",
        isValid: false,
        error: "Failed to parse FASTA content",
      }
    }
  }

  const value: FastaContextType = {
    primaryFile,
    setPrimaryFile,
    isValidFastaFile,
    parseFastaContent,
  }

  return <FastaContext.Provider value={value}>{children}</FastaContext.Provider>
}
