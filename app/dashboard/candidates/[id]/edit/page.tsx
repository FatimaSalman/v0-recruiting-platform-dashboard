// app/dashboard/candidates/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EditCandidateForm } from "@/components/edit-candidate-form"

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/auth/login")
    }

    // Verify user has permission to edit this candidate
    const { data: candidate } = await supabase
        .from("candidates")
        .select("user_id")
        .eq("id", id)
        .single()

    if (!candidate) {
        redirect("/dashboard/candidates")
    }

    if (candidate.user_id !== user.id) {
        redirect("/dashboard/candidates")
    }

    return (
        <DashboardLayout>
            <EditCandidateForm candidateId={id} />
        </DashboardLayout>
    )
}