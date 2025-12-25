"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Home, Search, Users, Briefcase, Calendar, FileText, Settings, Menu, X, LogOut, CreditCard, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useRouter, usePathname } from "next/navigation"
import { LanguageToggle } from "@/components/language-toggle"
import { useI18n } from "@/lib/i18n-context"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()
  const supabase = useSupabase()

  const navItems: NavItem[] = [
    { icon: Home, label: t("nav.dashboard"), href: "/dashboard" },
    { icon: Search, label: t("nav.search"), href: "/dashboard/search" },
    { icon: Users, label: t("nav.candidates"), href: "/dashboard/candidates" },
    { icon: Briefcase, label: t("nav.jobs"), href: "/dashboard/jobs" },
    { icon: Calendar, label: t("nav.interviews"), href: "/dashboard/interviews" },
    { icon: CreditCard, label: t("nav.pricing"), href: "/dashboard/pricing" },
    { icon: FileText, label: t("nav.reports"), href: "/dashboard/reports" },
    { icon: Settings, label: t("nav.settings"), href: "/dashboard/settings" },
  ]

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (

    <div className="flex h-screen overflow-hidden bg-background">


      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-semibold text-lg">TalentHub</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </a>
              )
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.signout")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile header */}
        <header className="lg:hidden h-16 border-b border-border bg-card flex items-center px-4 justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="ml-3 font-semibold text-lg">TalentHub</span>
          </div>
          <LanguageToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
