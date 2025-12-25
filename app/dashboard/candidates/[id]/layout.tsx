// app/dashboard/candidates/[id]/layout.tsx
import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()

    const { data: candidate } = await supabase
        .from("candidates")
        .select("name, title")
        .eq("id", id)
        .single()

    return {
        title: candidate ? `${candidate.name} - Candidate Profile` : "Candidate Profile",
        description: candidate?.title || "View candidate details and profile"
    }
}

export default function CandidateDetailLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}