import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EditInterviewForm } from "@/components/edit-interview-form"

export default async function EditInterviewPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    // Verify user owns this interview
    const { data: interview } = await supabase
        .from("interviews")
        .select("user_id")
        .eq("id", id)
        .single()

    if (!interview) {
        redirect("/dashboard/interviews")
    }

    if (interview.user_id !== user.id) {
        redirect("/dashboard/interviews")
    }

    return (
        <DashboardLayout>
            <EditInterviewForm interviewId={id} />
        </DashboardLayout>
    )
}