import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600  // 6 hours

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const supabase = getSupabase()

    // Fetch high-value trades (>$1M) from both House and Senate tables
    const [{ data: fdTrades, error: fdErr }, { data: senTrades, error: senErr }] = await Promise.all([
      supabase
        .from('fd_trades')
        .select('last_name, first_name, ticker, asset_name, transaction_type, amount_str, amount_max, transaction_date, year, doc_id')
        .gt('amount_max', 1000000)
        .order('amount_max', { ascending: false })
        .limit(100),
      supabase
        .from('senate_trades')
        .select('last_name, first_name, ticker, asset_name, transaction_type, amount_str, amount_max, transaction_date, year, filing_id')
        .gt('amount_max', 1000000)
        .order('amount_max', { ascending: false })
        .limit(50),
    ])

    if (fdErr && senErr) throw new Error(fdErr.message)

    // Gather unique last names to look up party/state/bioguide from fd_filings
    const fdLastNames = [...new Set((fdTrades || []).map(t => t.last_name).filter(Boolean))]

    let memberMap = {}
    if (fdLastNames.length > 0) {
      const { data: filings } = await supabase
        .from('fd_filings')
        .select('last_name, party, state, bioguide_id, member_name')
        .in('last_name', fdLastNames)
        .not('bioguide_id', 'is', null)
        .limit(500)

      for (const f of (filings || [])) {
        const key = (f.last_name || '').toLowerCase()
        if (key && !memberMap[key]) {
          memberMap[key] = {
            party: f.party,
            state: f.state,
            bioguide_id: f.bioguide_id,
            name: f.member_name,
          }
        }
      }
    }

    // Normalize House trades
    const houseTrades = (fdTrades || []).map(t => {
      const member = memberMap[(t.last_name || '').toLowerCase()] || {}
      return {
        name: member.name || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
        bioguide_id: member.bioguide_id || null,
        party: member.party || null,
        state: member.state || null,
        ticker: t.ticker || null,
        asset: t.asset_name || 'Unknown Asset',
        transaction_type: t.transaction_type || 'Unknown',
        amount_str: t.amount_str || 'Undisclosed',
        amount_max: t.amount_max || 0,
        filing_date: t.transaction_date || null,
        chamber: 'house',
        doc_url: t.doc_id && t.year
          ? `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${t.year}/${t.doc_id}.pdf`
          : null,
      }
    })

    // Normalize Senate trades
    const senateTrades = (senTrades || []).map(t => ({
      name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      bioguide_id: null,
      party: null,
      state: null,
      ticker: t.ticker || null,
      asset: t.asset_name || 'Unknown Asset',
      transaction_type: t.transaction_type || 'Unknown',
      amount_str: t.amount_str || 'Undisclosed',
      amount_max: t.amount_max || 0,
      filing_date: t.transaction_date || null,
      chamber: 'senate',
      doc_url: null,
    }))

    // Merge, sort by amount_max desc, deduplicate roughly, limit 20
    const all = [...houseTrades, ...senateTrades]
      .sort((a, b) => b.amount_max - a.amount_max)
      .slice(0, 20)

    return NextResponse.json(all)
  } catch (err) {
    console.error('Controversial trades error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch notable trades' }, { status: 500 })
  }
}
