"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, Calendar, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  totalApplications: number
}

export function DashboardOverview({ user }: { user: User }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch jobs count
        const { count: jobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch active jobs count
        const { count: activeJobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "open")

        // Fetch candidates count
        const { count: candidatesCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch applications count
        const { count: applicationsCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        setStats({
          totalJobs: jobsCount || 0,
          activeJobs: activeJobsCount || 0,
          totalCandidates: candidatesCount || 0,
          totalApplications: applicationsCount || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user.id, supabase])

  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      description: `${stats.activeJobs} active`,
      href: "/dashboard/jobs",
    },
    {
      title: "Candidates",
      value: stats.totalCandidates,
      icon: Users,
      description: "In your pipeline",
      href: "/dashboard/candidates",
    },
    {
      title: "Applications",
      value: stats.totalApplications,
      icon: TrendingUp,
      description: "Total received",
      href: "/dashboard/applications",
    },
    {
      title: "Interviews",
      value: 0,
      icon: Calendar,
      description: "Scheduled",
      href: "/dashboard/interviews",
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {user.user_metadata?.full_name || user.email}
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your recruitment today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/jobs/new">
                <Briefcase className="mr-2 h-4 w-4" />
                Post a New Job
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/candidates">
                <Users className="mr-2 h-4 w-4" />
                Search Candidates
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/interviews">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Interview
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your recruitment pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalJobs === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                <p className="mb-4">No activity yet. Start by posting your first job!</p>
                <Button asChild>
                  <Link href="/dashboard/jobs/new">Post a Job</Link>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Activity feed coming soon...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
