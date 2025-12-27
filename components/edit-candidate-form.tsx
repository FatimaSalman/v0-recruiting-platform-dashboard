// components/edit-candidate-form.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, Loader2, Save, User, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, FileText, Linkedin, Globe, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditCandidateFormProps {
    candidateId: string
}

export function EditCandidateForm({ candidateId }: EditCandidateFormProps) {
    const router = useRouter()
    const supabase = useSupabase()
    const { t } = useI18n()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        title: "",
        experience_years: "",
        location: "",
        current_salary: "",
        expected_salary: "",
        notice_period: "",
        status: "active",
        availability: "immediate",
        skills: [] as string[],
        linkedin_url: "",
        portfolio_url: "",
        resume_url: "",
        notes: "",
    })

    const [skillInput, setSkillInput] = useState("")
    const [resumeFile, setResumeFile] = useState<File | null>(null)

    useEffect(() => {
        fetchCandidate()
    }, [candidateId])

    async function fetchCandidate() {
        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from("candidates")
                .select("*")
                .eq("id", candidateId)
                .single()

            if (fetchError) throw fetchError

            if (data) {
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    title: data.title || "",
                    experience_years: data.experience_years?.toString() || "",
                    location: data.location || "",
                    current_salary: data.current_salary?.toString() || "",
                    expected_salary: data.expected_salary?.toString() || "",
                    notice_period: data.notice_period?.toString() || "",
                    status: data.status || "active",
                    availability: data.availability || "immediate",
                    skills: data.skills || [],
                    linkedin_url: data.linkedin_url || "",
                    portfolio_url: data.portfolio_url || "",
                    resume_url: data.resume_url || "",
                    notes: data.notes || "",
                })
            }
        } catch (err: any) {
            console.error("Error fetching candidate:", err)
            setError(err.message || t("editCandidate.error.load"))
        } finally {
            setLoading(false)
        }
    }

    const handleAddSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, skillInput.trim()],
            })
            setSkillInput("")
        }
    }

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter((skill) => skill !== skillToRemove),
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0])
        }
    }

    async function uploadResume() {
        if (!resumeFile) return null

        try {
            const fileExt = resumeFile.name.split(".").pop()
            const fileName = `${candidateId}-${Date.now()}.${fileExt}`
            const filePath = `resumes/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from("candidate-resumes")
                .upload(filePath, resumeFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from("candidate-resumes")
                .getPublicUrl(filePath)

            return publicUrl
        } catch (err) {
            console.error("Error uploading resume:", err)
            throw err
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(null)

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not authenticated")

            // 2. Upload resume if new file selected
            let finalResumeUrl: string | null = formData.resume_url // Use a different variable name
            if (resumeFile) {
                finalResumeUrl = await uploadResume()
            }

            // 3. Prepare update data
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                title: formData.title || null,
                experience_years: formData.experience_years ? Number.parseInt(formData.experience_years) : null,
                location: formData.location || null,
                current_salary: formData.current_salary ? Number.parseInt(formData.current_salary) : null,
                expected_salary: formData.expected_salary ? Number.parseInt(formData.expected_salary) : null,
                notice_period: formData.notice_period ? Number.parseInt(formData.notice_period) : null,
                status: formData.status,
                availability: formData.availability,
                skills: formData.skills.length > 0 ? formData.skills : null,
                linkedin_url: formData.linkedin_url || null,
                portfolio_url: formData.portfolio_url || null,
                resume_url: finalResumeUrl || null,
                notes: formData.notes || null,
                updated_at: new Date().toISOString(),
            }

            // 4. Update candidate in database
            const { error: updateError } = await supabase
                .from("candidates")
                .update(updateData)
                .eq("id", candidateId)
                .eq("user_id", user.id) // Security check

            if (updateError) throw updateError

            setSuccess(t("editCandidate.success"))

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push(`/dashboard/candidates/${candidateId}`)
            }, 2000)

        } catch (err: any) {
            console.error("Error updating candidate:", err)
            setError(err.message || t("editCandidate.error.update"))
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">{t("editCandidate.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href={`/dashboard/candidates/${candidateId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("editCandidate.backToProfile")}
                    </Link>
                </Button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t("editCandidate.title")}</h1>
                        <p className="text-muted-foreground">{t("editCandidate.subtitle")}</p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                {t("editCandidate.personalInfo")}
                            </CardTitle>
                            <CardDescription>{t("editCandidate.personalInfoDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t("candidates.form.fullName")} <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        {t("candidates.form.email")} <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t("editCandidate.phone")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">{t("candidates.form.location")}</Label>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="San Francisco, CA"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Professional Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                {t("editCandidate.professionalInfo")}
                            </CardTitle>
                            <CardDescription>{t("editCandidate.professionalInfoDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">{t("candidates.form.jobTitle")}</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Senior Software Engineer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience_years">{t("candidates.form.experience")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="experience_years"
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={formData.experience_years}
                                            onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                                            placeholder="5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_salary">{t("editCandidate.currentSalary")}</Label>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="current_salary"
                                            type="number"
                                            min="0"
                                            value={formData.current_salary}
                                            onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })}
                                            placeholder="120000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expected_salary">{t("editCandidate.expectedSalary")}</Label>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="expected_salary"
                                            type="number"
                                            min="0"
                                            value={formData.expected_salary}
                                            onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                                            placeholder="140000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Availability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                {t("editCandidate.statusAvailability")}
                            </CardTitle>
                            <CardDescription>{t("editCandidate.statusAvailabilityDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">{t("editCandidate.candidateStatus")}</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">{t("status.active")}</SelectItem>
                                            <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
                                            <SelectItem value="placed">{t("status.placed")}</SelectItem>
                                            <SelectItem value="withdrawn">{t("status.withdrawn")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="availability">{t("availability")}</Label>
                                    <Select
                                        value={formData.availability}
                                        onValueChange={(value) => setFormData({ ...formData, availability: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="immediate">{t("availability.immediate")}</SelectItem>
                                            <SelectItem value="2-weeks">{t("availability.2-weeks")}</SelectItem>
                                            <SelectItem value="1-month">{t("availability.1-month")}</SelectItem>
                                            <SelectItem value="3-months">{t("availability.3-month")}</SelectItem>
                                            <SelectItem value="not-available">{t("availability.not-available")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notice_period">{t("editCandidate.noticePeriod")}</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="notice_period"
                                        type="number"
                                        min="0"
                                        max="180"
                                        value={formData.notice_period}
                                        onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                                        placeholder="30"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("editCandidate.skillsExpertise")}</CardTitle>
                            <CardDescription>{t("editCandidate.skillsExpertiseDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="skills">{t("editCandidate.addSkills")}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="skills"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleAddSkill()
                                            }
                                        }}
                                        placeholder={t("candidates.form.skillPlaceholder")}
                                    />
                                    <Button type="button" onClick={handleAddSkill} variant="secondary">
                                        {t("candidates.form.add")}
                                    </Button>
                                </div>
                            </div>

                            {formData.skills.length > 0 && (
                                <div className="space-y-2">
                                    <Label>{t("editCandidate.currentSkills")}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="text-sm gap-1">
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="ml-1 hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Links & Attachments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                {t("editCandidate.linksAttachments")}
                            </CardTitle>
                            <CardDescription>{t("editCandidate.linksAttachmentsDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin_url">{t("editCandidate.linkedin")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="linkedin_url"
                                            type="url"
                                            value={formData.linkedin_url}
                                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="portfolio_url">{t("editCandidate.portfolio")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="portfolio_url"
                                            type="url"
                                            value={formData.portfolio_url}
                                            onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                                            placeholder="https://portfolio.example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resume">{t("editCandidate.resume")}</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input
                                            id="resume"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t("editCandidate.resumeDesc")}
                                        </p>
                                    </div>
                                    {formData.resume_url && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a href={formData.resume_url} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />
                                                {t("editCandidate.viewResume")}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("editCandidate.additionalNotes")}</CardTitle>
                            <CardDescription>{t("editCandidate.additionalNotesDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={6}
                                placeholder={t("editCandidate.notesPlaceholder")}
                                className="resize-none"
                            />
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/candidates/${candidateId}`)}
                            disabled={saving}
                        >
                            {t("candidates.form.cancel")}
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("settings.saving")}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {t("settings.save")}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}