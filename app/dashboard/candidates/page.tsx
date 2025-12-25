import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CandidateSearchInterface } from "@/components/candidate-search-interface"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Candidates - TalentHub",
}

export default async function CandidatesPage() {
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
      <CandidateSearchInterface />
    </DashboardLayout>
  )
}
