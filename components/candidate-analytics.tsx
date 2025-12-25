"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, TrendingUp, Calendar } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AnalyticsData {
    totalCandidates: number
    byStatus: {
        active: number
        inactive: number
        placed: number
        withdrawn: number
    }
    byAvailability: {
        immediate: number
        "2-weeks": number
        "1-month": number
        "3-months": number
        "not-available": number
    }
    monthlyGrowth: Array<{
        month: string
        count: number
    }>
}

export function CandidateAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = useSupabase()

    useEffect(() => {
        fetchAnalytics()
    }, [])

    async function fetchAnalytics() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get all candidates
            const { data: candidates, error } = await supabase
                .from("candidates")
                .select("*")
                .eq("user_id", user.id)

            if (error) throw error

            // Calculate analytics
            const byStatus = {
                active: candidates.filter(c => c.status === 'active').length,
                inactive: candidates.filter(c => c.status === 'inactive').length,
                placed: candidates.filter(c => c.status === 'placed').length,
                withdrawn: candidates.filter(c => c.status === 'withdrawn').length,
            }

            const byAvailability = {
                immediate: candidates.filter(c => c.availability === 'immediate').length,
                "2-weeks": candidates.filter(c => c.availability === '2-weeks').length,
                "1-month": candidates.filter(c => c.availability === '1-month').length,
                "3-months": candidates.filter(c => c.availability === '3-months').length,
                "not-available": candidates.filter(c => c.availability === 'not-available').length,
            }

            // Calculate monthly growth (simplified)
            const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                return {
                    month: date.toLocaleDateString('en-US', { month: 'short' }),
                    count: Math.floor(Math.random() * 20) + 5 // Mock data
                }
            }).reverse()

            setAnalytics({
                totalCandidates: candidates.length,
                byStatus,
                byAvailability,
                monthlyGrowth,
            })
        } catch (error) {
            console.error("Error fetching analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        )
    }

    if (!analytics) return null

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalCandidates}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.byStatus.active}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Placed</CardTitle>
                        <UserCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.byStatus.placed}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Withdrawn</CardTitle>
                        <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.byStatus.withdrawn}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Monthly Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.monthlyGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Availability Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(analytics.byAvailability).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm capitalize">{key.replace('-', ' ')}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{
                                                    width: `${(value / analytics.totalCandidates) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}