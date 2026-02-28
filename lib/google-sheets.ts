/**
 * Extract sheet ID from various Google Sheets URL formats
 * Supports: 
 * - https://docs.google.com/spreadsheets/d/{ID}/edit
 * - https://docs.google.com/spreadsheets/d/{ID}
 * - Just the ID itself
 */
export function extractSheetId(url: string): string | null {
  // Already just an ID
  if (!url.includes('/')) return url.trim()
  
  // Match the pattern between /d/ and the next /
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

/**
 * Fetch Google Sheet as CSV using public API
 * Note: Sheet must be shared as "Anyone with the link can view"
 */
export async function fetchGoogleSheet(sheetUrl: string): Promise<string> {
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL. Please provide a valid Google Sheets link.')
  }

  // Default to first sheet (gid=0)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
  
  console.log('[v0] Fetching Google Sheet:', csvUrl)

  try {
    const response = await fetch(csvUrl)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Sheet not found. Make sure the URL is correct and the sheet is shared.')
      }
      throw new Error(`Failed to fetch sheet: ${response.statusText}`)
    }
    
    const csv = await response.text()
    if (!csv.trim()) {
      throw new Error('Sheet appears to be empty')
    }
    
    return csv
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Google Sheets Error: ${err.message}`)
    }
    throw err
  }
}

/**
 * Validate Google Sheets URL format
 */
export function isValidGoogleSheetsUrl(url: string): boolean {
  if (!url.trim()) return false
  
  // Check if it's a Google Sheets URL or just an ID
  const isUrl = url.includes('docs.google.com/spreadsheets')
  const hasId = /^[a-zA-Z0-9-_]+$/.test(url.trim())
  
  return isUrl || hasId
}
