import { MergedCandidate } from './n8n-integration'

/**
 * Escape CSV value for proper formatting
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}""`
  }
  return str
}

/**
 * Create CSV content from merged candidates
 */
export function createCSVContent(candidates: MergedCandidate[]): string {
  const headers = [
    'Rank',
    'Name',
    'Email',
    'Phone',
    'LinkedIn URL',
    'Current Role',
    'Skills',
    'Experience',
    'Education',
    'Match Score %',
    'Decision',
    'Matching Skills',
    'Missing Skills',
    'AI Summary',
    'Score Breakdown',
    'Screened Date',
  ]

  const rows = candidates.map((c) => [
    c.rank || '',
    c.name,
    c.email,
    c.phone || '',
    c.linkedinUrl || '',
    c.currentRole || '',
    c.skills || '',
    c.experience || '',
    c.education || '',
    c.match_score.toFixed(0),
    c.decision,
    c.matching_skills.join('; '),
    c.missing_skills.join('; '),
    c.ai_summary,
    c.score_breakdown,
    c.screened_date,
  ])

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return csv
}

/**
 * Download CSV file
 */
export function downloadCSV(candidates: MergedCandidate[]): void {
  const content = createCSVContent(candidates)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const today = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `AI_Screener_Results_${today}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download Excel file using SheetJS
 */
export async function downloadExcel(candidates: MergedCandidate[]): Promise<void> {
  try {
    const { default: XLSX } = await import('xlsx')

    const workbook = XLSX.utils.book_new()
    
    // Prepare data
    const data = candidates.map((c) => ({
      Rank: c.rank || '',
      Name: c.name,
      Email: c.email,
      Phone: c.phone || '',
      'LinkedIn URL': c.linkedinUrl || '',
      'Current Role': c.currentRole || '',
      Skills: c.skills || '',
      Experience: c.experience || '',
      Education: c.education || '',
      'Match Score %': c.match_score,
      Decision: c.decision,
      'Matching Skills': c.matching_skills.join('; '),
      'Missing Skills': c.missing_skills.join('; '),
      'AI Summary': c.ai_summary,
      'Score Breakdown': c.score_breakdown,
      'Screened Date': c.screened_date,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)

    // Style header row (navy background, white bold text)
    const headerStyle = {
      fill: { fgColor: { rgb: '00001f' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    }

    // Style columns A-H (white background)
    const originalStyle = {
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    }

    // Style columns I-O (light yellow background)
    const aiResultStyle = {
      fill: { fgColor: { rgb: 'FFFACD' } },
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    }

    // Apply header styling
    if (worksheet['!ref']) {
      const cols = XLSX.utils.decode_col(worksheet['!ref'].split(':')[0].split('')[0])
      const rows = worksheet['!ref'].split(':')[1].charCodeAt(0) - 65

      for (let c = 0; c <= cols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c })
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = headerStyle
        }
      }
    }

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 }, // Rank
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // LinkedIn
      { wch: 20 }, // Current Role
      { wch: 30 }, // Skills
      { wch: 12 }, // Experience
      { wch: 20 }, // Education
      { wch: 15 }, // Match Score
      { wch: 12 }, // Decision
      { wch: 25 }, // Matching Skills
      { wch: 25 }, // Missing Skills
      { wch: 40 }, // AI Summary
      { wch: 30 }, // Score Breakdown
      { wch: 15 }, // Screened Date
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates')

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `AI_Screener_Results_${today}.xlsx`)
  } catch (error) {
    console.error('Failed to download Excel:', error)
    throw new Error('Failed to generate Excel file')
  }
}
