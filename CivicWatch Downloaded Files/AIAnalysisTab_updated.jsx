// ─── UPDATED AIAnalysisTab ────────────────────────────────────────────────────
// Replace the AIAnalysisTab function in CivicWatch.jsx with this version.
// The only change from the previous version is the runAnalysis function —
// it now calls /api/analyze-rep instead of api.anthropic.com directly.
// ─────────────────────────────────────────────────────────────────────────────

function AIAnalysisTab({ rep, S }) {
  const { user } = useUser()
  const [status, setStatus] = useState('idle') // idle | loading | preview | full | error
  const [preview, setPreview] = useState('')
  const [fullReport, setFullReport] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isPro = user?.publicMetadata?.isPro === true

  const runAnalysis = async (mode) => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/analyze-rep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, rep }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Analysis failed.')
        setStatus('error')
        return
      }

      if (mode === 'preview') {
        setPreview(data.text)
        setStatus('preview')
      } else {
        setFullReport(data.text)
        setStatus('full')
      }
    } catch (err) {
      console.error('analyze-rep error:', err)
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  // ── IDLE ───────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 24 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${S.navyMid}, #0A0E1E)`, border: `2px solid ${S.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, boxShadow: `0 0 32px rgba(212,175,55,0.2)` }}>
          🤖
        </div>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            AI Accountability Analysis
          </div>
          <p style={{ fontSize: 13, color: S.gray, lineHeight: 1.8 }}>
            Get a nonpartisan AI-generated report on {rep.name.split(' ').pop()}'s voting record,
            stock trades, wealth trajectory, and peer standing — written in plain English.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '⚖️', label: 'Voting Patterns' },
            { icon: '💰', label: 'Trade Conflicts' },
            { icon: '📈', label: 'Wealth Growth' },
            { icon: '🔍', label: 'Peer Comparison' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '8px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 30, fontSize: 12, color: S.grayLight, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>
        <button
          onClick={() => runAnalysis('preview')}
          style={{ padding: '13px 32px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: 'none', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5, boxShadow: `0 4px 20px rgba(178,34,52,0.35)` }}>
          Generate Analysis →
        </button>
        <div style={{ fontSize: 11, color: S.gray }}>Free preview · Full report requires Pro</div>
      </div>
    )
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="slide-in" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${S.border}`, borderTopColor: S.gold, animation: 'spin 0.9s linear infinite' }} />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: S.gold }}>Analyzing {rep.name.split(' ').pop()}…</div>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Reviewing voting record…', 'Cross-referencing trade disclosures…', 'Calculating wealth trajectory…'].map((label, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: S.gold, opacity: 0.6 }} />
              <div className="ai-shimmer" style={{ flex: 1, height: 14, borderRadius: 4 }} />
              <div style={{ fontSize: 11, color: S.gray, minWidth: 220 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="slide-in" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 14, color: S.gray, marginBottom: 16 }}>{errorMsg || 'Analysis failed. Please try again.'}</div>
        <button onClick={() => setStatus('idle')} style={{ padding: '9px 20px', background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, cursor: 'pointer', fontFamily: 'inherit' }}>
          Try Again
        </button>
      </div>
    )
  }

  // ── PREVIEW (free) ─────────────────────────────────────────────────────────
  if (status === 'preview') {
    return (
      <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 4 }}>AI Accountability Report</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18 }}>{rep.name}</div>
          </div>
          <div style={{ padding: '4px 12px', background: 'rgba(91,156,255,0.1)', border: '1px solid rgba(91,156,255,0.3)', borderRadius: 20, fontSize: 11, color: '#5B9CFF', fontWeight: 600 }}>
            FREE PREVIEW
          </div>
        </div>

        {/* Visible preview paragraph */}
        <div style={{ padding: 20, background: `linear-gradient(145deg, rgba(27,42,107,0.5), rgba(10,14,30,0.8))`, border: `1px solid ${S.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 11, color: S.gold, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Claude AI · Nonpartisan Analysis</span>
          </div>
          <p style={{ fontSize: 14, color: S.offWhite, lineHeight: 1.85, margin: 0 }}>{preview}</p>
        </div>

        {/* Blurred locked teaser */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          <div className="ai-blur" style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
            <p style={{ fontSize: 14, color: S.offWhite, lineHeight: 1.85, margin: 0 }}>
              Regarding stock trades, {rep.name.split(' ').pop()} disclosed {rep.trades.length} transactions totaling significant activity in sectors directly related to their committee assignments. The timing of several purchases raises questions about information asymmetry that warrant closer examination by oversight bodies.
            </p>
            <p style={{ fontSize: 14, color: S.offWhite, lineHeight: 1.85, margin: '12px 0 0' }}>
              On wealth accumulation, a {(((rep.netWorthCurrent - rep.netWorthBefore) / rep.netWorthBefore) * 100).toFixed(0)}% increase over {rep.yearsInOffice} years in office significantly outpaces typical congressional wealth growth. Peer comparison data reveals their issue positioning as notably divergent in key areas.
            </p>
          </div>
          {/* Lock overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(10,14,30,0.6)', backdropFilter: 'blur(2px)', borderRadius: 12 }}>
            <div style={{ fontSize: 28 }}>🔒</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, textAlign: 'center' }}>Full Report · Pro Members Only</div>
            <p style={{ fontSize: 12, color: S.gray, textAlign: 'center', maxWidth: 280, margin: 0 }}>
              Unlock trade conflict analysis, wealth trajectory deep-dive, peer standing breakdown, and overall accountability rating.
            </p>
            {isPro ? (
              <button
                onClick={() => runAnalysis('full')}
                style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: 'none', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Generate Full Report →
              </button>
            ) : (
              <button
                onClick={() => (window.location.href = '/api/subscribe')}
                style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, border: 'none', borderRadius: 10, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5 }}>
                ★ Upgrade to Pro · $9.99/mo
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: S.gray, textAlign: 'center' }}>
          Analysis powered by Claude AI · For informational purposes only · Not legal or financial advice
        </div>
      </div>
    )
  }

  // ── FULL REPORT (pro) ──────────────────────────────────────────────────────
  if (status === 'full') {
    const paragraphs = fullReport.split(/\n\n+/).filter((p) => p.trim())
    const sectionIcons = ['⚖️', '💰', '📈', '🔍', '📋']
    const sectionLabels = ['Voting Record', 'Financial Activity', 'Wealth Trajectory', 'Peer Standing', 'Summary']
    const lastPara = paragraphs[paragraphs.length - 1] || ''
    const ratingMatch = lastPara.match(/\b(Low|Medium|High|Very High)\b/i)
    const rating = ratingMatch ? ratingMatch[1] : null
    const ratingColor = { Low: '#4CAF50', Medium: S.gold, High: '#FF9800', 'Very High': S.red }[rating] || S.gray

    return (
      <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 4 }}>Full AI Accountability Report</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18 }}>{rep.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {rating && (
              <div style={{ padding: '6px 14px', background: `${ratingColor}22`, border: `1px solid ${ratingColor}55`, borderRadius: 20, fontSize: 12, color: ratingColor, fontWeight: 700 }}>
                ⚠️ {rating} Concern
              </div>
            )}
            <div style={{ padding: '4px 12px', background: 'rgba(212,175,55,0.12)', border: `1px solid ${S.gold}`, borderRadius: 20, fontSize: 11, color: S.gold, fontWeight: 600 }}>
              PRO REPORT
            </div>
          </div>
        </div>
        {paragraphs.map((para, i) => (
          <div key={i} className="ai-line" style={{ animationDelay: `${i * 0.1}s`, padding: 20, background: i === paragraphs.length - 1 ? `linear-gradient(145deg, rgba(178,34,52,0.08), rgba(10,14,30,0.6))` : S.cardBg, border: `1px solid ${i === paragraphs.length - 1 ? 'rgba(178,34,52,0.3)' : S.border}`, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{sectionIcons[i] || '📋'}</span>
              <span style={{ fontSize: 10, letterSpacing: 2, color: S.gold, textTransform: 'uppercase', fontWeight: 600 }}>{sectionLabels[i] || `Section ${i + 1}`}</span>
            </div>
            <p style={{ fontSize: 14, color: S.offWhite, lineHeight: 1.85, margin: 0 }}>{para}</p>
          </div>
        ))}
        <div style={{ padding: '10px 16px', background: 'rgba(27,42,107,0.3)', border: `1px solid ${S.border}`, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: S.gray }}>
            🤖 Powered by Claude AI · Nonpartisan · For informational purposes only
          </div>
          <button onClick={() => setStatus('idle')} style={{ padding: '6px 14px', background: 'none', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
            Regenerate
          </button>
        </div>
      </div>
    )
  }

  return null
}
