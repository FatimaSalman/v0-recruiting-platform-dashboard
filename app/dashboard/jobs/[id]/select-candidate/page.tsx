// app/dashboard/jobs/[id]/select-candidate/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, ArrowLeft, Check, Users } from "lucide-react"
import Link from "next/link"
import { CandidateCard } from "@/components/candidate-card"
import { useI18n } from "@/lib/i18n-context"

interface Candidate {
    id: string
    name: string
    email: string
    title: string | null
    experience_years: number | null
    location: string | null
    skills: string[] | null
    status: string
    availability: string
    experience: string
    matchScore: number
    avatar: string
}

export default function SelectCandidatePage() {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
    const [adding, setAdding] = useState(false)

    const { t } = useI18n()
    const params = useParams()
    const router = useRouter()
    const supabase = useSupabase()
    const jobId = params.id as string

    useEffect(() => {
        fetchCandidates()
    }, [])

    useEffect(() => {
        filterCandidates()
    }, [searchQuery, candidates])

    async function fetchCandidates() {
        try {
            setLoading(true)

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all candidates for the current user
            const { data, error } = await supabase
                .from("candidates")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })

            if (error) throw error

            // Transform candidates
            const transformedCandidates: Candidate[] = (data || []).map((candidate) => ({
                ...candidate,
                experience: candidate.experience_years
                    ? `${candidate.experience_years} ${t("candidates.years")}`
                    : "Not specified",
                matchScore: Math.floor(Math.random() * 30) + 70,
                avatar: `/placeholder.svg?height=80&width=80&query=professional+person`,
            }))

            setCandidates(transformedCandidates)
            setFilteredCandidates(transformedCandidates)

            // Check which candidates are already associated with this job
            const { data: existingApplications } = await supabase
                .from("applications")
                .select("candidate_id")
                .eq("job_id", jobId)

            if (existingApplications) {
                const existingCandidateIds = existingApplications.map(app => app.candidate_id)
                setSelectedCandidates(existingCandidateIds)
            }

        } catch (error) {
            console.error("Error fetching candidates:", error)
        } finally {
            setLoading(false)
        }
    }

    function filterCandidates() {
        if (!searchQuery) {
            setFilteredCandidates(candidates)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = candidates.filter(
            (candidate) =>
                candidate.name.toLowerCase().includes(query) ||
                candidate.title?.toLowerCase().includes(query) ||
                candidate.email.toLowerCase().includes(query) ||
                candidate.skills?.some((skill) => skill.toLowerCase().includes(query))
        )

        setFilteredCandidates(filtered)
    }

    function toggleCandidate(candidateId: string) {
        setSelectedCandidates(prev => {
            if (prev.includes(candidateId)) {
                return prev.filter(id => id !== candidateId)
            } else {
                return [...prev, candidateId]
            }
        })
    }

    async function addSelectedCandidates() {
        if (selectedCandidates.length === 0) return

        setAdding(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Prepare applications to insert
            const applicationsToInsert = selectedCandidates.map(candidateId => ({
                job_id: jobId,
                candidate_id: candidateId,
                user_id: user.id,
                status: 'applied'
            }))

            // Insert applications
            const { error } = await supabase
                .from("applications")
                .insert(applicationsToInsert)
                .select()

            if (error) throw error

            // Redirect back to job candidates page
            router.push(`/dashboard/jobs/${jobId}/candidates`)

        } catch (error) {
            console.error("Error adding candidates to job:", error)
            alert("Failed to add candidates. Please try again.")
        } finally {
            setAdding(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href={`/dashboard/jobs/${jobId}/candidates`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("jobs.backToCandidates")}
                        </Link>
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("jobs.addCandidatesToJob")}</h1>
                            <p className="text-muted-foreground">
                                {t("jobs.selectCandidatesDesc")}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                asChild
                                className="bg-transparent"
                            >
                                <Link href={`/dashboard/candidates/new?jobId=${jobId}`}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {t("candidates.addNew")}
                                </Link>
                            </Button>
                            <Button
                                onClick={addSelectedCandidates}
                                disabled={selectedCandidates.length === 0 || adding}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                {adding ? t("candidates.form.adding") : t("candidates.addCount").replace("{count}", selectedCandidates.length.toString())}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t("candidates.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground mt-4">{t("candidates.loading")}</p>
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">
                                {candidates.length === 0 ? t("candidates.noResults") : t("candidates.noMatching")}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {candidates.length === 0
                                    ? t("candidates.noCandidatesYet")
                                    : t("candidates.adjustSearch")}
                            </p>
                            <Button asChild>
                                <Link href={`/dashboard/candidates/new?jobId=${jobId}`}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {t("candidates.addNew")}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Selection Summary */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {t("candidates.resultsCount").replace("{count}", filteredCandidates.length.toString())}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t("candidates.selectedCount").replace("{count}", selectedCandidates.length.toString())}
                                </p>
                            </div>
                            {selectedCandidates.length > 0 && (
                                <Badge variant="default" className="text-sm">
                                    {t("candidates.countSelected").replace("{count}", selectedCandidates.length.toString())}
                                </Badge>
                            )}
                        </div>

                        {/* Candidates List */}
                        <div className="space-y-4">
                            {filteredCandidates.map((candidate) => {
                                const isSelected = selectedCandidates.includes(candidate.id)
                                const isAlreadyAdded = selectedCandidates.includes(candidate.id) &&
                                    candidate.status === 'applied' // You might want to check actual application status

                                return (
                                    <Card
                                        key={candidate.id}
                                        className={`hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}
                                        onClick={() => !isAlreadyAdded && toggleCandidate(candidate.id)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                {/* Checkbox */}
                                                <div className={`w-6 h-6 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                                                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                                                </div>

                                                {/* Candidate Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                                                        {isAlreadyAdded && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {t("candidates.alreadyAdded")}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground">{candidate.title}</p>

                                                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <span>{candidate.email}</span>
                                                        </div>
                                                        {candidate.location && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <span>{candidate.location}</span>
                                                            </div>
                                                        )}
                                                        {candidate.experience && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <span>{candidate.experience}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Skills */}
                                                    {candidate.skills && candidate.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {candidate.skills.slice(0, 4).map((skill, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {candidate.skills.length > 4 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{candidate.skills.length - 4} {t("candidate.moreSkills")}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Match Score */}
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-2xl font-bold text-primary">
                                                            {candidate.matchScore}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{t("candidate.match")}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}