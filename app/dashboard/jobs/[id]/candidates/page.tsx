// app/dashboard/jobs/[id]/candidates/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft,
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Star,
    FileText,
    ExternalLink,
    Filter,
    Download,
    UserCheck,
    XCircle,
    UserPlus,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface Job {
    id: string
    title: string
    department: string | null
    location: string | null
    status: string
}

interface Application {
    id: string
    candidate_id: string
    status: string
    match_score: number | null
    applied_at: string
    candidate: {
        id: string
        name: string
        email: string
        title: string | null
        experience_years: number | null
        location: string | null
        skills: string[] | null
        status: string
        availability: string
        phone: string | null
        linkedin_url: string | null
        portfolio_url: string | null
        resume_url: string | null
        last_contacted: string | null
    }
}

export default function JobCandidatesPage() {
    const [job, setJob] = useState<Job | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState("match")

    const { t, locale } = useI18n()
    const params = useParams()
    const router = useRouter()
    const supabase = useSupabase()
    const jobId = params.id as string

    useEffect(() => {
        fetchJobAndCandidates()
    }, [jobId])

    useEffect(() => {
        filterAndSortApplications()
    }, [searchQuery, statusFilter, sortBy, applications])

    async function fetchJobAndCandidates() {
        try {
            setLoading(true)

            // Fetch job details
            const { data: jobData, error: jobError } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", jobId)
                .single()

            if (jobError) throw jobError
            setJob(jobData)

            // Fetch applications for this job with candidate details
            const { data: applicationsData, error: applicationsError } = await supabase
                .from("applications")
                .select(`
          *,
          candidate:candidates(*)
        `)
                .eq("job_id", jobId)
                .order("applied_at", { ascending: false })

            if (applicationsError) throw applicationsError
            setApplications(applicationsData || [])
            setFilteredApplications(applicationsData || [])

        } catch (error) {
            console.error("Error fetching job and candidates:", error)
        } finally {
            setLoading(false)
        }
    }

    function filterAndSortApplications() {
        let filtered = [...applications]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((app) =>
                app.candidate.name.toLowerCase().includes(query) ||
                app.candidate.email.toLowerCase().includes(query) ||
                app.candidate.title?.toLowerCase().includes(query) ||
                app.candidate.skills?.some(skill => skill.toLowerCase().includes(query))
            )
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((app) => app.status === statusFilter)
        }

        // Sort
        if (sortBy === "match") {
            filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        } else if (sortBy === "date") {
            filtered.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
        } else if (sortBy === "name") {
            filtered.sort((a, b) => a.candidate.name.localeCompare(b.candidate.name))
        }

        setFilteredApplications(filtered)
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

            // Refresh data
            fetchJobAndCandidates()
        } catch (error) {
            console.error("Error updating application status:", error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "applied":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t("status.application.applied")}</Badge>
            case "screening":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t("status.application.screening")}</Badge>
            case "interview":
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">{t("status.application.interview")}</Badge>
            case "offer":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t("status.application.offer")}</Badge>
            case "hired":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t("status.application.hired")}</Badge>
            case "rejected":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t("status.application.rejected")}</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getCandidateStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                    <UserCheck className="w-3 h-3 mr-1" /> {t("status.active")}
                </Badge>
            case 'inactive':
                return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs">
                    {t("status.active")}
                </Badge>
            case 'placed':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                    {t("status.placed")}
                </Badge>
            case 'withdrawn':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                    <XCircle className="w-3 h-3 mr-1" /> {t("status.withdrawn")}
                </Badge>
            default:
                return null
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground mt-4">{t("candidates.loading")}</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!job) {
        return (
            <DashboardLayout>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">{t("jobs.details.notFound")}</h3>
                        <p className="text-muted-foreground mb-4">{t("jobs.details.notFoundDesc")}</p>
                        <Button asChild>
                            <Link href="/dashboard/jobs">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t("jobs.details.backToJobs")}
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
                <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href={`/dashboard/jobs/${jobId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("jobs.backToDetails")}
                        </Link>
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        {job.department && (
                                            <Badge variant="outline">{job.department}</Badge>
                                        )}
                                        {job.location && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span>{job.location}</span>
                                            </div>
                                        )}
                                        <Badge className={
                                            job.status === 'open'
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-red-500/10 text-red-500'
                                        }>
                                            {job.status === 'open' ? t("jobs.status.open") : t("jobs.status.closed")}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="bg-transparent">
                                <Download className="mr-2 h-4 w-4" />
                                {t("candidates.export")}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button>
                                        <Users className="mr-2 h-4 w-4" />
                                        {t("candidates.addCandidate")}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/candidates/new?jobId=${jobId}`}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            {t("candidates.addNew")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/jobs/${jobId}/select-candidate`}>
                                            <Users className="mr-2 h-4 w-4" />
                                            {t("candidates.selectExisting")}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("reports.totalCandidates")}</p>
                                    <p className="text-2xl font-bold">{applications.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-primary/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.newApplications")}</p>
                                    <p className="text-2xl font-bold">
                                        {applications.filter(app => app.status === 'applied').length}
                                    </p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-500/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.inInterview")}</p>
                                    <p className="text-2xl font-bold">
                                        {applications.filter(app => app.status === 'interview').length}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-purple-500/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("status.hired")}</p>
                                    <p className="text-2xl font-bold">
                                        {applications.filter(app => app.status === 'hired').length}
                                    </p>
                                </div>
                                <UserCheck className="w-8 h-8 text-emerald-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("candidates.searchPlaceholder")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("candidates.filterStatus")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("status.all")}</SelectItem>
                                    <SelectItem value="applied">{t("status.application.applied")}</SelectItem>
                                    <SelectItem value="screening">{t("status.application.screening")}</SelectItem>
                                    <SelectItem value="interview">{t("status.application.interview")}</SelectItem>
                                    <SelectItem value="offer">{t("status.application.offer")}</SelectItem>
                                    <SelectItem value="hired">{t("status.application.hired")}</SelectItem>
                                    <SelectItem value="rejected">{t("status.application.rejected")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sort.by")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="match">{t("candidate.match")}</SelectItem>
                                    <SelectItem value="date">{t("sort.applicationDate")}</SelectItem>
                                    <SelectItem value="name">{t("sort.name")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters */}
                        {(searchQuery || statusFilter !== "all") && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="text-sm text-muted-foreground">{t("candidates.activeFilters")}</span>
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1">
                                        {t("nav.search")}: {searchQuery}
                                        <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {statusFilter !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        {t("jobs.form.status")}: {statusFilter}
                                        <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setStatusFilter("all")
                                    }}
                                    className="h-6 text-xs"
                                >
                                    {t("candidates.clearAll")}
                                </Button>
                            </div>
                        )}
                        
                    </CardContent>
                </Card>

                {/* Results */}
                {filteredApplications.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">
                                {applications.length === 0 ? t("candidates.noCandidates") : t("candidates.noResults")}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {applications.length === 0
                                    ? t("candidates.startAdding")
                                    : t("candidates.noResults.subtitle")}
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button asChild>
                                    <Link href={`/dashboard/candidates/new?jobId=${jobId}`}>
                                        {t("candidates.addCandidate")}
                                    </Link>
                                </Button>
                                {applications.length > 0 && (
                                    <Button variant="outline" onClick={() => {
                                        setSearchQuery("")
                                        setStatusFilter("all")
                                    }}>
                                        {t("candidates.clearFilters")}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {t("candidates.resultsCount").replace("{count}", filteredApplications.length.toString())}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t("candidates.showingForJob")}
                                </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {sortBy === 'match' && t("candidates.sortedByScore")}
                                {sortBy === 'date' && t("sort.sortedByDate")}
                                {sortBy === 'name' && t("sorted.by.name")}
                            </div>
                        </div>

                        {/* Candidates List */}
                        <div className="space-y-4">
                            {filteredApplications.map((application) => (
                                <Card key={application.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Left Column - Candidate Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Link
                                                                href={`/dashboard/candidates/${application.candidate.id}`}
                                                                className="text-xl font-semibold hover:text-primary hover:underline"
                                                            >
                                                                {application.candidate.name}
                                                            </Link>
                                                            {getCandidateStatusBadge(application.candidate.status)}
                                                        </div>
                                                        <p className="text-muted-foreground">{application.candidate.title}</p>
                                                    </div>

                                                    {/* Match Score */}
                                                    {application.match_score && (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-4 h-4 text-primary" />
                                                                <span className="text-2xl font-bold text-primary">
                                                                    {application.match_score}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{t("candidate.match")}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{application.candidate.email}</span>
                                                    </div>
                                                    {application.candidate.phone && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{application.candidate.phone}</span>
                                                        </div>
                                                    )}
                                                    {application.candidate.location && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{application.candidate.location}</span>
                                                        </div>
                                                    )}
                                                    {application.candidate.experience_years && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Briefcase className="w-4 h-4" />
                                                            <span>{application.candidate.experience_years} {t("candidates.years")}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skills */}
                                                {application.candidate.skills && application.candidate.skills.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {application.candidate.skills.slice(0, 5).map((skill, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {application.candidate.skills.length > 5 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{application.candidate.skills.length - 5} {t("candidate.moreSkills")}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column - Application Status & Actions */}
                                            <div className="lg:w-64 space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">{t("application.status")}</span>
                                                        {getStatusBadge(application.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {t("candidate.profile.appliedOn")} {format(new Date(application.applied_at), 'MMM d, yyyy', { locale: locale === 'ar' ? ar : enUS })}
                                                    </div>
                                                </div>

                                                {/* Status Update Dropdown */}
                                                <Select
                                                    value={application.status}
                                                    onValueChange={(value) => updateApplicationStatus(application.id, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("bulk.update.status")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="applied">{t("status.application.applied")}</SelectItem>
                                                        <SelectItem value="screening">{t("status.application.screening")}</SelectItem>
                                                        <SelectItem value="interview">{t("status.application.interview")}</SelectItem>
                                                        <SelectItem value="offer">{t("status.application.offer")}</SelectItem>
                                                        <SelectItem value="hired">{t("status.application.hired")}</SelectItem>
                                                        <SelectItem value="rejected">{t("status.application.rejected")}</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Button asChild className="flex-1" size="sm">
                                                        <Link href={`/dashboard/candidates/${application.candidate.id}`}>
                                                            {t("candidate.view")}
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-transparent"
                                                        onClick={() => window.location.href = `mailto:${application.candidate.email}?subject=${t("candidate.emailSubject")}`}
                                                    >
                                                        {t("candidate.contact")}
                                                    </Button>
                                                </div>

                                                {/* Quick Links */}
                                                <div className="flex gap-2 pt-2 border-t">
                                                    {application.candidate.resume_url && (
                                                        <Button variant="ghost" size="sm" asChild className="flex-1">
                                                            <a href={application.candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="mr-1 h-3 w-3" />
                                                                {t("candidate.profile.resume")}
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {application.candidate.linkedin_url && (
                                                        <Button variant="ghost" size="sm" asChild className="flex-1">
                                                            <a href={application.candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="mr-1 h-3 w-3" />
                                                                LinkedIn
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}