"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search } from "lucide-react"

export interface Mutation {
  position: number
  reference: string
  alternate: string
  type: string
}

interface MutationTableProps {
  mutations: Mutation[]
  filename?: string
}

const mutationTypeColors = {
  missense_variant: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  synonymous_variant: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  frameshift_variant: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  intergenic_region: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

export function MutationTable({ mutations, filename }: MutationTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const filteredMutations = useMemo(() => {
    return mutations.filter((mutation) => {
      const matchesSearch =
        mutation.position.toString().includes(searchTerm) ||
        mutation.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mutation.alternate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mutation.type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === "all" || mutation.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [mutations, searchTerm, typeFilter])

  const paginatedMutations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredMutations.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredMutations, currentPage])

  const totalPages = Math.ceil(filteredMutations.length / itemsPerPage)

  const downloadCSV = () => {
    const headers = ["Position", "Reference", "Alternate", "Type of Mutation"]
    const csvContent = [
      headers.join(","),
      ...filteredMutations.map((m) => [m.position, m.reference, m.alternate, m.type].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename?.replace(/\.[^/.]+$/, "") || "mutations"}_analysis.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const mutationTypes = Array.from(new Set(mutations.map((m) => m.type)))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Mutation Analysis Results</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Found {mutations.length} mutations • Showing {filteredMutations.length} after filters
            </p>
          </div>
          <Button onClick={downloadCSV} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mutations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {mutationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Alternate</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMutations.map((mutation, index) => (
                  <tr key={index} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono">{mutation.position.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{mutation.reference}</td>
                    <td className="px-4 py-3 font-mono font-bold text-red-600">{mutation.alternate}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          mutationTypeColors[mutation.type as keyof typeof mutationTypeColors] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {mutation.type.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredMutations.length)} of {filteredMutations.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {mutationTypes.map((type) => {
            const count = mutations.filter((m) => m.type === type).length
            const percentage = ((count / mutations.length) * 100).toFixed(1)
            return (
              <div key={type} className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {type.replace(/_/g, " ")} ({percentage}%)
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
