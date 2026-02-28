import { ParsedCandidate } from './parse-candidates'

export interface N8NScreeningResult {
  email: string
  match_score: number
  decision: 'Shortlist' | 'Reject'
  matching_skills: string[]
  missing_skills: string[]
  ai_summary: string
  score_breakdown: {
    [key: string]: number | string
  }
}

export interface MergedCandidate extends ParsedCandidate {
  match_score: number
  decision: 'Shortlist' | 'Reject' | ''
  matching_skills: string[]
  missing_skills: string[]
  ai_summary: string
  score_breakdown: string
  screened_date: string
  rank?: number
}

/**
 * Send candidates to n8n for screening
 */
export async function sendToN8N(
  candidates: ParsedCandidate[],
  jobDescription: string
): Promise<N8NScreeningResult[]> {
  const response = await fetch(
    'https://visitshannu.app.n8n.cloud/webhook-test/screen-candidates',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription, candidates }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message ||
      `Failed to screen candidates (HTTP ${response.status}). Make sure your N8N workflow is active.`
    )
  }

  const data = await response.json()

  // Handle: [{ scoredCandidates: [...] }]
  if (Array.isArray(data) && data[0]?.scoredCandidates) {
    return data[0].scoredCandidates
  }
  // Handle: { scoredCandidates: [...] }
  if (data?.scoredCandidates) {
    return data.scoredCandidates
  }
  // Handle flat array
  return Array.isArray(data) ? data : data.candidates || data.results || []
}

/**
 * Merge n8n results with original candidates by email
 */
export function mergeCandidatesWithResults(
  originalCandidates: ParsedCandidate[],
  screeningResults: any[]
): MergedCandidate[] {
  const today = new Date().toISOString().split('T')[0]

  // Merge BY INDEX since N8N returns null for candidate_email
  const merged = originalCandidates.map((candidate, index) => {
    const result = screeningResults[index]

    const matchingSkills = result?.matching_skills
      ? typeof result.matching_skills === 'string'
        ? result.matching_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : result.matching_skills
      : []

    const missingSkills = result?.missing_skills
      ? typeof result.missing_skills === 'string'
        ? result.missing_skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : result.missing_skills
      : []

    return {
      ...candidate,
      match_score: result?.match_score ?? 0,
      decision: result?.decision ?? '',
      matching_skills: matchingSkills,
      missing_skills: missingSkills,
      ai_summary: result?.ai_summary ?? '',
      score_breakdown: JSON.stringify(result?.score_breakdown ?? {}),
      screened_date: result ? today : '',
    }
  })

  return merged
    .sort((a, b) => b.match_score - a.match_score)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
}

/**
 * Get top stats from merged candidates
 */
export function getTopStats(candidates: MergedCandidate[]) {
  const total = candidates.length
  const shortlisted = candidates.filter((c) => c.decision === 'Shortlist').length
  const rejected = candidates.filter((c) => c.decision === 'Reject').length
  const avgScore =
    candidates.reduce((sum, c) => sum + c.match_score, 0) / Math.max(total, 1)

  return {
    total,
    shortlisted,
    rejected,
    avgScore: Math.round(avgScore),
  }
}
