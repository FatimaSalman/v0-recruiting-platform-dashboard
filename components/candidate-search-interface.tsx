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
  const [allSkills, setAllSkills] = useState<string[]>([])

  useEffect(() => {
    fetchCandidates()
  }, [])

  useEffect(() => {
    filterCandidates()
  }, [searchQuery, experienceFilter, skillFilter, candidates])

  async function fetchCandidates() {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Transform candidates to match the card component format
      const transformedCandidates: CandidateWithScore[] = (data || []).map((candidate) => ({
        ...candidate,
        experience: candidate.experience_years
          ? `${candidate.experience_years} year${candidate.experience_years > 1 ? "s" : ""}`
          : "Not specified",
        matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score (70-100)
        avatar: `/placeholder.svg?height=80&width=80&query=professional+person`,
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
      const years = Number.parseInt(experienceFilter)
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

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore)

    setFilteredCandidates(filtered)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Candidate Search</h1>
          <p className="text-muted-foreground">Find and manage your candidate pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, title, email, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Experience Filter */}
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience</SelectItem>
                <SelectItem value="0-5">0-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>

            {/* Skill Filter */}
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchQuery || experienceFilter !== "all" || skillFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setExperienceFilter("all")
                  setSkillFilter("all")
                }}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {candidates.length === 0 ? "No candidates yet" : "No candidates found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {candidates.length === 0
                ? "Start building your candidate pipeline by adding candidates"
                : "Try adjusting your search filters"}
            </p>
            {candidates.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/candidates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Candidate
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
              <h2 className="text-xl font-semibold">{filteredCandidates.length} Candidates Found</h2>
              <p className="text-sm text-muted-foreground mt-1">Sorted by match score</p>
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="grid gap-4">
            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
