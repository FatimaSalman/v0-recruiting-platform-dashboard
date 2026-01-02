// app/dashboard/applications/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Eye,
  MoreVertical,
  Download,
  Filter,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Lock,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface Application {
  id: string
  candidate_id: string
  job_id: string
  status: string
  match_score: number | null
  applied_at: string
  updated_at: string
  notes: string | null
  candidate: {
    id: string
    name: string
    email: string
    title: string | null
    location: string | null
    phone: string | null
    status: string
  }
  job: {
    id: string
    title: string
    department: string | null
    location: string | null
    status: string
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const router = useRouter()
  const supabase = useSupabase()
  const { t, direction } = useI18n()

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [searchQuery, statusFilter, applications])

  async function fetchApplications() {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch applications with candidate and job details
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          candidate:candidates(
            id,
            name,
            email,
            title,
            location,
            phone,
            status
          ),
          job:jobs(
            id,
            title,
            department,
            location,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })

      if (error) throw error

      setApplications(applicationsData || [])
      setFilteredApplications(applicationsData || [])

    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterApplications() {
    let filtered = [...applications]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app =>
        app.candidate.name.toLowerCase().includes(query) ||
        app.candidate.email.toLowerCase().includes(query) ||
        app.job.title.toLowerCase().includes(query) ||
        app.candidate.title?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "applied": return "bg-blue-100 text-blue-800"
      case "screening": return "bg-yellow-100 text-yellow-800"
      case "interview": return "bg-purple-100 text-purple-800"
      case "offer": return "bg-green-100 text-green-800"
      case "hired": return "bg-emerald-100 text-emerald-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "hired": return <CheckCircle className="w-4 h-4" />
      case "interview": return <Clock className="w-4 h-4" />
      case "rejected": return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">{t("applications.loading")}</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("nav.applications")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("applications.subtitle")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchApplications()}>
                <RefreshCw className="w-4 h-4 me-2" />
                {t("reports.refresh")}
              </Button>
              <Button size="sm" onClick={() => router.push('/dashboard/jobs')}>
                <UserPlus className="w-4 h-4 me-2" />
                {t("applications.newApplication")}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("applications.total")}</p>
                    <p className="text-2xl font-bold">{applications.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("applications.active")}</p>
                    <p className="text-2xl font-bold">
                      {applications.filter(app => ['applied', 'screening', 'interview', 'offer'].includes(app.status)).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("applications.inProgress")}</p>
                    <p className="text-2xl font-bold">
                      {applications.filter(app => ['screening', 'interview'].includes(app.status)).length}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("status.hired")}</p>
                    <p className="text-2xl font-bold">
                      {applications.filter(app => app.status === 'hired').length}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("applications.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter} dir={direction}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("applications.filterStatus")} />
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-3">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{t("reports.dateRange")}</DropdownMenuItem>
                    <DropdownMenuItem>{t("candidate.match")}</DropdownMenuItem>
                    <DropdownMenuItem>{t("jobs.form.jobTitle")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full max-w-3xl">
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              {t("status.all")} ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="applied" onClick={() => setStatusFilter("applied")}>
              {t("status.application.applied")} ({applications.filter(a => a.status === 'applied').length})
            </TabsTrigger>
            <TabsTrigger value="screening" onClick={() => setStatusFilter("screening")}>
              {t("status.application.screening")} ({applications.filter(a => a.status === 'screening').length})
            </TabsTrigger>
            <TabsTrigger value="interview" onClick={() => setStatusFilter("interview")}>
              {t("status.application.interview")} ({applications.filter(a => a.status === 'interview').length})
            </TabsTrigger>
            <TabsTrigger value="offer" onClick={() => setStatusFilter("offer")}>
              {t("status.application.offer")} ({applications.filter(a => a.status === 'offer').length})
            </TabsTrigger>
            <TabsTrigger value="hired" onClick={() => setStatusFilter("hired")}>
              {t("status.application.hired")} ({applications.filter(a => a.status === 'hired').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" onClick={() => setStatusFilter("rejected")}>
              {t("status.application.rejected")} ({applications.filter(a => a.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {applications.length === 0 ? t("applications.noApplications") : t("applications.noResults")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {applications.length === 0
                  ? t("applications.startAdding")
                  : t("applications.noResultsMessage")}
              </p>
              <Button onClick={() => router.push('/dashboard/jobs')}>
                {t("applications.browseJobs")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {t("applications.showing").replace("{count}", filteredApplications.length.toString()).replace("{total}", applications.length.toString())}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-2"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-2"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {viewMode === "list" ? (
              // List View
              filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Application Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">
                                {application.candidate.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {application.candidate.title || t("common.unknown")}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={`${getStatusColor(application.status)} gap-1`}>
                                {getStatusIcon(application.status)}
                                {t(`status.application.${application.status}`) || application.status}
                              </Badge>
                              
                              {application.match_score && (
                                <div className="flex items-center gap-1">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600"
                                      style={{ width: `${application.match_score}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{application.match_score}% {t("applications.match")}</span>
                                </div>
                              )}
                            </div>

                            {/* Job Title */}
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-1">{t("applications.appliedFor")}</p>
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{application.job.title}</span>
                                {application.job.department && (
                                  <Badge variant="outline" className="text-xs">
                                    {application.job.department}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground text-end">
                            <div className="flex items-center gap-1 justify-end">
                              <Calendar className="w-4 h-4" />
                              <span>{t("candidate.profile.appliedOn")} {format(new Date(application.applied_at), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{application.candidate.email}</span>
                          </div>
                          {application.candidate.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{application.candidate.phone}</span>
                            </div>
                          )}
                          {application.candidate.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{application.candidate.location}</span>
                            </div>
                          )}
                        </div>

                        {application.notes && (
                          <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">{application.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="lg:w-48 flex flex-col gap-2">
                        <Select
                          value={application.status}
                          onValueChange={(value) => {
                            // Handle status update
                            console.log('Update status:', value)
                          }}
                          dir={direction}
                        >
                          <SelectTrigger>
                            <SelectValue />
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

                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/dashboard/candidates/${application.candidate.id}`}>
                              <Eye className="w-3 h-3 me-1" />
                              {t("common.view")}
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => window.location.href = `mailto:${application.candidate.email}`}
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/candidates/${application.candidate.id}`}>
                                  {t("candidate.profile.viewProfile")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.location.href = `mailto:${application.candidate.email}`}>
                                {t("candidates.send.email")}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                {t("interviews.schedule")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                {t("applications.reject")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold mb-1 truncate">{application.candidate.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{application.candidate.title || t("common.unknown")}</p>
                          </div>
                          <Badge className={`${getStatusColor(application.status)} gap-1`}>
                            {getStatusIcon(application.status)}
                            {t(`status.application.${application.status}`) || application.status}
                          </Badge>
                        </div>

                        {/* Job Info */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t("applications.position")}</p>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span className="font-medium text-sm truncate">{application.job.title}</span>
                          </div>
                        </div>

                        {/* Match Score */}
                        {application.match_score && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{t("candidate.match")}</span>
                              <span className="text-sm font-medium">{application.match_score}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600"
                                style={{ width: `${application.match_score}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate">{application.candidate.email}</span>
                          </div>
                          {application.candidate.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{application.candidate.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(application.applied_at), 'MMM d')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/dashboard/candidates/${application.candidate.id}`}>
                              <Eye className="w-3 h-3 me-1" />
                              {t("common.view")}
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => window.location.href = `mailto:${application.candidate.email}`}
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Add missing icons
const RefreshCw = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
)

const Grid3x3 = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
)