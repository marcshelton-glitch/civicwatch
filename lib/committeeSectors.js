// Static committee → sector/ticker jurisdiction map, used by
// app/api/conflict-score/route.js to flag trades that fall inside a member's
// own committee jurisdiction.
//
// METHODOLOGY (surfaced to users, not just this comment):
// A trade is flagged when (a) its ticker matches a sector this committee
// oversees, and (b) the trade date falls within the member's tenure on that
// committee. This is a jurisdiction/timing overlap, not proof of misconduct
// or use of nonpublic information — plenty of overlap is coincidental, and
// plenty of real conflicts won't have a ticker match here. It is presented
// as a starting point for the user's own research, same spirit as Capitol
// Trades' and Quiver's "committee" columns — CivicWatch is the only one of
// the six competitors researched that actually scores and flags the overlap
// instead of just displaying committee membership next to a trade list.
//
// Building this against real GICS sector data or a paid classification API
// was out of scope for a free, no-key data pipeline — this curated list
// covers the ~120 large-cap tickers most likely to appear in a PTR filing
// for each sector. It will under-flag (small/mid-caps, ETFs, foreign
// issuers) far more often than it over-flags, which is the safer failure
// mode for a tool making an accountability claim.

export const COMMITTEE_SECTORS = [
  {
    match: /armed services|military|defense appropriations/i,
    sector: 'Defense & Aerospace',
    tickers: ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'LHX', 'HII', 'TXT', 'LDOS', 'KTOS', 'AVAV', 'TDY'],
  },
  {
    match: /financial services|banking/i,
    sector: 'Banking & Financial Services',
    tickers: ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'SCHW', 'USB', 'PNC', 'TFC', 'COF', 'AXP', 'BLK', 'BK'],
  },
  {
    match: /energy and commerce|energy and natural resources|natural resources|energy/i,
    sector: 'Energy',
    tickers: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY', 'PSX', 'MPC', 'VLO', 'KMI', 'WMB', 'NEE', 'DUK', 'SO'],
  },
  {
    match: /health|veterans/i,
    sector: 'Healthcare & Pharma',
    tickers: ['UNH', 'JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'CVS', 'CI', 'HUM', 'MRNA', 'BMY', 'AMGN', 'GILD', 'ZTS', 'ABT'],
  },
  {
    match: /judiciary|antitrust/i,
    sector: 'Big Tech / Platforms',
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA'],
  },
  {
    match: /science, space, and technology|technology/i,
    sector: 'Tech & Aerospace',
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL', 'IBM', 'BA', 'LMT', 'NOC'],
  },
  {
    match: /transportation and infrastructure|transportation/i,
    sector: 'Transportation & Industrials',
    tickers: ['BA', 'UNP', 'CSX', 'NSC', 'DAL', 'UAL', 'LUV', 'AAL', 'FDX', 'UPS', 'CAT', 'DE'],
  },
  {
    match: /agriculture/i,
    sector: 'Agriculture',
    tickers: ['ADM', 'BG', 'DE', 'CTVA', 'MOS', 'CF', 'NTR', 'TSN', 'CAG'],
  },
  {
    match: /homeland security|intelligence/i,
    sector: 'Defense, Cyber & Intelligence',
    tickers: ['LMT', 'RTX', 'NOC', 'GD', 'LHX', 'PANW', 'CRWD', 'FTNT', 'PLTR', 'BAH'],
  },
  {
    match: /foreign affairs|foreign relations/i,
    sector: 'Defense & Aerospace',
    tickers: ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'LHX'],
  },
  {
    match: /ways and means|finance/i,
    sector: 'Broad Market / Tax-Sensitive',
    tickers: ['JPM', 'BAC', 'GS', 'MS', 'BRK.B', 'V', 'MA', 'AXP'],
  },
  {
    match: /small business/i,
    sector: 'Small-Cap / Regional Banking',
    tickers: ['SCHW', 'PNC', 'TFC', 'COF'],
  },
  {
    match: /telecommunications|communications/i,
    sector: 'Telecom & Media',
    tickers: ['T', 'VZ', 'TMUS', 'CMCSA', 'CHTR', 'DIS', 'NFLX'],
  },
]

/**
 * Returns the list of { sector, tickers } jurisdictions that apply to a
 * given committee name, matched by substring/keyword against COMMITTEE_SECTORS.
 * A committee can match more than one entry (e.g. "Energy and Commerce").
 */
export function sectorsForCommittee(committeeName) {
  if (!committeeName) return []
  return COMMITTEE_SECTORS.filter((entry) => entry.match.test(committeeName))
}

/**
 * True if `ticker` falls inside any sector jurisdiction of `committeeName`.
 */
export function tickerMatchesCommittee(ticker, committeeName) {
  if (!ticker) return false
  const tk = ticker.toUpperCase().trim()
  return sectorsForCommittee(committeeName).some((entry) => entry.tickers.includes(tk))
}
