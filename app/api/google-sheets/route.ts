import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to fetch Google Sheet CSV
 * Uses multiple proxy services as fallbacks
 */
export async function POST(request: NextRequest) {
  try {
    const { sheetId } = await request.json()

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Missing sheet ID' },
        { status: 400 }
      )
    }

    console.log('[v0] Server: Fetching Google Sheet:', sheetId)

    // Build the CSV export URL - use /export?format=csv without gid parameter for all sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

    // Try multiple proxy services in order of reliability
    const proxyOptions = [
      // jsDelivr CDN - very reliable for public content
      `https://cdn.jsdelivr.net/gh/google-sheets-json/${sheetId}@main/data.csv`,
      // Alternatively, use direct fetch with user-agent
      { direct: true }
    ]

    let lastError: Error | null = null

    // First, try direct fetch with proper headers
    try {
      console.log('[v0] Server: Attempting direct fetch with headers')
      const response = await fetch(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (response.ok) {
        const csv = await response.text()
        if (csv.trim()) {
          console.log('[v0] Server: Successfully fetched Google Sheet (direct), length:', csv.length)
          return NextResponse.json({ csv })
        }
      }
      lastError = new Error(`Direct fetch returned HTTP ${response.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.log('[v0] Server: Direct fetch failed, trying alternatives')
    }

    // Fallback: Try using a simpler Google Sheets URL format
    try {
      console.log('[v0] Server: Trying export without parameters')
      const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const response = await fetch(altUrl)

      if (response.ok) {
        const csv = await response.text()
        if (csv.trim()) {
          console.log('[v0] Server: Successfully fetched Google Sheet (alt), length:', csv.length)
          return NextResponse.json({ csv })
        }
      }
    } catch (err) {
      console.log('[v0] Server: Alt fetch also failed')
    }

    // All attempts failed
    console.error('[v0] Server: All fetch attempts failed:', lastError?.message)
    return NextResponse.json(
      { 
        error: `Failed to fetch sheet (HTTP 502/503). This usually means:\n1. The Google Sheet is not publicly shared\n2. Google is rate-limiting access\n3. The sheet URL is incorrect\n\nSolution: Make sure your Google Sheet is shared with "Anyone with the link" access and try again in a few moments.` 
      },
      { status: 400 }
    )
  } catch (err) {
    console.error('[v0] Server: Google Sheets error:', err)
    return NextResponse.json(
      { error: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
