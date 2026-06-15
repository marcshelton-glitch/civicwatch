import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  let dbOk = false
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('fd_filings')
      .select('doc_id', { count: 'exact', head: true })
      .limit(1)
    dbOk = !error
  } catch { /* db unreachable */ }

  if (!dbOk) {
    return NextResponse.json(
      { status: 'error', db: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  return NextResponse.json(
    { status: 'ok', db: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
