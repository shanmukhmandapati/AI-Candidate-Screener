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

    console.log('[v0] Server: Fetching Google Sheet:', sheetId)

    // Try multiple export URLs - some work better than others
    const urls = [
      // Standard export URL
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
      // Alternative export format
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=0`,
    ]

    let lastError: Error | null = null

    for (const url of urls) {
      try {
        console.log('[v0] Server: Trying URL:', url)
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })

        if (response.ok) {
          const csv = await response.text()
          
          if (!csv.trim()) {
            lastError = new Error('Sheet appears to be empty')
            continue
          }

          console.log('[v0] Server: Successfully fetched Google Sheet, length:', csv.length)
          return NextResponse.json({ csv })
        }

        lastError = new Error(`HTTP ${response.status}`)
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        continue
      }
    }

    // All URLs failed
    console.error('[v0] Server: All fetch attempts failed:', lastError?.message)
    return NextResponse.json(
      { 
        error: `Failed to fetch sheet. Make sure:\n1. The Google Sheet is shared as "Anyone with the link"\n2. The share link is set to "Viewer" or "Editor"\n3. You have pasted the correct URL\n\nError: ${lastError?.message || 'Unknown error'}` 
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
