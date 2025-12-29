"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import { CalendarIcon, Clock, MapPin, Users, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface EditInterviewFormProps {
    interviewId: string
}

export function EditInterviewForm({ interviewId }: EditInterviewFormProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        title: "",
        interview_type: "phone" as "phone" | "video" | "in_person",
        scheduled_at: new Date(),
        duration_minutes: 60,
        location: "",
        interviewer_name: "",
        interviewer_email: "",
        notes: "",
        status: "scheduled" as "scheduled" | "completed" | "cancelled" | "rescheduled"
    })

    const [candidate, setCandidate] = useState<any>(null)
    const [job, setJob] = useState<any>(null)

    const router = useRouter()
    const supabase = useSupabase()
    const { t, locale } = useI18n()

    useEffect(() => {
        fetchInterviewDetails()
    }, [interviewId])

    async function fetchInterviewDetails() {
        try {
            setLoading(true)

            // Fetch interview details
            const { data: interview, error: interviewError } = await supabase
                .from("interviews")
                .select("*")
                .eq("id", interviewId)
                .single()

            if (interviewError) throw interviewError

            if (interview) {
                setFormData({
                    title: interview.title || "",
                    interview_type: interview.interview_type || "phone",
                    scheduled_at: interview.scheduled_at ? new Date(interview.scheduled_at) : new Date(),
                    duration_minutes: interview.duration_minutes || 60,
                    location: interview.location || "",
                    interviewer_name: interview.interviewer_name || "",
                    interviewer_email: interview.interviewer_email || "",
                    notes: interview.notes || "",
                    status: interview.status || "scheduled"
                })

                // Fetch candidate details
                if (interview.candidate_id) {
                    const { data: candidateData } = await supabase
                        .from("candidates")
                        .select("id, name, email")
                        .eq("id", interview.candidate_id)
                        .single()
                    setCandidate(candidateData)
                }

                // Fetch job details if application_id exists
                if (interview.application_id) {
                    const { data: application } = await supabase
                        .from("applications")
                        .select("job_id")
                        .eq("id", interview.application_id)
                        .single()

                    if (application?.job_id) {
                        const { data: jobData } = await supabase
                            .from("jobs")
                            .select("id, title")
                            .eq("id", application.job_id)
                            .single()
                        setJob(jobData)
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching interview details:", error)
            setError(t("editInterview.errorLoad"))
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error: updateError } = await supabase
                .from("interviews")
                .update({
                    ...formData,
                    scheduled_at: formData.scheduled_at.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq("id", interviewId)

            if (updateError) throw updateError

            // Redirect back to interview details or interviews list
            router.push(`/dashboard/interviews`)
        } catch (err: any) {
            setError(err.message || t("editInterview.errorUpdate"))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground mt-4">{t("editInterview.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/dashboard/interviews">
                        <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
                        {t("editInterview.back")}
                    </Link>
                </Button>

                <h1 className="text-3xl font-bold tracking-tight mb-2">{t("editInterview.title")}</h1>
                <p className="text-muted-foreground">
                    {t("editInterview.subtitle")}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("editInterview.detailsTitle")}</CardTitle>
                        <CardDescription>{t("editInterview.detailsDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Candidate & Job Info */}
                        {(candidate || job) && (
                            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                                {candidate && (
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{t("editInterview.candidate")}</span>
                                        <span>{candidate.name}</span>
                                        <span className="text-muted-foreground">({candidate.email})</span>
                                    </div>
                                )}
                                {job && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{t("editInterview.job")}</span>
                                        <span>{job.title}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">{t("editInterview.interviewTitle")}</Label>
                            <Input
                                id="title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t("editInterview.titlePlaceholder")}
                            />
                        </div>

                        {/* Interview Type & Status */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="interview_type">{t("editInterview.type")}</Label>
                                <Select
                                    value={formData.interview_type}
                                    onValueChange={(value: "phone" | "video" | "in_person") =>
                                        setFormData({ ...formData, interview_type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="phone">{t("editInterview.type.phone")}</SelectItem>
                                        <SelectItem value="video">{t("editInterview.type.video")}</SelectItem>
                                        <SelectItem value="in_person">{t("editInterview.type.inPerson")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">{t("editInterview.status")}</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "scheduled" | "completed" | "cancelled" | "rescheduled") =>
                                        setFormData({ ...formData, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">{t("status.interview.scheduled")}</SelectItem>
                                        <SelectItem value="completed">{t("status.interview.completed")}</SelectItem>
                                        <SelectItem value="cancelled">{t("status.interview.cancelled")}</SelectItem>
                                        <SelectItem value="rescheduled">{t("status.interview.rescheduled")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2">
                            <Label>{t("editInterview.dateTime")}</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="me-2 h-4 w-4" />
                                            {formData.scheduled_at ? (
                                                format(formData.scheduled_at, "PPP", { locale: locale === 'ar' ? ar : enUS })
                                            ) : (
                                                <span>{t("editInterview.pickDate")}</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.scheduled_at}
                                            onSelect={(date: any) => date && setFormData({ ...formData, scheduled_at: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="time"
                                        value={format(formData.scheduled_at, "HH:mm")}
                                        onChange={(e) => {
                                            const [hours, minutes] = e.target.value.split(":")
                                            const newDate = new Date(formData.scheduled_at)
                                            newDate.setHours(parseInt(hours), parseInt(minutes))
                                            setFormData({ ...formData, scheduled_at: newDate })
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Duration & Location */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">{t("editInterview.duration")}</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="15"
                                        step="15"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">{t("editInterview.location")}</Label>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder={
                                            formData.interview_type === "video"
                                                ? t("editInterview.locationPlaceholderVideo")
                                                : t("editInterview.locationPlaceholderInPerson")
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Interviewer Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t("editInterview.interviewerInfo")}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="interviewer_name">{t("editInterview.interviewerName")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="interviewer_name"
                                            value={formData.interviewer_name}
                                            onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="interviewer_email">{t("editInterview.interviewerEmail")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="interviewer_email"
                                            type="email"
                                            value={formData.interviewer_email}
                                            onChange={(e) => setFormData({ ...formData, interviewer_email: e.target.value })}
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">{t("editInterview.notes")}</Label>
                            <Textarea
                                id="notes"
                                rows={4}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t("editInterview.notesPlaceholder")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        {t("editInterview.cancel")}
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? t("editInterview.updating") : t("editInterview.update")}
                    </Button>
                </div>
            </form>
        </div>
    )
}