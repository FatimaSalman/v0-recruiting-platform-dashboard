import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ScheduleInterviewForm } from "@/components/schedule-interview-form"

export default async function NewInterviewPage() {
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
      <ScheduleInterviewForm />
    </DashboardLayout>
  )
}
