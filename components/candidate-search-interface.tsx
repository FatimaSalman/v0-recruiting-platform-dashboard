"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CandidateCard } from "@/components/candidate-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"

interface Candidate {
  id: string
  name: string
  email: string
  phone: string | null
  title: string | null
  experience_years: number | null
  location: string | null
  skills: string[] | null
  resume_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'placed' | 'withdrawn' // Add status
  availability: 'immediate' | '2-weeks' | '1-month' | '3-months' | 'not-available' // Add availability
  current_salary: number | null
  expected_salary: number | null
  notice_period: number | null
  last_contacted: string | null
  created_at: string
}

interface CandidateWithScore extends Candidate {
  matchScore: number
  experience: string
  avatar: string
}

export function CandidateSearchInterface() {
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateWithScore[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [experienceFilter, setExperienceFilter] = useState<string>("all")
  const [skillFilter, setSkillFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all") // Add status filter
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all") // Add availability filter
  const [allSkills, setAllSkills] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [])

  useEffect(() => {
    filterCandidates()
  }, [searchQuery, experienceFilter, skillFilter, statusFilter, availabilityFilter, candidates])


  // Update the fetchCandidates function in CandidateSearchInterface
  async function fetchCandidates() {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Transform candidates to match the card component format
      const transformedCandidates: CandidateWithScore[] = (data || []).map((candidate) => ({
        ...candidate,
        status: candidate.status || 'active', // Default to active if not set
        availability: candidate.availability || 'immediate', // Default to immediate if not set
        experience: candidate.experience_years
          ? `${candidate.experience_years} year${candidate.experience_years > 1 ? "s" : ""}`
          : "Not specified",
        matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score (70-100)
        avatar: `/placeholder.svg?height=80&width=80&query=professional+person`,
        lastContacted: candidate.last_contacted || null, // Map last_contacted to lastContacted
      }))

      setCandidates(transformedCandidates)
      setFilteredCandidates(transformedCandidates)

      // Extract unique skills
      const skillsSet = new Set<string>()
      transformedCandidates.forEach((candidate) => {
        candidate.skills?.forEach((skill) => skillsSet.add(skill))
      })
      setAllSkills(Array.from(skillsSet).sort())
    } catch (error) {
      console.error("[v0] Error fetching candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the CandidateCard mapping in the render section
  {
    filteredCandidates.map((candidate) => (
      <CandidateCard
        key={candidate.id}
        candidate={{
          ...candidate,
          lastContacted: candidate.last_contacted || null,
          phone: candidate.phone || null,
          linkedin_url: candidate.linkedin_url || null,
          portfolio_url: candidate.portfolio_url || null,
        }}
      />
    ))
  }

  function filterCandidates() {
    let filtered = [...candidates]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.title?.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.skills?.some((skill) => skill.toLowerCase().includes(query)),
      )
    }

    // Experience filter
    if (experienceFilter !== "all") {
      filtered = filtered.filter((candidate) => {
        if (!candidate.experience_years) return false
        if (experienceFilter === "10+") return candidate.experience_years >= 10
        if (experienceFilter === "5-10") return candidate.experience_years >= 5 && candidate.experience_years < 10
        if (experienceFilter === "0-5") return candidate.experience_years < 5
        return true
      })
    }

    // Skill filter
    if (skillFilter !== "all") {
      filtered = filtered.filter((candidate) => candidate.skills?.includes(skillFilter))
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((candidate) => candidate.status === statusFilter)
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter((candidate) => candidate.availability === availabilityFilter)
    }

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore)

    setFilteredCandidates(filtered)
  }

  // Don't render Select components until after hydration
  if (!mounted) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header - static */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("candidates.title")}</h1>
            <p className="text-muted-foreground">{t("candidates.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent" disabled>
              <Download className="mr-2 h-4 w-4" />
              {t("candidates.export")}
            </Button>
            <Button asChild>
              <Link href="/dashboard/candidates/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("candidates.addCandidate")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters - static placeholders */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("candidates.searchFilters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 animate-pulse">
              {/* Search Input - static */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("candidates.searchPlaceholder")}
                    value={searchQuery || ""}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>

              {/* Experience Filter - placeholder */}
              <div className="h-10 bg-muted rounded-md"></div>

              {/* Skill Filter - placeholder */}
              <div className="h-10 bg-muted rounded-md"></div>

              {/* Status Filter - placeholder */}
              <div className="h-10 bg-muted rounded-md"></div>

              {/* Availability Filter - placeholder */}
              <div className="h-10 bg-muted rounded-md"></div>
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("candidates.loading")}</p>
        </div>
      </div>
    )
  }

  // After hydration, render full component with Selects
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("candidates.title")}</h1>
          <p className="text-muted-foreground">{t("candidates.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            {t("candidates.export")}
          </Button>
          <Button asChild>
            <Link href="/dashboard/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("candidates.addCandidate")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("candidates.searchFilters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("candidates.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("candidate.experience")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("candidates.allExperience")}</SelectItem>
                  <SelectItem value="0-5">{t("candidates.experience.0-5")}</SelectItem>
                  <SelectItem value="5-10">{t("candidates.experience.5-10")}</SelectItem>
                  <SelectItem value="10+">{t("candidates.experience.10+")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skill Filter */}
            <div>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("candidates.allSkills")}</SelectItem>
                  {allSkills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="2-weeks">2 Weeks</SelectItem>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="not-available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery ||
            experienceFilter !== "all" ||
            skillFilter !== "all" ||
            statusFilter !== "all" ||
            availabilityFilter !== "all") && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-muted-foreground">{t("candidates.activeFilters")}</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {experienceFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Experience: {experienceFilter}
                    <button onClick={() => setExperienceFilter("all")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {skillFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Skill: {skillFilter}
                    <button onClick={() => setSkillFilter("all")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                {availabilityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Availability: {availabilityFilter}
                    <button onClick={() => setAvailabilityFilter("all")} className="ml-1 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setExperienceFilter("all")
                    setSkillFilter("all")
                    setStatusFilter("all")
                    setAvailabilityFilter("all")
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
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("candidates.loading")}</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {candidates.length === 0 ? t("candidates.noCandidates") : t("candidates.noResults")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {candidates.length === 0 ? t("candidates.noCandidates.subtitle") : t("candidates.noResults.subtitle")}
            </p>
            {candidates.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/candidates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("candidates.addFirst")}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {filteredCandidates.length} {t("candidates.found")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{t("candidates.sortedByScore")}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </span>
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="grid gap-4">
            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={{
                ...candidate,
                status: candidate.status || 'active',
                availability: candidate.availability || 'immediate',
              }} />
            ))}
          </div>

          {/* Pagination (optional) */}
          {filteredCandidates.length > 10 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">1</Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">2</Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">3</Button>
                <span className="text-muted-foreground">...</span>
              </div>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}