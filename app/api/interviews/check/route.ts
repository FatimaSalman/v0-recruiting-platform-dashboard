// app/api/interviews/check/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkInterviewAccess } from '@/lib/interview-utils'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const access = await checkInterviewAccess(user.id)

        return NextResponse.json(access)
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}