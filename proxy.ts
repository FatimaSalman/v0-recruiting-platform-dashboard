// proxy.ts - Update this file
import { updateSession } from "@/lib/supabase/proxy"
import { createServerClient } from "@/lib/supabase/server"
import { checkAnalyticsAccess } from "@/lib/subscription-utils"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define analytics routes that require subscription
  const analyticsRoutes = [
    '/dashboard/reports',
    '/dashboard/analytics',
  ]

  // Check if current path is an analytics route
  const isAnalyticsRoute = analyticsRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If it's an analytics route, check subscription
  if (isAnalyticsRoute) {
    try {
      const supabase = await createServerClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check if user has access to analytics
      const hasAccess = await checkAnalyticsAccess(user.id)

      if (!hasAccess) {
        // Redirect to pricing page with upgrade prompt
        const redirectUrl = new URL('/dashboard/pricing', request.url)
        redirectUrl.searchParams.set('upgrade', 'analytics')
        redirectUrl.searchParams.set('feature', 'reports')

        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Analytics access check error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Continue with normal session update
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

// Helper for NextResponse (add this if not imported)
import { NextResponse } from 'next/server'