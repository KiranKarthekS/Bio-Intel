"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Download } from "lucide-react"

interface DNAHelixPlotlyProps {
  sequence: string
  className?: string
}

// Base color mapping from the Python code
const BASE_COLORS = {
  A: "#e63946", // red
  T: "#ffd166", // yellow
  C: "#457b9d", // blue
  G: "#2a9d8f", // green
  N: "#888888", // gray for unknown
}

const STRAND1_COLOR = "#1d3557" // dark blue
const STRAND2_COLOR = "#9a031e" // dark red
const CONNECTOR_COLOR = "#cccccc" // gray

export function DNAHelixPlotly({ sequence, className }: DNAHelixPlotlyProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const makeHelixCoords = (seq: string, maxPoints = 1500) => {
    const n = seq.length
    if (n === 0) return { x: [], y1: [], z1: [], y2: [], z2: [], seqKept: "" }

    // Downsample to avoid huge plotting
    const factor = Math.max(1, Math.ceil(n / maxPoints))
    const indices = Array.from({ length: Math.ceil(n / factor) }, (_, i) => i * factor)
    const seqKept = indices.map((i) => seq[i] || "N").join("")
    const m = indices.length

    // Parameters for helix (from Python code)
    const bpPerTurn = 10.5
    const risePerBp = 0.34 // nm
    const radius = 1.0

    const theta = indices.map((_, i) => (2 * Math.PI * i) / bpPerTurn)
    const x = indices.map((_, i) => i * risePerBp)

    // Strand 1
    const y1 = theta.map((t) => radius * Math.cos(t))
    const z1 = theta.map((t) => radius * Math.sin(t))

    // Strand 2 (opposite side of helix)
    const y2 = theta.map((t) => radius * Math.cos(t + Math.PI))
    const z2 = theta.map((t) => radius * Math.sin(t + Math.PI))

    return { x, y1, z1, y2, z2, seqKept }
  }

  const buildPlotlyFigure = (x: number[], y1: number[], z1: number[], y2: number[], z2: number[], seqKept: string) => {
    // Backbones
    const strand1 = {
      x: x,
      y: y1,
      z: z1,
      mode: "lines",
      type: "scatter3d",
      line: { color: STRAND1_COLOR, width: 6 },
      hoverinfo: "none",
      name: "strand1",
      showlegend: true,
    }

    const strand2 = {
      x: x,
      y: y2,
      z: z2,
      mode: "lines",
      type: "scatter3d",
      line: { color: STRAND2_COLOR, width: 6 },
      hoverinfo: "none",
      name: "strand2",
      showlegend: true,
    }

    // Base pair connectors
    const connectorTraces = []
    for (let i = 0; i < seqKept.length; i++) {
      const base = seqKept[i]
      const color = BASE_COLORS[base as keyof typeof BASE_COLORS] || BASE_COLORS.N

      connectorTraces.push({
        x: [x[i], x[i]],
        y: [y1[i], y2[i]],
        z: [z1[i], z2[i]],
        mode: "lines",
        type: "scatter3d",
        line: { color: color, width: 3 },
        hoverinfo: "text",
        text: `pos ${i}: ${base}`,
        showlegend: false,
      })
    }

    const layout = {
      paper_bgcolor: "black",
      plot_bgcolor: "black",
      scene: {
        xaxis: { visible: false },
        yaxis: { visible: false },
        zaxis: { visible: false },
        aspectratio: { x: 2.5, y: 1, z: 1 },
        camera: { eye: { x: 1.6, y: 0.6, z: 0.8 } },
        bgcolor: "black",
      },
      margin: { l: 0, r: 0, t: 30, b: 0 },
      title: {
        text: "DNA Double Helix",
        font: { color: "white" },
      },
      showlegend: true,
      legend: {
        font: { color: "white" },
        bgcolor: "rgba(0,0,0,0.5)",
      },
    }

    const config = {
      displayModeBar: true,
      modeBarButtonsToRemove: [
        "zoom3d",
        "pan3d",
        "orbitRotation",
        "tableRotation",
        "resetCameraDefault3d",
        "resetCameraLastSave3d",
        "hoverCompareCartesian",
        "hoverClosest3d",
        "toggleSpikelines",
        "select",
        "lasso",
        "toImage",
      ],
      responsive: true,
    }

    return { data: [strand1, strand2, ...connectorTraces], layout, config }
  }

  useEffect(() => {
    if (!sequence || !plotRef.current) return

    // Load Plotly dynamically
    const loadPlotly = async () => {
      if (typeof window !== "undefined" && !(window as any).Plotly) {
        const script = document.createElement("script")
        script.src = "https://cdn.plot.ly/plotly-latest.min.js"
        script.onload = () => setIsLoaded(true)
        document.head.appendChild(script)
      } else {
        setIsLoaded(true)
      }
    }

    loadPlotly()
  }, [])

  useEffect(() => {
    if (!isLoaded || !sequence || !plotRef.current) return

    const { x, y1, z1, y2, z2, seqKept } = makeHelixCoords(sequence, 1500)

    if (seqKept.length === 0) return

    const { data, layout, config } = buildPlotlyFigure(x, y1, z1, y2, z2, seqKept)

    // @ts-ignore - Plotly is loaded dynamically
    window.Plotly.newPlot(plotRef.current, data, layout, config)

    return () => {
      if (plotRef.current) {
        // @ts-ignore
        window.Plotly.purge(plotRef.current)
      }
    }
  }, [isLoaded, sequence])

  const resetView = () => {
    if (!plotRef.current || !isLoaded) return

    // @ts-ignore
    window.Plotly.relayout(plotRef.current, {
      "scene.camera": { eye: { x: 1.6, y: 0.6, z: 0.8 } },
    })
  }

  const downloadImage = () => {
    if (!plotRef.current || !isLoaded) return

    // @ts-ignore
    window.Plotly.downloadImage(plotRef.current, {
      format: "png",
      width: 1200,
      height: 800,
      filename: "dna_helix_visualization",
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🧬 DNA Double Helix
            <div className="flex gap-1">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 mr-1"></div>
                strand1
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-1"></div>
                strand2
              </Badge>
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetView} disabled={!isLoaded}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadImage} disabled={!isLoaded}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={plotRef}
          className="w-full h-[600px] lg:h-[750px] rounded-lg border"
          style={{ background: "#111111" }}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-white">Loading 3D visualization...</div>
          </div>
        )}
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <p>Sequence length: {sequence.length} bases</p>
            <p>Showing: {Math.min(sequence.length, 1500)} bases</p>
          </div>
          <div className="flex gap-2">
            {Object.entries(BASE_COLORS)
              .slice(0, 4)
              .map(([base, color]) => (
                <div key={base} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-xs font-mono">{base}</span>
                </div>
              ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Interactive 3D visualization • Drag to rotate • Scroll to zoom • Click controls above
        </p>
      </CardContent>
    </Card>
  )
}
