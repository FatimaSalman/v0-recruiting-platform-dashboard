"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"
import { use } from "react"

export default function ErrorPage({ searchParams }: {
  searchParams: Promise<{ error: string }>
}) {
  const { error } = use(searchParams)
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2 text-start">
                <AlertCircle className="w-5 h-5" />
                <CardTitle className="text-2xl">{t("auth.title")}</CardTitle>
              </div>
              <CardDescription className="text-start">{t("auth.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-destructive font-medium mb-1 text-start">{t("auth.errorDetails")}</p>
                  <p className="text-sm text-muted-foreground text-start">{decodeURIComponent(error)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-start">{t("auth.unspecified")}</p>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-start">{t("auth.commonIssues")}</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside text-start">
                  <li>{t("auth.issues1")}</li>
                  <li>{t("auth.issues2")}</li>
                  <li>{t("auth.issues3")}</li>

                </ul>
              </div>

              <Button asChild className="w-full">
                <Link href="/auth/login">{t("auth.tryAgain")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
