"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, Download, Filter, Mail, Phone, Calendar, MapPin, Briefcase, Star, X, Check, Tag, UserCheck, UserMinus, UserX, Award, Clock, Users, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CandidateCard } from "@/components/candidate-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"
import { CandidateBulkActions } from "@/components/candidate-bulk-actions"
import { format } from "date-fns"
import { exportCandidates, type CandidateImportData } from "@/lib/candidate-utils"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  status: 'active' | 'inactive' | 'placed' | 'withdrawn'
  availability: 'immediate' | '2-weeks' | '1-month' | '3-months' | 'not-available'
  current_salary: number | null
  expected_salary: number | null
  notice_period: number | null
  last_contacted: string | null
  created_at: string
  updated_at: string
  tags: string[] | null
  applications?: Array<{
    id: string
    status: string
    job_id?: string
    jobs?: {
      title: string
    }
  }>
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [salaryRangeFilter, setSalaryRangeFilter] = useState<string>("all")
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [allSkills, setAllSkills] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false)
  const [bulkEmailContent, setBulkEmailContent] = useState({
    subject: "",
    message: ""
  })
  const [sortBy, setSortBy] = useState<"match" | "date" | "name" | "salary">("match")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const { t } = useI18n()
  const router = useRouter()
  const [hiredFilter, setHiredFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true)
    fetchCandidates()
  }, [])

  useEffect(() => {
    filterAndSortCandidates()
  }, [searchQuery, experienceFilter, skillFilter, statusFilter, availabilityFilter, salaryRangeFilter, sortBy, sortOrder, candidates])

  async function fetchCandidates() {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const candidateIds = data?.map(c => c.id) || []
      const { data: applicationsData } = await supabase
        .from("applications")
        .select("*")
        .in("candidate_id", candidateIds)

      // 3. Group applications by candidate_id
      const applicationsByCandidate = new Map<string, any[]>()
      applicationsData?.forEach(app => {
        if (!applicationsByCandidate.has(app.candidate_id)) {
          applicationsByCandidate.set(app.candidate_id, [])
        }
        applicationsByCandidate.get(app.candidate_id)?.push(app)
      })

      // Transform candidates to match the card component format
      const transformedCandidates: CandidateWithScore[] = (data || []).map((candidate) => {
        const candidateApplications = applicationsByCandidate.get(candidate.id) || []
        const hasHiredApplications = candidateApplications.some(app => app.status === 'hired');
        return {
          ...candidate,
          status: candidate.status || 'active',
          availability: candidate.availability || 'immediate',
          experience: candidate.experience_years
            ? `${candidate.experience_years} year${candidate.experience_years > 1 ? "s" : ""}`
            : "Not specified",
          matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score (70-100)
          avatar: `/placeholder.svg?height=80&width=80&query=professional+person`,
          isHired: hasHiredApplications,
        }
      })

      setCandidates(transformedCandidates)
      setFilteredCandidates(transformedCandidates)

      // Extract unique skills
      const skillsSet = new Set<string>()
      transformedCandidates.forEach((candidate) => {
        candidate.skills?.forEach((skill) => skillsSet.add(skill))
      })
      setAllSkills(Array.from(skillsSet).sort())
    } catch (error) {
      console.error("Error fetching candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortCandidates() {
    let filtered = [...candidates]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.title?.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
          candidate.location?.toLowerCase().includes(query) ||
          candidate.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          candidate.applications?.some((app) => app.status.toLowerCase().includes(query))
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

    // Salary range filter
    if (salaryRangeFilter !== "all") {
      filtered = filtered.filter((candidate) => {
        const expectedSalary = candidate.expected_salary || 0
        switch (salaryRangeFilter) {
          case "0-50000":
            return expectedSalary <= 50000
          case "50000-100000":
            return expectedSalary > 50000 && expectedSalary <= 100000
          case "100000-150000":
            return expectedSalary > 100000 && expectedSalary <= 150000
          case "150000+":
            return expectedSalary > 150000
          default:
            return true
        }
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareA, compareB

      switch (sortBy) {
        case "match":
          compareA = a.matchScore
          compareB = b.matchScore
          break
        case "date":
          compareA = new Date(a.created_at).getTime()
          compareB = new Date(b.created_at).getTime()
          break
        case "name":
          compareA = a.name.toLowerCase()
          compareB = b.name.toLowerCase()
          break
        case "salary":
          compareA = a.expected_salary || 0
          compareB = b.expected_salary || 0
          break
        default:
          compareA = a.matchScore
          compareB = b.matchScore
      }

      if (sortOrder === "asc") {
        return compareA > compareB ? 1 : -1
      } else {
        return compareA < compareB ? 1 : -1
      }
    })

    setFilteredCandidates(filtered)
  }

  function toggleCandidateSelection(candidateId: string) {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  function toggleSelectAll() {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id))
    }
  }

  async function handleExportCandidates() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const candidatesData = await exportCandidates(user.id)

      // Convert to CSV
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Title",
        "Experience Years",
        "Location",
        "Skills",
        "Current Salary",
        "Expected Salary",
        "Notice Period",
        "Status",
        "Availability",
        "Tags",
        "Created At"
      ]

      const csvRows = [
        headers.join(","),
        ...candidatesData.map(candidate => [
          `"${candidate.name}"`,
          `"${candidate.email}"`,
          `"${candidate.phone || ''}"`,
          `"${candidate.title || ''}"`,
          candidate.experience_years || '',
          `"${candidate.location || ''}"`,
          `"${candidate.skills?.join('; ') || ''}"`,
          candidate.current_salary || '',
          candidate.expected_salary || '',
          candidate.notice_period || '',
          `"${candidate.status || ''}"`,
          `"${candidate.availability || ''}"`,
          `"${candidate.tags?.join('; ') || ''}"`,
          `"${new Date().toISOString()}"`
        ].join(","))
      ]

      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `candidates_${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setShowExportDialog(false)
    } catch (error) {
      console.error("Error exporting candidates:", error)
      alert("Failed to export candidates. Please try again.")
    }
  }

  async function handleBulkEmail() {
    if (selectedCandidates.length === 0) return

    try {
      const selectedEmails = filteredCandidates
        .filter(c => selectedCandidates.includes(c.id))
        .map(c => c.email)
        .filter(email => email) as string[]

      const subject = encodeURIComponent(bulkEmailContent.subject || "Regarding your application")
      const body = encodeURIComponent(bulkEmailContent.message || "Hello,\n\nWe would like to follow up with you regarding your application.\n\nBest regards,\nRecruitment Team")

      const mailtoLink = `mailto:?bcc=${selectedEmails.join(',')}&subject=${subject}&body=${body}`

      window.location.href = mailtoLink
      setShowBulkEmailDialog(false)
      setBulkEmailContent({ subject: "", message: "" })
    } catch (error) {
      console.error("Error sending bulk email:", error)
      alert("Failed to open email client. Please check your email configuration.")
    }
  }

  function clearAllFilters() {
    setSearchQuery("")
    setExperienceFilter("all")
    setSkillFilter("all")
    setStatusFilter("all")
    setAvailabilityFilter("all")
    setSalaryRangeFilter("all")
    setSortBy("match")
    setSortOrder("desc")
    setSelectedCandidates([])
  }

  const activeFilters = [
    searchQuery && "search",
    experienceFilter !== "all" && "experience",
    skillFilter !== "all" && "skill",
    statusFilter !== "all" && "status",
    availabilityFilter !== "all" && "availability",
    salaryRangeFilter !== "all" && "salary"
  ].filter(Boolean).length

  if (!mounted) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("candidates.title")}</h1>
          <p className="text-muted-foreground">{t("candidates.subtitle")}</p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg mb-6"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("candidates.title")}</h1>
          <p className="text-muted-foreground">{t("candidates.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                {t("candidates.export")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("candidates.export.title")}</DialogTitle>
                <DialogDescription>
                  {t("candidates.export.desc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t("candidates.exprot.all")} {candidates.length} {t("candidates.export.csv.file")}
                    {t("candidates.export.info")}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                    {t("jobs.form.cancel")}
                  </Button>
                  <Button onClick={handleExportCandidates}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("candidates.export.csv")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild>
            <Link href="/dashboard/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("candidates.addCandidate")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("reports.totalCandidates")}</p>
                <p className="text-2xl font-bold">{candidates.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("status.active")}</p>
                <p className="text-2xl font-bold">
                  {candidates.filter(c => c.status === 'active').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("status.available.now")}</p>
                <p className="text-2xl font-bold">
                  {candidates.filter(c => c.availability === 'immediate').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("candidates.avg.experience")}</p>
                <p className="text-2xl font-bold">
                  {candidates.length > 0
                    ? Math.round(candidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / candidates.length)
                    : 0} {t("candidates.years")}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t("candidates.searchFilters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("candidates.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Experience Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{t("candidate.experience")}</Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={`${t("candidates.allExperience")}`} />
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
            <div className="space-y-2">
              <Label className="text-xs">{t("candidates.skills")}</Label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={`${t("candidates.allSkills")}`} />
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
            <div className="space-y-2">
              <Label className="text-xs">{t("reports.status")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={`${t("status.all")}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("status.all")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                  <SelectItem value="placed">{t("status.placed")}</SelectItem>
                  <SelectItem value="withdrawn">{t("status.withdrawn")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{t("availability")}</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={`${t("availability.all")}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("availability.all")}</SelectItem>
                  <SelectItem value="immediate">{t("availability.immediate")}</SelectItem>
                  <SelectItem value="2-weeks">{t("availability.2-weeks")}</SelectItem>
                  <SelectItem value="1-month">{t("availability.1-month")}</SelectItem>
                  <SelectItem value="3-months">{t("availability.3-month")}</SelectItem>
                  <SelectItem value="not-available">{t("availability.not-available")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{t("salary.range")}</Label>
              <Select value={salaryRangeFilter} onValueChange={setSalaryRangeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("salary.range.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("salary.range.all")}</SelectItem>
                  <SelectItem value="0-50000">{t("salary.range.0-50k")}</SelectItem>
                  <SelectItem value="50000-100000">{t("salary.range.50k-100k")}</SelectItem>
                  <SelectItem value="100000-150000">{t("salary.range.100k-150k")}</SelectItem>
                  <SelectItem value="150000+">{t("salary.range.150k+")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label className="text-xs">{t("sort.by")}</Label>
              <div className="flex gap-1">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("sort.by")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">{t("candidate.match")}</SelectItem>
                    <SelectItem value="date">{t("sort.date.added")}</SelectItem>
                    <SelectItem value="name">{t("sort.name")}</SelectItem>
                    <SelectItem value="salary">{t("sort.expected.salary")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? t("sort.ascending") : t("sort.descending")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            {/* Hired Options */}
            <div className="space-y-2">
              <Label className="text-xs">{t("hired.status")}</Label>
              <Select value={hiredFilter} onValueChange={setHiredFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("candidates.all")}</SelectItem>
                  <SelectItem value="hired">{t("candidates.hired")}</SelectItem>
                  <SelectItem value="not-hired">{t("candidates.not.hired")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{activeFilters} active filter(s)</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      {t("nav.search")}: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {experienceFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("candidate.experience")}: {experienceFilter}
                      <button onClick={() => setExperienceFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {skillFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("candidates.skills")}: {skillFilter}
                      <button onClick={() => setSkillFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("jobs.form.status")}: {statusFilter}
                      <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {availabilityFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("avialability")}: {availabilityFilter}
                      <button onClick={() => setAvailabilityFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {salaryRangeFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {t("salary")}: {salaryRangeFilter}
                      <button onClick={() => setSalaryRangeFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs"
                >
                  {t("clear.all")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedCandidates.length > 0 && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedCandidates.length} {t("candidates.selected")}</h3>
                <p className="text-sm text-muted-foreground">{t("candidates.perform")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEmailDialog(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t("candidates.send.email")}
              </Button>
              <CandidateBulkActions
                selectedIds={selectedCandidates}
                onComplete={() => {
                  setSelectedCandidates([])
                  fetchCandidates()
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCandidates([])}
              >
                <X className="mr-2 h-4 w-4" />
                {t("candidates.clear.selection")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("candidates.send.email.selected")}</DialogTitle>
            <DialogDescription>
              {t("candidates.send.email.to")} {selectedCandidates.length} {t("selected.candidates")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t("candidates.subject")}</Label>
              <Input
                id="subject"
                value={bulkEmailContent.subject}
                onChange={(e) => setBulkEmailContent({ ...bulkEmailContent, subject: e.target.value })}
                placeholder={t("email.placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={bulkEmailContent.message}
                onChange={(e) => setBulkEmailContent({ ...bulkEmailContent, message: e.target.value })}
                rows={6}
                placeholder={t("email.message.placeholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)}>
                {t("jobs.form.cancel")}
              </Button>
              <Button onClick={handleBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {t("open.email.client")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">{t("candidates.loading")}</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {candidates.length === 0 ? t("candidates.noCandidates") : t("candidates.noResults")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {candidates.length === 0
                ? t("candidates.noCandidates.subtitle")
                : t("candidates.noResults.subtitle")}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {filteredCandidates.length} {t("candidates.found")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sortBy === "match" && `${t("sorted.by.match.score")}`}
                {sortBy === "date" && `${t("sorted.by.date.added")}`}
                {sortBy === "name" && `${t("sorted.by.name")}`}
                {sortBy === "salary" && `${t("sorted.by.expected.salary")}`}
                {sortOrder === "asc" ? ` (${t("sort.ascending")})` : ` (${t("sort.descending")})`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {t("showing")} {filteredCandidates.length} {t("of")} {candidates.length} {t("candidates.small.letter")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedCandidates.length === filteredCandidates.length ? (
                  <>
                    <X className="h-4 w-4" />
                    {t("deselect.all")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t("select.all")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => toggleCandidateSelection(candidate.id)}
                  className="absolute left-2 top-2 z-10 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className={selectedCandidates.includes(candidate.id) ? "opacity-100" : "opacity-100"}>
                  <CandidateCard
                    candidate={{
                      ...candidate,
                      experience: candidate.experience,
                      matchScore: candidate.matchScore,
                      avatar: candidate.avatar,
                      lastContacted: candidate.last_contacted,
                      phone: candidate.phone,
                      linkedin_url: candidate.linkedin_url,
                      portfolio_url: candidate.portfolio_url,
                      applications: (candidate.applications || []),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredCandidates.length > 10 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled>
                {t("previous")}
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">1</Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">2</Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">3</Button>
                <span className="text-muted-foreground">...</span>
              </div>
              <Button variant="outline" size="sm">
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}