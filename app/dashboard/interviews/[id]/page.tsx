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
    const { t } = useI18n()
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
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>
            case "completed":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
            case "cancelled":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>
            case "rescheduled":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Rescheduled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getStatusActions = () => {
        if (!interview) return []

        switch (interview.status) {
            case "scheduled":
                return [
                    { label: "Mark as Completed", value: "completed", variant: "default" },
                    { label: "Mark as Cancelled", value: "cancelled", variant: "destructive" },
                    { label: "Mark as Rescheduled", value: "rescheduled", variant: "outline" }
                ]
            case "completed":
                return [
                    { label: "Reopen as Scheduled", value: "scheduled", variant: "outline" },
                    { label: "Mark as Cancelled", value: "cancelled", variant: "destructive" }
                ]
            case "cancelled":
                return [
                    { label: "Re-schedule", value: "scheduled", variant: "default" },
                    { label: "Mark as Completed", value: "completed", variant: "outline" }
                ]
            case "rescheduled":
                return [
                    { label: "Mark as Scheduled", value: "scheduled", variant: "default" },
                    { label: "Mark as Completed", value: "completed", variant: "outline" },
                    { label: "Mark as Cancelled", value: "cancelled", variant: "destructive" }
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
                        <p className="text-muted-foreground mt-4">Loading interview details...</p>
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
                        <h3 className="text-lg font-semibold mb-2">Interview not found</h3>
                        <p className="text-muted-foreground mb-4">The interview you're looking for doesn't exist.</p>
                        <Button asChild>
                            <Link href="/dashboard/interviews">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Interviews
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
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Interviews
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
                                            <span>{format(new Date(interview.scheduled_at), "PPP 'at' h:mm a")}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{interview.duration_minutes || 60} minutes</span>
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
                                            Edit Interview
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
                                        Delete Interview
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button asChild>
                                <Link href={`/dashboard/interviews/${interviewId}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
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
                                <CardTitle>Interview Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Interview Type</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getInterviewIcon(interview.interview_type)}
                                            <span className="capitalize">{interview.interview_type?.replace("_", " ")}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Duration</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{interview.duration_minutes || 60} minutes</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Scheduled Date & Time</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{format(new Date(interview.scheduled_at), "PPP 'at' h:mm a")}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Status</Label>
                                        <div className="mt-1">
                                            {getStatusBadge(interview.status)}
                                        </div>
                                    </div>
                                </div>

                                {interview.location && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label>Location / Meeting Link</Label>
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
                                                        Join Meeting
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
                                            <Label>Notes</Label>
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
                                    <CardTitle>Interviewer Information</CardTitle>
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
                                                    Send Email
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const subject = `Interview: ${interview.title}`
                                                    const body = `Hi ${interview.interviewer_name},\n\nRegarding our interview scheduled for ${format(new Date(interview.scheduled_at), "PPP 'at' h:mm a")}...`
                                                    window.location.href = `mailto:${interview.interviewer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                                }}
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                Send Reminder
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline / Activity Log */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Interview Created</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(interview.created_at), "PPP 'at' h:mm a")}
                                            </p>
                                        </div>
                                    </div>

                                    {interview.updated_at !== interview.created_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                                <Edit className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">Last Updated</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(interview.updated_at), { addSuffix: true })}
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
                                        Candidate
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
                                                    View Full Profile
                                                </Link>
                                            </Button>
                                            <Button variant="outline" className="w-full" asChild>
                                                <Link href={`mailto:${candidate.email}?subject=Interview: ${interview.title}`}>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Email Candidate
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
                                        Job Position
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
                                                    <span className="text-muted-foreground">Type</span>
                                                    <span className="font-medium capitalize">{job.employment_type.replace("_", " ")}</span>
                                                </div>
                                            )}
                                            {job.experience_level && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Experience</span>
                                                    <span className="font-medium capitalize">{job.experience_level}</span>
                                                </div>
                                            )}
                                            {job.salary_min && job.salary_max && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Salary Range</span>
                                                    <span className="font-medium">
                                                        ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <Button asChild className="w-full">
                                            <Link href={`/dashboard/jobs/${job.id}`}>
                                                View Job Details
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        const subject = `Interview Details: ${interview.title}`
                                        const body = `Interview Details:\n\nTitle: ${interview.title}\nDate: ${format(new Date(interview.scheduled_at), "PPP 'at' h:mm a")}\nDuration: ${interview.duration_minutes} minutes\nType: ${interview.interview_type}\nLocation: ${interview.location}\n\nCandidate: ${candidate?.name}\nJob: ${job?.title}\n\nNotes: ${interview.notes}`
                                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                                    }}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Share Details
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => copyToClipboard(
                                        `Interview: ${interview.title}\nDate: ${format(new Date(interview.scheduled_at), "PPP 'at' h:mm a")}\nCandidate: ${candidate?.name}\nJob: ${job?.title}`
                                    )}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Details
                                </Button>

                                {interview.interview_type === "video" && interview.location && (
                                    <Button asChild className="w-full justify-start">
                                        <a href={interview.location} target="_blank" rel="noopener noreferrer">
                                            <Video className="mr-2 h-4 w-4" />
                                            Join Meeting
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
                                            View Resume
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
                                        Feedback
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Interview has been completed. Add feedback for this candidate.
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href={`/dashboard/interviews/${interviewId}/feedback`}>
                                            Add Feedback
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
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the interview
                                "{interview.title}" scheduled for {format(new Date(interview.scheduled_at), "PPP")}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={deleteInterview}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete Interview"}
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