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
 * Fetch Google Sheet as CSV using backend API route
 * Note: Sheet must be shared as "Anyone with the link can view"
 */
export async function fetchGoogleSheet(sheetUrl: string): Promise<string> {
  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL. Please provide a valid Google Sheets link or Sheet ID.')
  }

  console.log('[v0] Fetching Google Sheet via API:', sheetId)

  try {
    const response = await fetch('/api/google-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch sheet (HTTP ${response.status})`)
    }

    if (!data.csv || !data.csv.trim()) {
      throw new Error('Sheet appears to be empty. Please check the URL and make sure the sheet has data.')
    }

    console.log('[v0] Successfully fetched Google Sheet, length:', data.csv.length)
    return data.csv
  } catch (err) {
    console.error('[v0] Google Sheets fetch error:', err)
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
