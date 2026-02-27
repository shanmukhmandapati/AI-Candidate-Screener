/**
 * Parse CSV file content
 */
export function parseCSV(
  content: string
): {
  headers: string[]
  rows: Record<string, string>[]
} {
  const lines = content.trim().split('\n')
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  return { headers, rows }
}

/**
 * Map CSV headers to candidate fields
 */
export function mapCandidateFields(
  row: Record<string, string>,
  fieldMapping: Record<string, string>
): {
  name: string
  email: string
  phone: string
  linkedin_url: string
  resume_text: string
  skills: string[]
  experience_years: number
  custom_fields: Record<string, string>
} {
  const custom_fields: Record<string, string> = {}

  const candidate = {
    name: row[fieldMapping.name] || '',
    email: row[fieldMapping.email] || '',
    phone: row[fieldMapping.phone] || '',
    linkedin_url: row[fieldMapping.linkedin_url] || '',
    resume_text: row[fieldMapping.resume_text] || '',
    skills: (row[fieldMapping.skills] || '').split(';').filter((s) => s.trim()),
    experience_years: parseInt(row[fieldMapping.experience_years]) || 0,
    custom_fields,
  }

  // Collect any unmapped fields into custom_fields
  Object.entries(row).forEach(([key, value]) => {
    if (
      ![
        fieldMapping.name,
        fieldMapping.email,
        fieldMapping.phone,
        fieldMapping.linkedin_url,
        fieldMapping.resume_text,
        fieldMapping.skills,
        fieldMapping.experience_years,
      ].includes(key)
    ) {
      custom_fields[key] = value
    }
  })

  return candidate
}

/**
 * Validate candidate data
 */
export function validateCandidate(candidate: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!candidate.name || candidate.name.trim() === '') {
    errors.push('Name is required')
  }

  if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
    errors.push('Invalid email format')
  }

  if (
    candidate.experience_years !== undefined &&
    (candidate.experience_years < 0 || candidate.experience_years > 70)
  ) {
    errors.push('Experience years must be between 0 and 70')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
