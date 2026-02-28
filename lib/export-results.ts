import type { CandidateWithResults } from './export-results'

export interface CandidateWithResults {
  id: string
  name: string
  email: string
  phone: string
  linkedin_url: string
  resume_text: string
  skills: string
  experience_years: string
  // AI Scoring Columns (I-O)
  match_score: number
  decision: 'Strong Match' | 'Potential Match' | 'Not a Match' | ''
  matching_skills: string
  missing_skills: string
  ai_summary: string
  score_breakdown: string
  screened_date: string
  // Any other original columns
  [key: string]: any
}

/**
 * Escape CSV value if needed
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}""`
  }
  return stringValue
}

/**
 * Create CSV from candidates with results
 */
export function createResultsCSV(
  candidates: CandidateWithResults[]
): string {
  if (candidates.length === 0) return ''

  const headers = [
    'Name',
    'Email',
    'Phone',
    'LinkedIn URL',
    'Resume',
    'Skills',
    'Experience (Years)',
    'Match Score %',
    'Decision',
    'Matching Skills',
    'Missing Skills',
    'AI Summary',
    'Score Breakdown',
    'Screened Date',
  ]

  const rows = candidates.map((candidate) => [
    candidate.name,
    candidate.email,
    candidate.phone,
    candidate.linkedin_url,
    candidate.resume_text,
    candidate.skills,
    candidate.experience_years,
    candidate.match_score.toFixed(0),
    candidate.decision,
    candidate.matching_skills,
    candidate.missing_skills,
    candidate.ai_summary,
    candidate.score_breakdown,
    candidate.screened_date,
  ])

  const csvRows = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(',')),
  ]

  return csvRows.join('\n')
}

/**
 * Create Excel-friendly TSV for better compatibility
 */
export function createResultsTSV(
  candidates: CandidateWithResults[]
): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'LinkedIn URL',
    'Resume',
    'Skills',
    'Experience (Years)',
    'Match Score %',
    'Decision',
    'Matching Skills',
    'Missing Skills',
    'AI Summary',
    'Score Breakdown',
    'Screened Date',
  ]

  const rows = candidates.map((candidate) => [
    candidate.name,
    candidate.email,
    candidate.phone,
    candidate.linkedin_url,
    candidate.resume_text,
    candidate.skills,
    candidate.experience_years,
    candidate.match_score.toFixed(0),
    candidate.decision,
    candidate.matching_skills,
    candidate.missing_skills,
    candidate.ai_summary,
    candidate.score_breakdown,
    candidate.screened_date,
  ])

  return (
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes('\t')
              ? `"${cell}"`
              : cell
          )
          .join('\t')
      )
      .join('\n')
  )
}

/**
 * Download file with the given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Match n8n screening results to original candidates by email
 */
export function matchResultsToCandidates(
  originalCandidates: Record<string, string>[],
  screeningResults: Array<{
    candidate_email: string
    match_score: number
    decision: string
    matching_skills: string[]
    missing_skills: string[]
    summary: string
    score_breakdown: any
  }>
): CandidateWithResults[] {
  const resultsMap = new Map(
    screeningResults.map((r) => [
      r.candidate_email.toLowerCase(),
      r,
    ])
  )

  return originalCandidates.map((candidate) => {
    const email = candidate.email?.toLowerCase() || ''
    const result = resultsMap.get(email)

    return {
      id: candidate.id || '',
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      linkedin_url: candidate.linkedin_url || '',
      resume_text: candidate.resume_text || '',
      skills: candidate.skills || '',
      experience_years: candidate.experience_years || '',
      match_score: result?.match_score ?? 0,
      decision: result
        ? result.match_score >= 80
          ? 'Strong Match'
          : result.match_score >= 60
            ? 'Potential Match'
            : 'Not a Match'
        : '',
      matching_skills: result?.matching_skills?.join('; ') ?? '',
      missing_skills: result?.missing_skills?.join('; ') ?? '',
      ai_summary: result?.summary ?? '',
      score_breakdown: JSON.stringify(result?.score_breakdown) ?? '',
      screened_date: result
        ? new Date().toISOString().split('T')[0]
        : '',
      ...candidate,
    }
  })
}
