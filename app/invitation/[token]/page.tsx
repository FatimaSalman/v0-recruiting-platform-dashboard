"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/lib/supabase/supabase-provider'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface InvitationData {
    id: string
    email: string
    role: string
    status: string
    invited_by: string
    invited_at: string
    user_id: string
    team_owner_email?: string // We'll fetch this separately
}

export default function InvitationPage() {
    const [loading, setLoading] = useState(true)
    const [invitation, setInvitation] = useState<InvitationData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [teamOwnerEmail, setTeamOwnerEmail] = useState<string>('')
    const params = useParams()
    const router = useRouter()
    const supabase = useSupabase()
    const token = params.token as string

    useEffect(() => {
        verifyInvitation()
    }, [token])

    async function verifyInvitation() {
        try {
            setLoading(true)

            // Decode invitation token (you'll need to implement this)
            // For now, we'll assume token contains the invitation ID
            let invitationId = token

            // If token is base64 encoded, decode it
            if (token.includes('.') || /^[A-Za-z0-9+/]+=*$/.test(token)) {
                try {
                    invitationId = atob(token)
                } catch (e) {
                    // Not base64, use as-is
                }
            }

            // Get invitation details
            const { data: invitation, error: inviteError } = await supabase
                .from('team_members')
                .select('*')
                .eq('id', invitationId)
                .single()

            if (inviteError || !invitation) {
                setError('Invalid or expired invitation')
                return
            }

            if (invitation.status !== 'pending') {
                setError('This invitation has already been processed')
                return
            }

            setInvitation(invitation)

            // Get team owner email
            const { data: ownerData } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', invitation.user_id)
                .single()

            setTeamOwnerEmail(ownerData?.email || 'the team owner')

        } catch (error) {
            console.error('Error verifying invitation:', error)
            setError('Failed to verify invitation')
        } finally {
            setLoading(false)
        }

    }

    async function acceptInvitation() {
        if (!invitation) return

        try {
            setLoading(true)

            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Redirect to login with email pre-filled
                router.push(`/auth/login?email=${encodeURIComponent(invitation.email)}&invitation=${token}`)
                return
            }

            // Verify logged in user email matches invitation email
            if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
                setError(`Please log in with ${invitation.email} to accept this invitation`)
                setLoading(false)
                return
            }

            // Update invitation status
            const { error } = await supabase
                .from('team_members')
                .update({
                    status: 'active',
                    joined_at: new Date().toISOString()
                })
                .eq('id', invitation.id)

            if (error) throw error

            setSuccess(true)

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)

        } catch (error) {
            console.error('Error accepting invitation:', error)
            setError('Failed to accept invitation')
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p>Verifying invitation...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Invalid Invitation
                        </CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" asChild>
                            <a href="/auth/login">Go to Login</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-green-600 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Invitation Accepted!
                        </CardTitle>
                        <CardDescription>
                            You have successfully joined the team. Redirecting to dashboard...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }
    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>No Invitation Found</CardTitle>
                        <CardDescription>The invitation link is invalid or has expired.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" asChild>
                            <a href="/">Return to Home</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Team Invitation
                    </CardTitle>
                    <CardDescription>
                        You've been invited to join a team on TalentHub
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">To accept this invitation:</p>
                        <Button className="w-full mb-2" asChild>
                            <a href={`/auth/login?email=${encodeURIComponent('invitation.email')}`}>
                                Log in with {invitation.email}
                            </a>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <a href="/auth/sign-up">Create new account</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}