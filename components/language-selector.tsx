// components/language-selector.tsx
"use client"

import { useI18n } from "@/lib/i18n-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LanguageSelectorProps {
    className?: string
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
    const { locale, setLocale, t } = useI18n()

    return (
        <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "ar")}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={t("language.select")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">{t("language.english")}</SelectItem>
                <SelectItem value="ar">{t("language.arabic")}</SelectItem>
            </SelectContent>
        </Select>
    )
}