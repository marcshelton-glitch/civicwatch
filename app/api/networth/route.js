import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/networth?bioguideId=P000197&lastName=Pelosi&state=CA
export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const bioguideId = (searchParams.get('bioguideId') || '').trim().toUpperCase()
  const lastName = (searchParams.get('lastName') || '').trim()
  const state = (searchParams.get('state') || '').trim().toUpperCase()

  if (!bioguideId) return NextResponse.json({ error: 'bioguideId required' }, { status: 400 })

  const supabase = getSupabase()

  let { data, error } = await supabase
    .from('fd_net_worth')
    .select('report_year, net_worth_min, net_worth_max, filing_date')
    .eq('bioguide_id', bioguideId)
    .order('report_year', { ascending: true })

  // Fallback for the ~153 rows where bioguide_id couldn't be resolved (candidates, very new members)
  if (!error && (!data || data.length === 0) && lastName && state) {
    ;({ data, error } = await supabase
      .from('fd_net_worth')
      .select('report_year, net_worth_min, net_worth_max, filing_date')
      .ilike('last_name', lastName)
      .ilike('state_dst', `${state}%`)
      .order('report_year', { ascending: true }))
  }

  if (error) {
    console.error('networth GET error:', error.message)
    return NextResponse.json({ history: [] })
  }

  // Deduplicate: one row per year (keep highest net_worth_max — likely the amended filing)
  const byYear = {}
  for (const row of data || []) {
    if (row.net_worth_min == null) continue
    if (!byYear[row.report_year] || row.net_worth_max > byYear[row.report_year].net_worth_max) {
      byYear[row.report_year] = row
    }
  }

  const history = Object.values(byYear)
    .sort((a, b) => a.report_year - b.report_year)
    .map(row => ({
      year: row.report_year,
      min_value: row.net_worth_min,
      max_value: row.net_worth_max ?? row.net_worth_min,
      filing_date: row.filing_date,
    }))

  if (history.length === 0) return NextResponse.json({ history: [] })

  const CONGRESSIONAL_SALARY = 174000

  const first = history[0]
  const last = history[history.length - 1]
  const entryWorth = (first.min_value + first.max_value) / 2
  const currentWorth = (last.min_value + last.max_value) / 2
  const growthAmount = currentWorth - entryWorth
  const growthPct = entryWorth > 0 ? Math.round((growthAmount / entryWorth) * 100) : null
  const yearsInOffice = last.year - first.year + 1
  const salaryTotal = CONGRESSIONAL_SALARY * yearsInOffice

  return NextResponse.json({
    history,
    entry_year: first.year,
    entry_worth: entryWorth,
    current_year: last.year,
    current_worth: currentWorth,
    growth_amount: growthAmount,
    growth_pct: growthPct,
    salary_total: salaryTotal,
    categories: null,
  })
}
