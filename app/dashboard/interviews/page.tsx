import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InterviewScheduling } from "@/components/interview-scheduling"

export default async function InterviewsPage() {
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
      <InterviewScheduling />
    </DashboardLayout>
  )
}
