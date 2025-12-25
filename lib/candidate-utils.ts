"use client"

import { createClient } from "@/lib/supabase/client"

export interface CandidateImportData {
    status: string
    name: string
    email: string
    phone?: string
    title?: string
    experience_years?: number
    location?: string
    skills?: string[]
    resume_url?: string
    linkedin_url?: string
    portfolio_url?: string
    notes?: string
    current_salary?: number
    expected_salary?: number
    notice_period?: number
    availability?: string
    tags?: string[]
}

export async function importCandidates(
    candidates: CandidateImportData[],
    userId: string
): Promise<{ success: number; errors: string[] }> {
    const supabase = createClient()
    const errors: string[] = []
    let successCount = 0

    for (const candidate of candidates) {
        try {
            const { error } = await supabase.from("candidates").insert({
                user_id: userId,
                ...candidate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })

            if (error) {
                errors.push(`Failed to import ${candidate.name}: ${error.message}`)
            } else {
                successCount++
            }
        } catch (err) {
            errors.push(`Failed to import ${candidate.name}: ${err}`)
        }
    }

    return { success: successCount, errors }
}

export async function exportCandidates(userId: string): Promise<CandidateImportData[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error exporting candidates:", error)
        return []
    }

    return data.map((candidate) => ({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || undefined,
        title: candidate.title || undefined,
        experience_years: candidate.experience_years || undefined,
        location: candidate.location || undefined,
        skills: candidate.skills || undefined,
        resume_url: candidate.resume_url || undefined,
        linkedin_url: candidate.linkedin_url || undefined,
        portfolio_url: candidate.portfolio_url || undefined,
        notes: candidate.notes || undefined,
        current_salary: candidate.current_salary || undefined,
        expected_salary: candidate.expected_salary || undefined,
        notice_period: candidate.notice_period || undefined,
        availability: candidate.availability || undefined,
        tags: candidate.tags || undefined,
        status: candidate.status || undefined,
    }))
}