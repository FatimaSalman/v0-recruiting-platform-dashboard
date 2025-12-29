"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LanguageToggle } from "@/components/language-toggle"
import { useI18n } from "@/lib/i18n-context"

export default function SignUpSuccessPage() {
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
              <CardTitle className="text-2xl text-start">{t("auth.signUpSuccess.title")}</CardTitle>
              <CardDescription className="text-start">{t("auth.signUpSuccess.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-start">
                {t("auth.signUpSuccess.content")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
