import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { SubscriptionSuccess } from "@/components/subscription-success"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - TalentHub",
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
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

  if(params?.session_id){
    console.log("Successful subscription with session ID:", params.session_id);
    // You can add additional logic here, such as fetching subscription details
    // or updating the UI to reflect the successful subscription.
  }
  return (
    <DashboardLayout>
      {showSuccessMessage && <SubscriptionSuccess />}
      <DashboardOverview user={user} />
    </DashboardLayout>
  )
}
