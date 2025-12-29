"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Mail,
    Phone,
    Video,
    User,
    FileText,
    Award,
    Building,
    DollarSign,
    Briefcase,
    ArrowLeft,
    Edit,
    MessageSquare,
    ExternalLink,
    Copy,
    Download,
    Trash2,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function InterviewDetailPage() {
    const [interview, setInterview] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [candidate, setCandidate] = useState<any>(null)
    const [job, setJob] = useState<any>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const params = useParams()
    const router = useRouter()
    const supabase = useSupabase()
    const { t, locale } = useI18n()
    const dateLocale = locale === 'ar' ? ar : enUS
    const interviewId = params.id as string

    useEffect(() => {
        fetchInterviewDetails()
    }, [interviewId])

    async function fetchInterviewDetails() {
        try {
            setLoading(true)

            // Fetch interview details
            const { data: interviewData, error: interviewError } = await supabase
                .from("interviews")
                .select("*")
                .eq("id", interviewId)
                .single()

            if (interviewError) throw interviewError
            setInterview(interviewData)

            // Fetch candidate details if candidate_id exists
            if (interviewData?.candidate_id) {
                const { data: candidateData } = await supabase
                    .from("candidates")
                    .select("*")
                    .eq("id", interviewData.candidate_id)
                    .single()
                setCandidate(candidateData)
            }

            // Fetch job details if application_id exists
            if (interviewData?.application_id) {
                const { data: application } = await supabase
                    .from("applications")
                    .select("job_id")
                    .eq("id", interviewData.application_id)
                    .single()

                if (application?.job_id) {
                    const { data: jobData } = await supabase
                        .from("jobs")
                        .select("*")
                        .eq("id", application.job_id)
                        .single()
                    setJob(jobData)
                }
            }
        } catch (error) {
            console.error("Error fetching interview details:", error)
        } finally {
            setLoading(false)
        }
    }

    async function deleteInterview() {
        setDeleting(true)
        try {
            const { error } = await supabase
                .from("interviews")
                .delete()
                .eq("id", interviewId)

            if (error) throw error

            router.push("/dashboard/interviews")
        } catch (error) {
            console.error("Error deleting interview:", error)
        } finally {
            setDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    async function updateInterviewStatus(newStatus: string) {
        try {
            const { error } = await supabase
                .from("interviews")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", interviewId)

            if (error) throw error

            // Refresh data
            fetchInterviewDetails()
        } catch (error) {
            console.error("Error updating interview status:", error)
        }
    }

    const getInterviewIcon = (type: string) => {
        switch (type) {
            case "video":
                return <Video className="w-5 h-5 text-blue-500" />
            case "phone":
                return <Phone className="w-5 h-5 text-green-500" />
            default:
                return <Users className="w-5 h-5 text-purple-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "scheduled":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t("status.interview.scheduled")}</Badge>
            case "completed":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t("status.interview.completed")}</Badge>
            case "cancelled":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t("status.interview.cancelled")}</Badge>
            case "rescheduled":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t("status.interview.rescheduled")}</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getStatusActions = () => {
        if (!interview) return []

        switch (interview.status) {
            case "scheduled":
                return [
                    { label: t("interview.details.markCompleted"), value: "completed", variant: "default" },
                    { label: t("interview.details.markCancelled"), value: "cancelled", variant: "destructive" },
                    { label: t("interview.details.markRescheduled"), value: "rescheduled", variant: "outline" }
                ]
            case "completed":
                return [
                    { label: t("interview.details.reopenScheduled"), value: "scheduled", variant: "outline" },
                    { label: t("interview.details.markCancelled"), value: "cancelled", variant: "destructive" }
                ]
            case "cancelled":
                return [
                    { label: t("interview.details.reschedule"), value: "scheduled", variant: "default" },
                    { label: t("interview.details.markCompleted"), value: "completed", variant: "outline" }
                ]
            case "rescheduled":
                return [
                    { label: t("interview.details.markScheduled"), value: "scheduled", variant: "default" },
                    { label: t("interview.details.markCompleted"), value: "completed", variant: "outline" },
                    { label: t("interview.details.markCancelled"), value: "cancelled", variant: "destructive" }
                ]
            default:
                return []
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        // You could add a toast notification here
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground mt-4">{t("editInterview.loading")}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!interview) {
        return (
            <DashboardLayout>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">{t("interview.details.notFound")}</h3>
                        <p className="text-muted-foreground mb-4">{t("interview.details.notFoundDesc")}</p>
                        <Button asChild>
                            <Link href="/dashboard/interviews">
                                <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180" />
                                {t("interview.details.back")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/dashboard/interviews">
                            <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180" />
                            {t("interview.details.back")}
                        </Link>
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {getInterviewIcon(interview.interview_type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold tracking-tight">{interview.title}</h1>
                                        {getStatusBadge(interview.status)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(interview.scheduled_at), "PPP", { locale: dateLocale })} {t("interview.details.at")} {format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{interview.duration_minutes || 60} {t("candidate.profile.minutes")}</span>
                                        </div>
                                        {interview.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{interview.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/interviews/${interviewId}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            {t("interview.details.edit")}
                                        </Link>
                                    </DropdownMenuItem>

                                    {/* Status Actions */}
                                    {getStatusActions().map((action) => (
                                        <DropdownMenuItem
                                            key={action.value}
                                            onClick={() => updateInterviewStatus(action.value)}
                                            className={action.variant === "destructive" ? "text-red-600" : ""}
                                        >
                                            {action.label}
                                        </DropdownMenuItem>
                                    ))}

                                    <Separator className="my-1" />

                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t("interview.details.delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button asChild>
                                <Link href={`/dashboard/interviews/${interviewId}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Interview Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("editInterview.detailsTitle")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t("editInterview.type")}</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getInterviewIcon(interview.interview_type)}
                                            <span className="capitalize">{t(`editInterview.type.${interview.interview_type === 'in_person' ? 'inPerson' : interview.interview_type}`)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>{t("editInterview.duration")}</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{interview.duration_minutes || 60} {t("candidate.profile.minutes")}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>{t("editInterview.dateTime")}</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{format(new Date(interview.scheduled_at), "PPP", { locale: dateLocale })} {t("interview.details.at")} {format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>{t("editInterview.status")}</Label>
                                        <div className="mt-1">
                                            {getStatusBadge(interview.status)}
                                        </div>
                                    </div>
                                </div>

                                {interview.location && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label>{t("editInterview.location")}</Label>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    <span>{interview.location}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(interview.location)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {interview.interview_type === "video" && (
                                                <Button className="mt-2" asChild>
                                                    <a href={interview.location} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        {t("interview.details.joinMeeting")}
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {interview.notes && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label>{t("editInterview.notes")}</Label>
                                            <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                                                {interview.notes}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Interviewer Information */}
                        {(interview.interviewer_name || interview.interviewer_email) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("editInterview.interviewerInfo")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {interview.interviewer_name && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{interview.interviewer_name}</p>
                                                    {interview.interviewer_email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                                            <a
                                                                href={`mailto:${interview.interviewer_email}`}
                                                                className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                                            >
                                                                {interview.interviewer_email}
                                                            </a>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyToClipboard(interview.interviewer_email)}
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {interview.interviewer_email && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.location.href = `mailto:${interview.interviewer_email}`}
                                                >
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    {t("interview.details.sendEmail")}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const subject = t("interview.reminder.subject").replace("{title}", interview.title)
                                                    const body = t("interview.reminder.body").replace("{name}", interview.interviewer_name || "").replace("{date}", `${format(new Date(interview.scheduled_at), "PPP", { locale: dateLocale })} ${t("interview.details.at")} ${format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}`)
                                                    window.location.href = `mailto:${interview.interviewer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                                }}
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                {t("interview.details.sendReminder")}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline / Activity Log */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("interview.details.timeline")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{t("interview.details.created")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(interview.created_at), "PPP", { locale: dateLocale })} {t("interview.details.at")} {format(new Date(interview.created_at), "h:mm a", { locale: dateLocale })}
                                            </p>
                                        </div>
                                    </div>

                                    {interview.updated_at !== interview.created_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                                <Edit className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{t("interview.details.updated")}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(interview.updated_at), { addSuffix: true, locale: dateLocale })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        {/* Candidate Information */}
                        {candidate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        {t("common.candidate")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-primary">
                                                    {candidate.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <Link
                                                    href={`/dashboard/candidates/${candidate.id}`}
                                                    className="font-semibold hover:text-primary hover:underline"
                                                >
                                                    {candidate.name}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">{candidate.title}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <a
                                                    href={`mailto:${candidate.email}`}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {candidate.email}
                                                </a>
                                            </div>
                                            {candidate.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <a
                                                        href={`tel:${candidate.phone}`}
                                                        className="hover:text-primary hover:underline"
                                                    >
                                                        {candidate.phone}
                                                    </a>
                                                </div>
                                            )}
                                            {candidate.location && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                                    <span>{candidate.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <Button asChild className="w-full">
                                                <Link href={`/dashboard/candidates/${candidate.id}`}>
                                                    {t("interview.details.viewProfile")}
                                                </Link>
                                            </Button>
                                            <Button variant="outline" className="w-full" asChild>
                                                <Link href={`mailto:${candidate.email}?subject=Interview: ${interview.title}`}>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    {t("interview.details.emailCandidate")}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Job Information */}
                        {job && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        {t("interview.details.jobPosition")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Link
                                                href={`/dashboard/jobs/${job.id}`}
                                                className="font-semibold hover:text-primary hover:underline"
                                            >
                                                {job.title}
                                            </Link>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {job.department && (
                                                    <Badge variant="outline">{job.department}</Badge>
                                                )}
                                                {job.location && (
                                                    <Badge variant="outline">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {job.location}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {job.employment_type && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("interview.details.type")}</span>
                                                    <span className="font-medium capitalize">{t(`jobs.form.type.${job.employment_type === 'full_time' ? 'fullTime' : job.employment_type === 'part_time' ? 'partTime' : job.employment_type}`)}</span>
                                                </div>
                                            )}
                                            {job.experience_level && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("interview.details.experience")}</span>
                                                    <span className="font-medium capitalize">{t(`jobs.form.level.${job.experience_level}`)}</span>
                                                </div>
                                            )}
                                            {job.salary_min && job.salary_max && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{t("interview.details.salary")}</span>
                                                    <span className="font-medium">
                                                        ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <Button asChild className="w-full">
                                            <Link href={`/dashboard/jobs/${job.id}`}>
                                                {t("interview.details.viewJob")}
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("interview.details.quickActions")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        const subject = t("interview.email.subject").replace("{title}", interview.title)
                                        const body = `${t("interview.email.body.title")}\n\n${t("editInterview.interviewTitle")}: ${interview.title}\n${t("interview.email.body.date")} ${format(new Date(interview.scheduled_at), "PPP", { locale: dateLocale })} ${t("interview.details.at")} ${format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}\n${t("interview.email.body.duration")} ${interview.duration_minutes} ${t("candidate.profile.minutes")}\n${t("interview.email.body.type")} ${t(`editInterview.type.${interview.interview_type === 'in_person' ? 'inPerson' : interview.interview_type}`)}\n${t("interview.email.body.location")} ${interview.location}\n\n${t("interview.email.body.candidate")} ${candidate?.name}\n${t("interview.email.body.job")} ${job?.title}\n\n${t("interview.email.body.notes")} ${interview.notes || ''}`
                                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                    }}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    {t("interview.details.share")}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => copyToClipboard(
                                        `${t("editInterview.interviewTitle")}: ${interview.title}\n${t("interview.email.body.date")} ${format(new Date(interview.scheduled_at), "PPP", { locale: dateLocale })} ${t("interview.details.at")} ${format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}\n${t("interview.email.body.candidate")} ${candidate?.name}\n${t("interview.email.body.job")} ${job?.title}`
                                    )}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    {t("interview.details.copy")}
                                </Button>

                                {interview.interview_type === "video" && interview.location && (
                                    <Button asChild className="w-full justify-start">
                                        <a href={interview.location} target="_blank" rel="noopener noreferrer">
                                            <Video className="mr-2 h-4 w-4" />
                                            {t("interview.details.joinMeeting")}
                                        </a>
                                    </Button>
                                )}

                                {candidate?.resume_url && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        asChild
                                    >
                                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="mr-2 h-4 w-4" />
                                            {t("interview.details.viewResume")}
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Feedback Section */}
                        {interview.status === "completed" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        {t("interview.details.feedback")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t("interview.details.feedbackDesc")}
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href={`/dashboard/interviews/${interviewId}/feedback`}>
                                            {t("interview.details.addFeedback")}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Delete Dialog */}
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("interview.details.deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("interview.details.deleteDesc")} "{interview.title}"...
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("scheduleInterview.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={deleteInterview}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleting}
                            >
                                {deleting ? t("interview.details.deleting") : t("interview.details.delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    )
}

// Helper Label component
function Label({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm font-medium leading-none">{children}</p>
    )
}