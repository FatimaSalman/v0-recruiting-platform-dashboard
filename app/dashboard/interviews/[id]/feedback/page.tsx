// app/dashboard/interviews/[id]/feedback/page.tsx
"use client"

import { useParams } from "next/navigation"
import { InterviewFeedback } from "@/components/interview-feedback"

export default function InterviewFeedbackPage() {
    const params = useParams()

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <InterviewFeedback
                interviewId={params.id as string}
                candidateId="get-from-params"
                applicationId="get-from-params"
            />
        </div>
    )
}