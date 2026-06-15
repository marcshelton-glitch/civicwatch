// ─── REPLACE ENTIRE RepDetail FUNCTION ───────────────────────────────────────
// In CivicWatch.jsx, find:
//   function RepDetail({ rep, onBack, tracked, ...
// and delete everything from that line all the way down to (but NOT including):
//   function AIAnalysisTab({ rep, S }) {
// Then paste this entire block in its place.
// ─────────────────────────────────────────────────────────────────────────────

function RepDetail({ rep, onBack, tracked, toggleTrack, repTab, setRepTab, pollVotes, handlePollVote, S }) {
  const [liveVotes, setLiveVotes] = useState(null)
  const [liveTrades, setLiveTrades] = useState(null)
  const [liveBio, setLiveBio] = useState(null)
  const [liveSponsored, setLiveSponsored] = useState(null)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [loadingTrades, setLoadingTrades] = useState(false)
  const [loadingBio, setLoadingBio] = useState(false)

  const isLive = rep.isLive

  useEffect(() => {
    if (repTab === 'votes' && isLive && !liveVotes && !loadingVotes) {
      setLoadingVotes(true)
      fetch(`/api/congress?type=votes&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveVotes(d.votes || []); setLoadingVotes(false) })
        .catch(() => { setLiveVotes([]); setLoadingVotes(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (repTab === 'wealth' && isLive && !liveTrades && !loadingTrades) {
      setLoadingTrades(true)
      fetch(`/api/congress?type=trades&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveTrades(d.trades || []); setLoadingTrades(false) })
        .catch(() => { setLiveTrades([]); setLoadingTrades(false) })
    }
  }, [repTab, rep.id])

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
  const isTracked = tracked.includes(rep.id)

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "votes", label: "Votes" },
    { id: "docket", label: "Today's Docket" },
    { id: "wealth", label: "Wealth & Trades" },
    { id: "bio", label: "Bio & Compare" },
    { id: "townhall", label: "Town Hall" },
    { id: "ai", label: "🤖 AI Analysis" },
  ]

  return (
    <div className="slide-in">
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1px solid ${S.border}`, color: S.gray, cursor: "pointer", padding: "8px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, marginBottom: 20 }}>
        ← Back
      </button>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, rgba(27,42,107,0.8), rgba(10,14,30,0.95))`, border: `1px solid ${S.border}`, borderRadius: 20, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div className="star-pattern" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div style={{ position: "relative", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <img src={rep.photo} alt={rep.name} style={{ width: 90, height: 90, borderRadius: "50%", border: `4px solid ${S.gold}`, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>{rep.name}</div>
            <div style={{ fontSize: 13, color: S.gold, marginBottom: 8 }}>{rep.title} · {rep.state} · {rep.district}</div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: S.grayLight, flexWrap: "wrap" }}>
              <span>🏛️ {rep.officeLocation}</span>
              <span>🕐 {rep.officeHours}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={`tel:${rep.phone}`} style={{ padding: "9px 16px", background: S.green, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>📞 {rep.phone}</a>
            <a href={rep.email ? `mailto:${rep.email}` : rep.website} target={rep.email ? undefined : "_blank"} rel="noreferrer" style={{ padding: "9px 16px", background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>✉️ {rep.email ? 'Email' : 'Contact'}</a>
            <a href={rep.website} target="_blank" rel="noreferrer" style={{ padding: "9px 16px", background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 10, color: S.gold, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>🌐 Website</a>
            <button onClick={() => toggleTrack(rep.id)} style={{ padding: "9px 16px", background: isTracked ? `rgba(212,175,55,0.15)` : "rgba(255,255,255,0.05)", border: `1px solid ${isTracked ? S.gold : S.border}`, borderRadius: 10, color: isTracked ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
              {isTracked ? "★ Tracking" : "☆ Track"}
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} className={`rep-tab ${repTab === t.id ? "active" : ""}`}
            onClick={() => setRepTab(t.id)}
            style={{ padding: "8px 14px", border: `1px solid ${repTab === t.id ? "transparent" : S.border}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: repTab === t.id ? S.red : t.id === "ai" ? `rgba(212,175,55,0.08)` : S.cardBg, color: repTab === t.id ? "white" : t.id === "ai" ? S.gold : S.gray, transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {repTab === "overview" && (
        <div className="slide-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Wealth Change</div>
            {rep.netWorthBefore ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div><div style={{ fontSize: 10, color: S.gray }}>Before</div><div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18 }}>{fmt(rep.netWorthBefore)}</div></div>
                  <div><div style={{ fontSize: 10, color: S.gray }}>Current</div><div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</div></div>
                </div>
                <div style={{ padding: "6px 10px", background: "rgba(178,34,52,0.1)", borderRadius: 6, textAlign: "center", fontSize: 13, color: "#FF6B6B", fontWeight: 700 }}>+{enr.pct}% · {fmt(enr.delta)} gained</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: S.gray }}>Net worth data not available for this member.</div>
            )}
          </div>
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Recent Votes</div>
            {rep.votes.slice(0, 3).map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: S.grayLight, flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.bill.split(" – ")[1] || v.bill.split(" - ")[1] || v.bill}</span>
                <span className={v.vote === "YEA" ? "vote-yea" : "vote-nay"} style={{ fontWeight: 700 }}>{v.vote}</span>
              </div>
            ))}
            {rep.votes.length === 0 && <div style={{ fontSize: 12, color: S.gray }}>No votes loaded yet — click the Votes tab.</div>}
          </div>
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Today's Schedule</div>
            {rep.docket.length > 0 ? rep.docket.slice(0, 3).map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: S.gold, minWidth: 58 }}>{d.time}</span>
                <span style={{ fontSize: 12, color: S.grayLight }}>{d.item}</span>
              </div>
            )) : <div style={{ fontSize: 12, color: S.gray }}>Schedule data coming soon via LegiScan.</div>}
          </div>
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Latest Trades</div>
            {rep.trades.slice(0, 3).map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: t.type === "BUY" ? "#4CAF50" : S.red, fontWeight: 700 }}>{t.type}</span>
                <span style={{ color: S.grayLight }}>{t.asset}</span>
                <span>{typeof t.amount === 'number' ? fmt(t.amount) : t.amount}</span>
              </div>
            ))}
            {rep.trades.length === 0 && <div style={{ fontSize: 12, color: S.gray }}>No trades loaded yet — click Wealth & Trades tab.</div>}
          </div>
        </div>
      )}

      {/* ── VOTES ── */}
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

      {/* ── DOCKET ── */}
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

      {/* ── WEALTH & TRADES ── */}
      {repTab === "wealth" && (
        <div className="slide-in">
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
              <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noreferrer" style={{ color: S.gold }}>View official filings →</a>
            </div>
          )}

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
            <>
              <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${S.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 70px 1fr 80px 100px", padding: "10px 16px", background: S.navyMid, fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: "uppercase" }}>
                  <span>Date</span><span>Type</span><span>Asset</span><span>Sector</span><span style={{ textAlign: "right" }}>Amount</span>
                </div>
                {trades.map((t, i) => (
                  <div key={i} className="trade-row" style={{ display: "grid", gridTemplateColumns: "110px 70px 1fr 80px 100px", padding: "12px 16px", borderTop: `1px solid ${S.border}`, fontSize: 13 }}>
                    <span style={{ color: S.gray }}>{t.date}</span>
                    <span style={{ color: t.type === "BUY" ? "#4CAF50" : S.red, fontWeight: 700 }}>{t.type}</span>
                    <span style={{ fontWeight: 600 }}>{t.asset}{t.ticker ? ` (${t.ticker})` : ''}</span>
                    <span style={{ color: S.gray }}>{t.sector}</span>
                    <span style={{ textAlign: "right" }}>{typeof t.amount === 'number' ? fmt(t.amount) : t.amount}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: S.gray }}>
                * Official STOCK Act disclosures. Source: {trades[0]?.source || 'House Clerk / Senate.gov'}
              </div>
            </>
          )}
          {!loadingTrades && trades.length > 0 && !isLive && (
            <div style={{ marginTop: 10, fontSize: 11, color: S.gray }}>* Required STOCK Act disclosures. Source: SEC EDGAR / efts.sec.gov</div>
          )}
        </div>
      )}

      {/* ── BIO & COMPARE ── */}
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
                {rep.peers?.length > 0 && <div style={{ marginTop: 10, fontSize: 12, color: S.gray }}>Peers: {rep.peers.join(" · ")}</div>}
              </div>

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

      {/* ── TOWN HALL ── */}
      {repTab === "townhall" && (
        <div className="slide-in">
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 14 }}>Upcoming Events</div>
                {rep.townHall.map((ev, i) => (
                  <div key={i} style={{ marginBottom: 14, padding: 16, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{ev.event}</div>
                    <div style={{ fontSize: 12, color: S.gray, marginBottom: 10 }}>📅 {ev.date} · 📍 {ev.location}</div>
                    <a href={ev.rsvpLink} style={{ display: "inline-block", padding: "7px 16px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, borderRadius: 8, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>RSVP →</a>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 14 }}>Community Priority Poll</div>
                <div style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: S.grayLight, marginBottom: 16 }}>What should {rep.name.split(" ").pop()} prioritize?</div>
                  {Object.entries(rep.communityPoll).map(([issue, count]) => {
                    const hasVoted = pollVotes[`${rep.id}-${issue}`]
                    const total = Object.values(rep.communityPoll).reduce((a, b) => a + b, 0)
                    const pct = Math.round((count / total) * 100)
                    return (
                      <div key={issue} style={{ marginBottom: 14, opacity: hasVoted ? 0.7 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ textTransform: "capitalize", fontSize: 13 }}>{issue}</span>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: S.gray }}>{count} · {pct}%</span>
                            {!hasVoted && (
                              <button onClick={() => handlePollVote(rep.id, issue)}
                                style={{ padding: "3px 10px", background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 6, color: S.gold, cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="progress-bar"><div className="progress-fill bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${S.gold}, ${S.red})` }} /></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI ANALYSIS ── */}
      {repTab === "ai" && (
        <AIAnalysisTab rep={rep} S={S} />
      )}
    </div>
  )
}
