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
    'https://visitshannu.app.n8n.cloud/webhook/screen-candidates',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription,
        candidates,
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to send candidates to n8n')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.candidates || data.results || []
}

/**
 * Merge n8n results with original candidates by email
 */
export function mergeCandidatesWithResults(
  originalCandidates: ParsedCandidate[],
  screeningResults: N8NScreeningResult[]
): MergedCandidate[] {
  const resultsMap = new Map(
    screeningResults.map((r) => [r.email.toLowerCase(), r])
  )

  const today = new Date().toISOString().split('T')[0]

  const merged = originalCandidates.map((candidate) => {
    const result = resultsMap.get(candidate.email.toLowerCase())

    return {
      ...candidate,
      match_score: result?.match_score ?? 0,
      decision: result?.decision ?? '',
      matching_skills: result?.matching_skills ?? [],
      missing_skills: result?.missing_skills ?? [],
      ai_summary: result?.ai_summary ?? '',
      score_breakdown: JSON.stringify(result?.score_breakdown ?? {}),
      screened_date: result ? today : '',
    }
  })

  // Sort by match score descending and add ranks
  return merged
    .sort((a, b) => b.match_score - a.match_score)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }))
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
