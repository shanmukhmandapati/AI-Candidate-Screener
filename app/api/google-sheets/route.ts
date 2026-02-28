import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to fetch Google Sheet CSV using allorigins.win proxy
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

    // Build the CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`

    console.log('[v0] Server: Using allorigins proxy')

    const response = await fetch(proxyUrl)

    if (!response.ok) {
      console.error('[v0] Server: Fetch failed with status:', response.status)
      return NextResponse.json(
        { 
          error: `Failed to fetch sheet (HTTP ${response.status}). Make sure:\n1. The Google Sheet is shared as "Anyone with the link"\n2. You have pasted the correct URL\n3. The sheet has data with an Email column` 
        },
        { status: 400 }
      )
    }

    const csv = await response.text()

    if (!csv.trim()) {
      console.error('[v0] Server: Sheet appears empty')
      return NextResponse.json(
        { error: 'Sheet appears to be empty. Please check the URL and make sure the sheet has data.' },
        { status: 400 }
      )
    }

    console.log('[v0] Server: Successfully fetched Google Sheet, length:', csv.length)
    return NextResponse.json({ csv })
  } catch (err) {
    console.error('[v0] Server: Google Sheets error:', err)
    return NextResponse.json(
      { error: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
