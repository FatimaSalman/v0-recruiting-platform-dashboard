// app/api/user/subscription/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/subscription-utils'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        const subscription = await getUserSubscription(userId)

        return NextResponse.json(subscription)
    } catch (error) {
        console.error('Subscription API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}