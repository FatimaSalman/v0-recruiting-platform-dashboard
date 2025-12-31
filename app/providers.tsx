"use client"

import type React from "react"
import { I18nProvider } from "@/lib/i18n-context"
import { SupabaseProvider } from "@/lib/supabase/supabase-provider"
import { Toaster } from "@/components/ui/toaster"


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SupabaseProvider>
        {children}
        <Toaster />
      </SupabaseProvider>
    </I18nProvider>
  )
}
