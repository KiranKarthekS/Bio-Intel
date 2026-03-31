"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { LogOut, Search, Dna, Target, Brain, Shield, ChevronLeft, ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Pathogen Detection System", href: "/checker", icon: Search },
  { name: "Genomic Structure Analyzer", href: "/dna", icon: Dna },
  { name: "Variant Detection Engine", href: "/mutations", icon: Target },
  { name: "Clinical Impact Predictor", href: "/predictor", icon: Brain },
  { name: "Antimicrobial Resistance Profiler", href: "/resistance", icon: Shield },
]

export function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { logout } = useAuth()
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseLeave = () => {
    if (isOpen && !isCollapsed) {
      setIsCollapsed(true)
    }
  }

  const handleToggleClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false)
      setIsOpen(true)
    } else {
      setIsCollapsed(true)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Side Navigation */}
      <div
        ref={sidebarRef}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card z-50 transition-all duration-300 ease-in-out border-r border-border flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          "translate-x-0",
        )}
      >
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-border mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className={cn("bg-transparent", isCollapsed ? "w-8 h-8 p-0" : "w-full")}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleClick}
        className={cn(
          "fixed top-20 z-50 bg-card border-border shadow-md transition-all duration-300",
          isCollapsed ? "left-12" : "left-60",
        )}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </>
  )
}
