import { useState } from 'react'
import { toast } from 'sonner'

export interface ParsedCandidate {
  name: string
  email: string
  phone?: string
  linkedinUrl?: string
  currentRole?: string
  skills?: string
  experience?: string
  education?: string
}

interface ParseResult {
  success: boolean
  candidates: ParsedCandidate[]
  errors: string[]
}

/**
 * Parse CSV file using native JavaScript (no external dependency)
 */
export function parseCSVContent(content: string): ParseResult {
  const errors: string[] = []
  const lines = content.trim().split('\n')
  
  console.log('[v0] CSV Lines:', lines.length)
  
  if (lines.length < 2) {
    return { success: false, candidates: [], errors: ['No data rows found'] }
  }

  // Parse header
  const headers = parseCSVLine(lines[0])
  console.log('[v0] Headers found:', headers)
  
  // Map expected columns
  const columnMapping = {
    name: findColumnIndex(headers, ['name', 'full name', 'candidate name', 'applicant']),
    email: findColumnIndex(headers, ['email', 'email address', 'e-mail', 'contact email']),
    phone: findColumnIndex(headers, ['phone', 'phone number', 'contact', 'mobile']),
    linkedinUrl: findColumnIndex(headers, ['linkedin', 'linkedin url', 'linkedin profile', 'profile']),
    currentRole: findColumnIndex(headers, ['role', 'current role', 'position', 'job title', 'title']),
    skills: findColumnIndex(headers, ['skills', 'technical skills', 'expertise']),
    experience: findColumnIndex(headers, ['experience', 'years of experience', 'experience years', 'yoe']),
    education: findColumnIndex(headers, ['education', 'degree', 'qualification']),
  }

  console.log('[v0] Column mapping:', columnMapping)
  
  if (columnMapping.email === -1) {
    return { success: false, candidates: [], errors: ['Email column not found. Please ensure a column named "Email" or similar exists.'] }
  }

  // Parse data rows
  const candidates: ParsedCandidate[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    
    if (row.every(cell => !cell.trim())) continue // Skip empty rows
    
    const email = row[columnMapping.email]?.trim()
    if (!email) {
      errors.push(`Row ${i + 1}: Missing email`)
      continue
    }

    candidates.push({
      name: row[columnMapping.name]?.trim() || '',
      email: email,
      phone: row[columnMapping.phone]?.trim() || undefined,
      linkedinUrl: row[columnMapping.linkedinUrl]?.trim() || undefined,
      currentRole: row[columnMapping.currentRole]?.trim() || undefined,
      skills: row[columnMapping.skills]?.trim() || undefined,
      experience: row[columnMapping.experience]?.trim() || undefined,
      education: row[columnMapping.education]?.trim() || undefined,
    })
  }

  console.log('[v0] Parsed candidates:', candidates.length, 'Errors:', errors.length)
  
  return { success: candidates.length > 0, candidates, errors }
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

/**
 * Find column index by checking multiple possible names (case-insensitive, flexible matching)
 */
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim())
  
  for (const possibleName of possibleNames) {
    const lowerPossible = possibleName.toLowerCase().trim()
    
    // Exact match first
    const exactIndex = lowerHeaders.findIndex(h => h === lowerPossible)
    if (exactIndex !== -1) return exactIndex
    
    // Partial match (contains)
    const partialIndex = lowerHeaders.findIndex(h => 
      h.includes(lowerPossible) || lowerPossible.includes(h)
    )
    if (partialIndex !== -1) return partialIndex
  }
  
  return -1
}

/**
 * Use the PapaParse library if available
 */
export async function parseFileWithPapaParse(file: File): Promise<ParseResult> {
  try {
    // Dynamic import to avoid build-time dependency
    const { default: Papa } = await import('papaparse')
    
    const text = await file.text()
    const { data } = Papa.parse(text, { header: true })
    
    const candidates: ParsedCandidate[] = (data as any[])
      .filter((row: any) => row.email) // Must have email
      .map((row: any) => ({
        name: row.name || row['Full Name'] || '',
        email: row.email || row['Email'] || '',
        phone: row.phone || row['Phone'] || undefined,
        linkedinUrl: row.linkedinUrl || row['LinkedIn URL'] || row['LinkedIn'] || undefined,
        currentRole: row.currentRole || row['Current Role'] || row['Role'] || undefined,
        skills: row.skills || row['Skills'] || undefined,
        experience: row.experience || row['Experience'] || undefined,
        education: row.education || row['Education'] || undefined,
      }))

    return { success: true, candidates, errors: [] }
  } catch (err) {
    return { success: false, candidates: [], errors: [String(err)] }
  }
}

/**
 * Parse XLSX file using SheetJS
 */
export async function parseXLSXFile(file: File): Promise<ParseResult> {
  try {
    // Dynamic import to avoid build-time dependency
    const { default: XLSX } = await import('xlsx')
    
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)

    const candidates: ParsedCandidate[] = (data as any[])
      .filter((row: any) => row.email || row.Email) // Must have email
      .map((row: any) => ({
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        phone: row.phone || row.Phone || undefined,
        linkedinUrl: row.linkedinUrl || row['LinkedIn URL'] || row.LinkedIn || undefined,
        currentRole: row.currentRole || row['Current Role'] || row.Role || undefined,
        skills: row.skills || row.Skills || undefined,
        experience: row.experience || row.Experience || undefined,
        education: row.education || row.Education || undefined,
      }))

    return { success: true, candidates, errors: [] }
  } catch (err) {
    return { success: false, candidates: [], errors: [String(err)] }
  }
}

/**
 * Main file parsing handler
 */
export async function parseFile(file: File): Promise<ParseResult> {
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    const text = await file.text()
    return parseCSVContent(text)
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.name.endsWith('.xlsx')
  ) {
    return parseXLSXFile(file)
  } else if (file.name.endsWith('.xls')) {
    return parseXLSXFile(file)
  } else {
    return { success: false, candidates: [], errors: ['Unsupported file format. Please use CSV or XLSX.'] }
  }
}
