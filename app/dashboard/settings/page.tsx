// app/dashboard/settings/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SettingsPageContent } from "@/components/settings-page-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings - TalentHub",
}

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    return (
        <DashboardLayout>
            <SettingsPageContent />
        </DashboardLayout>
    )
}