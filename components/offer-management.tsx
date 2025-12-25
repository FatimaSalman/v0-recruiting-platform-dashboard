// components/offer-management.tsx
"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign,
    Calendar,
    FileText,
    Send,
    CheckCircle,
    XCircle
} from "lucide-react"
import { format } from "date-fns"

interface OfferManagementProps {
    applicationId: string
    candidateId: string
    jobId: string
}

export function OfferManagement({ applicationId, candidateId, jobId }: OfferManagementProps) {
    const [offerData, setOfferData] = useState({
        salary: "",
        startDate: "",
        benefits: "",
        notes: ""
    })
    const [loading, setLoading] = useState(false)
    const [offerSent, setOfferSent] = useState(false)
    const supabase = useSupabase()

    useEffect(() => {
        checkExistingOffer()
    }, [])

    async function checkExistingOffer() {
        try {
            const { data: communications } = await supabase
                .from("communications")
                .select("*")
                .eq("candidate_id", candidateId)
                .eq("type", "note")
                .ilike("subject", "%offer%")
                .order("created_at", { ascending: false })
                .limit(1)

            if (communications && communications.length > 0) {
                setOfferSent(true)
            }
        } catch (error) {
            console.error("Error checking existing offer:", error)
        }
    }

    async function sendOffer() {
        if (!offerData.salary || !offerData.startDate) {
            alert("Please fill in salary and start date")
            return
        }

        setLoading(true)
        try {
            // Get candidate and job details
            const [{ data: candidate }, { data: job }] = await Promise.all([
                supabase
                    .from("candidates")
                    .select("email, name")
                    .eq("id", candidateId)
                    .single(),
                supabase
                    .from("jobs")
                    .select("title")
                    .eq("id", jobId)
                    .single()
            ])

            if (!candidate || !job) throw new Error("Candidate or job not found")

            // Create offer communication
            const offerContent = `
Offer Details for ${job.title}:
- Salary: $${offerData.salary}
- Start Date: ${offerData.startDate}
- Benefits: ${offerData.benefits || "Standard company benefits"}
- Notes: ${offerData.notes || "None"}

This is an automated offer notification. Please contact HR for the official offer letter.
`

            await supabase.from("communications").insert({
                candidate_id: candidateId,
                type: "email",
                subject: `Offer Letter - ${job.title}`,
                content: offerContent,
                created_at: new Date().toISOString()
            })

            // Update application status
            await supabase
                .from("applications")
                .update({
                    status: "offer",
                    updated_at: new Date().toISOString()
                })
                .eq("id", applicationId)

            setOfferSent(true)
            alert("Offer sent successfully!")

        } catch (error) {
            console.error("Error sending offer:", error)
            alert("Failed to send offer")
        } finally {
            setLoading(false)
        }
    }

    async function markAsHired() {
        setLoading(true)
        try {
            await supabase
                .from("applications")
                .update({
                    status: "hired",
                    updated_at: new Date().toISOString()
                })
                .eq("id", applicationId)

            // Also update candidate status
            await supabase
                .from("candidates")
                .update({
                    status: "placed",
                    updated_at: new Date().toISOString()
                })
                .eq("id", candidateId)

            alert("Candidate marked as hired!")
        } catch (error) {
            console.error("Error marking as hired:", error)
            alert("Failed to update status")
        } finally {
            setLoading(false)
        }
    }

    if (offerSent) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Offer Sent
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-700">
                            Offer has been sent to the candidate. Awaiting response.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={markAsHired} disabled={loading}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Hired
                        </Button>
                        <Button variant="outline" onClick={() => setOfferSent(false)}>
                            Edit Offer
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Prepare Offer
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="salary">
                            <DollarSign className="inline w-4 h-4 mr-1" />
                            Salary Offer
                        </Label>
                        <Input
                            id="salary"
                            type="number"
                            placeholder="e.g., 85000"
                            value={offerData.salary}
                            onChange={(e) => setOfferData({ ...offerData, salary: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDate">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            Start Date
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={offerData.startDate}
                            onChange={(e) => setOfferData({ ...offerData, startDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits & Perks</Label>
                    <Textarea
                        id="benefits"
                        placeholder="Health insurance, 401k, vacation days, etc."
                        value={offerData.benefits}
                        onChange={(e) => setOfferData({ ...offerData, benefits: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                        id="notes"
                        placeholder="Any special conditions or notes..."
                        value={offerData.notes}
                        onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
                        rows={2}
                    />
                </div>

                <Button onClick={sendOffer} disabled={loading} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Sending..." : "Send Offer"}
                </Button>
            </CardContent>
        </Card>
    )
}