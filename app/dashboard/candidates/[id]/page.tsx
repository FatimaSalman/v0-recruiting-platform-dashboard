// app/dashboard/candidates/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Star,
    Edit,
    ArrowLeft,
    MessageSquare,
    Download,
    Copy,
    Shield,
    Clock,
    UserCheck,
    XCircle,
    CheckCircle,
    ExternalLink,
    Award,
    Globe,
    FileText,
    Linkedin,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { useI18n } from "@/lib/i18n-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Tag, UserMinus } from "lucide-react"
import { CandidateCommunication } from "@/components/candidate-communication"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"


export default function CandidateProfilePage() {
    const [candidate, setCandidate] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [notes, setNotes] = useState("")
    const [savingNotes, setSavingNotes] = useState(false)
    const [contactDialogOpen, setContactDialogOpen] = useState(false)
    const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'linkedin'>('email')

    const params = useParams()
    const router = useRouter()
    const supabase = useSupabase()
    const { t } = useI18n()
    const candidateId = params.id as string

    const tabs = ['overview', 'applications', 'interviews', 'notes', 'communications']

    useEffect(() => {
        fetchCandidateDetails()
    }, [candidateId])

    async function fetchCandidateDetails() {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from("candidates")
                .select("*")
                .eq("id", candidateId)
                .single()

            if (error) throw error

            // Fetch applications with job details
            const { data: applicationsData } = await supabase
                .from("applications")
                .select(`
                    id,
                    status,
                    match_score,
                    applied_at,
                    jobs (
                        id,
                        title,
                        department,
                        status
                    )
                `)
                .eq("candidate_id", candidateId)
                .order("applied_at", { ascending: false })

            // Fetch interviews
            const { data: interviewsData } = await supabase
                .from("interviews")
                .select("*")
                .eq("candidate_id", candidateId)
                .order("scheduled_at", { ascending: false })

            setCandidate({
                ...data,
                applications: applicationsData || [],
                interviews: interviewsData || [],
            })

            // Load existing notes
            if (data.notes) {
                setNotes(data.notes)
            }

        } catch (error) {
            console.error("Error fetching candidate details:", error)
        } finally {
            setLoading(false)
        }
    }

    async function updateCandidateStatus(newStatus: 'active' | 'inactive' | 'placed' | 'withdrawn') {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("User not authenticated!");
            }

            const { data: candidateCheck, error: checkError } = await supabase
                .from("candidates")
                .select("user_id")
                .eq("id", candidateId)
                .single()

            if (checkError) throw checkError
            if (candidateCheck.user_id !== user.id) {
                throw new Error("You don't have permission to update this candidate!");
            }

            const { error } = await supabase
                .from("candidates")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    last_contacted: new Date().toISOString()
                })
                .eq("id", candidateId)
                .eq("user_id", user.id)

            if (error) throw error

            // Refresh candidate data
            await fetchCandidateDetails()
        } catch (error) {
            console.error("Error updating status:", error)
        }
    }

    async function saveNotes() {
        if (!candidate) return

        setSavingNotes(true)
        try {
            const { error } = await supabase
                .from("candidates")
                .update({
                    notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq("id", candidateId)

            if (error) throw error

            setCandidate({ ...candidate, notes })
        } catch (error) {
            console.error("Error saving notes:", error)
        } finally {
            setSavingNotes(false)
        }
    }

    async function handleContact(contactMethod: string) {
        console.log(contactMethod);
        switch (contactMethod) {
            case 'email':
                window.location.href = `mailto:${candidate.email}?subject=Regarding your application`
                break
            case 'phone':
                if (candidate.phone) {
                    window.location.href = `tel:${candidate.phone}`
                }
                break
            case 'linkedin':
                if (candidate.linkedin_url) {
                    window.open(candidate.linkedin_url, '_blank')
                }
                break
        }
        setContactDialogOpen(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                </Badge>
            case 'inactive':
                return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                    <Clock className="w-3 h-3 mr-1" /> Inactive
                </Badge>
            case 'placed':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Award className="w-3 h-3 mr-1" /> Placed
                </Badge>
            case 'withdrawn':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" /> Withdrawn
                </Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getAvailabilityBadge = (availability: string) => {
        const availabilityMap: Record<string, { label: string, color: string }> = {
            'immediate': { label: 'Immediate', color: 'bg-green-500/10 text-green-500' },
            '2-weeks': { label: '2 Weeks', color: 'bg-blue-500/10 text-blue-500' },
            '1-month': { label: '1 Month', color: 'bg-yellow-500/10 text-yellow-500' },
            '3-months': { label: '3 Months', color: 'bg-orange-500/10 text-orange-500' },
            'not-available': { label: 'Not Available', color: 'bg-red-500/10 text-red-500' },
        }

        const info = availabilityMap[availability] || { label: availability, color: 'bg-gray-500/10 text-gray-500' }
        return <Badge className={info.color}>{info.label}</Badge>
    }

    const getApplicationStatusBadge = (status: string) => {
        switch (status) {
            case 'applied':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Applied</Badge>
            case 'screening':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Screening</Badge>
            case 'interview':
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Interview</Badge>
            case 'offer':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Offer</Badge>
            case 'hired':
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Hired</Badge>
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getInterviewStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>
            case 'completed':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>
            case 'rescheduled':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Rescheduled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    async function updateApplicationStatus(applicationId: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from("applications")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", applicationId)

            if (error) throw error

            // Refresh candidate data
            await fetchCandidateDetails()
        } catch (error) {
            console.error("Error updating application status:", error)
        }
    }

    async function updateInterviewStatus(interviewId: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from("interviews")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", interviewId)

            if (error) throw error

            // Refresh candidate data
            await fetchCandidateDetails()
        } catch (error) {
            console.error("Error updating interview status:", error)
        }
    }

    if (loading) {
        return (
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground mt-4">Loading candidate profile...</p>
                </div>
            </div>
        )
    }

    if (!candidate) {
        return (
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Candidate not found</h3>
                    <p className="text-muted-foreground mb-4">The candidate you're looking for doesn't exist or you don't have access.</p>
                    <Button asChild>
                        <Link href="/dashboard/candidates">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Candidates
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/dashboard/candidates">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Candidates
                    </Link>
                </Button>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-semibold text-primary">
                                        {candidate.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="absolute -bottom-1 -right-1">
                                    {getStatusBadge(candidate.status)}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {candidate.title && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{candidate.title}</span>
                                        </div>
                                    )}
                                    {candidate.location && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>{candidate.location}</span>
                                        </div>
                                    )}
                                    {candidate.experience_years && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>{candidate.experience_years} years experience</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            {candidate.availability && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Availability:</span>
                                    {getAvailabilityBadge(candidate.availability)}
                                </div>
                            )}
                            {candidate.notice_period && (
                                <div className="flex items-center gap-1">
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">Notice: {candidate.notice_period} days</span>
                                </div>
                            )}
                            {candidate.last_contacted && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Last contacted {formatDistanceToNow(new Date(candidate.last_contacted), { addSuffix: true })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateCandidateStatus('active')}
                                    disabled={candidate.status === 'active'}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Mark as Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCandidateStatus('inactive')}
                                    disabled={candidate.status === "inactive"}>
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Mark as Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCandidateStatus('placed')}
                                    disabled={candidate.status === "placed"}>
                                    <Award className="mr-2 h-4 w-4" />
                                    Mark as Placed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCandidateStatus('withdrawn')}
                                    disabled={candidate.status === "withdrawn"}
                                    className="text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Mark as Withdrawn
                                </DropdownMenuItem>
                                <Separator />
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/candidates/${candidateId}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => window.location.href = `mailto:${candidate.email}?subject=Regarding your application`}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact
                        </Button>

                        <Button>
                            <Star className="mr-2 h-4 w-4" />
                            Add to Shortlist
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact & Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Navigation */}
                    <div className="border-b">
                        <nav className="flex -mb-px">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize
                                        ${activeTab === tab
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                                        }
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Contact Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <a href={`mailto:${candidate.email}`} className="hover:text-primary hover:underline">
                                                    {candidate.email}
                                                </a>
                                            </div>
                                        </div>

                                        {candidate.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone</p>
                                                    <a href={`tel:${candidate.phone}`} className="hover:text-primary hover:underline">
                                                        {candidate.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {candidate.linkedin_url && (
                                            <div className="flex items-center gap-3">
                                                <Linkedin className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                                                    <a
                                                        href={candidate.linkedin_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        View Profile <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {candidate.portfolio_url && (
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Portfolio</p>
                                                    <a
                                                        href={candidate.portfolio_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        Visit Website <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {candidate.resume_url && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Resume</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="mr-2 h-3 w-3" />
                                                                View Resume
                                                            </a>
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => {
                                                            if (candidate.resume_url) {
                                                                window.open(candidate.resume_url, '_blank')
                                                            }
                                                        }}>
                                                            <Download className="mr-2 h-3 w-3" />
                                                            Download
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Skills */}
                            {candidate.skills && candidate.skills.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills & Expertise</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.skills.map((skill: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="text-sm">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Salary Information */}
                            {(candidate.current_salary || candidate.expected_salary) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Salary Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {candidate.current_salary && (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Current Salary</p>
                                                    <p className="text-lg font-semibold">
                                                        ${candidate.current_salary.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                            {candidate.expected_salary && (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Expected Salary</p>
                                                    <p className="text-lg font-semibold">
                                                        ${candidate.expected_salary.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <div>
                            {candidate.applications && candidate.applications.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">
                                            Job Applications ({candidate.applications.length})
                                        </h3>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/dashboard/jobs">
                                                Browse Jobs
                                            </Link>
                                        </Button>
                                    </div>
                                    {candidate.applications.map((app: any) => (
                                        <Card key={app.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="text-lg font-semibold">
                                                                        {app.jobs?.title || 'Unknown Job'}
                                                                    </h4>
                                                                    {getApplicationStatusBadge(app.status)}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {app.jobs?.department || 'No department'} •
                                                                    Applied on {format(new Date(app.applied_at), 'MMM d, yyyy')}
                                                                </p>
                                                            </div>
                                                            {app.match_score && (
                                                                <div className="flex flex-col items-center">
                                                                    <div className="flex items-center gap-1">
                                                                        <Star className="w-4 h-4 text-primary" />
                                                                        <span className="text-2xl font-bold text-primary">
                                                                            {app.match_score}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">Match Score</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                                                    <Select
                                                                        value={app.status}
                                                                        onValueChange={(value) => updateApplicationStatus(app.id, value)}
                                                                    >
                                                                        <SelectTrigger className="w-40">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="applied">Applied</SelectItem>
                                                                            <SelectItem value="screening">Screening</SelectItem>
                                                                            <SelectItem value="interview">Interview</SelectItem>
                                                                            <SelectItem value="offer">Offer</SelectItem>
                                                                            <SelectItem value="hired">Hired</SelectItem>
                                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="lg:w-48 space-y-3">
                                                        <div className="flex gap-2">
                                                            {app.jobs?.id && (
                                                                <Button asChild size="sm" variant="outline" className="flex-1">
                                                                    <Link href={`/dashboard/jobs/${app.jobs.id}`}>
                                                                        View Job
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold mb-2">No Applications</h3>
                                        <p className="text-muted-foreground mb-4">This candidate hasn't applied to any jobs yet.</p>
                                        <Button asChild>
                                            <Link href="/dashboard/jobs">Browse Jobs</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'interviews' && (
                        <div>
                            {candidate.interviews && candidate.interviews.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">
                                            Interviews ({candidate.interviews.length})
                                        </h3>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/interviews/new?candidateId=${candidateId}`}>
                                                Schedule Interview
                                            </Link>
                                        </Button>
                                    </div>
                                    {candidate.interviews.map((interview: any) => (
                                        <Card key={interview.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="text-lg font-semibold">{interview.title}</h4>
                                                                    {getInterviewStatusBadge(interview.status)}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {interview.interview_type || 'No type specified'} •
                                                                    Scheduled for {format(new Date(interview.scheduled_at), 'MMM d, yyyy h:mm a')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {interview.location && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Location</Label>
                                                                        <p className="text-sm">{interview.location}</p>
                                                                    </div>
                                                                )}
                                                                {interview.duration_minutes && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Duration</Label>
                                                                        <p className="text-sm">{interview.duration_minutes} minutes</p>
                                                                    </div>
                                                                )}
                                                                {interview.interviewer_name && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Interviewer</Label>
                                                                        <p className="text-sm">{interview.interviewer_name}</p>
                                                                    </div>
                                                                )}
                                                                {interview.interviewer_email && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Interviewer Email</Label>
                                                                        <p className="text-sm">{interview.interviewer_email}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Status</Label>
                                                                <Select
                                                                    value={interview.status}
                                                                    onValueChange={(value) => updateInterviewStatus(interview.id, value)}
                                                                >
                                                                    <SelectTrigger className="w-40">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                                                        <SelectItem value="completed">Completed</SelectItem>
                                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                                        <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {interview.notes && (
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Notes</Label>
                                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interview.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold mb-2">No Interviews</h3>
                                        <p className="text-muted-foreground mb-4">No interviews scheduled for this candidate.</p>
                                        <Button asChild>
                                            <Link href={`/dashboard/interviews/new?candidateId=${candidateId}`}>Schedule Interview</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    className="w-full min-h-[200px] p-3 border rounded-md"
                                    placeholder="Add notes about this candidate..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    onBlur={saveNotes}
                                    disabled={savingNotes}
                                />
                                <div className="flex justify-end mt-3">
                                    <Button onClick={saveNotes} disabled={savingNotes}>
                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'communications' && (
                        <CandidateCommunication
                            candidateId={candidateId}
                            candidateName={candidate.name}
                        />
                    )}
                </div>

                {/* Right Column - Quick Actions & Stats */}
                <div className="space-y-6">
                    {/* Quick Contact */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                onClick={() => {
                                    setContactMethod('email')
                                    console.log(contactMethod)
                                    handleContact('email')
                                }}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                            </Button>

                            {candidate.phone && (
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => {
                                        setContactMethod('phone')
                                        console.log(contactMethod)
                                        handleContact('phone')
                                    }}
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call Candidate
                                </Button>
                            )}

                            {candidate.linkedin_url && (
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => {
                                        setContactMethod('linkedin')
                                        console.log(contactMethod)
                                        handleContact('linkedin')
                                    }}
                                >
                                    <Linkedin className="mr-2 h-4 w-4" />
                                    View LinkedIn
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Applications</span>
                                    <span className="font-semibold">{candidate.applications?.length || 0}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Interviews</span>
                                    <span className="font-semibold">{candidate.interviews?.length || 0}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Active Applications</span>
                                    <span className="font-semibold">
                                        {candidate.applications?.filter((app: { status: string }) =>
                                            app.status === 'applied' || app.status === 'screening' || app.status === 'interview' || app.status === 'offer'
                                        )?.length || 0}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Match Score Avg</span>
                                    <span className="font-semibold">
                                        {candidate.applications?.length > 0
                                            ? Math.round(candidate.applications.reduce((acc: number, app: any) => acc + (app.match_score || 0), 0) / candidate.applications.length)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {candidate.applications && candidate.applications.length > 0 ? (
                                <div className="space-y-3">
                                    {candidate.applications.slice(0, 3).map((app: any) => (
                                        <div key={app.id} className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm">
                                                    Applied for <span className="font-medium">{app.jobs?.title || 'a job'}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {candidate.tags && candidate.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {candidate.tags.map((tag: string, index: number) => (
                                        <Badge key={index} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-3">No tags added</p>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/dashboard/candidates/${candidateId}/edit`}>
                                            Add Tags
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    {(candidate.resume_url || candidate.cover_letter_url) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Attachments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {candidate.resume_url && (
                                    <div className="flex items-center justify-between p-2 border rounded-md hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Resume</span>
                                        </div>
                                        <Button size="sm" variant="ghost" asChild>
                                            <a href={candidate.resume_url} download target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                                {candidate.cover_letter_url && (
                                    <div className="flex items-center justify-between p-2 border rounded-md hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Cover Letter</span>
                                        </div>
                                        <Button size="sm" variant="ghost" asChild>
                                            <a href={candidate.cover_letter_url} download target="_blank" rel="noopener noreferrer">
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}