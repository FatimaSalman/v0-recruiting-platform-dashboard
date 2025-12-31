import { createClient } from '@/lib/supabase/client'

export async function checkTeamPermissions(userId: string, action: string) {
    const supabase = createClient()

    // Get user's subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('max_team_members')
        .eq('user_id', userId)
        .single()

    // Get current active team member count
    const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

    const currentCount = (count || 0) + 1 // +1 for owner
    const maxTeamMembers = subscription?.max_team_members || 1

    return {
        canAddMember: currentCount < maxTeamMembers,
        currentCount,
        maxTeamMembers,
        availableSlots: maxTeamMembers - currentCount
    }
}

export async function getUserPermissions(userId: string, targetUserId?: string) {
    if (!targetUserId) {
        // Default permissions for account owner
        return {
            can_view_candidates: true,
            can_edit_candidates: true,
            can_view_jobs: true,
            can_edit_jobs: true,
            can_schedule_interviews: true,
            can_view_reports: true,
            can_manage_team: true
        }
    }

    // Check if target user is a team member
    const supabase = createClient()
    const { data: member } = await supabase
        .from('team_members')
        .select('permissions, role')
        .eq('user_id', userId)
        .eq('email', targetUserId) // Assuming targetUserId is email for now
        .single()

    return member?.permissions || {
        can_view_candidates: false,
        can_edit_candidates: false,
        can_view_jobs: false,
        can_edit_jobs: false,
        can_schedule_interviews: false,
        can_view_reports: false,
        can_manage_team: false
    }
}