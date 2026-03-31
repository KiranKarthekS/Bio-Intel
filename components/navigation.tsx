"use client"

import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, Microscope } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function Navigation() {
  const { logout } = useAuth()

  return (
    <nav className="bg-card border-b border-border">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Microscope className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-foreground">BioIntel</span>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout} className="bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
