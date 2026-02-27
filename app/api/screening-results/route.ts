import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { candidate_id, batch_id, results } = await request.json()

    const { data, error } = await supabase
      .from('screening_results')
      .insert([
        {
          candidate_id,
          batch_id,
          score: results.score,
          rating: results.rating,
          summary: results.summary,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          recommendation: results.recommendation,
          n8n_response: results,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating screening result:', error)
    return NextResponse.json(
      { error: 'Failed to create screening result' },
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
      .from('screening_results')
      .select('*, candidates(*)')
      .eq('batch_id', batch_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching screening results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch screening results' },
      { status: 500 }
    )
  }
}
