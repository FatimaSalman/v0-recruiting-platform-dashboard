"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n-context"
import { useEffect, useState } from "react"

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label={t("language.toggle")}>
        <Languages className="w-5 h-5" />
        <span className="sr-only">{t("language.toggle")}</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language.toggle")}>
          <Languages className="w-5 h-5" />
          <span className="sr-only">{t("language.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")} className={locale === "en" ? "bg-accent" : ""}>
          {t("language.english")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("ar")} className={locale === "ar" ? "bg-accent" : ""}>
          {t("language.arabic")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
