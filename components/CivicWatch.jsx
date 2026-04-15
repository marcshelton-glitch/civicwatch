'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'


// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const REPS = [
  {
    id: 1,
    name: "Sen. Margaret A. Collins",
    title: "U.S. Senator",
    party: "Democrat",
    state: "California",
    district: "Statewide",
    level: "federal",
    photo: "https://i.pravatar.cc/150?img=47",
    email: "senator.collins@senate.gov",
    phone: "(202) 224-3553",
    website: "https://collins.senate.gov",
    officeHours: "Mon–Fri 9am–5pm",
    officeLocation: "Hart Senate Office Building, Rm 702, Washington DC",
    bio: "Sen. Collins has served since 2010. Former state AG, Stanford Law graduate. Focuses on healthcare, climate legislation, and tech regulation. Sits on the Senate Judiciary and Finance committees.",
    peers: ["Sen. R. Thompson (R-TX)", "Sen. D. Martinez (D-FL)"],
    peerComparison: {
      healthcare: { self: 92, peers: 44 },
      climate: { self: 88, peers: 31 },
      defense: { self: 55, peers: 79 },
      economy: { self: 67, peers: 71 },
    },
    netWorthBefore: 1200000,
    netWorthCurrent: 8700000,
    yearsInOffice: 15,
    trades: [
      { date: "2024-11-12", asset: "NVDA", type: "BUY", amount: 45000, sector: "Tech" },
      { date: "2024-09-03", asset: "ETH", type: "BUY", amount: 22000, sector: "Crypto" },
      { date: "2024-07-19", asset: "PFE", type: "SELL", amount: 31000, sector: "Pharma" },
      { date: "2024-05-01", asset: "TSLA", type: "BUY", amount: 18000, sector: "EV" },
    ],
    votes: [
      { bill: "H.R. 1447 - Inflation Reduction Act", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-08-12" },
      { bill: "S. 2134 - Healthcare Expansion Act", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-06-05" },
      { bill: "H.R. 899 - Border Security Act", vote: "NAY", outcome: "FAILED", link: "https://congress.gov", date: "2024-04-22" },
      { bill: "S. 501 - Defense Appropriations", vote: "YEA", outcome: "PASSED", link: "https://congress.gov", date: "2024-02-14" },
    ],
    docket: [
      { time: "9:00 AM", item: "Senate Judiciary Hearing: AI Regulation", type: "hearing" },
      { time: "11:30 AM", item: "Floor Vote: S. 3321 – Clean Energy Act", type: "vote" },
      { time: "2:00 PM", item: "Constituent Meeting: CA Tech Alliance", type: "meeting" },
      { time: "4:00 PM", item: "Press Conference: Climate Policy", type: "press" },
    ],
    townHall: [
      { date: "2025-04-10", event: "Open Town Hall – San Francisco City Hall", location: "SF, CA", rsvpLink: "#" },
      { date: "2025-04-24", event: "Virtual Town Hall – Q&A Session", location: "Online", rsvpLink: "#" },
    ],
    communityPoll: { healthcare: 412, climate: 289, housing: 341, education: 198 },
  },
  {
    id: 2,
    name: "Rep. James T. Harrington",
    title: "U.S. Representative",
    party: "Republican",
    state: "California",
    district: "CA-33",
    level: "federal",
    photo: "https://i.pravatar.cc/150?img=52",
    email: "rep.harrington@house.gov",
    phone: "(202) 225-4576",
    website: "https://harrington.house.gov",
    officeHours: "Mon–Thu 9am–4pm",
    officeLocation: "Cannon HOB, Rm 210, Washington DC",
    bio: "Rep. Harrington has served since 2016. Retired Army Colonel. Focuses on border security, veterans affairs, and deregulation. Member of the House Armed Services Committee.",
    peers: ["Rep. S. Wallace (D-CA)", "Rep. T. Nguyen (R-TX)"],
    peerComparison: {
      healthcare: { self: 38, peers: 61 },
      climate: { self: 22, peers: 44 },
      defense: { self: 91, peers: 55 },
      economy: { self: 85, peers: 66 },
    },
    netWorthBefore: 2100000,
    netWorthCurrent: 5400000,
    yearsInOffice: 9,
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
    id: 3,
    name: "Councilwoman Diana M. Rivera",
    title: "City Council Member",
    party: "Democrat",
    state: "California",
    district: "District 8 – Los Angeles",
    level: "municipal",
    photo: "https://i.pravatar.cc/150?img=48",
    email: "diana.rivera@lacity.org",
    phone: "(213) 485-3378",
    website: "https://councilmember.lacity.org/district8",
    officeHours: "Tue–Fri 9am–3pm",
    officeLocation: "200 N Spring St, Los Angeles, CA 90012",
    bio: "Councilwoman Rivera has served District 8 since 2018. Former public school teacher and community organizer. Focuses on affordable housing, transit access, and public safety reform.",
    peers: ["CM J. Lee (R-D4)", "CM P. Okafor (D-D6)"],
    peerComparison: {
      housing: { self: 95, peers: 62 },
      transit: { self: 87, peers: 55 },
      publicsafety: { self: 61, peers: 78 },
      budget: { self: 72, peers: 65 },
    },
    netWorthBefore: 145000,
    netWorthCurrent: 890000,
    yearsInOffice: 7,
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

const CONSTITUTION_ARTICLES = [
  { id: "art1", title: "Article I – The Legislative Branch", original: "All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives...", plain: "Congress (Senate + House of Representatives) holds all law-making power. The House has members based on population; senators serve 6-year terms, two per state. Congress can tax, borrow money, regulate commerce, declare war, and make all laws necessary to carry out these powers." },
  { id: "art2", title: "Article II – The Executive Branch", original: "The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years...", plain: "The President leads the executive branch, serving 4-year terms. The President is Commander in Chief, makes treaties (with Senate approval), appoints federal officers and judges, and must take care that laws are faithfully executed." },
  { id: "art3", title: "Article III – The Judicial Branch", original: "The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish...", plain: "The Supreme Court and lower federal courts hold judicial power. Judges serve for life during good behavior. Federal courts handle cases involving the Constitution, federal laws, treaties, and disputes between states." },
  { id: "art4", title: "Article IV – The States", original: "Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State...", plain: "States must respect each other's laws and court decisions. Citizens of each state have the same rights in other states. New states can be admitted to the Union. The federal government guarantees each state a republican form of government." },
  { id: "art5", title: "Article V – Amendments", original: "The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution...", plain: "The Constitution can be amended if two-thirds of Congress and three-fourths of state legislatures agree, or through a constitutional convention called by two-thirds of states." },
  { id: "art6", title: "Article VI – Supremacy", original: "This Constitution, and the Laws of the United States which shall be made in Pursuance thereof shall be the supreme Law of the Land...", plain: "The Constitution is the supreme law of the land. All federal and state officials must swear to uphold it. No religious test can be required for public office." },
  { id: "art7", title: "Article VII – Ratification", original: "The Ratification of the Conventions of nine States shall be sufficient for the Establishment of this Constitution...", plain: "The Constitution became effective when nine of the thirteen original states ratified it." },
]

const AMENDMENTS = [
  { num: 1, title: "Freedom of Religion, Speech, Press, Assembly, Petition", original: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press...", plain: "The government cannot establish an official religion, prevent you from practicing your faith, or stop you from speaking, publishing, assembling peacefully, or petitioning the government." },
  { num: 2, title: "Right to Bear Arms", original: "A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.", plain: "Citizens have the right to own and carry firearms. This right cannot be taken away by the government." },
  { num: 4, title: "Search and Seizure", original: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated...", plain: "Police cannot search your home, papers, or body without a court-issued warrant based on probable cause." },
  { num: 5, title: "Due Process, Double Jeopardy, Self-Incrimination", original: "No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury...", plain: "You cannot be tried twice for the same crime. You cannot be forced to testify against yourself. The government cannot take your life, liberty, or property without due process." },
  { num: 6, title: "Right to a Fair Trial", original: "In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury...", plain: "You have the right to a speedy, public trial with an impartial jury, to know the charges against you, to confront witnesses, and to have a lawyer." },
  { num: 8, title: "No Cruel and Unusual Punishment", original: "Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.", plain: "Bail and fines cannot be excessive, and punishments cannot be cruel or unusual." },
  { num: 13, title: "Abolition of Slavery", original: "Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States...", plain: "Slavery is abolished throughout the United States." },
  { num: 14, title: "Equal Protection and Due Process", original: "All persons born or naturalized in the United States and subject to the jurisdiction thereof, are citizens of the United States...", plain: "Everyone born in the US is a citizen. No state can deny citizens equal protection of the laws or due process." },
  { num: 19, title: "Women's Right to Vote", original: "The right of citizens of the United States to vote shall not be denied or abridged on account of sex.", plain: "Women have the right to vote." },
  { num: 26, title: "Voting Age Lowered to 18", original: "The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied or abridged on account of age.", plain: "Citizens 18 and older have the right to vote." },
]

const ALERT_LOG = [
  { id: 1, repId: 1, type: "vote", message: "Sen. Collins voted YEA on S. 3321 – Clean Energy Act", time: "2h ago", read: false },
  { id: 2, repId: 1, type: "trade", message: "Sen. Collins disclosed new trade: NVDA BUY $45,000", time: "1d ago", read: false },
  { id: 3, repId: 2, type: "docket", message: "Rep. Harrington added to Armed Services hearing docket", time: "3h ago", read: true },
  { id: 4, repId: 3, type: "townhall", message: "Councilwoman Rivera scheduled Town Hall – April 8", time: "5h ago", read: false },
]

const STATE_MAP_DATA = [
  { state: "WA", x: 68,  y: 52,  label: "Washington" },
  { state: "OR", x: 62,  y: 98,  label: "Oregon" },
  { state: "CA", x: 52,  y: 168, label: "California" },
  { state: "NV", x: 100, y: 150, label: "Nevada" },
  { state: "ID", x: 118, y: 88,  label: "Idaho" },
  { state: "MT", x: 168, y: 58,  label: "Montana" },
  { state: "WY", x: 178, y: 108, label: "Wyoming" },
  { state: "UT", x: 138, y: 150, label: "Utah" },
  { state: "AZ", x: 130, y: 210, label: "Arizona" },
  { state: "CO", x: 192, y: 162, label: "Colorado" },
  { state: "NM", x: 178, y: 220, label: "New Mexico" },
  { state: "ND", x: 248, y: 58,  label: "North Dakota" },
  { state: "SD", x: 252, y: 100, label: "South Dakota" },
  { state: "NE", x: 258, y: 142, label: "Nebraska" },
  { state: "KS", x: 262, y: 182, label: "Kansas" },
  { state: "OK", x: 268, y: 222, label: "Oklahoma" },
  { state: "TX", x: 262, y: 272, label: "Texas" },
  { state: "MN", x: 312, y: 68,  label: "Minnesota" },
  { state: "IA", x: 322, y: 130, label: "Iowa" },
  { state: "MO", x: 328, y: 178, label: "Missouri" },
  { state: "AR", x: 332, y: 228, label: "Arkansas" },
  { state: "LA", x: 328, y: 278, label: "Louisiana" },
  { state: "WI", x: 368, y: 88,  label: "Wisconsin" },
  { state: "IL", x: 372, y: 148, label: "Illinois" },
  { state: "MS", x: 372, y: 258, label: "Mississippi" },
  { state: "MI", x: 418, y: 98,  label: "Michigan" },
  { state: "IN", x: 412, y: 148, label: "Indiana" },
  { state: "TN", x: 408, y: 210, label: "Tennessee" },
  { state: "AL", x: 408, y: 258, label: "Alabama" },
  { state: "OH", x: 452, y: 138, label: "Ohio" },
  { state: "KY", x: 442, y: 180, label: "Kentucky" },
  { state: "GA", x: 448, y: 248, label: "Georgia" },
  { state: "FL", x: 452, y: 308, label: "Florida" },
  { state: "WV", x: 482, y: 162, label: "West Virginia" },
  { state: "VA", x: 502, y: 182, label: "Virginia" },
  { state: "SC", x: 492, y: 232, label: "South Carolina" },
  { state: "NC", x: 498, y: 208, label: "North Carolina" },
  { state: "PA", x: 522, y: 132, label: "Pennsylvania" },
  { state: "NY", x: 548, y: 102, label: "New York" },
  { state: "MD", x: 532, y: 162, label: "Maryland" },
  { state: "DE", x: 552, y: 168, label: "Delaware" },
  { state: "NJ", x: 558, y: 148, label: "New Jersey" },
  { state: "CT", x: 578, y: 128, label: "Connecticut" },
  { state: "RI", x: 592, y: 118, label: "Rhode Island" },
  { state: "MA", x: 582, y: 106, label: "Massachusetts" },
  { state: "VT", x: 568, y: 80,  label: "Vermont" },
  { state: "NH", x: 584, y: 80,  label: "New Hampshire" },
  { state: "ME", x: 600, y: 62,  label: "Maine" },
  { state: "AK", x: 72,  y: 330, label: "Alaska" },
  { state: "HI", x: 148, y: 330, label: "Hawaii" },
]

const STATE_ABBR = {
  "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
  "Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA",
  "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
  "Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD",
  "Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO",
  "Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ",
  "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH",
  "Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC",
  "South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT",
  "Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY",
  "District of Columbia":"DC",
}

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n)
const enrichment = (b, c) => {
  if (!b || !c || b === 0) return { pct: null, delta: null }
  const pct = ((c - b) / b * 100).toFixed(0)
  return { pct, delta: c - b }
}

const S = {
  navy: "#0A1628", navyMid: "#1B2A6B", navyLight: "#243A8C",
  red: "#B22234", redLight: "#CC2B3F", gold: "#D4AF37",
  white: "#F8F9FF", offWhite: "#EEF0F8", gray: "#8892A4",
  grayLight: "#CDD2E0", green: "#1A7A4A",
  cardBg: "rgba(255,255,255,0.04)", border: "rgba(212,175,55,0.25)",
}

export default function CivicWatch() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("reps")
  const [selectedRep, setSelectedRep] = useState(null)
  const [repTab, setRepTab] = useState("overview")
  const [tracked, setTracked] = useState([1])
  const [alerts, setAlerts] = useState(ALERT_LOG)
  const [constitMode, setConstitMode] = useState("plain")
  const [constitSection, setConstitSection] = useState("articles")
  const [selectedState, setSelectedState] = useState("CA")
  const [searchTerm, setSearchTerm] = useState("")
  const [pollVotes, setPollVotes] = useState({})
 const [filterLevel, setFilterLevel] = useState("all")
const [filterParty, setFilterParty] = useState("all")
const [liveReps, setLiveReps] = useState([])
const [loadingReps, setLoadingReps] = useState(true)
const [dataSource, setDataSource] = useState("loading")
  const unreadCount = alerts.filter(a => !a.read).length

  const MOCK_MUNICIPAL = REPS.filter(r => r.level === 'municipal')
const displayReps = loadingReps
  ? []
  : liveReps.length > 0
    ? [...liveReps, ...MOCK_MUNICIPAL]
    : REPS
const filteredReps = displayReps.filter(r => {
    const matchLevel = filterLevel === "all" || r.level === filterLevel
    const matchParty = filterParty === "all" || r.party.toLowerCase() === filterParty
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.district.toLowerCase().includes(searchTerm.toLowerCase())
    return matchLevel && matchParty && matchSearch
  })

  const markAllRead = () => setAlerts(alerts.map(a => ({ ...a, read: true })))
  const toggleTrack = (id) => setTracked(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id])
  const handlePollVote = (repId, issue) => setPollVotes(prev => ({ ...prev, [`${repId}-${issue}`]: true }))

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
  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error('Subscribe error:', e)
    }
  }

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: "100vh", color: S.white }}>
      <style>{`
        * { box-sizing: border-box; }
        .rep-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(178,34,52,0.3); }
        .nav-btn.active { border-bottom: 2px solid ${S.gold}; color: ${S.gold}; }
        .rep-tab.active { background: ${S.red}; color: white; }
        .vote-yea { color: #4CAF50; }
        .vote-nay { color: ${S.red}; }
        .outcome-passed { background: rgba(76,175,80,0.15); color: #4CAF50; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .outcome-failed { background: rgba(178,34,52,0.15); color: ${S.red}; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .star-pattern { background-image: radial-gradient(rgba(212,175,55,0.08) 1px, transparent 1px); background-size: 24px 24px; }
        .bar-fill { transition: width 0.8s cubic-bezier(.4,0,.2,1); }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .slide-in { animation: slideIn 0.3s ease; }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .map-state:hover { cursor: pointer; filter: brightness(1.3); }
        .btn-contact:hover { transform: scale(1.04); opacity: 0.9; }
        .constitution-article:hover { background: rgba(212,175,55,0.07); }
        .trade-row:hover { background: rgba(255,255,255,0.04); }
        .progress-bar { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
        .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; letter-spacing:0.5px; }
        .dem-badge { background:rgba(0,80,200,0.2); color:#5B9CFF; }
        .rep-badge { background:rgba(178,34,52,0.2); color:#FF6B7A; }
        .federal-badge { background:rgba(212,175,55,0.15); color:${S.gold}; }
        .muni-badge { background:rgba(120,220,120,0.15); color:#90EE90; }
        .alert-unread { border-left: 3px solid ${S.gold}; background: rgba(212,175,55,0.05); }
        .ai-blur { filter: blur(5px); user-select: none; pointer-events: none; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .ai-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(212,175,55,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 400px 100%; animation: shimmer 1.8s infinite; }
        @keyframes typewriter { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .ai-line { animation: typewriter 0.4s ease forwards; opacity: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width:6px } ::-webkit-scrollbar-track { background:${S.navy} } ::-webkit-scrollbar-thumb { background:${S.navyMid}; border-radius:3px }
      `}</style>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid ${S.gold}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
            <span style={{ fontSize: 26 }}>🏛️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>CIVIC<span style={{ color: S.gold }}>WATCH</span></div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: S.gray, textTransform: "uppercase" }}>Your Representatives. Accountable.</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            {[
              { id: "reps", label: "My Reps" },
              { id: "map", label: "Map" },
              { id: "alerts", label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
              { id: "constitution", label: "Constitution" },
            ].map(tab => (
              <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.id); setSelectedRep(null) }}
                style={{ background: "none", border: "none", color: activeTab === tab.id ? S.gold : S.gray, cursor: "pointer", padding: "8px 12px", fontSize: 12, fontFamily: "inherit", letterSpacing: 0.5, transition: "all 0.2s", borderBottom: `2px solid ${activeTab === tab.id ? S.gold : "transparent"}`, fontWeight: activeTab === tab.id ? 600 : 400 }}>
                {tab.label}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {unreadCount > 0 && (
              <div className="pulse" onClick={() => setActiveTab("alerts")}
                style={{ background: S.red, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {unreadCount}
              </div>
            )}
            <button onClick={handleSubscribe}
              style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.5 }}>
              ★ Go Pro $9.99/mo
            </button>
            <div style={{ fontSize: 12, color: S.gray }}>
              {user?.firstName || ""}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {/* REPS LIST */}
        {activeTab === "reps" && !selectedRep && (
          <div className="slide-in">
            <SectionHeader title="My Representatives" subtitle="Find, track, and contact your elected officials at every level of government." />
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <input placeholder="🔍 Search by name or district…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: "1 1 220px", padding: "10px 14px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, fontFamily: "inherit", fontSize: 13, outline: "none" }} />
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                style={{ padding: "10px 14px", background: S.navyMid, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, fontFamily: "inherit", fontSize: 13 }}>
                <option value="all">All Levels</option>
                <option value="federal">Federal</option>
                <option value="municipal">Municipal</option>
              </select>
              <select value={filterParty} onChange={e => setFilterParty(e.target.value)}
                style={{ padding: "10px 14px", background: S.navyMid, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, fontFamily: "inherit", fontSize: 13 }}>
                <option value="all">All Parties</option>
                <option value="democrat">Democrat</option>
                <option value="republican">Republican</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {filteredReps.map(rep => {
                const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
                const isTracked = tracked.includes(rep.id)
                return (
                  <div key={rep.id} className="rep-card"
                    style={{ background: `linear-gradient(145deg, rgba(27,42,107,0.6), rgba(10,14,30,0.9))`, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: rep.party === "Democrat" ? "#5B9CFF" : S.red }} />
                    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                      <div style={{ position: "relative" }}>
                        <img src={rep.photo} alt={rep.name} style={{ width: 68, height: 68, borderRadius: "50%", border: `3px solid ${S.gold}`, objectFit: "cover" }} />
                        {isTracked && <div style={{ position: "absolute", bottom: 0, right: -2, background: S.gold, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{rep.name}</div>
                        <div style={{ fontSize: 11, color: S.gold, marginBottom: 6 }}>{rep.title} · {rep.district}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span className={`badge ${rep.party === "Democrat" ? "dem-badge" : "rep-badge"}`}>{rep.party}</span>
                          <span className={`badge ${rep.level === "federal" ? "federal-badge" : "muni-badge"}`}>{rep.level}</span>
                        </div>
                      </div>
                    </div>
                   {enr.pct !== null && (
  <div style={{ background: "rgba(178,34,52,0.1)", border: "1px solid rgba(178,34,52,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontSize: 10, color: S.gray, marginBottom: 1 }}>WEALTH CHANGE IN OFFICE</div>
      <div style={{ fontSize: 12 }}>{fmt(rep.netWorthBefore)} → <span style={{ color: "#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</span></div>
    </div>
    <div style={{ color: "#FF6B6B", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20 }}>+{enr.pct}%</div>
  </div>
)}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <a href={`tel:${rep.phone}`} className="btn-contact" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, textAlign: "center", padding: "7px 0", background: S.green, borderRadius: 8, fontSize: 12, color: "white", textDecoration: "none", transition: "all 0.2s", fontWeight: 600 }}>📞 Call</a>
                      <a href={`mailto:${rep.email}`} className="btn-contact" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, textAlign: "center", padding: "7px 0", background: S.navyLight, borderRadius: 8, fontSize: 12, color: "white", textDecoration: "none", transition: "all 0.2s", fontWeight: 600 }}>✉️ Email</a>
                      <a href={rep.website} target="_blank" rel="noreferrer" className="btn-contact" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, textAlign: "center", padding: "7px 0", background: `rgba(212,175,55,0.15)`, borderRadius: 8, fontSize: 12, color: S.gold, textDecoration: "none", border: `1px solid ${S.border}`, transition: "all 0.2s", fontWeight: 600 }}>🌐 Web</a>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setSelectedRep(rep)}
                        style={{ flex: 1, padding: "9px 0", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>
                        Full Profile →
                      </button>
                      <button onClick={() => toggleTrack(rep.id)}
                        style={{ padding: "9px 12px", background: isTracked ? `rgba(212,175,55,0.2)` : "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, borderRadius: 8, color: isTracked ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
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
          <RepDetail rep={selectedRep} onBack={() => setSelectedRep(null)} tracked={tracked} toggleTrack={toggleTrack} repTab={repTab} setRepTab={setRepTab} pollVotes={pollVotes} handlePollVote={handlePollVote} S={S} />
        )}

        {/* MAP */}
        {activeTab === "map" && (
  <div className="slide-in">
    <SectionHeader title="District Map" subtitle="Click any state to view its representatives." />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
      <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20 }}>
        <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: 'auto' }}>
          <Geographies geography="https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json">
            {({ geographies }) =>
              geographies.map(geo => {
                const abbr = STATE_ABBR[geo.properties.name] || ''
                const isSelected = abbr === selectedState
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => abbr && setSelectedState(abbr)}
                    style={{
                      default: { fill: isSelected ? S.red : 'rgba(27,42,107,0.85)', stroke: isSelected ? S.gold : 'rgba(212,175,55,0.35)', strokeWidth: isSelected ? 1.5 : 0.5, outline: 'none', cursor: 'pointer' },
                      hover: { fill: S.navyLight, stroke: S.gold, strokeWidth: 1, outline: 'none', cursor: 'pointer' },
                      pressed: { fill: S.red, stroke: S.gold, strokeWidth: 1.5, outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
        <div style={{ textAlign: 'center', fontSize: 11, color: S.gray, marginTop: 4 }}>
          Click any state to load its representatives
        </div>
      </div>
      <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
          {STATE_MAP_DATA.find(s => s.state === selectedState)?.label || selectedState}
        </div>
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Representatives
        </div>
        {loadingReps ? (
          <div style={{ textAlign: 'center', padding: 32, color: S.gray }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
            Loading…
          </div>
        ) : (() => {
          const stateLabel = STATE_MAP_DATA.find(s => s.state === selectedState)?.label
          const stateReps = displayReps.filter(r => r.state === stateLabel || r.state === selectedState)
          if (stateReps.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: 24, color: S.gray }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏛️</div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>No data loaded for this state.</div>
                <div style={{ fontSize: 11, color: S.gray, marginBottom: 16 }}>Click the state on the map to load members.</div>
              </div>
            )
          }
          return stateReps.map(r => (
            <div key={r.id || r.bioguideId}
              style={{ display: "flex", gap: 10, marginBottom: 10, padding: 10, background: "rgba(27,42,107,0.3)", border: `1px solid ${S.border}`, borderRadius: 10, cursor: "pointer" }}
              onClick={() => { setSelectedRep(r); setActiveTab("reps") }}
              className="rep-card">
              <img src={r.photo} alt={r.name} style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${S.gold}`, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: S.gold }}>{r.title}</div>
                <div style={{ fontSize: 10, color: S.gray }}>{r.district}</div>
              </div>
            </div>
          ))
        })()}
      </div>
    </div>
  </div>
)}

        {/* ALERTS */}
        {activeTab === "alerts" && (
          <div className="slide-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <SectionHeader title="Track My Rep™ Alerts" subtitle="Live notifications when your tracked representatives vote, trade, or schedule events." />
              <button onClick={markAllRead}
                style={{ padding: "8px 16px", background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 8, color: S.gold, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                Mark All Read
              </button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Currently Tracking</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {REPS.map(r => (
                  <div key={r.id} onClick={() => toggleTrack(r.id)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: tracked.includes(r.id) ? `rgba(212,175,55,0.12)` : S.cardBg, border: `1px solid ${tracked.includes(r.id) ? S.gold : S.border}`, borderRadius: 30, cursor: "pointer" }}>
                    <img src={r.photo} alt={r.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
                    <span style={{ fontSize: 12, color: tracked.includes(r.id) ? S.gold : S.gray }}>{r.name.split(" ").slice(-1)[0]}</span>
                    {tracked.includes(r.id) && <span style={{ color: S.gold, fontSize: 11 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.map(alert => {
                const rep = REPS.find(r => r.id === alert.repId)
                const typeIcon = { vote: "⚖️", trade: "💰", docket: "📋", townhall: "🏛️" }[alert.type]
                const typeColor = { vote: S.gold, trade: "#FF6B6B", docket: "#5B9CFF", townhall: "#90EE90" }[alert.type]
                return (
                  <div key={alert.id} className={alert.read ? "" : "alert-unread"}
                    style={{ padding: "14px 16px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{typeIcon}</span>
                    <img src={rep?.photo} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, marginBottom: 2 }}>{alert.message}</div>
                      <div style={{ fontSize: 11, color: S.gray }}>{alert.time}</div>
                    </div>
                    <span className="badge" style={{ background: `rgba(212,175,55,0.12)`, color: typeColor, textTransform: "uppercase" }}>{alert.type}</span>
                    {!alert.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.gold, flexShrink: 0 }} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CONSTITUTION */}
        {activeTab === "constitution" && (
          <div className="slide-in">
            <SectionHeader title="The Constitution of the United States" subtitle="Original text and plain-language interpretation of every Article and Amendment." />
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 8, overflow: "hidden" }}>
                {["original", "plain"].map(m => (
                  <button key={m} onClick={() => setConstitMode(m)}
                    style={{ padding: "8px 18px", background: constitMode === m ? S.red : "transparent", border: "none", color: constitMode === m ? "white" : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    {m === "original" ? "Original" : "Plain English"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 8, overflow: "hidden" }}>
                {["articles", "amendments"].map(m => (
                  <button key={m} onClick={() => setConstitSection(m)}
                    style={{ padding: "8px 18px", background: constitSection === m ? S.navyLight : "transparent", border: "none", color: constitSection === m ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                    {m === "articles" ? "Articles" : "Amendments"}
                  </button>
                ))}
              </div>
              <a href="https://www.archives.gov/founding-docs/constitution" target="_blank" rel="noreferrer"
                style={{ padding: "8px 18px", background: `rgba(212,175,55,0.1)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                📜 National Archives
              </a>
            </div>
            {constitSection === "articles" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CONSTITUTION_ARTICLES.map(art => (
                  <ConstitutionCard key={art.id} title={art.title} text={constitMode === "original" ? art.original : art.plain} mode={constitMode} S={S} />
                ))}
              </div>
            )}
            {constitSection === "amendments" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {AMENDMENTS.map(am => (
                  <div key={am.num} style={{ padding: 18, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 40, height: 40, background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14 }}>{am.num}</div>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 13, color: S.gold, marginBottom: 2 }}>Amendment {am.num}</div>
                        <div style={{ fontSize: 12, color: S.grayLight }}>{am.title}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: constitMode === "original" ? S.offWhite : S.grayLight, lineHeight: 1.7, fontStyle: constitMode === "original" ? "italic" : "normal" }}>
                      {constitMode === "original" ? am.original : am.plain}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ marginTop: 48, borderTop: `1px solid ${S.border}`, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, white 33%, white 66%, ${S.navyMid} 66%)`, marginBottom: 14, borderRadius: 2 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", color: S.gold, fontSize: 14, marginBottom: 4 }}>CivicWatch™ · A Democracy Accountability Platform</div>
          <div style={{ fontSize: 11, color: S.gray }}>Data sourced from <a href="https://congress.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>Congress.gov</a>, <a href="https://disclosures-clerk.house.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>House Clerk STOCK Act Disclosures</a>, <a href="https://efts.senate.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>Senate Financial Disclosures</a>, and <a href="https://legiscan.com" target="_blank" rel="noreferrer" style={{ color: S.gray }}>LegiScan LLC (CC BY 4.0)</a>.</div>
        </div>
      </footer>
    </div>
  )
}

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

// ─────────────────────────────────────────────────────────────────────────────

function ConstitutionCard({ title, text, mode, S }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="constitution-article" style={{ border: `1px solid ${S.border}`, borderRadius: 12, overflow: "hidden", transition: "all 0.2s" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: open ? "rgba(27,42,107,0.5)" : S.cardBg, border: "none", cursor: "pointer", fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 15, color: S.gold, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {title}
        <span style={{ fontSize: 12, color: S.gray }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px 20px", background: "rgba(10,22,40,0.4)" }}>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: mode === "original" ? S.offWhite : S.grayLight, fontStyle: mode === "original" ? "italic" : "normal", borderLeft: `3px solid ${mode === "original" ? S.gold : S.red}`, paddingLeft: 16 }}>
            {text}
          </p>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 26, marginBottom: 6 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: "#8892A4", lineHeight: 1.6 }}>{subtitle}</p>}
      <div style={{ marginTop: 10, height: 2, background: `linear-gradient(90deg, #B22234, transparent)`, borderRadius: 2 }} />
    </div>
  )
}
