"use client"

import type React from "react"

import { I18nProvider } from "@/lib/i18n-context"
import { SupabaseProvider } from "@/lib/supabase/supabase-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SupabaseProvider>{children}</SupabaseProvider>
    </I18nProvider>
  )
}
