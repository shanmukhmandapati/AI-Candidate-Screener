import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { name, description, n8n_webhook_url } = await request.json()

    const { data, error } = await supabase
      .from('screening_batches')
      .insert([
        {
          name,
          description,
          n8n_webhook_url,
          status: 'pending',
          total_candidates: 0,
          processed_count: 0,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('screening_batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}
