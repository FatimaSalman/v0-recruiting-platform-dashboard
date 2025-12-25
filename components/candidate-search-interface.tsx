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

      // Transform candidates to match the card component format
      const transformedCandidates: CandidateWithScore[] = (data || []).map((candidate) => ({
        ...candidate,
        status: candidate.status || 'active',
        availability: candidate.availability || 'immediate',
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
          candidate.tags?.some((tag) => tag.toLowerCase().includes(query))
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

  function getStatusIcon(status: string) {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <UserMinus className="w-4 h-4 text-gray-500" />
      case 'placed':
        return <Award className="w-4 h-4 text-blue-500" />
      case 'withdrawn':
        return <UserX className="w-4 h-4 text-red-500" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  function getAvailabilityIcon(availability: string) {
    switch (availability) {
      case 'immediate':
        return <Clock className="w-4 h-4 text-green-500" />
      case '2-weeks':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case '1-month':
        return <Calendar className="w-4 h-4 text-yellow-500" />
      case '3-months':
        return <Calendar className="w-4 h-4 text-orange-500" />
      case 'not-available':
        return <Clock className="w-4 h-4 text-red-500" />
      default:
        return <Calendar className="w-4 h-4" />
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
                <DialogTitle>Export Candidates</DialogTitle>
                <DialogDescription>
                  Export your candidates to CSV format for external use.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This will export all {candidates.length} candidates to a CSV file.
                    The export includes all candidate information except sensitive data.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExportCandidates}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
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
                <p className="text-sm text-muted-foreground">Total Candidates</p>
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
                <p className="text-sm text-muted-foreground">Active</p>
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
                <p className="text-sm text-muted-foreground">Available Now</p>
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
                <p className="text-sm text-muted-foreground">Avg Experience</p>
                <p className="text-2xl font-bold">
                  {candidates.length > 0
                    ? Math.round(candidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / candidates.length)
                    : 0} yrs
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Experience Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Experience</Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="0-5">0-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skill Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Skill</Label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Skills" />
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

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
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
            <div className="space-y-2">
              <Label className="text-xs">Availability</Label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Availability" />
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

            {/* Salary Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Salary Range</Label>
              <Select value={salaryRangeFilter} onValueChange={setSalaryRangeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Salaries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salaries</SelectItem>
                  <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                  <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                  <SelectItem value="100000-150000">$100,000 - $150,000</SelectItem>
                  <SelectItem value="150000+">$150,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label className="text-xs">Sort By</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match Score</SelectItem>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="salary">Expected Salary</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
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
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {experienceFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Exp: {experienceFilter}
                      <button onClick={() => setExperienceFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {skillFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Skill: {skillFilter}
                      <button onClick={() => setSkillFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {availabilityFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Availability: {availabilityFilter}
                      <button onClick={() => setAvailabilityFilter("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {salaryRangeFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Salary: {salaryRangeFilter}
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
                  Clear all
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
                <h3 className="font-semibold">{selectedCandidates.length} candidates selected</h3>
                <p className="text-sm text-muted-foreground">Perform actions on selected candidates</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEmailDialog(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
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
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to Selected Candidates</DialogTitle>
            <DialogDescription>
              Send an email to {selectedCandidates.length} selected candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={bulkEmailContent.subject}
                onChange={(e) => setBulkEmailContent({ ...bulkEmailContent, subject: e.target.value })}
                placeholder="Email subject..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={bulkEmailContent.message}
                onChange={(e) => setBulkEmailContent({ ...bulkEmailContent, message: e.target.value })}
                rows={6}
                placeholder="Write your message here..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Open Email Client
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
                {sortBy === "match" && "Sorted by match score"}
                {sortBy === "date" && "Sorted by date added"}
                {sortBy === "name" && "Sorted by name"}
                {sortBy === "salary" && "Sorted by expected salary"}
                {sortOrder === "asc" ? " (ascending)" : " (descending)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredCandidates.length} of {candidates.length} candidates
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
                    Deselect All
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Select All
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
                  className="absolute left-4 top-6 z-10 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
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