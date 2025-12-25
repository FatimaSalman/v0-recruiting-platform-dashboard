// components/interview-feedback.tsx
"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"

interface InterviewFeedbackProps {
    interviewId: string
    candidateId: string
    applicationId: string
}

export function InterviewFeedback({ interviewId, candidateId, applicationId }: InterviewFeedbackProps) {
    const [feedback, setFeedback] = useState("")
    const [rating, setRating] = useState("")
    const [recommendation, setRecommendation] = useState("")
    const [loading, setLoading] = useState(false)
    const supabase = useSupabase()

    async function submitFeedback() {
        if (!feedback.trim() || !rating || !recommendation) {
            alert("Please fill all fields")
            return
        }

        setLoading(true)
        try {
            // Update interview with feedback
            const { error: interviewError } = await supabase
                .from("interviews")
                .update({
                    notes: feedback,
                    status: "completed",
                    updated_at: new Date().toISOString()
                })
                .eq("id", interviewId)

            if (interviewError) throw interviewError

            // Add feedback to communications
            await supabase.from("communications").insert({
                candidate_id: candidateId,
                type: "note",
                subject: `Interview Feedback - Rating: ${rating}/5`,
                content: feedback,
                created_at: new Date().toISOString()
            })

            // Update application status based on recommendation
            let newStatus = "interview"
            if (recommendation === "hire") newStatus = "offer"
            if (recommendation === "reject") newStatus = "rejected"
            if (recommendation === "next_round") newStatus = "interview"

            await supabase
                .from("applications")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", applicationId)

            // Clear form
            setFeedback("")
            setRating("")
            setRecommendation("")

            alert("Feedback submitted successfully!")
        } catch (error) {
            console.error("Error submitting feedback:", error)
            alert("Failed to submit feedback")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Interview Feedback
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="rating">Overall Rating</Label>
                    <Select value={rating} onValueChange={setRating}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span>1 - Poor</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="2">
                                <div className="flex items-center gap-2">
                                    {[1, 2].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span>2 - Fair</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="3">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span>3 - Good</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="4">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span>4 - Very Good</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="5">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    <span>5 - Excellent</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="recommendation">Recommendation</Label>
                    <Select value={recommendation} onValueChange={setRecommendation}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select recommendation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hire">
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="w-4 h-4 text-green-500" />
                                    <span>Hire</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="next_round">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    <span>Next Round</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="reject">
                                <div className="flex items-center gap-2">
                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                    <span>Reject</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="feedback">Detailed Feedback</Label>
                    <Textarea
                        id="feedback"
                        placeholder="Provide detailed feedback about the interview..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={6}
                        className="resize-none"
                    />
                </div>

                <Button onClick={submitFeedback} disabled={loading} className="w-full">
                    {loading ? "Submitting..." : "Submit Feedback"}
                </Button>
            </CardContent>
        </Card>
    )
}