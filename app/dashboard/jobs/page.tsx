import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { JobsManagement } from "@/components/jobs-management"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Jobs - TalentHub",
}

export default async function JobsPage() {
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
      <JobsManagement />
    </DashboardLayout>
  )
}
