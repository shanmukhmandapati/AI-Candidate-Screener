import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, processed_count } = await request.json()
    const { id } = await Promise.resolve(params)

    const { data, error } = await supabase
      .from('screening_batches')
      .update({
        status,
        processed_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating batch:', error)
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params)

    const { data, error } = await supabase
      .from('screening_batches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching batch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    )
  }
}
