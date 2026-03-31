"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SequenceInfoProps {
  sequence: string
  filename?: string
}

export function SequenceInfo({ sequence, filename }: SequenceInfoProps) {
  // Calculate base composition
  const baseCount = {
    A: (sequence.match(/A/g) || []).length,
    T: (sequence.match(/T/g) || []).length,
    G: (sequence.match(/G/g) || []).length,
    C: (sequence.match(/C/g) || []).length,
  }

  const total = sequence.length
  const gcContent = (((baseCount.G + baseCount.C) / total) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sequence Analysis</CardTitle>
        {filename && <p className="text-sm text-muted-foreground">File: {filename}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Base Composition</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Adenine (A):</span>
              <Badge variant="secondary" className="ml-2">
                {baseCount.A} ({((baseCount.A / total) * 100).toFixed(1)}%)
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Thymine (T):</span>
              <Badge variant="secondary" className="ml-2">
                {baseCount.T} ({((baseCount.T / total) * 100).toFixed(1)}%)
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Guanine (G):</span>
              <Badge variant="secondary" className="ml-2">
                {baseCount.G} ({((baseCount.G / total) * 100).toFixed(1)}%)
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Cytosine (C):</span>
              <Badge variant="secondary" className="ml-2">
                {baseCount.C} ({((baseCount.C / total) * 100).toFixed(1)}%)
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Statistics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Length:</span>
              <Badge>{total.toLocaleString()} bp</Badge>
            </div>
            <div className="flex justify-between">
              <span>GC Content:</span>
              <Badge variant="outline">{gcContent}%</Badge>
            </div>
            <div className="flex justify-between">
              <span>AT Content:</span>
              <Badge variant="outline">{(100 - Number.parseFloat(gcContent)).toFixed(1)}%</Badge>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Sequence Preview</h4>
          <div className="bg-muted p-3 rounded-lg">
            <code className="text-xs font-mono break-all">
              {sequence.substring(0, 200)}
              {sequence.length > 200 && "..."}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
