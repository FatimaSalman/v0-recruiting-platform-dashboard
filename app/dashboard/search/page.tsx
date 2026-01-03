// app/dashboard/search/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Filter,
    Star,
    Users,
    Briefcase,
    MapPin,
    Calendar,
    Zap,
    Crown,
    Brain,
    Sparkles,
    Lock,
    Eye,
    Download,
    MessageSquare,
    Mail,
    Phone,
    Linkedin,
    Award,
    TrendingUp,
    X,
    RefreshCw,
    Check,
    ArrowRight,
    ExternalLink,
    FileText,
    User,
    Clock,
    AlertCircle,
    Building,
    Globe,
    Target,
    AlertTriangle
} from "lucide-react"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Candidate {
    id: string
    name: string
    email: string
    title: string | null
    location: string | null
    experience_years: number | null
    skills: string[] | null
    status: string
    availability: string
    match_score?: number
    ai_insights?: string
    last_contacted: string | null
    created_at: string
    resume_url: string | null
    linkedin_url: string | null
}

interface Job {
    id: string
    title: string
    department: string | null
    location: string | null
    status: string
    skills: string[] | null
    match_score?: number
}

interface SearchResult {
    candidates: Candidate[]
    jobs: Job[]
    totalResults: number
    searchTime: number
    aiSuggestions?: string[]
}

interface SubscriptionTier {
    id: 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'
    name: string
    searchFeatures: {
        basicSearch: boolean
        advancedFilters: boolean
        aiSearch: boolean
        aiMatching: boolean
        bulkActions: boolean
        saveSearches: boolean
        exportResults: boolean
        realTimeUpdates: boolean
        candidateInsights: boolean
        predictiveHiring: boolean
    }
    limits: {
        maxResults: number
        maxSavedSearches: number
        searchHistoryDays: number
    }
}

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
    'free-trial': {
        id: 'free-trial',
        name: 'Free Trial',
        searchFeatures: {
            basicSearch: true,
            advancedFilters: false,
            aiSearch: false,
            aiMatching: false,
            bulkActions: false,
            saveSearches: false,
            exportResults: false,
            realTimeUpdates: false,
            candidateInsights: false,
            predictiveHiring: false
        },
        limits: {
            maxResults: 50,
            maxSavedSearches: 0,
            searchHistoryDays: 7
        }
    },
    'starter-monthly': {
        id: 'starter-monthly',
        name: 'Starter',
        searchFeatures: {
            basicSearch: true,
            advancedFilters: true,
            aiSearch: false,
            aiMatching: false,
            bulkActions: true,
            saveSearches: true,
            exportResults: true,
            realTimeUpdates: false,
            candidateInsights: false,
            predictiveHiring: false
        },
        limits: {
            maxResults: 200,
            maxSavedSearches: 5,
            searchHistoryDays: 30
        }
    },
    'professional-monthly': {
        id: 'professional-monthly',
        name: 'Professional',
        searchFeatures: {
            basicSearch: true,
            advancedFilters: true,
            aiSearch: true,
            aiMatching: false,
            bulkActions: true,
            saveSearches: true,
            exportResults: true,
            realTimeUpdates: true,
            candidateInsights: true,
            predictiveHiring: false
        },
        limits: {
            maxResults: 1000,
            maxSavedSearches: 20,
            searchHistoryDays: 90
        }
    },
    'enterprise-monthly': {
        id: 'enterprise-monthly',
        name: 'Enterprise',
        searchFeatures: {
            basicSearch: true,
            advancedFilters: true,
            aiSearch: true,
            aiMatching: true,
            bulkActions: true,
            saveSearches: true,
            exportResults: true,
            realTimeUpdates: true,
            candidateInsights: true,
            predictiveHiring: true
        },
        limits: {
            maxResults: 10000,
            maxSavedSearches: 100,
            searchHistoryDays: 365
        }
    }
}

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchType, setSearchType] = useState<"candidates" | "jobs" | "all">("candidates")
    const [activeFilters, setActiveFilters] = useState<string[]>([])
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [aiSearchEnabled, setAiSearchEnabled] = useState(false)
    const [aiMatchingEnabled, setAiMatchingEnabled] = useState(false)
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS['free-trial'])
    const [savedSearches, setSavedSearches] = useState<any[]>([])
    const [searchHistory, setSearchHistory] = useState<any[]>([])
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
    const [bulkAction, setBulkAction] = useState<string>("")

    // Advanced filter states
    const [locationFilter, setLocationFilter] = useState("")
    const [experienceMin, setExperienceMin] = useState<number>(0)
    const [experienceMax, setExperienceMax] = useState<number>(20)
    const [salaryMin, setSalaryMin] = useState<number>(0)
    const [salaryMax, setSalaryMax] = useState<number>(300000)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
    const [skillFilters, setSkillFilters] = useState<string[]>([])
    const [departmentFilter, setDepartmentFilter] = useState("")

    const { t, locale, direction } = useI18n()
    const supabase = useSupabase()
    const router = useRouter()

    useEffect(() => {
        checkSubscriptionTier()
        loadSavedSearches()
        loadSearchHistory()
    }, [])

    useEffect(() => {
        // Enable AI features based on subscription
        setAiSearchEnabled(subscriptionTier.searchFeatures.aiSearch)
        setAiMatchingEnabled(subscriptionTier.searchFeatures.aiMatching)
    }, [subscriptionTier])

    async function checkSubscriptionTier() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('plan_type, status')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()

            let tierId: keyof typeof SUBSCRIPTION_TIERS = 'free-trial'
            if (subscription && subscription.status === 'active') {
                tierId = subscription.plan_type as keyof typeof SUBSCRIPTION_TIERS
            }

            setSubscriptionTier(SUBSCRIPTION_TIERS[tierId])
        } catch (error) {
            console.error("Error checking subscription:", error)
        }
    }

    async function loadSavedSearches() {
        if (!subscriptionTier.searchFeatures.saveSearches) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(subscriptionTier.limits.maxSavedSearches)

            setSavedSearches(data || [])
        } catch (error) {
            console.error("Error loading saved searches:", error)
        }
    }

    async function loadSearchHistory() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - subscriptionTier.limits.searchHistoryDays)

            const { data } = await supabase
                .from('search_history')
                .select('*')
                .eq('user_id', user.id)
                .gte('searched_at', cutoffDate.toISOString())
                .order('searched_at', { ascending: false })
                .limit(50)

            setSearchHistory(data || [])
        } catch (error) {
            console.error("Error loading search history:", error)
        }
    }

    const performBasicSearch = useCallback(async (query: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { candidates: [], jobs: [], totalResults: 0, searchTime: 0 }

        const startTime = Date.now()
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

        console.log("Searching with terms:", searchTerms)
        console.log("User ID:", user.id)
        console.log("Max results:", subscriptionTier.limits.maxResults)

        // Search candidates
        let candidatesQuery = supabase
            .from('candidates')
            .select('*')
            .eq('user_id', user.id)
            .limit(subscriptionTier.limits.maxResults)

        if (searchTerms.length > 0) {
            // Build OR conditions for each search term
            const conditions = searchTerms.map(term =>
                `name.ilike.%${term}%,title.ilike.%${term}%,email.ilike.%${term}%,location.ilike.%${term}%`
            ).join(',')

            candidatesQuery = candidatesQuery.or(conditions)
            console.log("Search conditions:", conditions)
        }

        // Apply basic filters
        if (statusFilter !== 'all') {
            candidatesQuery = candidatesQuery.eq('status', statusFilter)
        }
        if (locationFilter) {
            candidatesQuery = candidatesQuery.ilike('location', `%${locationFilter}%`)
        }

        console.log("Executing candidates query...")
        const { data: candidates, error: candidatesError } = await candidatesQuery

        if (candidatesError) {
            console.error("Error searching candidates:", candidatesError)
            return { candidates: [], jobs: [], totalResults: 0, searchTime: 0 }
        }

        console.log("Found candidates:", candidates?.length)

        // Search jobs if needed
        let jobs: Job[] = []
        if (searchType === 'jobs' || searchType === 'all') {
            let jobsQuery = supabase
                .from('jobs')
                .select('*')
                .eq('user_id', user.id)
                .limit(subscriptionTier.limits.maxResults)

            if (searchTerms.length > 0) {
                const conditions = searchTerms.map(term =>
                    `title.ilike.%${term}%,department.ilike.%${term}%,location.ilike.%${term}%`
                ).join(',')
                jobsQuery = jobsQuery.or(conditions)
            }

            const { data: jobsData } = await jobsQuery
            jobs = jobsData || []
            console.log("Found jobs:", jobs.length)
        }

        const searchTime = Date.now() - startTime
        console.log("Search completed in:", searchTime, "ms")
        console.log("Total results:", (candidates?.length || 0) + jobs.length)

        return {
            candidates: candidates || [],
            jobs,
            totalResults: (candidates?.length || 0) + jobs.length,
            searchTime
        }
    }, [subscriptionTier, statusFilter, locationFilter, searchType, supabase])

    const performAISearch = useCallback(async (query: string) => {
        // This is a simulated AI search - in production, you would call an AI service
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { candidates: [], jobs: [], totalResults: 0, searchTime: 0, aiSuggestions: [] }

        const startTime = Date.now()

        // First, get basic results
        const basicResults = await performBasicSearch(query)

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 500))

        // Add AI insights and match scores
        const enhancedCandidates = basicResults.candidates.map(candidate => ({
            ...candidate,
            match_score: calculateAIMatchScore(candidate, query),
            ai_insights: generateAIInsights(candidate, query)
        })).sort((a, b) => (b.match_score || 0) - (a.match_score || 0))

        // Generate AI suggestions
        const aiSuggestions = generateAISuggestions(query, enhancedCandidates)

        const searchTime = Date.now() - startTime

        return {
            ...basicResults,
            candidates: enhancedCandidates,
            aiSuggestions,
            searchTime
        }
    }, [performBasicSearch])

    const performAIMatching = useCallback(async (query: string) => {
        // This is advanced AI matching for enterprise tier
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { candidates: [], jobs: [], totalResults: 0, searchTime: 0, aiSuggestions: [] }

        const startTime = Date.now()

        // Get AI search results
        const aiResults = await performAISearch(query)

        // Simulate more advanced AI processing
        await new Promise(resolve => setTimeout(resolve, 800))

        // Add predictive hiring scores and recommendations
        const predictiveCandidates = aiResults.candidates.map(candidate => ({
            ...candidate,
            predictive_hiring_score: calculatePredictiveHiringScore(candidate),
            recommended_jobs: recommendJobsForCandidate(candidate),
            retention_risk: calculateRetentionRisk(candidate)
        }))

        // Generate advanced AI insights
        const advancedAISuggestions = [
            ...(aiResults.aiSuggestions || []),
            "Predictive hiring scores calculated based on historical success patterns",
            "Candidate retention risk analysis included",
            "Job-candidate matching optimized for long-term success"
        ]

        const searchTime = Date.now() - startTime

        return {
            ...aiResults,
            candidates: predictiveCandidates,
            aiSuggestions: advancedAISuggestions,
            searchTime
        }
    }, [performAISearch])

    const calculateAIMatchScore = (candidate: Candidate, query: string): number => {
        // Simulate AI match score calculation
        let score = 50 // Base score

        // Title match
        if (candidate.title && query.toLowerCase().includes(candidate.title.toLowerCase())) {
            score += 20
        }

        // Skills match
        if (candidate.skills) {
            const querySkills = query.toLowerCase().split(' ').filter(term => term.length > 3)
            const matchedSkills = candidate.skills.filter(skill =>
                querySkills.some(term => skill.toLowerCase().includes(term))
            )
            score += matchedSkills.length * 5
        }

        // Experience bonus
        if (candidate.experience_years && candidate.experience_years >= 3) {
            score += 10
        }

        // Recent activity bonus
        if (candidate.last_contacted) {
            const daysSinceContact = Math.floor((Date.now() - new Date(candidate.last_contacted).getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceContact < 30) score += 5
        }

        return Math.min(100, Math.max(0, score))
    }
    const generateAIInsights = (candidate: Candidate, query: string): string => {
        const insights: string[] = []

        if (candidate.experience_years && candidate.experience_years >= 5) {
            insights.push("Senior-level experience")
        }

        if (candidate.skills && candidate.skills.length >= 5) {
            insights.push("Diverse skill set")
        }

        if (candidate.availability === 'immediate') {
            insights.push("Immediately available")
        }

        if (candidate.status === 'active') {
            insights.push("Currently active in job search")
        }

        return insights.join(" • ") || "No specific insights available"
    }

    const generateAISuggestions = (query: string, candidates: Candidate[]): string[] => {
        const suggestions: string[] = []

        if (query.length < 3) {
            suggestions.push("Try using more specific keywords for better results")
        }

        if (candidates.length > 10) {
            suggestions.push("Consider adding location filters to narrow down results")
        }

        if (candidates.some(c => c.experience_years && c.experience_years >= 8)) {
            suggestions.push("Senior candidates available. Consider leadership roles")
        }

        const popularSkills = candidates.flatMap(c => c.skills || [])
            .reduce((acc: Record<string, number>, skill) => {
                acc[skill] = (acc[skill] || 0) + 1
                return acc
            }, {})

        const topSkill = Object.entries(popularSkills)
            .sort(([, a], [, b]) => b - a)[0]

        if (topSkill && topSkill[1] > candidates.length * 0.3) {
            suggestions.push(`Many candidates have "${topSkill[0]}" skill - consider specializing your search`)
        }

        return suggestions.slice(0, 3)
    }

    const calculatePredictiveHiringScore = (candidate: Candidate): number => {
        // Simulate predictive hiring score
        let score = 60

        // Factors that increase hiring likelihood
        if (candidate.experience_years && candidate.experience_years >= 3) score += 15
        if (candidate.skills && candidate.skills.length >= 5) score += 10
        if (candidate.availability === 'immediate') score += 5
        if (candidate.status === 'active') score += 5

        // Factors that decrease hiring likelihood
        if (candidate.location && candidate.location.includes('Remote')) score -= 5

        return Math.min(100, Math.max(0, score))
    }

    const recommendJobsForCandidate = (candidate: Candidate): string[] => {
        // Simulate job recommendations based on candidate profile
        const recommendations: string[] = []

        if (candidate.title?.toLowerCase().includes('developer')) {
            recommendations.push("Senior Software Engineer", "Full Stack Developer", "Tech Lead")
        } else if (candidate.title?.toLowerCase().includes('manager')) {
            recommendations.push("Product Manager", "Project Manager", "Operations Manager")
        } else if (candidate.title?.toLowerCase().includes('design')) {
            recommendations.push("UI/UX Designer", "Product Designer", "Design Lead")
        }

        return recommendations.slice(0, 3)
    }

    const calculateRetentionRisk = (candidate: Candidate): number => {
        // Simulate retention risk calculation
        let risk = 30 // Base risk

        // Factors that increase retention
        if (candidate.experience_years && candidate.experience_years >= 5) risk -= 10
        if (candidate.status === 'active') risk -= 5

        // Factors that decrease retention
        if (candidate.availability === 'immediate') risk += 10
        if (candidate.location?.toLowerCase().includes('san francisco') ||
            candidate.location?.toLowerCase().includes('new york')) {
            risk += 15 // Higher competition areas
        }

        return Math.min(100, Math.max(0, risk))
    }

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        console.log("handleSearch called")
        console.log("Search query:", searchQuery)
        console.log("Active filters:", activeFilters)

        if (!searchQuery.trim() && !activeFilters.length && !locationFilter && statusFilter === 'all') {
            console.log("No search criteria provided")
            toast({
                title: t("common.warning"),
                description: t("search.enterSearchCriteria"),
                variant: "default"
            })
            return
        }

        setLoading(true)
        setSearchResults(null)
        setSelectedCandidates([])

        try {
            let results: SearchResult
            console.log("Subscription tier:", subscriptionTier.id)
            console.log("AI search enabled:", subscriptionTier.searchFeatures.aiSearch && aiSearchEnabled)
            console.log("AI matching enabled:", subscriptionTier.searchFeatures.aiMatching && aiMatchingEnabled)

            // Choose search method based on subscription tier
            if (subscriptionTier.searchFeatures.aiMatching && aiMatchingEnabled) {
                console.log("Using AI Matching search")
                results = await performAIMatching(searchQuery)
            } else if (subscriptionTier.searchFeatures.aiSearch && aiSearchEnabled) {
                console.log("Using AI Search")
                results = await performAISearch(searchQuery)
            } else {
                console.log("Using Basic Search")
                results = await performBasicSearch(searchQuery)
            }

            console.log("Search results:", results)
            setSearchResults(results)

            // Save to search history
            await saveSearchToHistory(searchQuery, results.totalResults)

            if (results.totalResults === 0) {
                toast({
                    title: t("search.noResults"),
                    description: t("search.tryDifferentKeywords"),
                    variant: "default"
                })
            }

        } catch (error) {
            console.error("Search error:", error)
            toast({
                title: t("common.error"),
                description: t("search.errorOccurred"),
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const saveSearchToHistory = async (query: string, resultCount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase
                .from('search_history')
                .insert({
                    user_id: user.id,
                    search_query: query,
                    result_count: resultCount,
                    search_type: searchType,
                    filters_applied: activeFilters,
                    searched_at: new Date().toISOString()
                })
        } catch (error) {
            console.error("Error saving search history:", error)
        }
    }

    const saveCurrentSearch = async () => {
        if (!subscriptionTier.searchFeatures.saveSearches) {
            setShowUpgradePrompt(true)
            return
        }

        if (savedSearches.length >= subscriptionTier.limits.maxSavedSearches) {
            toast({
                title: t("common.warning"),
                description: `${t("search.saveLimit")} ${subscriptionTier.limits.maxSavedSearches}`,
                variant: "destructive"
            })
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('saved_searches')
                .insert({
                    user_id: user.id,
                    name: `Search: ${searchQuery.substring(0, 30)}${searchQuery.length > 30 ? '...' : ''}`,
                    search_query: searchQuery,
                    search_type: searchType,
                    filters: activeFilters,
                    last_results_count: searchResults?.totalResults || 0
                })
                .select()
                .single()

            if (data) {
                setSavedSearches(prev => [data, ...prev])
                toast({
                    title: t("common.success"),
                    description: t("search.savedSuccessfully")
                })
            }
        } catch (error) {
            console.error("Error saving search:", error)
            toast({
                title: t("common.error"),
                description: t("search.saveFailed"),
                variant: "destructive"
            })
        }
    }

    const loadSavedSearch = async (savedSearch: any) => {
        setSearchQuery(savedSearch.search_query)
        setSearchType(savedSearch.search_type)
        setActiveFilters(savedSearch.filters || [])

        // Trigger search after a short delay
        setTimeout(() => handleSearch(), 100)
    }

    const exportResults = (format: 'csv' | 'pdf' = 'csv') => {
        if (!subscriptionTier.searchFeatures.exportResults) {
            setShowUpgradePrompt(true)
            return
        }

        if (!searchResults || searchResults.candidates.length === 0) {
            toast({
                title: t("common.warning"),
                description: t("search.noResultsToExport"),
                variant: "destructive"
            })
            return
        }

        // Simple CSV export for demonstration
        if (format === 'csv') {
            const headers = ['Name', 'Email', 'Title', 'Location', 'Experience', 'Skills', 'Status', 'Match Score']
            const rows = searchResults.candidates.map(candidate => [
                candidate.name,
                candidate.email,
                candidate.title || '',
                candidate.location || '',
                candidate.experience_years ? `${candidate.experience_years} years` : '',
                candidate.skills?.join(', ') || '',
                candidate.status,
                candidate.match_score ? `${candidate.match_score}%` : ''
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            toast({
                title: t("common.success"),
                description: t("search.exportedSuccessfully")
            })
        }
    }

    const handleBulkAction = async (action: string) => {
        if (!subscriptionTier.searchFeatures.bulkActions) {
            setShowUpgradePrompt(true)
            return
        }

        if (selectedCandidates.length === 0) {
            toast({
                title: t("common.warning"),
                description: t("search.selectCandidatesFirst"),
                variant: "destructive"
            })
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            switch (action) {
                case 'email':
                    // Open email composer with selected candidates
                    const emails = searchResults?.candidates
                        .filter(c => selectedCandidates.includes(c.id))
                        .map(c => c.email)
                        .join(',')
                    window.location.href = `mailto:${emails}?subject=Regarding your application`
                    break

                case 'add_to_job':
                    router.push(`/dashboard/jobs/new?candidates=${selectedCandidates.join(',')}`)
                    break

                case 'export_selected':
                    const selectedCandidatesData = searchResults?.candidates.filter(c => selectedCandidates.includes(c.id))
                    // Export logic here
                    break

                case 'update_status':
                    // Show status update modal
                    break
            }

            setSelectedCandidates([])
            setBulkAction("")

        } catch (error) {
            console.error("Bulk action error:", error)
            toast({
                title: t("common.error"),
                description: t("search.actionFailed"),
                variant: "destructive"
            })
        }
    }

    const toggleCandidateSelection = (candidateId: string) => {
        setSelectedCandidates(prev =>
            prev.includes(candidateId)
                ? prev.filter(id => id !== candidateId)
                : [...prev, candidateId]
        )
    }

    const clearFilters = () => {
        setActiveFilters([])
        setLocationFilter("")
        setExperienceMin(0)
        setExperienceMax(20)
        setSalaryMin(0)
        setSalaryMax(300000)
        setStatusFilter("all")
        setAvailabilityFilter("all")
        setSkillFilters([])
        setDepartmentFilter("")
    }

    const getFeatureBadge = (feature: string) => {
        const isAvailable = subscriptionTier.searchFeatures[feature as keyof SubscriptionTier['searchFeatures']]

        return (
            <Badge
                variant={isAvailable ? "default" : "outline"}
                className={cn(
                    "gap-1",
                    isAvailable
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                )}
            >
                {isAvailable ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
            </Badge>
        )
    }

    const renderCandidateCard = (candidate: Candidate) => (
        <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    {/* Selection checkbox */}
                    {subscriptionTier.searchFeatures.bulkActions && (
                        <div className="flex items-center me-4">
                            <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.id)}
                                onChange={() => toggleCandidateSelection(candidate.id)}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg font-semibold text-primary">
                                        {candidate.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/candidates/${candidate.id}`}
                                            className="text-lg font-semibold hover:text-primary hover:underline"
                                        >
                                            {candidate.name}
                                        </Link>
                                        <Badge variant="outline">{t(`status.${candidate.status}`)}</Badge>
                                    </div>
                                    <p className="text-muted-foreground">{candidate.title || t("common.unknown")}</p>
                                </div>
                            </div>

                            {/* Match score for AI searches */}
                            {(subscriptionTier.searchFeatures.aiSearch || subscriptionTier.searchFeatures.aiMatching) &&
                                candidate.match_score && (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-primary" />
                                            <span className="text-2xl font-bold text-primary">{candidate.match_score}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{t("candidate.match")}</span>
                                    </div>
                                )}
                        </div>

                        {/* AI Insights */}
                        {subscriptionTier.searchFeatures.aiSearch && candidate.ai_insights && (
                            <div className="mb-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-500">{t("search.aiInsights")}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{candidate.ai_insights}</p>
                            </div>
                        )}

                        {/* Candidate details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm truncate">{candidate.email}</span>
                            </div>
                            {candidate.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{candidate.location}</span>
                                </div>
                            )}
                            {candidate.experience_years && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{candidate.experience_years} {t("candidates.years")}</span>
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.slice(0, 5).map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {candidate.skills.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{candidate.skills.length - 5} {t("candidate.moreSkills")}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                                <Link href={`/dashboard/candidates/${candidate.id}`}>
                                    <Eye className="me-2 h-3 w-3" />
                                    {t("common.view")}
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.href = `mailto:${candidate.email}`}
                            >
                                <Mail className="me-2 h-3 w-3" />
                                {t("candidate.contact")}
                            </Button>
                            {candidate.resume_url && (
                                <Button size="sm" variant="ghost" asChild>
                                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="me-2 h-3 w-3" />
                                        {t("candidate.profile.resume")}
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const getPlanName = (tierId: string) => {
        const keyMap: Record<string, string> = {
            'free': 'plans.freeTrial',
            'starter': 'plans.starter',
            'professional': 'plans.professional',
            'enterprise': 'plans.enterprise'
        }
        return t(keyMap[tierId.split('-')[0]] || 'plans.freeTrial')
    }

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header with Plan Info */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("search.title")}</h1>
                            <div className="flex items-center gap-3">
                                <Badge className={
                                    subscriptionTier.id === 'enterprise-monthly' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        subscriptionTier.id === 'professional-monthly' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                            subscriptionTier.id === 'starter-monthly' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                }>
                                    {getPlanName(subscriptionTier.id)}
                                </Badge>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{subscriptionTier.limits.maxResults} {t("search.maxResults")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            {subscriptionTier.searchFeatures.saveSearches && savedSearches.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <Sparkles className="me-2 h-4 w-4" />
                                            {t("search.savedSearches")}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        {savedSearches.map((search) => (
                                            <DropdownMenuItem
                                                key={search.id}
                                                onClick={() => loadSavedSearch(search)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate">{search.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {search.last_results_count} results • {formatDistanceToNow(new Date(search.updated_at), { addSuffix: true, locale: locale === 'ar' ? ar : enUS })}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {subscriptionTier.searchFeatures.exportResults && searchResults && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            <Download className="me-2 h-4 w-4" />
                                            {t("search.export")}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => exportResults('csv')}>
                                            Export as CSV
                                        </DropdownMenuItem>
                                        {subscriptionTier.id !== 'starter-monthly' && (
                                            <DropdownMenuItem onClick={() => exportResults('pdf')}>
                                                Export as PDF
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {subscriptionTier.id === 'free-trial' && (
                                <Button onClick={() => router.push("/dashboard/pricing")}>
                                    <Crown className="me-2 h-4 w-4" />
                                    {t("search.upgrade")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Plan Features Overview */}
                    <Card className="mb-6">
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {getFeatureBadge('basicSearch')}
                                {getFeatureBadge('advancedFilters')}
                                {getFeatureBadge('aiSearch')}
                                {getFeatureBadge('aiMatching')}
                                {getFeatureBadge('bulkActions')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Search Area */}
                <Card className="mb-6">
                    <CardContent>
                        <form onSubmit={handleSearch}>
                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            placeholder={
                                                subscriptionTier.searchFeatures.aiSearch
                                                    ? t("search.aiPlaceholder")
                                                    : t("search.basicPlaceholder")
                                            }
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="ps-10 text-lg py-6"
                                            dir={direction}
                                        />
                                    </div>
                                    <Button type="submit" size="lg" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <RefreshCw className="me-2 h-4 w-4 animate-spin" />
                                                {t("search.searching")}
                                            </>
                                        ) : (
                                            <>
                                                <Search className="me-2 h-4 w-4" />
                                                {t("search.search")}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Search Type and AI Toggles */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)}>
                                        <TabsList>
                                            <TabsTrigger value="candidates">
                                                <Users className="me-2 h-4 w-4" />
                                                {t("search.candidates")}
                                            </TabsTrigger>
                                            <TabsTrigger value="jobs">
                                                <Briefcase className="me-2 h-4 w-4" />
                                                {t("search.jobs")}
                                            </TabsTrigger>
                                            <TabsTrigger value="all">
                                                <Search className="me-2 h-4 w-4" />
                                                {t("search.all")}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    <div className="flex items-center gap-4">
                                        {/* AI Search Toggle */}
                                        {subscriptionTier.searchFeatures.aiSearch && (
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-purple-500" />
                                                <Switch
                                                    checked={aiSearchEnabled}
                                                    onCheckedChange={(checked) => {
                                                        if (!subscriptionTier.searchFeatures.aiSearch) {
                                                            setShowUpgradePrompt(true)
                                                        } else {
                                                            setAiSearchEnabled(checked)
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm font-medium">AI Search</span>
                                            </div>
                                        )}

                                        {/* AI Matching Toggle */}
                                        {subscriptionTier.searchFeatures.aiMatching && (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                                <Switch
                                                    checked={aiMatchingEnabled}
                                                    onCheckedChange={(checked) => {
                                                        if (!subscriptionTier.searchFeatures.aiMatching) {
                                                            setShowUpgradePrompt(true)
                                                        } else {
                                                            setAiMatchingEnabled(checked)
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm font-medium">AI Matching</span>
                                            </div>
                                        )}

                                        {/* Advanced Filters Toggle */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (!subscriptionTier.searchFeatures.advancedFilters) {
                                                    setShowUpgradePrompt(true)
                                                } else {
                                                    setShowAdvancedFilters(!showAdvancedFilters)
                                                }
                                            }}
                                        >
                                            <Filter className="me-2 h-4 w-4" />
                                            {t("search.filters")}
                                            {activeFilters.length > 0 && (
                                                <Badge variant="secondary" className="ms-2">
                                                    {activeFilters.length}
                                                </Badge>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Advanced Filters */}
                                {showAdvancedFilters && subscriptionTier.searchFeatures.advancedFilters && (
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{t("search.advancedFilters")}</h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFilters}
                                            >
                                                <X className="me-2 h-4 w-4" />
                                                {t("search.clearAll")}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Location Filter */}
                                            <div>
                                                <Label className="mb-5" htmlFor="location">{t("search.location")}</Label>
                                                <Input
                                                    id="location"
                                                    placeholder={t("search.locationPlaceholder")}
                                                    value={locationFilter}
                                                    onChange={(e) => setLocationFilter(e.target.value)}
                                                    className="mt-1"
                                                    dir={direction}
                                                />
                                            </div>

                                            {/* Experience Range */}
                                            <div>
                                                <Label className="mb-5">{t("search.experience")}</Label>
                                                <div className="space-y-2 mt-1" dir="ltr">
                                                    <div className="flex justify-between text-sm">
                                                        <span>{experienceMin} {t("candidates.years")}</span>
                                                        <span>{experienceMax} {t("candidates.years")}+</span>
                                                    </div>
                                                    <Slider
                                                        min={0}
                                                        max={20}
                                                        step={1}
                                                        value={[experienceMin, experienceMax]}
                                                        onValueChange={([min, max]) => {
                                                            setExperienceMin(min)
                                                            setExperienceMax(max)
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <Label className="mb-5" htmlFor="status">{t("search.status")}</Label>
                                                <Select value={statusFilter} onValueChange={setStatusFilter} dir={direction}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder={t("search.selectStatus")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">{t("status.all")}</SelectItem>
                                                        <SelectItem value="active">{t("status.active")}</SelectItem>
                                                        <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                                                        <SelectItem value="placed">{t("status.placed")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Bulk Actions Bar */}
                {subscriptionTier.searchFeatures.bulkActions && selectedCandidates.length > 0 && (
                    <Card className="mb-6 border-primary/20 bg-primary/5">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-primary" />
                                    <span className="font-medium">
                                        {selectedCandidates.length} {t("search.selected")}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={bulkAction} onValueChange={handleBulkAction} dir={direction}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder={t("search.bulkActions")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">{t("search.sendEmail")}</SelectItem>
                                            <SelectItem value="add_to_job">{t("search.addToJob")}</SelectItem>
                                            <SelectItem value="export_selected">{t("search.exportSelected")}</SelectItem>
                                            <SelectItem value="update_status">{t("search.updateStatus")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCandidates([])}
                                    >
                                        {t("search.clearSelection")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results Area */}
                {searchResults && (
                    <div className="space-y-6">
                        {/* Results Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {searchResults.totalResults} {t("search.results")}
                                </h2>
                                <p className="text-muted-foreground">
                                    {searchResults.searchTime}ms • {searchType === 'candidates' ? t("search.inCandidates") :
                                        searchType === 'jobs' ? t("search.inJobs") : t("search.inAll")}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {subscriptionTier.searchFeatures.saveSearches && (
                                    <Button
                                        variant="outline"
                                        onClick={saveCurrentSearch}
                                    >
                                        <Sparkles className="me-2 h-4 w-4" />
                                        {t("search.saveSearch")}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* AI Suggestions */}
                        {subscriptionTier.searchFeatures.aiSearch && searchResults.aiSuggestions && searchResults.aiSuggestions.length > 0 && (
                            <Card className="border-blue-500/20 bg-blue-500/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Brain className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2">{t("search.aiSuggestions")}</h3>
                                            <ul className="space-y-2">
                                                {searchResults.aiSuggestions.map((suggestion, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <ArrowRight className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                                                        <span className="text-sm">{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Results Tabs */}
                        <Tabs defaultValue="candidates">
                            <TabsList>
                                <TabsTrigger value="candidates">
                                    <Users className="me-2 h-4 w-4" />
                                    {t("search.candidates")} ({searchResults.candidates.length})
                                </TabsTrigger>
                                {(searchType === 'jobs' || searchType === 'all') && (
                                    <TabsTrigger value="jobs">
                                        <Briefcase className="me-2 h-4 w-4" />
                                        {t("search.jobs")} ({searchResults.jobs.length})
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="candidates" className="space-y-4">
                                {searchResults.candidates.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-lg font-semibold mb-2">{t("search.noCandidatesFound")}</h3>
                                            <p className="text-muted-foreground mb-4">{t("search.tryDifferentKeywords")}</p>
                                            <Button onClick={() => setSearchQuery("")}>
                                                {t("search.clearSearch")}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        {/* Results Stats */}
                                        {subscriptionTier.searchFeatures.aiSearch && (
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                                    <span className="text-sm">
                                                        {searchResults.candidates.filter(c => (c.match_score || 0) >= 80).length} {t("search.highMatch")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                                    <span className="text-sm">
                                                        {searchResults.candidates.filter(c => (c.match_score || 0) >= 60 && (c.match_score || 0) < 80).length} {t("search.mediumMatch")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                                    <span className="text-sm">
                                                        {searchResults.candidates.filter(c => (c.match_score || 0) < 60).length} {t("search.lowMatch")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Candidates List */}
                                        <div className="space-y-4">
                                            {searchResults.candidates.map(candidate => renderCandidateCard(candidate))}
                                        </div>

                                        {/* Results Limit Warning */}
                                        {searchResults.candidates.length >= subscriptionTier.limits.maxResults && (
                                            <Card className="border-yellow-500/20 bg-yellow-500/5">
                                                <CardContent className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                        <div className="flex-1">
                                                            <p className="text-sm">
                                                                {t("search.resultsLimited").replace("{limit}", subscriptionTier.limits.maxResults.toString())}
                                                            </p>
                                                            {subscriptionTier.id !== 'enterprise-monthly' && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {t("search.upgradeForMoreResults")}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {subscriptionTier.id !== 'enterprise-monthly' && (
                                                            <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/pricing")}>
                                                                {t("search.upgradeNow")}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="jobs" className="space-y-4">
                                {searchResults.jobs.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-lg font-semibold mb-2">{t("search.noJobsFound")}</h3>
                                            <p className="text-muted-foreground mb-4">{t("search.tryDifferentKeywords")}</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        {searchResults.jobs.map(job => (
                                            <Card key={job.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <Link
                                                                href={`/dashboard/jobs/${job.id}`}
                                                                className="text-lg font-semibold hover:text-primary hover:underline"
                                                            >
                                                                {job.title}
                                                            </Link>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {job.department && (
                                                                    <Badge variant="outline">{job.department}</Badge>
                                                                )}
                                                                {job.location && (
                                                                    <Badge variant="outline">
                                                                        <MapPin className="w-3 h-3 me-1" />
                                                                        {job.location}
                                                                    </Badge>
                                                                )}
                                                                <Badge className={job.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                                                                    {job.status === 'open' ? t("jobs.status.open") : t("jobs.status.closed")}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <Button asChild size="sm">
                                                            <Link href={`/dashboard/jobs/${job.id}`}>
                                                                {t("common.view")}
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* No Search Performed */}
                {!searchResults && !loading && (
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Search className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">{t("search.welcomeTitle")}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            {subscriptionTier.searchFeatures.aiSearch
                                ? t("search.welcomeMessageAI")
                                : t("search.welcomeMessageBasic")}
                        </p>

                        {/* Quick Search Examples */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("software engineer")
                                    setTimeout(() => handleSearch(), 100)
                                }}
                                className="h-auto py-4"
                            >
                                <div className="text-start">
                                    <div className="font-semibold">{t("search.quick.softwareEngineer")}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{t("search.quick.softwareEngineerDesc")}</div>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("product manager")
                                    setTimeout(() => handleSearch(), 100)
                                }}
                                className="h-auto py-4"
                            >
                                <div className="text-start">
                                    <div className="font-semibold">{t("search.quick.productManager")}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{t("search.quick.productManagerDesc")}</div>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery(t("search.quick.locationExample"))
                                    setTimeout(() => handleSearch(), 100)
                                }}
                                className="h-auto py-4"
                            >
                                <div className="text-start">
                                    <div className="font-semibold">{t("search.quick.locationExample")}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{t("search.quick.locationDesc")}</div>
                                </div>
                            </Button>
                        </div>

                        {/* Plan Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("search.planComparison")}</CardTitle>
                                <CardDescription>{t("search.chooseRightPlan")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {Object.values(SUBSCRIPTION_TIERS).map((tier) => (
                                        <Card key={tier.id} className={
                                            tier.id === subscriptionTier.id
                                                ? 'border-primary ring-1 ring-primary'
                                                : ''
                                        }>
                                            <CardContent className="pt-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">{getPlanName(tier.id)}</h3>
                                                        {tier.id === subscriptionTier.id && (
                                                            <Badge>{t("search.current")}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${tier.searchFeatures.basicSearch ? 'bg-green-500' : 'bg-gray-300'
                                                                }`} />
                                                            <span className="text-sm">{t("search.feature.basicSearch")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${tier.searchFeatures.advancedFilters ? 'bg-green-500' : 'bg-gray-300'
                                                                }`} />
                                                            <span className="text-sm">{t("search.feature.advancedFilters")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${tier.searchFeatures.aiSearch ? 'bg-green-500' : 'bg-gray-300'
                                                                }`} />
                                                            <span className="text-sm">{t("search.feature.aiSearch")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${tier.searchFeatures.aiMatching ? 'bg-green-500' : 'bg-gray-300'
                                                                }`} />
                                                            <span className="text-sm">{t("search.feature.aiMatching")}</span>
                                                        </div>
                                                    </div>
                                                    <div className="pt-4 border-t">
                                                        <p className="text-sm text-muted-foreground">
                                                            {tier.limits.maxResults.toLocaleString()} {t("search.maxResults")}
                                                        </p>
                                                    </div>
                                                    {tier.id !== subscriptionTier.id && tier.id !== 'free-trial' && (
                                                        <Button
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => router.push("/dashboard/pricing")}
                                                        >
                                                            {t("search.upgradeTo")} {getPlanName(tier.id)}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search History */}
                {subscriptionTier.limits.searchHistoryDays > 0 && searchHistory.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-lg font-semibold mb-4">{t("search.recentSearches")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {searchHistory.slice(0, 6).map((history) => (
                                <Card key={history.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent
                                        className="p-4"
                                        onClick={() => {
                                            setSearchQuery(history.search_query)
                                            setSearchType(history.search_type)
                                            setTimeout(() => handleSearch(), 100)
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium truncate">{history.search_query}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {history.result_count} results • {formatDistanceToNow(new Date(history.searched_at), { addSuffix: true, locale: locale === 'ar' ? ar : enUS })}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upgrade Prompt */}
                {showUpgradePrompt && (
                    <UpgradePrompt
                        open={showUpgradePrompt}
                        onOpenChange={setShowUpgradePrompt}
                        requiredFeature={subscriptionTier.id === 'free-trial' ? 'basic_search' : 'advanced_search'}
                        currentPlan={subscriptionTier.id}
                    />
                )}
            </div>
        </DashboardLayout>
    )
}