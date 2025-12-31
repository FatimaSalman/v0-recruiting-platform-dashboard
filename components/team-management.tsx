"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Users,
    Mail,
    UserPlus,
    UserCheck,
    UserX,
    Shield,
    MoreVertical,
    Copy,
    Send
} from "lucide-react"
import { useI18n } from "@/lib/i18n-context"
import { toast } from "@/components/ui/use-toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface TeamMember {
    id: string
    email: string
    role: 'owner' | 'admin' | 'member'
    status: 'pending' | 'active' | 'inactive'
    invited_by: string
    invited_at: string
    joined_at: string | null
    permissions: any
}

interface TeamLimits {
    maxTeamMembers: number
    currentCount: number
}

export function TeamManagement() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<'admin' | 'member'>('member')
    const [teamLimits, setTeamLimits] = useState<TeamLimits>({ maxTeamMembers: 1, currentCount: 1 })
    const [showInviteDialog, setShowInviteDialog] = useState(false)

    const supabase = useSupabase()
    const { t } = useI18n()

    useEffect(() => {
        fetchTeamMembers()
        fetchTeamLimits()
    }, [])

    async function fetchTeamMembers() {
        try {
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            setTeamMembers(data || [])
        } catch (error) {
            console.error('Error fetching team members:', error)
            toast({
                title: "Error",
                description: "Failed to load team members",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    async function fetchTeamLimits() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user's subscription
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('max_team_members')
                .eq('user_id', user.id)
                .single()

            // Get current team member count
            const { count } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'active')

            setTeamLimits({
                maxTeamMembers: subscription?.max_team_members || 1,
                currentCount: (count || 0) + 1 // +1 for the owner
            })
        } catch (error) {
            console.error('Error fetching team limits:', error)
        }
    }

    async function inviteTeamMember() {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email address",
                variant: "destructive"
            })
            return
        }

        // Check if reached team limit
        if (teamLimits.currentCount >= teamLimits.maxTeamMembers) {
            toast({
                title: "Team limit reached",
                description: `Your current plan allows up to ${teamLimits.maxTeamMembers} team members`,
                variant: "destructive"
            })
            return
        }

        setInviting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Check if email already invited
            const { data: existing } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', user.id)
                .eq('email', email)
                .single()

            if (existing) {
                toast({
                    title: "Already invited",
                    description: "This email has already been invited to your team",
                    variant: "destructive"
                })
                return
            }

            // Create invitation
            const { error } = await supabase
                .from('team_members')
                .insert({
                    user_id: user.id,
                    email: email.toLowerCase(),
                    role: role,
                    status: 'pending',
                    invited_by: user.id,
                    permissions: {
                        can_view_candidates: true,
                        can_edit_candidates: role === 'admin',
                        can_view_jobs: true,
                        can_edit_jobs: role === 'admin',
                        can_schedule_interviews: true,
                        can_view_reports: role === 'admin'
                    }
                })

            if (error) throw error

            // Send invitation email (you'll need to implement this)
            await sendInvitationEmail(email, user.email!, role)

            toast({
                title: "Invitation sent",
                description: `Invitation sent to ${email}`,
            })

            setEmail("")
            setRole('member')
            setShowInviteDialog(false)
            fetchTeamMembers()
            fetchTeamLimits()

        } catch (error) {
            console.error('Error inviting team member:', error)
            toast({
                title: "Error",
                description: "Failed to send invitation",
                variant: "destructive"
            })
        } finally {
            setInviting(false)
        }
    }

    async function sendInvitationEmail(toEmail: string, fromEmail: string, role: string) {
        // Implement email sending using your preferred service
        // You can use Resend, SendGrid, etc.
        console.log(`Sending invitation to ${toEmail} from ${fromEmail} as ${role}`)

        // For now, log it. You'll need to implement actual email sending
        // Example with Resend:
        // await resend.emails.send({
        //   from: 'TalentHub <team@talenthub.com>',
        //   to: toEmail,
        //   subject: `You've been invited to join a team on TalentHub`,
        //   html: `<p>You've been invited by ${fromEmail} to join their team as a ${role}.</p>`
        // })
    }

    async function resendInvitation(memberId: string, email: string) {
        try {
            // Update invited_at timestamp
            const { error } = await supabase
                .from('team_members')
                .update({ invited_at: new Date().toISOString() })
                .eq('id', memberId)

            if (error) throw error

            // Send invitation email again
            const { data: { user } } = await supabase.auth.getUser()
            await sendInvitationEmail(email, user!.email!, 'member')

            toast({
                title: "Invitation resent",
                description: `Invitation resent to ${email}`,
            })
        } catch (error) {
            console.error('Error resending invitation:', error)
            toast({
                title: "Error",
                description: "Failed to resend invitation",
                variant: "destructive"
            })
        }
    }

    async function removeTeamMember(memberId: string) {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error

            toast({
                title: "Member removed",
                description: "Team member has been removed",
            })

            fetchTeamMembers()
            fetchTeamLimits()
        } catch (error) {
            console.error('Error removing team member:', error)
            toast({
                title: "Error",
                description: "Failed to remove team member",
                variant: "destructive"
            })
        }
    }

    async function updateTeamMemberRole(memberId: string, newRole: string) {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({
                    role: newRole,
                    permissions: {
                        can_view_candidates: true,
                        can_edit_candidates: newRole === 'admin',
                        can_view_jobs: true,
                        can_edit_jobs: newRole === 'admin',
                        can_schedule_interviews: true,
                        can_view_reports: newRole === 'admin'
                    }
                })
                .eq('id', memberId)

            if (error) throw error

            toast({
                title: "Role updated",
                description: "Team member role has been updated",
            })

            fetchTeamMembers()
        } catch (error) {
            console.error('Error updating role:', error)
            toast({
                title: "Error",
                description: "Failed to update role",
                variant: "destructive"
            })
        }
    }

    function getRoleBadge(role: string) {
        switch (role) {
            case 'owner':
                return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Owner</Badge>
            case 'admin':
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Admin</Badge>
            case 'member':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Member</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
            case 'inactive':
                return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Inactive</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const availableSlots = teamLimits.maxTeamMembers - teamLimits.currentCount

    return (
        <div className="space-y-6">
            {/* Team Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Management
                    </CardTitle>
                    <CardDescription>
                        Manage your team members and permissions. Your plan supports up to {teamLimits.maxTeamMembers} team members.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{teamLimits.currentCount}</div>
                            <div className="text-sm text-muted-foreground">Current Members</div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{teamLimits.maxTeamMembers}</div>
                            <div className="text-sm text-muted-foreground">Plan Limit</div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{availableSlots}</div>
                            <div className="text-sm text-muted-foreground">Available Slots</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invite Team Member */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Invite Team Member
                    </CardTitle>
                    <CardDescription>
                        Invite colleagues to collaborate on your recruitment efforts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {availableSlots <= 0 ? (
                        <div className="text-center py-6">
                            <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">Team Limit Reached</h3>
                            <p className="text-muted-foreground mb-4">
                                Your current plan allows up to {teamLimits.maxTeamMembers} team members.
                                Upgrade your plan to add more team members.
                            </p>
                            <Button asChild>
                                <a href="/dashboard/pricing">Upgrade Plan</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Role</Label>
                                    <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="member">Member</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Permissions for {role}:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        View candidates and jobs
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" />
                                        Schedule interviews
                                    </li>
                                    {role === 'admin' && (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                Edit candidates and jobs
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-500" />
                                                View analytics and reports
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <Button
                                onClick={inviteTeamMember}
                                disabled={inviting || !email}
                                className="w-full"
                            >
                                <Send className="me-2 h-4 w-4" />
                                {inviting ? "Sending Invitation..." : "Send Invitation"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Members ({teamMembers.length + 1})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground mt-4">Loading team members...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Owner (current user) */}
                            <div className="border rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">You</span>
                                            {getRoleBadge('owner')}
                                            {getStatusBadge('active')}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Account Owner</p>
                                    </div>
                                </div>
                                <Badge variant="outline">Full Access</Badge>
                            </div>

                            {/* Team members */}
                            {teamMembers.map((member) => (
                                <div key={member.id} className="border rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{member.email}</span>
                                                {getRoleBadge(member.role)}
                                                {getStatusBadge(member.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {member.status === 'pending' && (
                                                    <>
                                                        <span>Invited {new Date(member.invited_at).toLocaleDateString()}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => resendInvitation(member.id, member.email)}
                                                            className="h-6"
                                                        >
                                                            Resend
                                                        </Button>
                                                    </>
                                                )}
                                                {member.status === 'active' && member.joined_at && (
                                                    <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.status === 'pending' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(member.email)}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => updateTeamMemberRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                                >
                                                    {member.role === 'admin' ? 'Make Member' : 'Make Admin'}
                                                </DropdownMenuItem>
                                                {member.status === 'pending' && (
                                                    <DropdownMenuItem
                                                        onClick={() => resendInvitation(member.id, member.email)}
                                                    >
                                                        Resend Invitation
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => removeTeamMember(member.id)}
                                                    className="text-red-600"
                                                >
                                                    Remove from Team
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {teamMembers.length === 0 && (
                                <div className="text-center py-8">
                                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                                    <p className="text-muted-foreground">
                                        Invite colleagues to collaborate on your recruitment efforts.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast({
        title: "Copied",
        description: "Email address copied to clipboard",
    })
}

// Add this Check component if not already available
function Check({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}