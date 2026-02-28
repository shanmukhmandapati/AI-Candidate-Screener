import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to fetch Google Sheet CSV
 * This bypasses CORS issues by running on the server
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

    // Build the Google Sheets export URL
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`

    console.log('[v0] Server: Fetching Google Sheet:', sheetId)

    // Fetch from server (no CORS issues)
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error('[v0] Google Sheets HTTP error:', response.status)
      return NextResponse.json(
        { 
          error: `Failed to fetch sheet (HTTP ${response.status}). Make sure the sheet is shared as "Anyone with the link can view".` 
        },
        { status: response.status }
      )
    }

    const csv = await response.text()

    if (!csv.trim()) {
      return NextResponse.json(
        { error: 'Sheet appears to be empty' },
        { status: 400 }
      )
    }

    console.log('[v0] Server: Successfully fetched Google Sheet, length:', csv.length)

    return NextResponse.json({ csv })
  } catch (err) {
    console.error('[v0] Server: Google Sheets error:', err)
    return NextResponse.json(
      { error: `Failed to fetch sheet: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
