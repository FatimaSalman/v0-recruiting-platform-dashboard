import { createClient } from '@/lib/supabase/client'
import { PRICING_PLANS } from './products'

export async function checkInterviewAccess(userId: string): Promise<{
    canSchedule: boolean
    limit: number | null
    used: number
    remaining: number | null
    hasUnlimited: boolean
    needsUpgrade: boolean
}> {

    const supabase = createClient()

    try {
        // Get user's subscription
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

        let plan = PRICING_PLANS.find(p => p.id === 'free-trial') as any // Default to free trial
        if (subscription?.plan_id) {
            plan = PRICING_PLANS.find(p => p.id === subscription.plan_id) as any || plan
        }


        // Get interviews scheduled this month
        const now = new Date()
        const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))

        const firstDayNextMonth = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            1, 0, 0, 0, 0
        ))
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        console.log('📅 Counting interviews for month:')
        console.log('From:', firstDayOfMonth.toISOString())
        console.log('To (exclusive):', firstDayNextMonth.toISOString())


        const { count, error } = await supabase
            .from('interviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          //  .gte('scheduled_at', firstDayOfMonth.toISOString())
           // .lte('scheduled_at', firstDayNextMonth.toISOString())

        if (error) {
            console.error('Error counting interviews:', error)
            return {
                canSchedule: false,
                limit: plan?.limits.maxInterviewsPerMonth || 0,
                used: 0,
                remaining: plan?.limits.maxInterviewsPerMonth || 0,
                hasUnlimited: false,
                needsUpgrade: false
            }
        }

        // DEBUG: Also get all interviews to see what's being counted
        const { data: allInterviews } = await supabase
            .from('interviews')
            .select('id, scheduled_at, title')
            .eq('user_id', userId)
            .order('scheduled_at', { ascending: false })

        console.log('📋 All interviews for user:', allInterviews)
        console.log('🔢 Count for current month:', count)

        const usedCount = count || 0
        const maxInterviews = plan.limits.maxInterviewsPerMonth
        const hasUnlimited = plan.limits.hasUnlimitedInterviews || maxInterviews === null

        console.log('📊 Interview stats:', {
            userId,
            usedCount,
            maxInterviews,
            hasUnlimited,
            plan: plan?.name,
            firstDayOfMonth: firstDayOfMonth.toISOString(),
            firstDayNextMonth: firstDayNextMonth.toISOString()
        })

        const canSchedule = hasUnlimited || usedCount < (maxInterviews || 0)

        return {
            canSchedule,
            limit: maxInterviews,
            used: usedCount,
            remaining: hasUnlimited ? null : Math.max(0, (maxInterviews || 0) - usedCount),
            hasUnlimited,
            needsUpgrade: !canSchedule
        }
    } catch (error) {
        console.error('Error checking interview access:', error)
        return {
            canSchedule: false,
            limit: 0,
            used: 0,
            remaining: 0,
            hasUnlimited: false,
            needsUpgrade: true
        }
    }
}

export async function canScheduleInterview(userId: string): Promise<boolean> {
    const { canSchedule } = await checkInterviewAccess(userId)
    return canSchedule
}

export async function getInterviewStats(userId: string) {
    console.log(userId)
    return await checkInterviewAccess(userId)
}