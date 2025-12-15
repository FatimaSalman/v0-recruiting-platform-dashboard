import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`)
      }

      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (err) {
      return NextResponse.redirect(`${origin}/auth/error?error=unexpected_error`)
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
