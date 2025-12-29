"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MessageSquare, Calendar, User, Save, X } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"

interface Communication {
    id: string
    candidate_id: string
    type: "email" | "phone" | "meeting" | "note"
    subject: string
    content: string
    scheduled_for?: string
    status: "scheduled" | "completed" | "cancelled"
    created_at: string
    created_by: string
}

interface CandidateCommunicationProps {
    candidateId: string
    candidateName: string
}

export function CandidateCommunication({ candidateId, candidateName }: CandidateCommunicationProps) {
    const [communications, setCommunications] = useState<Communication[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        type: "email" as "email" | "phone" | "meeting" | "note",
        subject: "",
        content: "",
        scheduled_for: "",
    })

    const supabase = useSupabase()
    const { t, locale } = useI18n()
    const dateLocale = locale === 'ar' ? ar : enUS

    useEffect(() => {
        fetchCommunications()
    }, [candidateId])

    async function fetchCommunications() {
        try {
            const { data, error } = await supabase
                .from("communications")
                .select("*")
                .eq("candidate_id", candidateId)
                .order("created_at", { ascending: false })

            if (error) throw error
            setCommunications(data || [])
        } catch (error) {
            console.error("Error fetching communications:", error)
        } finally {
            setLoading(false)
        }
    }

    async function saveCommunication() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase.from("communications").insert({
                candidate_id: candidateId,
                user_id: user.id,
                type: formData.type,
                subject: formData.subject,
                content: formData.content,
                scheduled_for: formData.scheduled_for || null,
                status: formData.scheduled_for ? "scheduled" : "completed",
                created_at: new Date().toISOString(),
            })

            if (error) throw error

            // Update candidate's last_contacted field
            await supabase
                .from("candidates")
                .update({ last_contacted: new Date().toISOString() })
                .eq("id", candidateId)

            // Reset form and refresh
            setFormData({
                type: "email",
                subject: "",
                content: "",
                scheduled_for: "",
            })
            setShowForm(false)
            fetchCommunications()
        } catch (error) {
            console.error("Error saving communication:", error)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "email":
                return <Mail className="w-4 h-4" />
            case "phone":
                return <Phone className="w-4 h-4" />
            case "meeting":
                return <Calendar className="w-4 h-4" />
            default:
                return <MessageSquare className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "email":
                return t("communication.type.email")
            case "phone":
                return t("communication.type.phone")
            case "meeting":
                return t("communication.type.meeting")
            case "note":
                return t("communication.type.note")
            default:
                return type
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        {t("communication.history")}
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <MessageSquare className="me-2 h-4 w-4" />
                        {t("communication.log")}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {showForm && (
                    <div className="mb-6 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">{t("communication.logNew")}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t("communication.type")}</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">{t("communication.type.email")}</SelectItem>
                                        <SelectItem value="phone">{t("communication.type.phone")}</SelectItem>
                                        <SelectItem value="meeting">{t("communication.type.meeting")}</SelectItem>
                                        <SelectItem value="note">{t("communication.type.note")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("communication.subject")}</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder={t("communication.subjectPlaceholder")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t("communication.content")}</Label>
                                <Textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    placeholder={t("communication.contentPlaceholder")}
                                />
                            </div>

                            {formData.type === "meeting" && (
                                <div className="space-y-2">
                                    <Label>{t("communication.scheduledFor")}</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.scheduled_for}
                                        onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowForm(false)}>
                                    {t("communication.cancel")}
                                </Button>
                                <Button onClick={saveCommunication}>
                                    <Save className="me-2 h-4 w-4" />
                                    {t("communication.save")}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground">{t("communication.loading")}</p>
                    </div>
                ) : communications.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{t("communication.noLogs")}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {communications.map((comm) => (
                            <div key={comm.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(comm.type)}
                                        <span className="font-medium">{getTypeLabel(comm.type)}</span>
                                        {comm.status === "scheduled" && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                {t("communication.scheduled")}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(comm.created_at), "MMM d, yyyy h:mm a", { locale: dateLocale })}
                                    </span>
                                </div>

                                {comm.subject && (
                                    <h4 className="font-semibold mb-2">{comm.subject}</h4>
                                )}

                                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                                    {comm.content}
                                </p>

                                {comm.scheduled_for && (
                                    <div className="text-sm text-muted-foreground">
                                        <Calendar className="inline w-3 h-3 me-1" />
                                        {t("communication.scheduledAt")} {format(new Date(comm.scheduled_for), "MMM d, yyyy h:mm a", { locale: dateLocale })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}