# CivicWatch.jsx — RepDetail updates

Replace the entire `RepDetail` function with this version.
It lazy-loads votes, trades, bio detail, and sponsored bills on tab click.

---

## Step 1 — Replace the RepDetail function signature + hooks

Find:
```js
function RepDetail({ rep, onBack, tracked, toggleTrack, repTab, setRepTab, pollVotes, handlePollVote, S }) {
  const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
```

Replace with:
```js
function RepDetail({ rep, onBack, tracked, toggleTrack, repTab, setRepTab, pollVotes, handlePollVote, S }) {
  const [liveVotes, setLiveVotes] = useState(null)
  const [liveTrades, setLiveTrades] = useState(null)
  const [liveBio, setLiveBio] = useState(null)
  const [liveSponsored, setLiveSponsored] = useState(null)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [loadingTrades, setLoadingTrades] = useState(false)
  const [loadingBio, setLoadingBio] = useState(false)

  const isLive = rep.isLive

  // Lazy-load votes on tab click
  useEffect(() => {
    if (repTab === 'votes' && isLive && !liveVotes && !loadingVotes) {
      setLoadingVotes(true)
      fetch(`/api/congress?type=votes&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveVotes(d.votes || []); setLoadingVotes(false) })
        .catch(() => { setLiveVotes([]); setLoadingVotes(false) })
    }
  }, [repTab, rep.id])

  // Lazy-load trades on tab click
  useEffect(() => {
    if (repTab === 'wealth' && isLive && !liveTrades && !loadingTrades) {
      setLoadingTrades(true)
      fetch(`/api/congress?type=trades&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveTrades(d.trades || []); setLoadingTrades(false) })
        .catch(() => { setLiveTrades([]); setLoadingTrades(false) })
    }
  }, [repTab, rep.id])

  // Lazy-load bio detail + sponsored bills on tab click
  useEffect(() => {
    if (repTab === 'bio' && isLive && !liveBio && !loadingBio) {
      setLoadingBio(true)
      Promise.all([
        fetch(`/api/congress?type=member&bioguideId=${rep.id}`).then(r => r.json()),
        fetch(`/api/congress?type=sponsored&bioguideId=${rep.id}`).then(r => r.json()),
      ]).then(([bioData, sponsoredData]) => {
        setLiveBio(bioData.member || null)
        setLiveSponsored(sponsoredData.bills || [])
        setLoadingBio(false)
      }).catch(() => { setLoadingBio(false) })
    }
  }, [repTab, rep.id])

  const votes = isLive ? (liveVotes || rep.votes) : rep.votes
  const trades = isLive ? (liveTrades || rep.trades) : rep.trades

  const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
```

---

## Step 2 — Update the votes tab

Find the `{repTab === "votes" && (` block. Replace the entire content inside it with:

```jsx
{repTab === "votes" && (
  <div className="slide-in">
    {loadingVotes && (
      <div style={{ textAlign: 'center', padding: 48, color: S.gray }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
        Loading votes from Congress.gov…
      </div>
    )}
    {!loadingVotes && votes.length === 0 && (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
        <div style={{ fontSize: 14, color: S.gray, marginBottom: 16 }}>No vote records available yet for this member.</div>
        <a href={`https://www.congress.gov/member/${rep.id}`} target="_blank" rel="noreferrer"
          style={{ padding: '8px 20px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
          View on Congress.gov →
        </a>
      </div>
    )}
    {!loadingVotes && votes.map((v, i) => (
      <div key={i} style={{ padding: "14px 18px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, display: "flex", gap: 14, alignItems: "center", marginBottom: 10 }}>
        <div className={v.vote === "YEA" ? "vote-yea" : "vote-nay"} style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, minWidth: 54 }}>{v.vote}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, marginBottom: 3 }}>{v.bill}</div>
          <div style={{ fontSize: 11, color: S.gray }}>{v.date}</div>
        </div>
        <span className={v.outcome === "PASSED" ? "outcome-passed" : "outcome-failed"}>{v.outcome || v.result}</span>
        <a href={v.url || v.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: S.gold, border: `1px solid ${S.border}`, padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>Bill →</a>
      </div>
    ))}
  </div>
)}
```

---

## Step 3 — Update the wealth tab

Find `{repTab === "wealth" && (`. Replace the trades table section inside it.

After the two stat cards (before office/current net worth), find the trade history table. Replace the entire `rep.trades.map(...)` section with:

```jsx
{loadingTrades && (
  <div style={{ textAlign: 'center', padding: 32, color: S.gray }}>
    <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
    Loading STOCK Act disclosures…
  </div>
)}
{!loadingTrades && trades.length === 0 && isLive && (
  <div style={{ textAlign: 'center', padding: 32 }}>
    <div style={{ fontSize: 28, marginBottom: 10 }}>💼</div>
    <div style={{ fontSize: 13, color: S.gray, marginBottom: 12 }}>No trade disclosures found in House or Senate STOCK Act records.</div>
    <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noreferrer"
      style={{ padding: '7px 18px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
      Search House Disclosures →
    </a>
  </div>
)}
{!loadingTrades && trades.length > 0 && (
  <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${S.border}` }}>
    <div style={{ display: "grid", gridTemplateColumns: "110px 70px 1fr 80px 100px", padding: "10px 16px", background: S.navyMid, fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: "uppercase" }}>
      <span>Date</span><span>Type</span><span>Asset</span><span>Sector</span><span style={{ textAlign: "right" }}>Amount</span>
    </div>
    {trades.map((t, i) => (
      <div key={i} className="trade-row" style={{ display: "grid", gridTemplateColumns: "110px 70px 1fr 80px 100px", padding: "12px 16px", borderTop: `1px solid ${S.border}`, fontSize: 13, transition: "background 0.2s" }}>
        <span style={{ color: S.gray }}>{t.date}</span>
        <span style={{ color: t.type === "BUY" ? "#4CAF50" : S.red, fontWeight: 700 }}>{t.type}</span>
        <span style={{ fontWeight: 600 }}>{t.asset}{t.ticker ? ` (${t.ticker})` : ''}</span>
        <span style={{ color: S.gray }}>{t.sector}</span>
        <span style={{ textAlign: "right" }}>{typeof t.amount === 'number' ? fmt(t.amount) : t.amount}</span>
      </div>
    ))}
  </div>
)}
{!loadingTrades && trades.length > 0 && (
  <div style={{ marginTop: 10, fontSize: 11, color: S.gray }}>
    * Official STOCK Act disclosures. Source: {trades[0]?.source || 'House Clerk / Senate.gov'}
  </div>
)}
```

Also update the two stat cards at the top of the wealth tab — when `isLive` and no net worth data exists, show a message instead of broken values:

Find the two stat cards (netWorthBefore / netWorthCurrent) and wrap them:

```jsx
{rep.netWorthBefore ? (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
    <div style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Net Worth Before Office</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 26, color: "#90EE90" }}>{fmt(rep.netWorthBefore)}</div>
    </div>
    <div style={{ padding: 20, background: "rgba(178,34,52,0.1)", border: "1px solid rgba(178,34,52,0.3)", borderRadius: 12 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 8 }}>Current Net Worth</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 26, color: "#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</div>
      <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 4 }}>+{enr.pct}% in {rep.yearsInOffice} years</div>
    </div>
  </div>
) : (
  <div style={{ padding: 18, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 20, fontSize: 13, color: S.gray, textAlign: 'center' }}>
    Net worth data not available. Financial disclosures are self-reported annually.{' '}
    <a href={`https://disclosures-clerk.house.gov/FinancialDisclosure`} target="_blank" rel="noreferrer" style={{ color: S.gold }}>View official filings →</a>
  </div>
)}
```

---

## Step 4 — Update the bio tab

Find `{repTab === "bio" && (`. Replace the entire content inside with:

```jsx
{repTab === "bio" && (
  <div className="slide-in">
    {loadingBio && (
      <div style={{ textAlign: 'center', padding: 48, color: S.gray }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
        Loading member details…
      </div>
    )}
    {!loadingBio && (
      <>
        <div style={{ padding: 22, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Biography</div>
          <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.8 }}>
            {liveBio ? (
              <>
                {rep.name} represents {rep.state} in the {rep.title === 'U.S. Senator' ? 'U.S. Senate' : 'U.S. House of Representatives'}.
                {liveBio.birthYear ? ` Born ${liveBio.birthYear}.` : ''}
                {liveBio.terms?.length ? ` Has served ${liveBio.terms.length} term${liveBio.terms.length > 1 ? 's' : ''} in Congress.` : ''}
                {liveBio.leadership?.length ? ` Leadership roles: ${liveBio.leadership.map(l => l.type).join(', ')}.` : ''}
              </>
            ) : rep.bio}
          </p>
          {liveBio?.officialWebsiteUrl && (
            <a href={liveBio.officialWebsiteUrl} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 12, padding: '7px 16px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
              Official Website →
            </a>
          )}
        </div>

        {/* Sponsored Legislation */}
        {liveSponsored && liveSponsored.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Recently Sponsored Legislation</div>
            {liveSponsored.map((b, i) => (
              <div key={i} style={{ padding: '12px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, marginBottom: 3 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: S.gray }}>{b.number} · {b.latestActionDate} · {b.policyArea}</div>
                  {b.latestAction && <div style={{ fontSize: 11, color: S.gold, marginTop: 3 }}>{b.latestAction}</div>}
                </div>
                <a href={b.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: S.gold, border: `1px solid ${S.border}`, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', textDecoration: 'none' }}>
                  View →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Peer comparison — show for mock reps only */}
        {Object.keys(rep.peerComparison || {}).length > 0 && (
          <>
            <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 14 }}>Issue Comparison vs. Direct Peers</div>
            {Object.entries(rep.peerComparison).map(([issue, vals]) => (
              <div key={issue} style={{ padding: 16, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, textTransform: "capitalize", fontSize: 14 }}>{issue}</span>
                  <span style={{ fontSize: 12, color: S.gray }}><span style={{ color: S.gold }}>This Rep: {vals.self}%</span> · Peers: {vals.peers}%</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>{rep.name.split(" ").pop()}</div>
                  <div className="progress-bar"><div className="progress-fill bar-fill" style={{ width: `${vals.self}%`, background: `linear-gradient(90deg, ${S.gold}, ${S.red})` }} /></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: S.gray, marginBottom: 4 }}>Peer Average</div>
                  <div className="progress-bar"><div className="progress-fill bar-fill" style={{ width: `${vals.peers}%`, background: "rgba(255,255,255,0.25)" }} /></div>
                </div>
              </div>
            ))}
          </>
        )}
      </>
    )}
  </div>
)}
```

---

## Step 5 — Update the docket tab

Find `{repTab === "docket" && (`. Wrap the existing content with an isLive check:

```jsx
{repTab === "docket" && (
  <div className="slide-in">
    {isLive && rep.docket.length === 0 ? (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14, color: S.gray, marginBottom: 6 }}>Real-time floor schedule coming soon.</div>
        <div style={{ fontSize: 12, color: S.gray, marginBottom: 16 }}>Legislative docket data requires the LegiScan API, currently pending approval.</div>
        <a href={rep.website} target="_blank" rel="noreferrer"
          style={{ padding: '8px 20px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
          View on Congress.gov →
        </a>
      </div>
    ) : (
      /* existing docket JSX unchanged below this line */
      <>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase" }}>Today's Legislative Docket</div>
          <div style={{ fontSize: 11, color: S.gold }}>🔄 Synced with Congress.gov</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
          <div style={{ position: "absolute", left: 90, top: 20, bottom: 20, width: 2, background: `linear-gradient(to bottom, ${S.gold}, transparent)` }} />
          {rep.docket.map((d, i) => {
            const typeStyle = {
              hearing: { bg: "rgba(91,156,255,0.1)", border: "rgba(91,156,255,0.3)", icon: "🎤", color: "#5B9CFF" },
              vote: { bg: "rgba(212,175,55,0.1)", border: S.border, icon: "⚖️", color: S.gold },
              meeting: { bg: "rgba(144,238,144,0.08)", border: "rgba(144,238,144,0.2)", icon: "🤝", color: "#90EE90" },
              press: { bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.2)", icon: "📰", color: "#FF6B6B" },
            }[d.type]
            return (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ minWidth: 80, textAlign: "right", fontSize: 12, color: S.gold, fontWeight: 600 }}>{d.time}</div>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: typeStyle.color, border: `2px solid ${S.navy}`, zIndex: 1, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "12px 14px", background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>{typeStyle.icon}</span>
                  <div>
                    <div style={{ fontSize: 13 }}>{d.item}</div>
                    <div style={{ fontSize: 11, color: typeStyle.color, textTransform: "uppercase", letterSpacing: 1 }}>{d.type}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )}
  </div>
)}
```

---

## Step 6 — Update the town hall tab

Find `{repTab === "townhall" && (`. Wrap with isLive check at the top:

```jsx
{isLive && rep.townHall.length === 0 ? (
  <div style={{ textAlign: 'center', padding: 48 }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
    <div style={{ fontSize: 14, color: S.gray, marginBottom: 6 }}>Town hall data not available via API.</div>
    <div style={{ fontSize: 12, color: S.gray, marginBottom: 16 }}>Check the member's official website for upcoming events.</div>
    <a href={rep.website} target="_blank" rel="noreferrer"
      style={{ padding: '8px 20px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
      Visit Official Website →
    </a>
  </div>
) : (
  /* existing townhall JSX unchanged */
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
    ...existing content...
  </div>
)}
```
