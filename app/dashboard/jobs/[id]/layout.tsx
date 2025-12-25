// app/dashboard/candidates/[id]/layout.tsx
import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", id)
      .single()

    return {
      title: `${job?.title || 'Job'} - TalentHub`,
    }
  } catch {
    return {
      title: "Job - TalentHub",
    }
  }
}

export default function JobDetailLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}