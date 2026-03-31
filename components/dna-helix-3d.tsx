"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut } from "lucide-react"

interface DNAHelix3DProps {
  sequence: string
  className?: string
}

// Base color mapping
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

export function DNAHelix3D({ sequence, className }: DNAHelix3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isPlaying, setIsPlaying] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [cameraAngle, setCameraAngle] = useState({ x: 0.3, y: 0 })

  const makeHelixCoords = (seq: string, maxPoints = 1000) => {
    const n = seq.length
    if (n === 0) return { coords: [], sequence: "" }

    // Downsample for performance
    const factor = Math.max(1, Math.ceil(n / maxPoints))
    const indices = Array.from({ length: Math.ceil(n / factor) }, (_, i) => i * factor)
    const seqKept = indices.map((i) => seq[i] || "N").join("")
    const m = indices.length

    // Biological parameters
    const bpPerTurn = 10.5
    const risePerBp = 0.34
    const radius = 1.0

    const coords = indices.map((_, i) => {
      const theta = (2 * Math.PI * i) / bpPerTurn
      const x = i * risePerBp

      return {
        x,
        y1: radius * Math.cos(theta),
        z1: radius * Math.sin(theta),
        y2: radius * Math.cos(theta + Math.PI),
        z2: radius * Math.sin(theta + Math.PI),
        base: seqKept[i],
      }
    })

    return { coords, sequence: seqKept }
  }

  useEffect(() => {
    if (!sequence || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height
    const centerX = width / 2
    const centerY = height / 2

    const { coords } = makeHelixCoords(sequence, 800)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      ctx.fillStyle = "#111111"
      ctx.fillRect(0, 0, width, height)

      if (coords.length === 0) return

      const scale = 80 * zoom
      const perspective = 400

      // Apply camera rotation
      const cosX = Math.cos(cameraAngle.x)
      const sinX = Math.sin(cameraAngle.x)
      const cosY = Math.cos(cameraAngle.y)
      const sinY = Math.sin(cameraAngle.y)

      const projectedCoords = coords.map((coord) => {
        // Rotate around Y axis (left-right)
        const x = coord.x * cosY - coord.z1 * sinY
        let z1 = coord.x * sinY + coord.z1 * cosY
        let z2 = coord.x * sinY + coord.z2 * cosY

        // Rotate around X axis (up-down)
        const y1 = coord.y1 * cosX - z1 * sinX
        z1 = coord.y1 * sinX + z1 * cosX
        const y2 = coord.y2 * cosX - z2 * sinX
        z2 = coord.y2 * sinX + z2 * cosX

        // Apply perspective projection
        const scale1 = perspective / (perspective + z1)
        const scale2 = perspective / (perspective + z2)

        return {
          x1: centerX + x * scale + y1 * scale * scale1,
          y1: centerY + z1 * scale * scale1,
          x2: centerX + x * scale + y2 * scale * scale2,
          y2: centerY + z2 * scale * scale2,
          scale1,
          scale2,
          base: coord.base,
          depth1: z1,
          depth2: z2,
        }
      })

      // Sort by depth for proper rendering
      const sortedCoords = projectedCoords
        .map((coord, i) => ({ ...coord, index: i }))
        .sort((a, b) => Math.min(a.depth1, a.depth2) - Math.min(b.depth1, b.depth2))

      sortedCoords.forEach((coord) => {
        const alpha = Math.max(0.2, Math.min(coord.scale1, coord.scale2))
        ctx.strokeStyle = `rgba(204, 204, 204, ${alpha * 0.8})`
        ctx.lineWidth = Math.max(1, 3 * Math.min(coord.scale1, coord.scale2))
        ctx.beginPath()
        ctx.moveTo(coord.x1, coord.y1)
        ctx.lineTo(coord.x2, coord.y2)
        ctx.stroke()
      })

      // Strand 1 (blue)
      ctx.strokeStyle = STRAND1_COLOR
      ctx.lineWidth = 4
      ctx.beginPath()
      sortedCoords.forEach((coord, i) => {
        if (i === 0) ctx.moveTo(coord.x1, coord.y1)
        else ctx.lineTo(coord.x1, coord.y1)
      })
      ctx.stroke()

      // Strand 2 (red)
      ctx.strokeStyle = STRAND2_COLOR
      ctx.lineWidth = 4
      ctx.beginPath()
      sortedCoords.forEach((coord, i) => {
        if (i === 0) ctx.moveTo(coord.x2, coord.y2)
        else ctx.lineTo(coord.x2, coord.y2)
      })
      ctx.stroke()

      sortedCoords.forEach((coord) => {
        const baseColor = BASE_COLORS[coord.base as keyof typeof BASE_COLORS] || BASE_COLORS.N

        // Strand 1 base
        const alpha1 = Math.max(0.3, coord.scale1)
        ctx.fillStyle = `${baseColor}${Math.round(alpha1 * 255)
          .toString(16)
          .padStart(2, "0")}`
        ctx.beginPath()
        ctx.arc(coord.x1, coord.y1, 3 * coord.scale1, 0, 2 * Math.PI)
        ctx.fill()

        // Strand 2 base (complementary)
        const alpha2 = Math.max(0.3, coord.scale2)
        const complementBase =
          coord.base === "A"
            ? "T"
            : coord.base === "T"
              ? "A"
              : coord.base === "G"
                ? "C"
                : coord.base === "C"
                  ? "G"
                  : "N"
        const compColor = BASE_COLORS[complementBase as keyof typeof BASE_COLORS] || BASE_COLORS.N
        ctx.fillStyle = `${compColor}${Math.round(alpha2 * 255)
          .toString(16)
          .padStart(2, "0")}`
        ctx.beginPath()
        ctx.arc(coord.x2, coord.y2, 3 * coord.scale2, 0, 2 * Math.PI)
        ctx.fill()
      })

      if (isPlaying) {
        setRotation((prev) => prev + 0.005)
        setCameraAngle((prev) => ({ ...prev, y: prev.y + 0.005 }))
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [sequence, isPlaying, zoom, cameraAngle])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - mousePos.x
    const deltaY = e.clientY - mousePos.y

    setCameraAngle((prev) => ({
      x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + deltaY * 0.01)),
      y: prev.y + deltaX * 0.01,
    }))

    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setCameraAngle({ x: 0.3, y: 0 })
    setZoom(1)
    setRotation(0)
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
            <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.min(2, prev + 0.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.2))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="w-full h-96 rounded-lg border cursor-grab active:cursor-grabbing"
          style={{ background: "#111111" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <p>Sequence length: {sequence.length} bases</p>
            <p>Showing: {Math.min(sequence.length, 800)} bases</p>
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
          Drag to rotate • Use controls to zoom and play/pause animation
        </p>
      </CardContent>
    </Card>
  )
}
