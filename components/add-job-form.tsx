"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"

export function AddJobForm() {
  const router = useRouter()
  const supabase = useSupabase()
  const { t } = useI18n()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    location: "",
    employment_type: "",
    experience_level: "",
    salary_min: "",
    salary_max: "",
    status: "open",
  })

  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error("You must be logged in to create a job")
      }

      const jobData = {
        user_id: userData.user.id,
        title: formData.title,
        description: formData.description || null,
        department: formData.department || null,
        location: formData.location || null,
        employment_type: formData.employment_type || null,
        experience_level: formData.experience_level || null,
        salary_min: formData.salary_min ? Number.parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number.parseInt(formData.salary_max) : null,
        skills: skills.length > 0 ? skills : null,
        status: formData.status,
      }

      const { error: insertError } = await supabase.from("jobs").insert([jobData])

      if (insertError) throw insertError

      router.push("/dashboard/jobs")
    } catch (err: any) {
      setError(err.message || "Failed to create job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("jobs.form.backToJobs")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("jobs.form.createTitle")}</h1>
        <p className="text-muted-foreground">{t("jobs.form.createSubtitle")}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("jobs.form.basicInfo")}</CardTitle>
            <CardDescription>{t("jobs.form.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t("jobs.form.jobTitle")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("jobs.form.jobTitlePlaceholder")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("jobs.form.description")}</Label>
              <Textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("jobs.form.descriptionPlaceholder")}
              />
            </div>

            {/* Department and Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">{t("jobs.form.department")}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder={t("jobs.form.departmentPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t("jobs.form.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t("jobs.form.locationPlaceholder")}
                />
              </div>
            </div>

            {/* Employment Type and Experience Level */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment_type">{t("jobs.form.employmentType")}</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("jobs.form.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">{t("jobs.form.type.fullTime")}</SelectItem>
                    <SelectItem value="part-time">{t("jobs.form.type.partTime")}</SelectItem>
                    <SelectItem value="contract">{t("jobs.form.type.contract")}</SelectItem>
                    <SelectItem value="internship">{t("jobs.form.type.internship")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_level">{t("jobs.form.experienceLevel")}</Label>
                <Select
                  value={formData.experience_level}
                  onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("jobs.form.selectLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">{t("jobs.form.level.entry")}</SelectItem>
                    <SelectItem value="mid">{t("jobs.form.level.mid")}</SelectItem>
                    <SelectItem value="senior">{t("jobs.form.level.senior")}</SelectItem>
                    <SelectItem value="lead">{t("jobs.form.level.lead")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label>{t("jobs.form.salaryRange")}</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min" className="text-sm text-muted-foreground">
                    {t("jobs.form.minSalary")}
                  </Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max" className="text-sm text-muted-foreground">
                    {t("jobs.form.maxSalary")}
                  </Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label htmlFor="skills">{t("jobs.form.requiredSkills")}</Label>
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
                  placeholder={t("jobs.form.skillsPlaceholder")}
                />
                <Button type="button" onClick={handleAddSkill} variant="secondary">
                  {t("jobs.form.add")}
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">{t("jobs.form.status")}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("jobs.status.open")}</SelectItem>
                  <SelectItem value="closed">{t("jobs.status.closed")}</SelectItem>
                  <SelectItem value="draft">{t("jobs.status.draft")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/jobs">{t("jobs.form.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t("jobs.form.creating") : t("jobs.form.createJob")}
          </Button>
        </div>
      </form>
    </div>
  )
}
