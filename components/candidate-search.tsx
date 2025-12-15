"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CandidateCard } from "@/components/candidate-card"

interface Candidate {
  id: string
  name: string
  title: string
  experience: string
  location: string
  skills: string[]
  matchScore: number
  avatar: string
  email: string
}

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    title: "Senior Civil Engineer",
    experience: "12 years",
    location: "San Francisco, CA",
    skills: ["Structural Design", "AutoCAD", "Project Management", "LEED Certified"],
    matchScore: 95,
    avatar: "/professional-woman-diverse.png",
    email: "sarah.mitchell@email.com",
  },
  {
    id: "2",
    name: "Michael Chen",
    title: "Civil Engineering Manager",
    experience: "15 years",
    location: "Austin, TX",
    skills: ["Infrastructure", "Team Leadership", "Civil 3D", "Cost Estimation"],
    matchScore: 92,
    avatar: "/professional-man.jpg",
    email: "michael.chen@email.com",
  },
  {
    id: "3",
    name: "Jennifer Rodriguez",
    title: "Lead Civil Engineer",
    experience: "11 years",
    location: "Denver, CO",
    skills: ["Transportation", "Surveying", "Hydraulics", "BIM"],
    matchScore: 88,
    avatar: "/professional-woman-2.png",
    email: "jennifer.rodriguez@email.com",
  },
  {
    id: "4",
    name: "David Park",
    title: "Senior Civil Engineer",
    experience: "13 years",
    location: "Seattle, WA",
    skills: ["Geotechnical", "Site Development", "Environmental", "Permitting"],
    matchScore: 85,
    avatar: "/professional-man-2.png",
    email: "david.park@email.com",
  },
  {
    id: "5",
    name: "Amanda Johnson",
    title: "Civil Engineer III",
    experience: "10 years",
    location: "Portland, OR",
    skills: ["Water Resources", "Stormwater", "Site Planning", "GIS"],
    matchScore: 82,
    avatar: "/professional-woman-3.png",
    email: "amanda.johnson@email.com",
  },
  {
    id: "6",
    name: "Robert Taylor",
    title: "Principal Civil Engineer",
    experience: "18 years",
    location: "Phoenix, AZ",
    skills: ["Land Development", "Urban Planning", "Regulatory Compliance", "Quality Control"],
    matchScore: 79,
    avatar: "/professional-man-3.png",
    email: "robert.taylor@email.com",
  },
]

export function CandidateSearch() {
  const [searchQuery, setSearchQuery] = useState("Find me civil engineers with 10+ years experience")
  const [candidates] = useState<Candidate[]>(mockCandidates)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Candidate Search</h1>
        <p className="text-muted-foreground">Find the perfect candidates with AI-powered matching</p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Describe the candidate you're looking for..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-32 h-14 text-base"
          />
          <Button className="absolute right-2 top-1/2 -translate-y-1/2" size="lg">
            Search
          </Button>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{candidates.length} Candidates Found</h2>
          <p className="text-sm text-muted-foreground mt-1">Sorted by match score</p>
        </div>
      </div>

      {/* Candidate cards */}
      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  )
}
