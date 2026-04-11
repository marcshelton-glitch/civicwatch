'use client'
import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

const REPS = [
  {
    id: 1, name: "Sen. Margaret A. Collins", title: "U.S. Senator",
    party: "Democrat", state: "California", district: "Statewide", level: "federal",
    photo: "https://i.pravatar.cc/150?img=47",
    email: "senator.collins@senate.gov", phone: "(202) 224-3553",
    website: "https://senate.gov", officeHours: "Mon–Fri 9am–5pm",
    officeLocation: "Hart Senate Office Building, Rm 702, Washington DC",
    bio: "Sen. Collins has served since 2010. Former state AG, Stanford Law graduate. Focuses on healthcare, climate legislation, and tech regulation.",
    peers: ["Sen. R. Thompson (R-TX)", "Sen. D. Martinez (D-FL)"],
    peerComparison: { healthcare: { self: 92, peers: 44 }, climate: { self: 88, peers: 31 }, defense: { self: 55, peers: 79 }, economy: { self: 67, peers: 71 } },
    netWorthBefore: 1200000, netWorthCurrent: 8700000, yearsInOffice: 15,
    trades: [
      { date: "2024-11-12", asset: "NVDA", type: "BUY", amount: 45000, sector: "Tech" },
      { date: "2024-09-03", asset: "ETH", type: "BUY", amount: 22000, sector: "Crypto" },
      { date: "2024-07-19", asset: "PFE", type: "SELL", amount: 31000, sector: "Pharma" },
    ],
    votes: [
      { bill: "H.R. 1447 - Inflation Reduction Act", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-08-12" },
      { bill: "S. 2134 - Healthcare Expansion Act", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-06-05" },
      { bill: "H.R. 899 - Border Security Act", vote: "NAY", outcome: "FAILED", link: "https://congress.gov", date: "2024-04-22" },
    ],
    docket: [
      { time: "9:00 AM", item: "Senate Judiciary Hearing: AI Regulation", type: "hearing" },
      { time: "11:30 AM", item: "Floor Vote: S. 3321 – Clean Energy Act", type: "vote" },
      { time: "2:00 PM", item: "Constituent Meeting: CA Tech Alliance", type: "meeting" },
    ],
    townHall: [
      { date: "2025-04-10", event: "Open Town Hall – San Francisco City Hall", location: "SF, CA", rsvpLink: "#" },
      { date: "2025-04-24", event: "Virtual Town Hall – Q&A Session", location: "Online", rsvpLink: "#" },
    ],
    communityPoll: { healthcare: 412, climate: 289, housing: 341, education: 198 },
  },
  {
    id: 2, name: "Rep. James T. Harrington", title: "U.S. Representative",
    party: "Republican", state: "California", district: "CA-33", level: "federal",
    photo: "https://i.pravatar.cc/150?img=52",
    email: "rep.harrington@house.gov", phone: "(202) 225-4576",
    website: "https://house.gov", officeHours: "Mon–Thu 9am–4pm",
    officeLocation: "Cannon HOB, Rm 210, Washington DC",
    bio: "Rep. Harrington has served since 2016. Retired Army Colonel. Focuses on border security, veterans affairs, and deregulation.",
    peers: ["Rep. S. Wallace (D-CA)", "Rep. T. Nguyen (R-TX)"],
    peerComparison: { healthcare: { self: 38, peers: 61 }, climate: { self: 22, peers: 44 }, defense: { self: 91, peers: 55 }, economy: { self: 85, peers: 66 } },
    netWorthBefore: 2100000, netWorthCurrent: 5400000, yearsInOffice: 9,
    trades: [
      { date: "2024-12-01", asset: "LMT", type: "BUY", amount: 67000, sector: "Defense" },
      { date: "2024-10-15", asset: "BTC", type: "BUY", amount: 15000, sector: "Crypto" },
      { date: "2024-08-08", asset: "XOM", type: "BUY", amount: 41000, sector: "Energy" },
    ],
    votes: [
      { bill: "H.R. 1447 - Inflation Reduction Act", vote: "NAY", outcome: "PASSED", link: "https://congress.gov", date: "2024-08-12" },
      { bill: "H.R. 3301 - Veterans Benefits Act", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-07-18" },
      { bill: "H.R. 899 - Border Security Act", vote: "YEA", outcome: "FAILED", link: "https://congress.gov", date: "2024-04-22" },
    ],
    docket: [
      { time: "10:00 AM", item: "Armed Services Subcommittee Briefing", type: "hearing" },
      { time: "1:00 PM", item: "Floor Vote: H.R. 4412 – Veterans Housing", type: "vote" },
      { time: "3:30 PM", item: "Meeting: Defense Contractors Caucus", type: "meeting" },
    ],
    townHall: [
      { date: "2025-04-15", event: "Town Hall – Pasadena Convention Center", location: "Pasadena, CA", rsvpLink: "#" },
    ],
    communityPoll: { veterans: 378, border: 312, economy: 289, education: 145 },
  },
  {
    id: 3, name: "Councilwoman Diana M. Rivera", title: "City Council Member",
    party: "Democrat", state: "California", district: "District 8 – Los Angeles", level: "municipal",
    photo: "https://i.pravatar.cc/150?img=48",
    email: "diana.rivera@lacity.org", phone: "(213) 485-3378",
    website: "https://lacity.org", officeHours: "Tue–Fri 9am–3pm",
    officeLocation: "200 N Spring St, Los Angeles, CA 90012",
    bio: "Councilwoman Rivera has served District 8 since 2018. Former public school teacher. Focuses on affordable housing, transit access, and public safety reform.",
    peers: ["CM J. Lee (R-D4)", "CM P. Okafor (D-D6)"],
    peerComparison: { housing: { self: 95, peers: 62 }, transit: { self: 87, peers: 55 }, publicsafety: { self: 61, peers: 78 }, budget: { self: 72, peers: 65 } },
    netWorthBefore: 145000, netWorthCurrent: 890000, yearsInOffice: 7,
    trades: [
      { date: "2024-11-05", asset: "REIT Index", type: "BUY", amount: 12000, sector: "Real Estate" },
      { date: "2024-07-14", asset: "MSFT", type: "BUY", amount: 8000, sector: "Tech" },
    ],
    votes: [
      { bill: "Motion 23-0412 – Affordable Housing Bonds", vote: "YEA", outcome: "PASSED", link: "#", date: "2024-09-10" },
      { bill: "Motion 24-0102 – Metro Expansion Fund", vote: "YEA", outcome: "PASSED", link: "#", date: "2024-03-05" },
      { bill: "Motion 23-0891 – Police Dept Budget Increase", vote: "NAY", outcome: "PASSED", link: "#", date: "2024-01-22" },
    ],
    docket: [
      { time: "9:30 AM", item: "Council Session: Housing Zoning Amendments", type: "hearing" },
      { time: "12:00 PM", item: "Vote: Metro Line Extension Budget", type: "vote" },
      { time: "2:30 PM", item: "Community Briefing: District 8 Safety Plan", type: "meeting" },
    ],
    townHall: [
      { date: "2025-04-08", event: "Community Forum – Lincoln Park Rec Center", location: "Los Angeles, CA", rsvpLink: "#" },
    ],
    communityPoll: { housing: 501, transit: 423, parks: 201, safety: 344 },
  },
]

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n)
const enrichment = (b, c) => ({ pct: ((c - b) / b * 100).toFixed(0), delta: c - b })

const S = {
  navy: "#0A1628", navyMid: "#1B2A6B", navyLight: "#243A8C",
  red: "#B22234", gold: "#D4AF37", white: "#F8F9FF",
  gray: "#8892A4", grayLight: "#CDD2E0", green: "#1A7A4A",
  cardBg: "rgba(255,255,255,0.04)", border: "rgba(212,175,55,0.25)",
}

export default function CivicWatch() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState("reps")
  const [selectedRep, setSelectedRep] = useState(null)
  const [repTab, setRepTab] = useState("overview")
  const [tracked, setTracked] = useState([1])
  const [alerts, setAlerts] = useState([
    { id: 1, repId: 1, type: "vote", message: "Sen. Collins voted YEA on S. 3321 – Clean Energy Act", time: "2h ago", read: false },
    { id: 2, repId: 1, type: "trade", message: "Sen. Collins disclosed new trade: NVDA BUY $45,000", time: "1d ago", read: false },
    { id: 3, repId: 2, type: "docket", message: "Rep. Harrington added to Armed Services hearing docket", time: "3h ago", read: true },
    { id: 4, repId: 3, type: "townhall", message: "Councilwoman Rivera scheduled Town Hall – April 8", time: "5h ago", read: false },
  ])
  const [constitMode, setConstitMode] = useState("plain")
  const [constitSection, setConstitSection] = useState("articles")
  const [searchTerm, setSearchTerm] = useState("")
  const [pollVotes, setPollVotes] = useState({})
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterParty, setFilterParty] = useState("all")
  const [selectedState, setSelectedState] = useState("CA")
  const [liveReps, setLiveReps] = useState([])
  const [loadingReps, setLoadingReps] = useState(true)
  const [dataSource, setDataSource] = useState("loading")

  const unreadCount = alerts.filter(a => !a.read).length
  const displayReps = liveReps.length > 0 ? liveReps : REPS
  const filteredReps = displayReps.filter(r => {
    const matchLevel = filterLevel === "all" || r.level === filterLevel
    const matchParty = filterParty === "all" || r.party.toLowerCase() === filterParty
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.district.toLowerCase().includes(searchTerm.toLowerCase())
    return matchLevel && matchParty && matchSearch
  })

  useEffect(() => { if (selectedRep) setRepTab("overview") }, [selectedRep])

  useEffect(() => {
    const load = async () => {
      setLoadingReps(true)
      try {
        const res = await fetch(`/api/congress?type=members&state=${selectedState}`)
        const data = await res.json()
        if (data.members && data.members.length > 0) {
          setLiveReps(data.members.map(r => {
            const isSen = (r.chamber||'').toLowerCase().includes('senate')
            return {
              id: r.bioguideId, name: r.name,
              title: isSen ? 'U.S. Senator' : 'U.S. Representative',
              party: r.party||'Unknown', state: r.state||'', district: r.district||'Statewide',
              level: 'federal',
              photo: r.depiction || `https://bioguide.congress.gov/bioguide/photo/${r.bioguideId[0]}/${r.bioguideId}.jpg`,
              email: '', phone: isSen ? '(202) 224-3121' : '(202) 225-3121',
              website: r.url||'https://congress.gov', officeHours: 'Mon-Fri 9am-5pm',
              officeLocation: isSen ? 'U.S. Senate, Washington DC' : 'U.S. House, Washington DC',
              bio: `${r.name} represents ${r.state} in the ${r.chamber}.`,
              peers: [], peerComparison: {}, netWorthBefore: null, netWorthCurrent: null,
              yearsInOffice: null, trades: [], votes: [], docket: [], townHall: [],
              communityPoll: { healthcare:0, climate:0, housing:0, education:0 }, isLive: true,
            }
          }))
          setDataSource('live')
        } else { setDataSource('mock') }
      } catch { setDataSource('mock') }
      finally { setLoadingReps(false) }
    }
    load()
  }, [selectedState])

  return (
    <div style={{ fontFamily: "Georgia, serif", background: S.navy, minHeight: "100vh", color: S.white }}>
      <style>{`
        * { box-sizing: border-box; }
        .rep-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(178,34,52,0.3); }
        .nav-btn.active { border-bottom:2px solid ${S.gold}; color:${S.gold}; }
        .rep-tab-active { background:${S.red} !important; color:white !important; }
        .vote-yea { color:#4CAF50; }
        .vote-nay { color:${S.red}; }
        .star-pattern { background-image:radial-gradient(rgba(212,175,55,0.08) 1px,transparent 1px); background-size:24px 24px; }
        .slide-in { animation:slideIn 0.3s ease; }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .progress-bar { height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; }
        .progress-fill { height:100%; border-radius:4px; transition:width 1s ease; }
        .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
        .alert-unread { border-left:3px solid ${S.gold}; background:rgba(212,175,55,0.05); }
        .trade-row:hover { background:rgba(255,255,255,0.04); }
        .map-state { cursor:pointer; }
        .map-state:hover { filter:brightness(1.4); }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:${S.navy}} ::-webkit-scrollbar-thumb{background:${S.navyMid};border-radius:3px}
      `}</style>

      {/* HEADER */}
      <header style={{ background:`linear-gradient(135deg,#0A0E1E,${S.navyMid})`, borderBottom:`2px solid ${S.gold}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0" }}>
            <span style={{ fontSize:26 }}>🦅</span>
            <div>
              <div style={{ fontWeight:900, fontSize:18, letterSpacing:2 }}>CIVIC<span style={{ color:S.gold }}>WATCH</span></div>
              <div style={{ fontSize:9, letterSpacing:3, color:S.gray, textTransform:"uppercase" }}>Your Representatives. Accountable.</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:2 }}>
            {[["reps","My Reps"],["map","Map"],["alerts",`Alerts${unreadCount > 0 ? ` (${unreadCount})` : ""}`],["constitution","Constitution"]].map(([id,label]) => (
              <button key={id} className={`nav-btn ${activeTab === id ? "active" : ""}`}
                onClick={() => { setActiveTab(id); setSelectedRep(null) }}
                style={{ background:"none", border:"none", color:activeTab === id ? S.gold : S.gray, cursor:"pointer", padding:"8px 12px", fontSize:12, fontFamily:"inherit", letterSpacing:0.5, transition:"all 0.2s", borderBottom:`2px solid ${activeTab === id ? S.gold : "transparent"}`, fontWeight:activeTab === id ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:12, color:S.gray }}>👤 {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || ""}</div>
            <button onClick={() => signOut({ redirectUrl: "/" })}
              style={{ padding:"6px 12px", background:"rgba(178,34,52,0.2)", border:"1px solid rgba(178,34,52,0.4)", borderRadius:6, color:"#FF6B7A", cursor:"pointer", fontFamily:"inherit", fontSize:11 }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div style={{ height:4, background:`linear-gradient(90deg,${S.red} 33%,white 33%,white 66%,${S.navyMid} 66%)` }} />

      <main style={{ maxWidth:1200, margin:"0 auto", padding:"24px 16px" }}>

        {/* REPS LIST */}
        {activeTab === "reps" && !selectedRep && (
          <div className="slide-in">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontWeight:900, fontSize:26, marginBottom:6 }}>My Representatives</h1>
              <p style={{ fontSize:13, color:S.gray }}>Find, track, and contact your elected officials at every level of government.</p>
              <div style={{ marginTop:10, height:2, background:`linear-gradient(90deg,${S.red},transparent)`, borderRadius:2 }} />
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
              <input placeholder="🔍 Search by name or district…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ flex:"1 1 200px", padding:"10px 14px", background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:8, color:S.white, fontFamily:"inherit", fontSize:13, outline:"none" }} />
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                style={{ padding:'10px 14px', background:S.navyMid, border:`1px solid ${S.gold}`, borderRadius:8, color:S.gold, fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                {[['CA','California'],['TX','Texas'],['FL','Florida'],['NY','New York'],['IL','Illinois'],['AZ','Arizona'],['WA','Washington'],['CO','Colorado'],['GA','Georgia'],['OH','Ohio'],['NC','North Carolina'],['PA','Pennsylvania'],['VA','Virginia'],['NV','Nevada'],['OR','Oregon']].map(([a,n]) => (
                  <option key={a} value={a}>{n}</option>
                ))}
              </select>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                style={{ padding:"10px 14px", background:S.navyMid, border:`1px solid ${S.border}`, borderRadius:8, color:S.white, fontFamily:"inherit", fontSize:13 }}>
                <option value="all">All Levels</option>
                <option value="federal">Federal</option>
                <option value="municipal">Municipal</option>
              </select>
              <select value={filterParty} onChange={e => setFilterParty(e.target.value)}
                style={{ padding:"10px 14px", background:S.navyMid, border:`1px solid ${S.border}`, borderRadius:8, color:S.white, fontFamily:"inherit", fontSize:13 }}>
                <option value="all">All Parties</option>
                <option value="democrat">Democrat</option>
                <option value="republican">Republican</option>
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:20 }}>
              {filteredReps.map(rep => {
                const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
                const isTracked = tracked.includes(rep.id)
                return (
                  <div key={rep.id} className="rep-card"
                    style={{ background:`linear-gradient(145deg,rgba(27,42,107,0.6),rgba(10,14,30,0.9))`, border:`1px solid ${S.border}`, borderRadius:16, padding:20, transition:"all 0.3s", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:rep.party === "Democrat" ? "#5B9CFF" : S.red }} />
                    <div style={{ display:"flex", gap:14, marginBottom:14 }}>
                      <div style={{ position:"relative" }}>
                        <img src={rep.photo} alt={rep.name} style={{ width:66, height:66, borderRadius:"50%", border:`3px solid ${S.gold}`, objectFit:"cover" }} />
                        {isTracked && <div style={{ position:"absolute", bottom:0, right:-2, background:S.gold, borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>✓</div>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{rep.name}</div>
                        <div style={{ fontSize:11, color:S.gold, marginBottom:6 }}>{rep.title} · {rep.district}</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <span className="badge" style={{ background:rep.party === "Democrat" ? "rgba(0,80,200,0.2)" : "rgba(178,34,52,0.2)", color:rep.party === "Democrat" ? "#5B9CFF" : "#FF6B7A" }}>{rep.party}</span>
                          <span className="badge" style={{ background:"rgba(212,175,55,0.15)", color:S.gold }}>{rep.level}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ background:"rgba(178,34,52,0.1)", border:"1px solid rgba(178,34,52,0.3)", borderRadius:8, padding:"8px 12px", marginBottom:12, display: rep.netWorthBefore ? "flex" : "none", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:10, color:S.gray, marginBottom:1 }}>WEALTH CHANGE IN OFFICE</div>
                        <div style={{ fontSize:12 }}>{fmt(rep.netWorthBefore)} → <span style={{ color:"#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</span></div>
                      </div>
                      <div style={{ color:"#FF6B6B", fontWeight:700, fontSize:20 }}>+{enr.pct}%</div>
                    </div>
                    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                      <a href={`tel:${rep.phone}`} onClick={e => e.stopPropagation()}
                        style={{ flex:1, textAlign:"center", padding:"7px 0", background:S.green, borderRadius:8, fontSize:12, color:"white", textDecoration:"none", fontWeight:600 }}>📞 Call</a>
                      <a href={`mailto:${rep.email}`} onClick={e => e.stopPropagation()}
                        style={{ flex:1, textAlign:"center", padding:"7px 0", background:S.navyLight, borderRadius:8, fontSize:12, color:"white", textDecoration:"none", fontWeight:600 }}>✉️ Email</a>
                      <a href={rep.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ flex:1, textAlign:"center", padding:"7px 0", background:`rgba(212,175,55,0.15)`, borderRadius:8, fontSize:12, color:S.gold, textDecoration:"none", border:`1px solid ${S.border}`, fontWeight:600 }}>🌐 Web</a>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => setSelectedRep(rep)}
                        style={{ flex:1, padding:"9px 0", background:`linear-gradient(135deg,${S.red},${S.navyLight})`, border:"none", borderRadius:8, color:"white", cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:13 }}>
                        Full Profile →
                      </button>
                      <button onClick={() => setTracked(t => t.includes(rep.id) ? t.filter(x => x !== rep.id) : [...t, rep.id])}
                        style={{ padding:"9px 12px", background:isTracked ? `rgba(212,175,55,0.2)` : "rgba(255,255,255,0.05)", border:`1px solid ${S.border}`, borderRadius:8, color:isTracked ? S.gold : S.gray, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>
                        {isTracked ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* REP DETAIL */}
        {activeTab === "reps" && selectedRep && (
          <RepDetail rep={selectedRep} onBack={() => setSelectedRep(null)} tracked={tracked}
            toggleTrack={(id) => setTracked(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id])}
            repTab={repTab} setRepTab={setRepTab} pollVotes={pollVotes}
            handlePollVote={(repId, issue) => setPollVotes(p => ({ ...p, [`${repId}-${issue}`]: true }))} S={S} />
        )}

        {/* MAP */}
        {activeTab === "map" && (
          <div className="slide-in">
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontWeight:900, fontSize:26, marginBottom:6 }}>District Map</h1>
              <p style={{ fontSize:13, color:S.gray }}>Click a state to view its representatives.</p>
              <div style={{ marginTop:10, height:2, background:`linear-gradient(90deg,${S.red},transparent)` }} />
            </div>
            <MapView reps={REPS} setSelectedRep={setSelectedRep} setActiveTab={setActiveTab} S={S} />
          </div>
        )}

        {/* ALERTS */}
        {activeTab === "alerts" && (
          <div className="slide-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <h1 style={{ fontWeight:900, fontSize:26, marginBottom:6 }}>Track My Rep™ Alerts</h1>
                <p style={{ fontSize:13, color:S.gray }}>Notifications when your tracked reps vote, trade, or schedule events.</p>
                <div style={{ marginTop:10, height:2, background:`linear-gradient(90deg,${S.red},transparent)` }} />
              </div>
              <button onClick={() => setAlerts(a => a.map(x => ({ ...x, read: true })))}
                style={{ padding:"8px 16px", background:S.navyMid, border:`1px solid ${S.border}`, borderRadius:8, color:S.gold, cursor:"pointer", fontFamily:"inherit", fontSize:12, whiteSpace:"nowrap" }}>
                Mark All Read
              </button>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
              {REPS.map(r => (
                <div key={r.id} onClick={() => setTracked(t => t.includes(r.id) ? t.filter(x => x !== r.id) : [...t, r.id])}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", background:tracked.includes(r.id) ? `rgba(212,175,55,0.12)` : S.cardBg, border:`1px solid ${tracked.includes(r.id) ? S.gold : S.border}`, borderRadius:30, cursor:"pointer" }}>
                  <img src={r.photo} alt="" style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover" }} />
                  <span style={{ fontSize:12, color:tracked.includes(r.id) ? S.gold : S.gray }}>{r.name.split(" ").pop()}</span>
                  {tracked.includes(r.id) && <span style={{ color:S.gold, fontSize:11 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {alerts.map(alert => {
                const rep = REPS.find(r => r.id === alert.repId)
                const icons = { vote:"⚖️", trade:"💰", docket:"📋", townhall:"🏛️" }
                const colors = { vote:S.gold, trade:"#FF6B6B", docket:"#5B9CFF", townhall:"#90EE90" }
                return (
                  <div key={alert.id} className={alert.read ? "" : "alert-unread"}
                    style={{ padding:"14px 16px", background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:10, display:"flex", gap:12, alignItems:"center" }}>
                    <span style={{ fontSize:20 }}>{icons[alert.type]}</span>
                    <img src={rep?.photo} alt="" style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover" }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, marginBottom:2 }}>{alert.message}</div>
                      <div style={{ fontSize:11, color:S.gray }}>{alert.time}</div>
                    </div>
                    <span className="badge" style={{ background:`rgba(212,175,55,0.1)`, color:colors[alert.type], textTransform:"uppercase" }}>{alert.type}</span>
                    {!alert.read && <div style={{ width:8, height:8, borderRadius:"50%", background:S.gold, flexShrink:0 }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CONSTITUTION */}
        {activeTab === "constitution" && (
          <ConstitutionTab constitMode={constitMode} setConstitMode={setConstitMode} constitSection={constitSection} setConstitSection={setConstitSection} S={S} />
        )}
      </main>

      <footer style={{ marginTop:48, borderTop:`1px solid ${S.border}`, padding:"20px 16px", textAlign:"center" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${S.red} 33%,white 33%,white 66%,${S.navyMid} 66%)`, marginBottom:14, borderRadius:2 }} />
          <div style={{ color:S.gold, fontSize:13, marginBottom:4 }}>CivicWatch™ · A Democracy Accountability Platform</div>
          <div style={{ fontSize:11, color:S.gray }}>Data sourced from Congress.gov, OpenSecrets, SEC EDGAR, and official government records.</div>
        </div>
      </footer>
    </div>
  )
}

function RepDetail({ rep, onBack, tracked, toggleTrack, repTab, setRepTab, pollVotes, handlePollVote, S }) {
  const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
  const isTracked = tracked.includes(rep.id)
  const tabs = [["overview","Overview"],["votes","Votes"],["docket","Today's Docket"],["wealth","Wealth & Trades"],["bio","Bio & Compare"],["townhall","Town Hall"]]
  return (
    <div className="slide-in">
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:`1px solid ${S.border}`, color:S.gray, cursor:"pointer", padding:"8px 14px", borderRadius:8, fontFamily:"inherit", fontSize:12, marginBottom:20 }}>← Back</button>
      <div style={{ background:`linear-gradient(135deg,rgba(27,42,107,0.8),rgba(10,14,30,0.95))`, border:`1px solid ${S.border}`, borderRadius:20, padding:24, marginBottom:20, position:"relative", overflow:"hidden" }}>
        <div className="star-pattern" style={{ position:"absolute", inset:0, opacity:0.4 }} />
        <div style={{ position:"relative", display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
          <img src={rep.photo} alt={rep.name} style={{ width:88, height:88, borderRadius:"50%", border:`4px solid ${S.gold}`, objectFit:"cover" }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>{rep.name}</div>
            <div style={{ fontSize:13, color:S.gold, marginBottom:8 }}>{rep.title} · {rep.state} · {rep.district}</div>
            <div style={{ display:"flex", gap:14, fontSize:12, color:S.grayLight, flexWrap:"wrap" }}>
              <span>🏛️ {rep.officeLocation}</span>
              <span>🕐 {rep.officeHours}</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <a href={`tel:${rep.phone}`} style={{ padding:"9px 14px", background:S.green, borderRadius:10, color:"white", textDecoration:"none", fontSize:12, fontWeight:600 }}>📞 {rep.phone}</a>
            <a href={`mailto:${rep.email}`} style={{ padding:"9px 14px", background:S.navyLight, border:`1px solid ${S.border}`, borderRadius:10, color:"white", textDecoration:"none", fontSize:12, fontWeight:600 }}>✉️ Email</a>
            <a href={rep.website} target="_blank" rel="noreferrer" style={{ padding:"9px 14px", background:`rgba(212,175,55,0.15)`, border:`1px solid ${S.gold}`, borderRadius:10, color:S.gold, textDecoration:"none", fontSize:12, fontWeight:600 }}>🌐 Website</a>
            <button onClick={() => toggleTrack(rep.id)} style={{ padding:"9px 14px", background:isTracked ? `rgba(212,175,55,0.15)` : "rgba(255,255,255,0.05)", border:`1px solid ${isTracked ? S.gold : S.border}`, borderRadius:10, color:isTracked ? S.gold : S.gray, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
              {isTracked ? "★ Tracking" : "☆ Track"}
            </button>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={() => setRepTab(id)}
            className={repTab === id ? "rep-tab-active" : ""}
            style={{ padding:"8px 14px", border:`1px solid ${S.border}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, background:repTab === id ? S.red : S.cardBg, color:repTab === id ? "white" : S.gray, transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {repTab === "overview" && (
        <div className="slide-in" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Wealth Change</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontSize:10, color:S.gray }}>Before</div><div style={{ fontWeight:700, fontSize:18 }}>{fmt(rep.netWorthBefore)}</div></div>
              <div><div style={{ fontSize:10, color:S.gray }}>Current</div><div style={{ fontWeight:700, fontSize:18, color:"#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</div></div>
            </div>
            <div style={{ padding:"6px 10px", background:"rgba(178,34,52,0.1)", borderRadius:6, textAlign:"center", fontSize:13, color:"#FF6B6B", fontWeight:700 }}>+{enr.pct}% · {fmt(enr.delta)} gained</div>
          </div>
          <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Recent Votes</div>
            {rep.votes.slice(0,3).map((v,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:S.grayLight, flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(v.bill.split(" – ")[1] || v.bill.split(" - ")[1] || v.bill).substring(0,30)}</span>
                <span className={v.vote === "YEA" ? "vote-yea" : "vote-nay"} style={{ fontWeight:700 }}>{v.vote}</span>
              </div>
            ))}
          </div>
          <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Today's Schedule</div>
            {rep.docket.map((d,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:11, color:S.gold, minWidth:56 }}>{d.time}</span>
                <span style={{ fontSize:12, color:S.grayLight }}>{d.item}</span>
              </div>
            ))}
          </div>
          <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Latest Trades</div>
            {rep.trades.map((t,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:t.type === "BUY" ? "#4CAF50" : S.red, fontWeight:700 }}>{t.type}</span>
                <span style={{ color:S.grayLight }}>{t.asset}</span>
                <span>{fmt(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {repTab === "votes" && (
        <div className="slide-in">
          {rep.votes.map((v,i) => (
            <div key={i} style={{ padding:"14px 18px", background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:10, display:"flex", gap:14, alignItems:"center", marginBottom:10 }}>
              <div className={v.vote === "YEA" ? "vote-yea" : "vote-nay"} style={{ fontWeight:700, fontSize:22, minWidth:54 }}>{v.vote}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, marginBottom:3 }}>{v.bill}</div>
                <div style={{ fontSize:11, color:S.gray }}>{v.date}</div>
              </div>
              <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, background:v.outcome === "PASSED" ? "rgba(76,175,80,0.15)" : "rgba(178,34,52,0.15)", color:v.outcome === "PASSED" ? "#4CAF50" : S.red }}>{v.outcome}</span>
              <a href={v.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:S.gold, border:`1px solid ${S.border}`, padding:"4px 10px", borderRadius:6, whiteSpace:"nowrap" }}>Bill →</a>
            </div>
          ))}
        </div>
      )}

      {repTab === "docket" && (
        <div className="slide-in">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:S.gray, textTransform:"uppercase" }}>Today's Legislative Docket</div>
            <div style={{ fontSize:11, color:S.gold }}>🔄 Synced with Congress.gov</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, position:"relative" }}>
            <div style={{ position:"absolute", left:88, top:20, bottom:20, width:2, background:`linear-gradient(to bottom,${S.gold},transparent)` }} />
            {rep.docket.map((d,i) => {
              const ts = { hearing:{bg:"rgba(91,156,255,0.1)",border:"rgba(91,156,255,0.3)",icon:"🎤",color:"#5B9CFF"}, vote:{bg:"rgba(212,175,55,0.1)",border:S.border,icon:"⚖️",color:S.gold}, meeting:{bg:"rgba(144,238,144,0.08)",border:"rgba(144,238,144,0.2)",icon:"🤝",color:"#90EE90"}, press:{bg:"rgba(255,107,107,0.08)",border:"rgba(255,107,107,0.2)",icon:"📰",color:"#FF6B6B"} }[d.type]
              return (
                <div key={i} style={{ display:"flex", gap:14, alignItems:"center" }}>
                  <div style={{ minWidth:78, textAlign:"right", fontSize:12, color:S.gold, fontWeight:600 }}>{d.time}</div>
                  <div style={{ width:14, height:14, borderRadius:"50%", background:ts.color, border:`2px solid ${S.navy}`, zIndex:1, flexShrink:0 }} />
                  <div style={{ flex:1, padding:"12px 14px", background:ts.bg, border:`1px solid ${ts.border}`, borderRadius:10, display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:16 }}>{ts.icon}</span>
                    <div>
                      <div style={{ fontSize:13 }}>{d.item}</div>
                      <div style={{ fontSize:11, color:ts.color, textTransform:"uppercase", letterSpacing:1 }}>{d.type}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {repTab === "wealth" && (
        <div className="slide-in">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div style={{ padding:20, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:8 }}>Before Office</div>
              <div style={{ fontWeight:700, fontSize:26, color:"#90EE90" }}>{fmt(rep.netWorthBefore)}</div>
            </div>
            <div style={{ padding:20, background:"rgba(178,34,52,0.1)", border:"1px solid rgba(178,34,52,0.3)", borderRadius:12 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:8 }}>Current Net Worth</div>
              <div style={{ fontWeight:700, fontSize:26, color:"#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</div>
              <div style={{ fontSize:12, color:"#FF6B6B", marginTop:4 }}>+{enr.pct}% in {rep.yearsInOffice} years</div>
            </div>
          </div>
          <div style={{ fontSize:11, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Trade History (STOCK Act Disclosures)</div>
          <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${S.border}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"110px 70px 1fr 80px 100px", padding:"10px 16px", background:S.navyMid, fontSize:10, letterSpacing:1.5, color:S.gray, textTransform:"uppercase" }}>
              <span>Date</span><span>Type</span><span>Asset</span><span>Sector</span><span style={{ textAlign:"right" }}>Amount</span>
            </div>
            {rep.trades.map((t,i) => (
              <div key={i} className="trade-row" style={{ display:"grid", gridTemplateColumns:"110px 70px 1fr 80px 100px", padding:"12px 16px", borderTop:`1px solid ${S.border}`, fontSize:13, transition:"background 0.2s" }}>
                <span style={{ color:S.gray }}>{t.date}</span>
                <span style={{ color:t.type === "BUY" ? "#4CAF50" : S.red, fontWeight:700 }}>{t.type}</span>
                <span style={{ fontWeight:600 }}>{t.asset}</span>
                <span style={{ color:S.gray }}>{t.sector}</span>
                <span style={{ textAlign:"right" }}>{fmt(t.amount)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:11, color:S.gray }}>* Required STOCK Act disclosures · Source: SEC EDGAR</div>
        </div>
      )}

      {repTab === "bio" && (
        <div className="slide-in">
          <div style={{ padding:22, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, marginBottom:18 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:10 }}>Biography</div>
            <p style={{ fontSize:14, color:S.grayLight, lineHeight:1.8 }}>{rep.bio}</p>
            <div style={{ marginTop:10, fontSize:12, color:S.gray }}>Peers: {rep.peers.join(" · ")}</div>
          </div>
          <div style={{ fontSize:11, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:14 }}>Issue Comparison vs. Direct Peers</div>
          {Object.entries(rep.peerComparison).map(([issue, vals]) => (
            <div key={issue} style={{ padding:16, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontWeight:600, textTransform:"capitalize", fontSize:14 }}>{issue}</span>
                <span style={{ fontSize:12, color:S.gray }}><span style={{ color:S.gold }}>This Rep: {vals.self}%</span> · Peers: {vals.peers}%</span>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:S.gray, marginBottom:4 }}>{rep.name.split(" ").pop()}</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${vals.self}%`, background:`linear-gradient(90deg,${S.gold},${S.red})` }} /></div>
              </div>
              <div>
                <div style={{ fontSize:10, color:S.gray, marginBottom:4 }}>Peer Average</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${vals.peers}%`, background:"rgba(255,255,255,0.25)" }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {repTab === "townhall" && (
        <div className="slide-in" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:14 }}>Upcoming Events</div>
            {rep.townHall.map((ev,i) => (
              <div key={i} style={{ marginBottom:14, padding:16, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{ev.event}</div>
                <div style={{ fontSize:12, color:S.gray, marginBottom:10 }}>📅 {ev.date} · 📍 {ev.location}</div>
                <a href={ev.rsvpLink} style={{ display:"inline-block", padding:"7px 16px", background:`linear-gradient(135deg,${S.red},${S.navyLight})`, borderRadius:8, color:"white", textDecoration:"none", fontSize:12, fontWeight:600 }}>RSVP →</a>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11, letterSpacing:2, color:S.gray, textTransform:"uppercase", marginBottom:14 }}>Community Priority Poll</div>
            <div style={{ padding:20, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12 }}>
              <div style={{ fontSize:13, color:S.grayLight, marginBottom:16 }}>What should {rep.name.split(" ").pop()} prioritize?</div>
              {Object.entries(rep.communityPoll).map(([issue, votes]) => {
                const hasVoted = pollVotes[`${rep.id}-${issue}`]
                const total = Object.values(rep.communityPoll).reduce((a,b) => a+b, 0)
                const pct = Math.round((votes/total)*100)
                return (
                  <div key={issue} style={{ marginBottom:14, opacity:hasVoted ? 0.7 : 1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ textTransform:"capitalize", fontSize:13 }}>{issue}</span>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:S.gray }}>{votes} · {pct}%</span>
                        {!hasVoted && <button onClick={() => handlePollVote(rep.id, issue)} style={{ padding:"3px 10px", background:S.navyLight, border:`1px solid ${S.border}`, borderRadius:6, color:S.gold, cursor:"pointer", fontFamily:"inherit", fontSize:11 }}>Vote</button>}
                      </div>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${S.gold},${S.red})` }} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MapView({ reps, setSelectedRep, setActiveTab, S }) {
  const [selectedState, setSelectedState] = useState("CA")
  const states = [
    { state:"CA", x:60, y:220, label:"California" },
    { state:"TX", x:300, y:320, label:"Texas" },
    { state:"FL", x:580, y:340, label:"Florida" },
    { state:"NY", x:650, y:160, label:"New York" },
    { state:"IL", x:480, y:200, label:"Illinois" },
    { state:"AZ", x:130, y:290, label:"Arizona" },
    { state:"WA", x:80, y:100, label:"Washington" },
    { state:"CO", x:230, y:230, label:"Colorado" },
  ]
  const stateReps = reps.filter(r => r.state === states.find(s => s.state === selectedState)?.label)
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
      <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
        <svg viewBox="0 0 760 420" style={{ width:"100%" }}>
          {states.map(st => {
            const isSel = st.state === selectedState
            const hasReps = reps.some(r => r.state === st.label)
            return (
              <g key={st.state} className="map-state" onClick={() => setSelectedState(st.state)}>
                <circle cx={st.x+40} cy={st.y+30} r={hasReps ? 34 : 28} fill={isSel ? S.red : hasReps ? S.navyMid : "rgba(27,42,107,0.4)"} stroke={isSel ? S.gold : hasReps ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"} strokeWidth={isSel ? 3 : 1.5} />
                <text x={st.x+40} y={st.y+27} textAnchor="middle" fill={isSel ? S.gold : S.white} fontSize="12" fontWeight={isSel?"bold":"normal"}>{st.state}</text>
                {hasReps && <text x={st.x+40} y={st.y+42} textAnchor="middle" fill={S.gold} fontSize="9">{reps.filter(r=>r.state===st.label).length} rep{reps.filter(r=>r.state===st.label).length>1?"s":""}</text>}
                <text x={st.x+40} y={st.y+72} textAnchor="middle" fill="rgba(136,146,164,0.6)" fontSize="10">{st.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
        <div style={{ fontWeight:700, fontSize:20, marginBottom:16 }}>{states.find(s=>s.state===selectedState)?.label}</div>
        {stateReps.length > 0 ? stateReps.map(r => (
          <div key={r.id} style={{ display:"flex", gap:12, marginBottom:12, padding:12, background:"rgba(27,42,107,0.3)", border:`1px solid ${S.border}`, borderRadius:10, cursor:"pointer" }}
            onClick={() => { setSelectedRep(r); setActiveTab("reps") }}>
            <img src={r.photo} alt={r.name} style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${S.gold}`, objectFit:"cover" }} />
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{r.name}</div>
              <div style={{ fontSize:11, color:S.gold }}>{r.title}</div>
              <div style={{ fontSize:11, color:S.gray }}>{r.district}</div>
            </div>
          </div>
        )) : (
          <div style={{ fontSize:13, color:S.gray, textAlign:"center", padding:"24px 0" }}>No representatives in database for this state yet.</div>
        )}
      </div>
    </div>
  )
}

function ConstitutionTab({ constitMode, setConstitMode, constitSection, setConstitSection, S }) {
  const articles = [
    { id:"art1", title:"Article I – The Legislative Branch", original:"All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives...", plain:"Congress holds all law-making power. The House has members based on population; senators serve 6-year terms, two per state. Congress can tax, borrow money, regulate commerce, declare war, and make all laws necessary to carry out these powers." },
    { id:"art2", title:"Article II – The Executive Branch", original:"The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years...", plain:"The President leads the executive branch, serving 4-year terms. The President is Commander in Chief, makes treaties with Senate approval, appoints federal officers and judges, and must faithfully execute the laws." },
    { id:"art3", title:"Article III – The Judicial Branch", original:"The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish...", plain:"The Supreme Court and lower federal courts hold judicial power. Judges serve for life during good behavior. Federal courts handle cases involving the Constitution, federal laws, treaties, and disputes between states." },
    { id:"art4", title:"Article IV – The States", original:"Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State...", plain:"States must respect each other's laws and court decisions. Citizens have the same rights in all states. The federal government guarantees each state a republican form of government." },
    { id:"art5", title:"Article V – Amendments", original:"The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution...", plain:"The Constitution can be amended if two-thirds of Congress and three-fourths of state legislatures agree." },
    { id:"art6", title:"Article VI – Supremacy", original:"This Constitution shall be the supreme Law of the Land...", plain:"The Constitution is the supreme law of the land. All officials must swear to uphold it. No religious test can be required for office." },
    { id:"art7", title:"Article VII – Ratification", original:"The Ratification of the Conventions of nine States shall be sufficient for the Establishment of this Constitution...", plain:"The Constitution became effective when nine of the thirteen original states ratified it." },
  ]
  const amendments = [
    { num:1, title:"Freedom of Religion, Speech, Press, Assembly, Petition", original:"Congress shall make no law respecting an establishment of religion...", plain:"The government cannot establish a religion, stop you from practicing faith, or restrict speech, press, peaceful assembly, or petitioning the government." },
    { num:2, title:"Right to Bear Arms", original:"A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.", plain:"Citizens have the right to own and carry firearms." },
    { num:4, title:"Search and Seizure", original:"The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated...", plain:"Police cannot search your home or body without a court-issued warrant based on probable cause." },
    { num:5, title:"Due Process, Double Jeopardy, Self-Incrimination", original:"No person shall be held to answer for a capital crime unless on indictment of a Grand Jury...", plain:"You cannot be tried twice for the same crime. You cannot be forced to testify against yourself. The government cannot take your life, liberty, or property without due process." },
    { num:6, title:"Right to a Fair Trial", original:"In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial...", plain:"You have the right to a speedy, public trial with an impartial jury, to know the charges, confront witnesses, and have a lawyer." },
    { num:8, title:"No Cruel and Unusual Punishment", original:"Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.", plain:"Bail and fines cannot be excessive. Punishments cannot be cruel or unusual." },
    { num:13, title:"Abolition of Slavery", original:"Neither slavery nor involuntary servitude shall exist within the United States...", plain:"Slavery is abolished throughout the United States." },
    { num:14, title:"Equal Protection and Due Process", original:"All persons born or naturalized in the United States are citizens...", plain:"Everyone born in the US is a citizen. No state can deny citizens equal protection of the laws." },
    { num:19, title:"Women's Right to Vote", original:"The right of citizens to vote shall not be denied on account of sex.", plain:"Women have the right to vote." },
    { num:26, title:"Voting Age Lowered to 18", original:"The right of citizens who are eighteen years of age or older to vote shall not be denied on account of age.", plain:"Citizens 18 and older have the right to vote." },
  ]
  return (
    <div className="slide-in">
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontWeight:900, fontSize:26, marginBottom:6 }}>The Constitution of the United States</h1>
        <p style={{ fontSize:13, color:S.gray }}>Original text and plain-language interpretation of every Article and Amendment.</p>
        <div style={{ marginTop:10, height:2, background:`linear-gradient(90deg,${S.red},transparent)` }} />
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ display:"flex", background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:8, overflow:"hidden" }}>
          {["original","plain"].map(m => (
            <button key={m} onClick={() => setConstitMode(m)}
              style={{ padding:"8px 18px", background:constitMode === m ? S.red : "transparent", border:"none", color:constitMode === m ? "white" : S.gray, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, textTransform:"uppercase" }}>
              {m === "original" ? "Original" : "Plain English"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:8, overflow:"hidden" }}>
          {["articles","amendments"].map(m => (
            <button key={m} onClick={() => setConstitSection(m)}
              style={{ padding:"8px 18px", background:constitSection === m ? S.navyMid : "transparent", border:"none", color:constitSection === m ? S.gold : S.gray, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, textTransform:"uppercase" }}>
              {m === "articles" ? "Articles" : "Amendments"}
            </button>
          ))}
        </div>
        <a href="https://www.archives.gov/founding-docs/constitution" target="_blank" rel="noreferrer"
          style={{ padding:"8px 18px", background:`rgba(212,175,55,0.1)`, border:`1px solid ${S.gold}`, borderRadius:8, color:S.gold, textDecoration:"none", fontSize:12, fontWeight:600 }}>
          📜 National Archives
        </a>
      </div>
      {constitSection === "articles" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {articles.map(art => <ConstitutionCard key={art.id} title={art.title} text={constitMode === "original" ? art.original : art.plain} mode={constitMode} S={S} />)}
        </div>
      )}
      {constitSection === "amendments" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
          {amendments.map(am => (
            <div key={am.num} style={{ padding:18, background:S.cardBg, border:`1px solid ${S.border}`, borderRadius:12 }}>
              <div style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
                <div style={{ minWidth:40, height:40, background:`linear-gradient(135deg,${S.red},${S.navyLight})`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14 }}>{am.num}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:S.gold, marginBottom:2 }}>Amendment {am.num}</div>
                  <div style={{ fontSize:12, color:S.grayLight }}>{am.title}</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:constitMode === "original" ? S.white : S.grayLight, lineHeight:1.7, fontStyle:constitMode === "original" ? "italic" : "normal" }}>
                {constitMode === "original" ? am.original : am.plain}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConstitutionCard({ title, text, mode, S }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:`1px solid ${S.border}`, borderRadius:12, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width:"100%", textAlign:"left", padding:"16px 20px", background:open ? "rgba(27,42,107,0.5)" : S.cardBg, border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:15, color:S.gold, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        {title}
        <span style={{ fontSize:12, color:S.gray }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding:"0 20px 18px 20px", background:"rgba(10,22,40,0.4)" }}>
          <p style={{ fontSize:13, lineHeight:1.8, color:mode === "original" ? S.white : S.grayLight, fontStyle:mode === "original" ? "italic" : "normal", borderLeft:`3px solid ${mode === "original" ? S.gold : S.red}`, paddingLeft:16 }}>
            {text}
          </p>
        </div>
      )}
    </div>
  )
}