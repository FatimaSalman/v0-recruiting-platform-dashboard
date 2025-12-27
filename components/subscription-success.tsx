"use client"

import { CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"

export function SubscriptionSuccess() {
    const [show, setShow] = useState(true)
    const { t } = useI18n()
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false)
        }, 5000) // Hide after 5 seconds

        return () => clearTimeout(timer)
    }, [])

    if (!show) return null

    return (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-green-800 dark:text-green-300">
                            {t("subscription.success.title")}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            {t("subscription.success.message")}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => setShow(false)}
                    >
                        {t("subscription.success.dismiss")}
                    </Button>
                </div>
            </div>
        </Card>
    )
}