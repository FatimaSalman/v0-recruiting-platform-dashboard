"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n-context"

interface AddCandidateFormProps {
  initialJobId?: string
}

export function AddCandidateForm({ initialJobId }: AddCandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    experience_years: "",
    location: "",
    skills: [] as string[],
    linkedin_url: "",
    portfolio_url: "",
    notes: "",
  })

  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error(t("auth.error"))

      const candidateData = {
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        title: formData.title || null,
        experience_years: formData.experience_years ? Number.parseInt(formData.experience_years) : null,
        location: formData.location || null,
        skills: formData.skills.length > 0 ? formData.skills : null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
        notes: formData.notes || null,
      }

      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert(candidateData)
        .select()
        .single()
      if (candidateError) throw candidateError

      // If initialJobId is provided, link candidate to the job
      if (initialJobId && candidate) {
        const { error: linkError } = await supabase.from("applications").insert({
          job_id: initialJobId,
          candidate_id: candidate.id,
          user_id: user.id,
          status: 'applied'
        })

        if (linkError) throw linkError
      }

      // Redirect to candidate detail page after successful addition
      router.push(initialJobId ? `/dashboard/jobs/${initialJobId}/candidates` :
        "/dashboard/candidates")

      // Alternatively, redirect to candidates list
      // router.push("/dashboard/candidates")
    } catch (err) {
      console.error("Error adding candidate:", err)
      setError(err instanceof Error ? err.message : t("auth.error"))
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t("back.to.candidates")}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("candidates.addNew")}</h1>
        <p className="text-muted-foreground">{t("candidates.form.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("candidates.form.infoTitle")}</CardTitle>
          <CardDescription>{t("candidates.form.infoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("candidates.form.fullName")} *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("candidates.form.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("candidates.form.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{t("candidates.form.jobTitle")}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">{t("candidates.form.experience")}</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t("candidates.form.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label htmlFor="skills">{t("candidates.form.skills")}</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder={t("candidates.form.skillPlaceholder")}
                />
                <Button type="button" onClick={addSkill} variant="outline" className="bg-transparent">
                  {t("candidates.form.add")}
                </Button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">{t("candidates.form.linkedin")}</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">{t("candidates.form.portfolio")}</Label>
                <Input
                  id="portfolio"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("candidates.form.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder={t("candidates.form.notesPlaceholder")}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? t("candidates.form.adding") : t("candidates.form.addBtn")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                {t("candidates.form.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
