// Prompt construction for /api/analyze-rep, kept pure (no I/O) so it can be
// tested without the route's auth, rate-limit and Gemini plumbing.

export const fmt = (n) => {
  if (n == null || isNaN(n)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n)
}

// STOCK Act amounts arrive as ranges ("$1,000,001 - $5,000,000"), not numbers.
const amountText = (a) => (typeof a === 'number' ? fmt(a) : (a || 'amount not stated'))

// True when there is nothing for the model to analyse. Calling Gemini then
// only produces a filler report (and spends shared quota), so the route skips it.
export function hasAnyData(rep) {
  return rep.votes.length > 0
    || rep.trades.length > 0
    || rep.netWorthBefore != null
    || rep.netWorthCurrent != null
    || rep.filingsCount > 0
}

export const INSUFFICIENT_DATA_MESSAGE =
  "We don't have enough data on this member yet to write a useful report. "
  + 'Check back soon — votes, trades and net worth fill in as filings are processed.'

// Tells the model exactly what is missing, so absence of data is reported as
// absence of data and never as "no votes" / "no trades" / low concern.
function dataNotes(rep) {
  const notes = []
  if (rep.votes.length === 0) {
    notes.push('Vote data was not available for this member. Say that vote data was unavailable. Do NOT say the member cast no votes, and draw no conclusions about their voting.')
  }
  if (rep.trades.length === 0) {
    notes.push(rep.filingsCount > 0
      ? `${rep.filingsCount} financial disclosure filings are on record, but individual transactions were not itemised in the data provided. Say that. Do NOT say the member made no trades.`
      : 'No financial disclosure filings or itemised trades were found in the data provided. Say that, without implying wrongdoing or its absence.')
  }
  if (rep.netWorthBefore == null && rep.netWorthCurrent == null) {
    notes.push('Net worth history was not available. Say so briefly.')
  }
  if (Object.keys(rep.peerComparison).length === 0) {
    notes.push('Peer comparison data is not available. Say so in one sentence rather than inventing a comparison.')
  }
  return notes.length ? `\nData limits (state these plainly, do not paper over them):\n- ${notes.join('\n- ')}` : ''
}

export function buildPrompt(rep, mode) {
  const haveWorth = rep.netWorthBefore != null && rep.netWorthCurrent != null
  const pct = haveWorth && rep.netWorthBefore > 0
    ? Math.round(((rep.netWorthCurrent - rep.netWorthBefore) / rep.netWorthBefore) * 100)
    : null
  const pctText = pct == null ? 'change unknown' : `${pct >= 0 ? '+' : ''}${pct}%`
  const span = rep.netWorthEntryYear && rep.netWorthCurrentYear
    ? ` (${rep.netWorthEntryYear} → ${rep.netWorthCurrentYear})` : ''

  const tradeList = rep.trades.length > 0
    ? rep.trades.map(t => {
        const sector = t.sector && !/^stock\/security$/i.test(t.sector) ? `, ${t.sector}` : ''
        return `${t.date}: ${t.type} ${t.asset}${t.ticker ? ` [${t.ticker}]` : ''} (${amountText(t.amount)}${sector})`
      }).join('; ')
    : 'None itemised'

  const voteList = rep.votes.length > 0
    ? rep.votes.map(v => `${v.bill} — ${v.vote}${v.outcome ? ` — ${v.outcome}` : ''}`).join('; ')
    : 'Not available'

  const peerData = Object.keys(rep.peerComparison).length > 0
    ? Object.entries(rep.peerComparison)
        .map(([issue, v]) => `${issue}: this rep ${v.self}% vs peers ${v.peers}%`)
        .join('; ')
    : 'Not available'

  const worthLine = haveWorth
    ? `${fmt(rep.netWorthBefore)} → ${fmt(rep.netWorthCurrent)} (${pctText})${span}`
    : 'Not available'

  if (mode === 'preview') {
    return `You are a civic accountability analyst. In 2-3 sentences only, write a sharp, factual preview summary of this elected official for a civic watchdog platform. Be specific about one notable pattern; if the data is too thin for a pattern, say what is and is not available. Do NOT use markdown, headers, or bullet points. Write in plain prose.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Years in office: ${rep.yearsInOffice ?? 'unknown'}
Disclosed net worth (earliest on record → latest): ${worthLine}
Trades: ${tradeList}
Votes: ${voteList}${dataNotes(rep)}`
  }

  return `You are a nonpartisan civic accountability analyst. Write a thorough, factual accountability report for a civic watchdog platform. Use plain prose only — no markdown headers, no bullet points, no asterisks. Write in flowing paragraphs. Be specific, factual, and objective. Only state what the data below supports.

Cover these four areas in order, each as its own paragraph:

1. VOTING RECORD: Analyze their votes and what they reveal about priorities.
2. FINANCIAL ACTIVITY: Examine stock trades in context of their committee roles and votes. Note any timing patterns.
3. WEALTH TRAJECTORY: Assess disclosed net worth growth relative to their years served and peer norms.
4. PEER STANDING: Compare their issue scores vs peers and what that says about their positioning.

Then end with ONE final line in exactly this form:
Overall concern: <Low | Medium | High | Very High | Insufficient data> — <one short reason>
Use "Insufficient data" whenever fewer than two of the four areas above have real data. Missing data is never a reason to rate Low.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Bio: ${rep.bio || 'Not available'}
Years in office: ${rep.yearsInOffice ?? 'unknown'}
Disclosed net worth (earliest on record → latest): ${worthLine}
Trades: ${tradeList}
Votes: ${voteList}
Peer comparison: ${peerData}
Committee peers: ${rep.peers.join(', ') || 'unknown'}${dataNotes(rep)}`
}
