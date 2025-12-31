import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { SubscriptionSuccess } from "@/components/subscription-success"
import type { Metadata } from "next"
import { verifyAndSaveSubscription } from "../actions/stripe"

export const metadata: Metadata = {
  title: "Dashboard - TalentHub",
}

interface DashboardPageProps {
  searchParams: Promise<{
    session_id?: string
    subscription?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const params = await searchParams
  const showSuccessMessage = params?.subscription === "success"
  const sessionId = params?.session_id

  if (sessionId) {
    try {
      console.log("Successful subscription with session ID:", params.session_id);
      const result = await verifyAndSaveSubscription(sessionId) as any
      if (result.success) {
        console.log('✅ Subscription saved successfully from success page')
      } else {
        console.error('❌ Failed to save subscription:', result.error)
      }
    } catch (error) {
      console.error('Error processing subscription:', error)
    }
  }

  return (
    <DashboardLayout>
      {showSuccessMessage && <SubscriptionSuccess />}
      <DashboardOverview user={user} />
    </DashboardLayout>
  )
}
