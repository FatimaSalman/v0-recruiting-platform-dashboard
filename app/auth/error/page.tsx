import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="w-5 h-5" />
                <CardTitle className="text-2xl">Authentication Error</CardTitle>
              </div>
              <CardDescription>Something went wrong during the authentication process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-destructive font-medium mb-1">Error Details:</p>
                  <p className="text-sm text-muted-foreground">{decodeURIComponent(params.error)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Common issues:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Google OAuth is not enabled in Supabase Dashboard</li>
                  <li>Invalid OAuth credentials</li>
                  <li>Redirect URL mismatch</li>
                </ul>
              </div>

              <Button asChild className="w-full">
                <Link href="/auth/login">Try Again</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
