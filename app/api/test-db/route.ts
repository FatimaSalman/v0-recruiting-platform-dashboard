// app/api/test-db/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Test connection
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    console.log('Profiles test:', profilesError ? profilesError.message : 'Success')
    
    // Test subscription insert
    const testData = {
      user_id: '79babca8-1bef-47d0-b15b-d1d142469566',
      plan_id: 'professional-monthly',
      status: 'active',
      stripe_customer_id: 'cus_ThVw6z3AQd5AND',
      stripe_subscription_id: 'test-sub'
    }
    
    const { data: insertTest, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testData)
      .select()
    
    console.log('Insert test:', insertError ? insertError.message : 'Success')
    
    return NextResponse.json({
      profiles: profilesError ? profilesError.message : 'Connected',
      insert: insertError ? insertError.message : 'Success',
      envVars: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}