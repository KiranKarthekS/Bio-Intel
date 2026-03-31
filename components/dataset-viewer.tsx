"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Database, Search, Download } from "lucide-react"

interface MutationData {
  CHROM: string
  POS: string
  REF: string
  ALT: string
  "Type of mutation": string
  "Protein Position": string
  "Nucliec Position": string
  drug: string
  resistance_label: string
  suggested_antibody: string
}

export function DatasetViewer() {
  const [data, setData] = useState<MutationData[]>([])
  const [filteredData, setFilteredData] = useState<MutationData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const loadDataset = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mutations_with_resistance_and_antibody-wZs5FKRl5i7YQXV1SIMezibArHev0E.csv",
      )
      const csvText = await response.text()

      // Parse CSV
      const lines = csvText.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const parsedData: MutationData[] = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ""
          })
          parsedData.push(row as MutationData)
        }
      }

      setData(parsedData)
      setFilteredData(parsedData)
      setIsDataLoaded(true)
    } catch (error) {
      console.error("Error loading dataset:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = data.filter((row) =>
        Object.values(row).some((value) => value.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(data)
    }
  }, [searchTerm, data])

  const exportData = () => {
    const csv = [
      Object.keys(filteredData[0] || {}).join(","),
      ...filteredData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "filtered_mutations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Mutation Dataset
        </CardTitle>
        <CardDescription>Comprehensive database of M. tuberculosis mutations with resistance patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDataLoaded ? (
          <div className="text-center py-8">
            <Button onClick={loadDataset} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Dataset...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Load Dataset
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mutations, drugs, resistance patterns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={exportData} disabled={filteredData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredData.length} of {data.length} mutations
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Mutation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Drug</TableHead>
                      <TableHead>Resistance</TableHead>
                      <TableHead>Suggested Treatment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.slice(0, 100).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{row.POS}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.REF}→{row.ALT}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row["Type of mutation"]}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.drug}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.resistance_label === "Resistant" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {row.resistance_label}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.suggested_antibody}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredData.length > 100 && (
              <div className="text-center text-sm text-muted-foreground">
                Showing first 100 results. Use search to filter data.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
