import { auth, currentUser } from '@clerk/nextjs/server'

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { mode, rep } = body

  if (!mode || !rep) {
    return Response.json({ error: 'Missing mode or rep data' }, { status: 400 })
  }

  if (!['preview', 'full'].includes(mode)) {
    return Response.json({ error: 'Invalid mode' }, { status: 400 })
  }

  if (mode === 'full') {
    const user = await currentUser()
    const isPro = user?.publicMetadata?.isPro === true
    if (!isPro) {
      return Response.json({ error: 'Pro subscription required' }, { status: 403 })
    }
  }

  const fmt = (n) => n ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n) : 'N/A'

  const enrichPct = rep.netWorthBefore && rep.netWorthCurrent
    ? (((rep.netWorthCurrent - rep.netWorthBefore) / rep.netWorthBefore) * 100).toFixed(0)
    : 'unknown'

  const tradeList = rep.trades?.length
    ? rep.trades.map((t) => `${t.date}: ${t.type} ${t.asset} (${fmt(t.amount)}, ${t.sector})`).join('; ')
    : 'No trades disclosed'

  const voteList = rep.votes?.length
    ? rep.votes.map((v) => `${v.bill} — ${v.vote} — ${v.outcome}`).join('; ')
    : 'No votes on record'

  const peerData = rep.peerComparison && Object.keys(rep.peerComparison).length
    ? Object.entries(rep.peerComparison).map(([issue, v]) => `${issue}: this rep ${v.self}% vs peers ${v.peers}%`).join('; ')
    : 'No peer data available'

  const prompt = mode === 'preview'
    ? `You are a civic accountability analyst. In 2-3 sentences only, write a sharp, factual preview summary of this elected official for a civic watchdog platform. Be specific about one notable pattern. Do NOT use markdown, headers, or bullet points. Write in plain prose.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Net worth change in office: ${fmt(rep.netWorthBefore)} → ${fmt(rep.netWorthCurrent)} (+${enrichPct}% over ${rep.yearsInOffice || 'unknown'} years)
Recent trades: ${tradeList}
Recent votes: ${voteList}`
    : `You are a nonpartisan civic accountability analyst. Write a thorough, factual accountability report for a civic watchdog platform. Use plain prose only — no markdown headers, no bullet points, no asterisks. Write in flowing paragraphs. Be specific, factual, and objective.

Cover these four areas in order, each as its own paragraph:

1. VOTING RECORD: Analyze their votes and what they reveal about priorities.
2. FINANCIAL ACTIVITY: Examine stock trades in context of their committee roles and votes. Note any timing patterns.
3. WEALTH TRAJECTORY: Assess net worth growth in office relative to their years served and peer norms.
4. PEER STANDING: Compare their issue scores vs peers and what that says about their positioning.

End with one sentence: an overall accountability rating as "Low / Medium / High / Very High" concern, with a one-line reason.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Bio: ${rep.bio}
Years in office: ${rep.yearsInOffice || 'unknown'}
Net worth before office: ${fmt(rep.netWorthBefore)}
Current net worth: ${fmt(rep.netWorthCurrent)} (+${enrichPct}%)
Trades: ${tradeList}
Votes: ${voteList}
Peer comparison: ${peerData}
Committee peers: ${rep.peers?.join(', ') || 'unknown'}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }),
      }
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      console.error('Gemini empty response:', data)
      return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
    }

    return Response.json({ text })
  } catch (err) {
    console.error('Gemini API error:', err)
    return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}
