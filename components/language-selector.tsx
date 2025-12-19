// components/language-selector.tsx
"use client"

import { useI18n } from "@/lib/i18n-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LanguageSelectorProps {
    className?: string
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
    const { locale, setLocale } = useI18n()

    return (
        <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "ar")}>
            <SelectTrigger className={className}>
                <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
            </SelectContent>
        </Select>
    )
}