import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { batch_id, candidates } = await request.json()

    // Insert candidates in bulk
    const { data, error } = await supabase
      .from('candidates')
      .insert(
        candidates.map((candidate: any) => ({
          ...candidate,
          batch_id,
        }))
      )
      .select()

    if (error) throw error

    // Update batch total_candidates count
    await supabase
      .from('screening_batches')
      .update({ total_candidates: candidates.length })
      .eq('id', batch_id)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating candidates:', error)
    return NextResponse.json(
      { error: 'Failed to create candidates' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const batch_id = searchParams.get('batch_id')

    if (!batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('batch_id', batch_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}
