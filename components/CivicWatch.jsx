'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ComposableMap, Geographies, Geography, Marker, Annotation } from 'react-simple-maps'
import Image from 'next/image'
import SettingsPanel from './SettingsPanel'


// ─── PLACEHOLDER AVATAR (used when no photo is available) ────────────────────
function PlaceholderAvatar({ size = 68, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" style={{ borderRadius: '50%', flexShrink: 0, ...style }}>
      <circle cx="34" cy="34" r="34" fill="rgba(27,42,107,0.7)" />
      <circle cx="34" cy="27" r="11" fill="rgba(212,175,55,0.35)" />
      <ellipse cx="34" cy="54" rx="18" ry="12" fill="rgba(212,175,55,0.35)" />
    </svg>
  )
}

// ─── INITIALS AVATAR (shown for state reps without a photo) ──────────────────
function InitialsAvatar({ name = '', party = '', size = 68, style = {} }) {
  // Build 2-letter initials from "Last, First" or "First Last"
  const parts = name.replace(',', '').trim().split(/\s+/).filter(Boolean)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0] || 'R').slice(0, 2).toUpperCase()
  const bg = party === 'Democrat'    ? '#0d2a4a'
           : party === 'Republican'  ? '#4a0d0d'
           : party === 'Independent' ? '#2a2400'
           : party === 'Green'       ? '#0a2e18'
           : '#1b2a6b'
  const fontSize = Math.round(size * 0.33)
  const mid = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: '50%', flexShrink: 0, ...style }}>
      <circle cx={mid} cy={mid} r={mid} fill={bg} />
      <text x={mid} y={mid + fontSize * 0.36}
        textAnchor="middle" fill="#D4AF37"
        fontSize={fontSize} fontFamily="Georgia, serif" fontWeight="bold">
        {initials}
      </text>
    </svg>
  )
}

// ─── TRADE TYPE TRANSLATION ───────────────────────────────────────────────────
function tradeTypeLabel(type) {
  if (type === 'BUY') return 'Purchase'
  if (type === 'SELL') return 'Sale'
  if (type === 'EXCHANGE') return 'Exchange'
  if (type === 'OTHER') return 'Other'
  return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Trade'
}

// ─── LEADERSHIP ROLE FORMATTING ───────────────────────────────────────────────
function congressToYear(n) { return 1789 + (n - 1) * 2 }

function deriveContactUrl(officialWebsiteUrl, isSenator) {
  if (!officialWebsiteUrl) return null
  try {
    const base = new URL(officialWebsiteUrl).origin
    return isSenator ? `${base}/content/contact-senator` : `${base}/contact`
  } catch { return null }
}

function ordinal(n) {
  const v = n % 100
  const s = (v >= 11 && v <= 13) ? 'th' : ['th','st','nd','rd'][n % 10] || 'th'
  return n + s
}

function formatLeadershipRoles(leadership) {
  if (!leadership?.length) return []
  const byRole = {}
  for (const entry of leadership) {
    const start = entry.startCongress ?? entry.congress
    const end = entry.endCongress ?? entry.congress
    if (!start) continue
    const key = entry.type
    if (!byRole[key]) byRole[key] = []
    byRole[key].push([start, end])
  }
  const currentYear = new Date().getFullYear()
  return Object.entries(byRole).map(([role, pairs]) => {
    // Sort and collapse overlapping/adjacent ranges
    const sorted = pairs.sort((a, b) => a[0] - b[0])
    const ranges = []
    for (const [s, e] of sorted) {
      const last = ranges[ranges.length - 1]
      if (last && s <= last[1] + 1) { last[1] = Math.max(last[1], e) }
      else { ranges.push([s, e]) }
    }
    const spans = ranges.map(([s, e]) => {
      const startYear = congressToYear(s)
      const endYear = congressToYear(e) + 2
      const endStr = endYear > currentYear ? 'present' : String(endYear)
      return `(${startYear}–${endStr})`
    })
    return { role, spans }
  })
}

// ─── REMOVED: mock REPS data. Live data comes from Congress API. ──────────────
const REPS = []

// ─── REMOVED: mock ALERT_LOG. Alerts are fetched live from Congress API. ─────
const ALERT_LOG = []

// ─── CONSTITUTION (real data) ─────────────────────────────────────────────────
const CONSTITUTION_ARTICLES = [
  { id: "preamble", title: "Preamble", original: "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.", plain: "This introduction explains why the Constitution was created: to form a unified nation, ensure justice, maintain peace, and protect the freedom of all Americans." },
  { id: "art1", title: "Article I – The Legislative Branch", original: "All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives...", plain: "Creates Congress — the Senate and House of Representatives — and gives them the power to make laws." },
  { id: "art2", title: "Article II – The Executive Branch", original: "The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years...", plain: "Creates the office of President, who enforces the laws and serves as Commander in Chief." },
  { id: "art3", title: "Article III – The Judicial Branch", original: "The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish...", plain: "Creates the Supreme Court and gives Congress power to establish lower courts." },
  { id: "art4", title: "Article IV – The States", original: "Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State...", plain: "Defines the relationship between states and the federal government, including how new states join the Union." },
  { id: "art5", title: "Article V – Amendments", original: "The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution...", plain: "Explains how the Constitution can be changed." },
  { id: "art6", title: "Article VI – Supremacy", original: "This Constitution, and the Laws of the United States which shall be made in Pursuance thereof shall be the supreme Law of the Land...", plain: "The Constitution is the highest law in the land — it overrides state laws." },
  { id: "art7", title: "Article VII – Ratification", original: "The Ratification of the Conventions of nine States shall be sufficient for the Establishment of this Constitution...", plain: "The Constitution became law when 9 of 13 states approved it." },
]

const AMENDMENTS = [
  { num: 1, title: "Freedom of Speech, Religion, Press, Assembly, and Petition", original: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press...", plain: "The government cannot establish an official religion, prevent you from practicing your faith, or stop you from speaking, publishing, assembling peacefully, or petitioning the government." },
  { num: 2, title: "Right to Bear Arms", original: "A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.", plain: "Citizens have the right to own and carry firearms. This right cannot be taken away by the government." },
  { num: 4, title: "Protection from Unreasonable Search and Seizure", original: "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated...", plain: "Police cannot search your home, papers, or body without a court-issued warrant based on probable cause." },
  { num: 5, title: "Right to Remain Silent, Due Process", original: "No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury...", plain: "You cannot be tried twice for the same crime. You cannot be forced to testify against yourself. The government cannot take your life, liberty, or property without due process." },
  { num: 13, title: "Abolished Slavery (1865)", original: "Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States...", plain: "Slavery is abolished throughout the United States." },
  { num: 14, title: "Citizenship and Equal Protection Under the Law (1868)", original: "All persons born or naturalized in the United States and subject to the jurisdiction thereof, are citizens of the United States...", plain: "Everyone born in the US is a citizen. No state can deny citizens equal protection of the laws or due process." },
  { num: 15, title: "Right to Vote Regardless of Race (1870)", original: "The right of citizens of the United States to vote shall not be denied or abridged by the United States or by any State on account of race, color, or previous condition of servitude.", plain: "Citizens cannot be denied the right to vote based on race or previous enslaved status." },
  { num: 19, title: "Women's Right to Vote (1920)", original: "The right of citizens of the United States to vote shall not be denied or abridged on account of sex.", plain: "Women have the right to vote." },
  { num: 26, title: "Voting Age Lowered to 18 (1971)", original: "The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied or abridged on account of age.", plain: "Citizens 18 and older have the right to vote." },
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

const STATE_CENTROIDS = {
  AL: [-86.7, 32.8], AK: [-153.4, 64.2], AZ: [-111.5, 34.3], AR: [-92.4, 34.9],
  CA: [-119.7, 36.5], CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0],
  FL: [-81.5, 27.7], GA: [-83.4, 32.7], HI: [-157.0, 20.5], ID: [-114.5, 44.4],
  IL: [-89.2, 40.0], IN: [-86.3, 40.3], IA: [-93.5, 42.1], KS: [-98.4, 38.5],
  KY: [-84.9, 37.8], LA: [-91.9, 31.1], ME: [-69.0, 45.4], MD: [-76.6, 39.0],
  MA: [-71.8, 42.3], MI: [-84.5, 43.5], MN: [-94.3, 46.4], MS: [-89.7, 32.7],
  MO: [-92.5, 38.3], MT: [-110.5, 47.0], NE: [-99.9, 41.5], NV: [-116.4, 38.8],
  NH: [-71.6, 44.0], NJ: [-74.4, 40.1], NM: [-106.1, 34.4], NY: [-75.4, 43.0],
  NC: [-79.4, 35.6], ND: [-100.5, 47.5], OH: [-82.8, 40.4], OK: [-97.5, 35.5],
  OR: [-120.6, 43.9], PA: [-77.2, 40.9], RI: [-71.5, 41.7], SC: [-80.9, 33.8],
  SD: [-100.2, 44.4], TN: [-86.3, 35.9], TX: [-99.3, 31.5], UT: [-111.1, 39.3],
  VT: [-72.7, 44.0], VA: [-78.7, 37.5], WA: [-120.4, 47.4], WV: [-80.6, 38.9],
  WI: [-89.8, 44.5], WY: [-107.6, 43.0],
}

// Small/narrow states that can't fit an inline label: use callout line with [dx, dy] pixel offsets
const SMALL_STATE_CALLOUTS = {
  VT: { dx: -28, dy: -18 },
  NH: { dx: 28, dy: -18 },
  MA: { dx: 30, dy: -22 },
  RI: { dx: 32, dy:   8 },
  CT: { dx: 32, dy:  24 },
  NJ: { dx: 32, dy:   8 },
  DE: { dx: 32, dy:  24 },
  MD: { dx: 32, dy:  38 },
  HI: { dx:  0, dy: -22 },
}

// 2-digit Census FIPS code for each state abbreviation
const STATE_FIPS = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',
  LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',MT:'30',
  NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',
  OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',
  VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56',
}

// Geographic [longitude, latitude] center for each state (center for geoMercator projectionConfig)
const STATE_GEO_CENTER = {
  AL:[-86.9,32.8],AK:[-153.4,64.2],AZ:[-111.9,34.3],AR:[-92.4,34.9],
  CA:[-119.4,37.2],CO:[-105.5,39.0],CT:[-72.7,41.6],DE:[-75.5,39.1],
  DC:[-77.0,38.9],FL:[-81.5,28.7],GA:[-83.4,32.7],HI:[-157.5,20.3],
  ID:[-114.5,44.4],IL:[-89.2,40.6],IN:[-86.3,40.3],IA:[-93.4,42.1],
  KS:[-98.4,38.5],KY:[-84.9,37.5],LA:[-92.0,30.9],ME:[-69.4,45.4],
  MD:[-76.6,39.1],MA:[-71.5,42.2],MI:[-85.4,44.3],MN:[-94.3,46.4],
  MS:[-89.7,32.7],MO:[-92.3,38.5],MT:[-110.5,47.0],NE:[-99.9,41.5],
  NV:[-116.4,38.8],NH:[-71.6,43.7],NJ:[-74.5,40.1],NM:[-106.2,34.5],
  NY:[-75.5,42.8],NC:[-79.4,35.6],ND:[-100.5,47.5],OH:[-82.8,40.4],
  OK:[-97.5,35.5],OR:[-120.6,44.0],PA:[-77.2,40.9],RI:[-71.5,41.7],
  SC:[-80.9,33.8],SD:[-100.3,44.4],TN:[-86.7,35.7],TX:[-99.3,31.5],
  UT:[-111.4,39.3],VT:[-72.7,44.1],VA:[-78.6,37.5],WA:[-120.5,47.4],
  WV:[-80.6,38.6],WI:[-89.7,44.3],WY:[-107.6,43.0],
}

// geoMercator scale for the per-state district view (computed from each state's lon/lat extent)
const STATE_DIST_SCALE = {
  AL:4261,AK:1203,AZ:3589,AR:5844,CA:2153,CO:4943,
  CT:18595,DE:14610,DC:97403,FL:3147,GA:4447,HI:5287,
  ID:2922,IL:3719,IN:5114,IA:5655,KS:4646,KY:4464,
  LA:4989,ME:4649,MD:7810,MA:10226,MI:3099,MN:3467,
  MS:4352,MO:4447,MT:3305,NE:4138,NV:2922,NH:7867,
  NJ:8182,NM:3589,NY:4545,NC:3812,ND:5383,OH:5245,
  OK:3895,OR:4681,PA:6221,RI:22727,SC:6392,SD:4957,
  TN:3860,TX:1912,UT:4091,VT:8893,VA:4044,WA:5166,
  WV:6016,WI:4447,WY:5114,
}

const fmt = (n) => {
  if (n == null || !isFinite(n)) return 'N/A'
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n)
}
const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const days = Math.floor((Date.now() - date) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
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

export default function CivicWatch({ defaultBioguideId = null, defaultState = 'CA' }) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { openSignIn, openUserProfile } = useClerk()
  const router = useRouter()
  const isPro = user?.publicMetadata?.isPro === true
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("map")
  const [selectedRep, setSelectedRep] = useState(null)
  const [repTab, setRepTab] = useState("overview")
  const [tracked, setTracked] = useState([])
  const [alerts, setAlerts] = useState(ALERT_LOG)
  const [liveAlerts, setLiveAlerts] = useState([])
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [constitMode, setConstitMode] = useState("plain")
  const [constitSection, setConstitSection] = useState("articles")
  const [selectedState, setSelectedState] = useState(defaultState)
  const [searchTerm, setSearchTerm] = useState("")
  const [pollVotes, setPollVotes] = useState({})
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterParty, setFilterParty] = useState("all")
  const [liveReps, setLiveReps] = useState([])
  const [loadingReps, setLoadingReps] = useState(true)
  const [dataSource, setDataSource] = useState("loading")
  const [mounted, setMounted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [onboardingSelectedState, setOnboardingSelectedState] = useState(defaultState)
  const [civicAddress, setCivicAddress] = useState("")
  const [civicAddressInput, setCivicAddressInput] = useState("")
  const [municipalReps, setMunicipalReps] = useState([])
  const [loadingMunicipal, setLoadingMunicipal] = useState(false)
  const [municipalError, setMunicipalError] = useState("")
  const [municipalityInfo, setMunicipalityInfo] = useState(null)   // { city, county, schoolDistrict, state }
  const [hasCiceroData, setHasCiceroData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [stats, setStats] = useState(null)
  const [statsDisplay, setStatsDisplay] = useState({ filings: 0, trades: 0, representatives: 0 })
  const [prefs, setPrefs] = useState({
    alert_frequency: 'daily',
    alert_trades: true,
    alert_networth: true,
    alert_legislation: false,
    alert_committees: false,
  })
  const [prefsSaved, setPrefsSaved] = useState(false)
  const prefsSaveTimer = useRef(null)

  // District drill-down state
  const [mapView, setMapView] = useState('national') // 'national' | 'state'
  const [zoomedState, setZoomedState] = useState(null) // { abbreviation, name, fips }
  const [hoveredDistrict, setHoveredDistrict] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [districtGeoJson, setDistrictGeoJson] = useState(null)
  const [districtPaths, setDistrictPaths] = useState([])
  const [districtLoading, setDistrictLoading] = useState(false)
  const [districtError, setDistrictError] = useState(null)

  // District map pan/zoom
  const [mapScale, setMapScale] = useState(1)
  const [mapTx, setMapTx] = useState(0)
  const [mapTy, setMapTy] = useState(0)
  const [mapPanning, setMapPanning] = useState(false)
  const mapSvgRef = useRef(null)
  const mapDragAnchor = useRef(null) // { ax, ay } in SVG coords
  const mapDidDrag = useRef(false)

  const unreadCount = alerts.filter(a => !a.read).length + liveAlerts.filter(a => !a.read).length
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  // Isolated effect — no other code that can throw, so setMounted(true) always commits.
  // Safari private mode / ITP can throw on localStorage; mixing them in one effect risks
  // the state update being discarded if the effect function throws.
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    try {
      if (!localStorage.getItem('cw_onboarded')) setShowOnboarding(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (localStorage.getItem('cw_install_dismissed')) return
    } catch {}
    const handler = e => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    const timer = setTimeout(() => setShowInstallBanner(true), 30000)
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(timer) }
  }, [])

  // Switch to My Reps tab once auth confirms the user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) setActiveTab("reps")
  }, [isLoaded, isSignedIn])

  // Fetch district GeoJSON when zoomed state changes, to enable fitSize projection
  useEffect(() => {
    if (!zoomedState?.fips) {
      setDistrictGeoJson(null)
      setDistrictLoading(false)
      setDistrictError(null)
      return
    }
    setDistrictLoading(true)
    setDistrictError(null)
    setDistrictGeoJson(null)
    fetch(`/api/district-boundaries?fips=${zoomedState.fips}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data?.features?.length) {
          setDistrictGeoJson(data)
        } else {
          setDistrictError('No district boundary data is available for this state.')
        }
      })
      .catch(() => {
        setDistrictError('Failed to load district boundaries. Please try again.')
      })
      .finally(() => setDistrictLoading(false))
  }, [zoomedState?.fips])

  // Reset zoom/pan whenever the user switches to a different state
  useEffect(() => {
    setMapScale(1); setMapTx(0); setMapTy(0)
  }, [zoomedState?.fips])

  useEffect(() => {
    if (!districtGeoJson?.features?.length) { setDistrictPaths([]); return }
    const W = 600, H = 400, pad = 20
    // Both axes must be in the same units (radians) so Math.min(sx,sy) is meaningful.
    // Longitude degrees → radians keeps x and y comparable to Mercator Y output.
    const mercX = lon => lon * Math.PI / 180
    const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    const visitCoord = ([lon, lat]) => {
      const mx = mercX(lon)
      const my = mercY(lat)
      if (mx < x0) x0 = mx; if (mx > x1) x1 = mx
      if (my < y0) y0 = my; if (my > y1) y1 = my
    }
    const visitRing = ring => ring.forEach(visitCoord)
    const visitGeom = ({ type, coordinates }) => {
      if (type === 'Polygon') coordinates.forEach(visitRing)
      else if (type === 'MultiPolygon') coordinates.forEach(poly => poly.forEach(visitRing))
    }
    districtGeoJson.features.forEach(f => visitGeom(f.geometry))
    const sx = (W - 2 * pad) / (x1 - x0 || 1)
    const sy = (H - 2 * pad) / (y1 - y0 || 1)
    const s = Math.min(sx, sy)
    const dx = pad + (W - 2 * pad - s * (x1 - x0)) / 2
    const dy = pad + (H - 2 * pad - s * (y1 - y0)) / 2
    const px = ([lon, lat]) => [(dx + s * (mercX(lon) - x0)).toFixed(2), (dy + s * (y1 - mercY(lat))).toFixed(2)]
    const ringPath = ring => ring.map((c, i) => `${i ? 'L' : 'M'}${px(c).join(',')}`).join('') + 'Z'
    const geomPath = ({ type, coordinates }) => {
      if (type === 'Polygon') return coordinates.map(ringPath).join(' ')
      if (type === 'MultiPolygon') return coordinates.map(poly => poly.map(ringPath).join(' ')).join(' ')
      return ''
    }
    setDistrictPaths(districtGeoJson.features.map(f => ({
      d: geomPath(f.geometry),
      districtNum: f.properties?.CD118FP || f.properties?.CD116FP || f.properties?.DISTRICT || f.properties?.districtNum || '00',
    })))
  }, [districtGeoJson])

  // Load persisted tracked reps from Supabase when user signs in
  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/track')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.tracked)) setTracked(data.tracked) })
      .catch(() => {})
  }, [isSignedIn, user?.id])

  // Load notification preferences from Supabase when user signs in
  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch('/api/preferences')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setPrefs(p => ({ ...p, ...data }))
      })
      .catch(() => {})
  }, [isSignedIn, user?.id])

  // Once Clerk finishes loading: if the signed-in user already has the flag set
  // server-side, close the modal (handles cross-device completions).
  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user?.publicMetadata?.onboardingComplete) setShowOnboarding(false)
  }, [isLoaded, isSignedIn, user?.publicMetadata?.onboardingComplete])

  const feedCacheRef = useRef({ data: null, ts: 0 })
  const [feedData, setFeedData] = useState(null)
  const [feedLoading, setFeedLoading] = useState(false)

  const doFeedFetch = useCallback(() => {
    setFeedLoading(true)
    fetch('/api/public-feed')
      .then(r => r.json())
      .then(d => {
        feedCacheRef.current = { data: d, ts: Date.now() }
        setFeedData(d)
        setFeedLoading(false)
      })
      .catch(() => setFeedLoading(false))
  }, [])

  useEffect(() => {
    const check = () => {
      if (feedCacheRef.current.data && Date.now() - feedCacheRef.current.ts < 300000) return
      doFeedFetch()
    }
    check()
    const id = setInterval(check, 300000)
    return () => clearInterval(id)
  }, [doFeedFetch])

  const displayReps = filterLevel === 'state'
    ? municipalReps
    : filterLevel === 'all'
      ? [...liveReps, ...municipalReps]
      : liveReps
const filteredReps = displayReps.filter(r => {
    const matchLevel = filterLevel === "all" || r.level === filterLevel
    const matchParty = filterParty === "all" || (r.party || '').toLowerCase() === filterParty
    const matchSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.district || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchLevel && matchParty && matchSearch
  })

  // Map 2-digit zero-padded district number → House rep object
  const districtReps = useMemo(() => {
    const map = {}
    liveReps
      .filter(r => r.title === 'U.S. Representative')
      .forEach(r => {
        const m = (r.district || '').match(/\d+/)
        const num = m ? String(parseInt(m[0])).padStart(2, '0') : '00'
        map[num] = r
      })
    return map
  }, [liveReps])

const markAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })))
    setLiveAlerts(liveAlerts.map(a => ({ ...a, read: true })))
  }

  const updatePref = (key, value) => {
    if (!isSignedIn) { openSignIn(); return }
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setPrefsSaved(false)
    clearTimeout(prefsSaveTimer.current)
    prefsSaveTimer.current = setTimeout(() => {
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
        .then(r => r.json())
        .then(data => { if (data.ok) { setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 2500) } })
        .catch(() => {})
    }, 1000)
  }
  const BIOGUIDE_RE = /^[A-Z]\d{6}$/
  const toggleTrack = (repOrId) => {
    if (!isSignedIn) { openSignIn(); return }
    const isFull = repOrId && typeof repOrId === 'object'
    const id = isFull ? repOrId.id : repOrId
    const isCurrentlyTracked = tracked.includes(id)
    setTracked(t => isCurrentlyTracked ? t.filter(x => x !== id) : [...t, id])
    // Persist to Supabase for federal reps only (valid bioguide IDs)
    if (isFull && BIOGUIDE_RE.test(id)) {
      const lastName = (repOrId.name || '').split(',')[0].trim()
      const isSenator = (repOrId.title || '').toLowerCase().includes('senator')
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bioguideId: id, repName: repOrId.name, lastName, isSenator,
          action: isCurrentlyTracked ? 'remove' : 'add',
        }),
      }).catch(() => {})
    }
  }
  const handlePollVote = (repId, issue) => setPollVotes(prev => ({ ...prev, [`${repId}-${issue}`]: true }))

  useEffect(() => { if (selectedRep) setRepTab("overview") }, [selectedRep])

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    setSearchError('')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/congress?type=search&name=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        setSearchResults(data.members || [])
      } catch {
        setSearchError('Search failed. Please try again.')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── URL-persistence helpers ───────────────────────────────────────────────────
  const selectRep = useCallback((rep) => {
    setSelectedRep(rep)
    router.replace(`/dashboard?rep=${rep.id}`, { scroll: false })
  }, [router])

  const clearRep = useCallback(() => {
    setSelectedRep(null)
    router.replace('/dashboard', { scroll: false })
  }, [router])

  // On mount: restore the selected rep from ?rep= URL param
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const repId = params.get('rep')
    if (!repId) return
    fetch(`/api/congress?type=member&bioguideId=${encodeURIComponent(repId)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.member) return
        const m = data.member
        const terms = m.terms || []
        const latestTerm = terms[terms.length - 1] || {}
        const isSen = (latestTerm.chamber || '').toLowerCase().includes('senate')
        const nameParts = (m.name || '').split(', ')
        const displayName = nameParts.length >= 2
          ? `${nameParts[1].split(' ')[0]} ${nameParts[0]}`
          : m.name || ''
        const nameSlug = displayName.toLowerCase()
          .replace(/[^a-z\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        setSelectedRep({
          id: m.bioguideId,
          name: m.name,
          title: isSen ? 'U.S. Senator' : 'U.S. Representative',
          party: m.party === 'Democratic' ? 'Democrat' : m.party || 'Unknown',
          state: m.state || '',
          district: 'Statewide',
          level: 'federal',
          photo: `/api/rep-photo/${m.bioguideId}`,
          email: '',
          phone: isSen ? '(202) 224-3121' : '(202) 225-3121',
          contactForm: deriveContactUrl(m.officialWebsiteUrl, isSen),
          website: `https://www.congress.gov/member/${nameSlug}/${m.bioguideId}`,
          officeHours: 'Mon-Fri 9am-5pm',
          officeLocation: isSen ? 'U.S. Senate, Washington DC' : 'U.S. House, Washington DC',
          bio: `${m.name} represents ${m.state}.`,
          peers: [], peerComparison: {}, netWorthBefore: null, netWorthCurrent: null,
          yearsInOffice: null, trades: [], votes: [], docket: [], townHall: [],
          communityPoll: { healthcare: 0, climate: 0, housing: 0, education: 0 },
          isLive: true,
        })
        if (m.state) setSelectedState(STATE_ABBR[m.state] || m.state)
        setActiveTab('reps')
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select the default rep once members load (public preview mode)
  useEffect(() => {
    if (!defaultBioguideId || selectedRep || liveReps.length === 0) return
    const def = liveReps.find(r => r.id === defaultBioguideId)
    if (def) selectRep(def)
  }, [liveReps, defaultBioguideId]) // eslint-disable-line react-hooks/exhaustive-deps

useEffect(() => {
  setLiveReps([])
  setLoadingReps(true)
  const load = async () => {
    try {
      const res = await fetch(`/api/congress?type=members&state=${selectedState}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      })
      const data = await res.json()
      if (data.members && data.members.length > 0) {
        setLiveReps(data.members.map(r => {
          const isSen = (r.chamber||'').toLowerCase().includes('senate')
          const nameParts = (r.name || '').split(', ')
          const displayName = nameParts.length >= 2
            ? `${nameParts[1].split(' ')[0]} ${nameParts[0]}`
            : r.name || ''
          const nameSlug = displayName.toLowerCase()
            .replace(/[^a-z\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          return {
            id: r.bioguideId, name: r.name,
            title: isSen ? 'U.S. Senator' : 'U.S. Representative',
            party: r.party === 'Democratic' ? 'Democrat' : r.party === 'Republican' ? 'Republican' : r.party||'Unknown', state: r.state||'', district: r.district||'Statewide',
            level: 'federal',
            photo: `/api/rep-photo/${r.bioguideId}`,
            email: '', phone: isSen ? '(202) 224-3121' : '(202) 225-3121',
            contactForm: deriveContactUrl(r.officialWebsiteUrl, isSen),
            website: `https://www.congress.gov/member/${nameSlug}/${r.bioguideId}`,
            officeHours: 'Mon-Fri 9am-5pm',
            officeLocation: isSen ? 'U.S. Senate, Washington DC' : 'U.S. House, Washington DC',
            bio: `${r.name} represents ${r.state} in the ${r.chamber}.`,
            peers: [], peerComparison: {}, netWorthBefore: null, netWorthCurrent: null,
            yearsInOffice: null, trades: [], votes: [], docket: [], townHall: [],
            communityPoll: { healthcare:0, climate:0, housing:0, education:0 }, isLive: true,
          }
        }))
        setDataSource('live')
      } else { setLiveReps([]); setDataSource('mock') }
    } catch { setLiveReps([]); setDataSource('mock') }
    finally { setLoadingReps(false) }
  }
  load()
}, [selectedState])

  useEffect(() => {
    if (!civicAddress) return
    setLoadingMunicipal(true)
    setMunicipalError("")
    fetch(`/api/civic?address=${encodeURIComponent(civicAddress)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setMunicipalError(data.error); setMunicipalReps([]) }
        else {
          const officials = data.officials || []
          setMunicipalReps(officials)
          setMunicipalityInfo(data.municipality || null)
          setHasCiceroData(data.hasCiceroData || false)
          // Sync the federal-rep state selector so liveReps loads the right Congress members
          const stateFromResults = officials.find(o => o.state)?.state
          if (stateFromResults && stateFromResults !== selectedState) {
            setSelectedState(stateFromResults)
          }
          // Switch filter to "all" so federal + state + local all appear
          setFilterLevel('all')
        }
      })
      .catch(e => setMunicipalError(e.message))
      .finally(() => setLoadingMunicipal(false))
  }, [civicAddress])

  useEffect(() => {
    if (activeTab !== 'alerts') return
    const trackedLive = displayReps.filter(r => r.isLive && tracked.includes(r.id) && r.level === 'federal')
    if (trackedLive.length === 0) { setLiveAlerts([]); return }
    setLoadingAlerts(true)
    const fetches = trackedLive.flatMap(rep => [
      fetch(`/api/congress?type=votes&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => (d.votes || []).slice(0, 3).map((v, i) => ({
          id: `${rep.id}-vote-${i}`,
          repId: rep.id,
          photo: rep.photo,
          type: 'vote',
          message: `${rep.name} voted ${v.vote} on ${v.bill}`,
          time: v.date || '',
          read: false,
        })))
        .catch(() => []),
      fetch(`/api/congress?type=trades&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => (d.trades || []).slice(0, 2).map((t, i) => ({
          id: `${rep.id}-trade-${i}`,
          repId: rep.id,
          photo: rep.photo,
          type: 'trade',
          message: `${rep.name} disclosed: ${t.asset} ${t.type} ${typeof t.amount === 'number' ? fmt(t.amount) : t.amount}`,
          time: t.date || '',
          read: false,
        })))
        .catch(() => []),
    ])
    Promise.all(fetches).then(results => {
      const all = results.flat()
        .filter(a => a.time)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
      setLiveAlerts(all)
      setLoadingAlerts(false)
    })
  }, [activeTab, tracked])

  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store', signal: AbortSignal.timeout(10000) }).then(r => r.ok ? r.json() : null).then(data => { if (data) setStats(data) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!stats) return
    const keys = ['filings', 'trades', 'representatives']
    const duration = 1000
    const steps = 40
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const t = step / steps
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setStatsDisplay({
        filings: Math.round(ease * Number(stats.filings || 0)),
        trades: Math.round(ease * Number(stats.trades || 0)),
        representatives: Math.round(ease * Number(stats.representatives || 0)),
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [stats])

  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error('Subscribe error:', e)
    }
  }

  const handleBillingPortal = async () => {
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error('Billing portal error:', e)
    }
  }

  const finishOnboarding = (goToMap = false) => {
    try { localStorage.setItem('cw_onboarded', '1') } catch {}
    setShowOnboarding(false)
    if (goToMap) setActiveTab('map')
    if (isSignedIn) fetch('/api/onboarding', { method: 'PATCH' }).catch(() => {})
  }

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: "100vh", color: S.white, overflowX: "hidden", width: "100%" }}>
      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; }
        * { box-sizing: border-box; min-width: 0; }
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
        .dem-badge   { background:rgba(21,101,192,0.2);  color:#5B9CFF; }
        .rep-badge   { background:rgba(204,32,32,0.2);   color:#FF6B6B; }
        .ind-badge   { background:rgba(212,184,0,0.18);  color:#F0D000; }
        .green-badge { background:rgba(34,160,90,0.18);  color:#4CAF76; }
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
        @media (max-width: 768px) {
          .mobile-stack { grid-template-columns: 1fr !important; }
          .mobile-col { flex-direction: column !important; }
          .mobile-scroll { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; }
          .mobile-hide { display: none !important; }
          .map-layout { grid-template-columns: 1fr !important; }
          /* Mobile header: nav tabs drop to their own scrollable row */
          .header-inner { flex-wrap: wrap !important; }
          .header-nav {
            order: 3; width: 100%; border-top: 1px solid rgba(212,175,55,0.15);
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; padding-bottom: 2px;
          }
          .header-nav::-webkit-scrollbar { display: none; }
          .header-nav .nav-btn { padding: 8px 10px !important; font-size: 11px !important; white-space: nowrap; }
          .header-logo { order: 1; }
          .header-actions { order: 2; }
          .header-actions .header-username { display: none !important; }
          /* Rep detail hero: action buttons wrap to multiple rows on mobile */
          .rep-hero-actions { flex-basis: 100% !important; flex-wrap: wrap !important; flex-direction: row !important; }
          /* Rep detail tab row: 2 rows of 4 on mobile */
          .rep-tabs-row { display: flex !important; flex-wrap: wrap !important; gap: 0 !important; overflow-x: visible !important; padding-bottom: 0 !important; }
          .rep-tabs-row > button { flex: 0 0 25% !important; box-sizing: border-box !important; text-align: center !important; padding: 8px 4px !important; font-size: 10px !important; white-space: normal !important; min-width: 0 !important; }
          /* Hide office hours on mobile to save vertical space */
          .rep-office-hours { display: none !important; }
          /* Onboarding modal: full-screen on mobile */
          .onboarding-overlay { align-items: stretch !important; padding: 0 !important; }
          .onboarding-card { border-radius: 0 !important; min-height: 100dvh; display: flex !important; flex-direction: column !important; justify-content: center !important; }
        }
        .compare-card-header { display: grid; grid-template-columns: 1fr 1px 1fr; }
        .compare-vs-mobile { display: none; }
        @media (max-width: 520px) {
          .compare-card-header { grid-template-columns: 1fr !important; }
          .compare-divider-vert { display: none !important; }
          .compare-vs-mobile { display: flex !important; align-items: center; gap: 12px; padding: 6px 16px; color: rgba(212,175,55,0.6); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
          .compare-vs-mobile::before, .compare-vs-mobile::after { content: ''; flex: 1; height: 1px; background: rgba(212,175,55,0.3); }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid ${S.gold}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div className="header-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="header-logo"
            onClick={() => { setActiveTab("reps"); clearRep() }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 26 }}>🏛️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, letterSpacing: 2, color: S.white }}>CIVIC<span style={{ color: S.gold }}>WATCH</span></div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: S.gray, textTransform: "uppercase" }}>Your Representatives. Accountable.</div>
            </div>
          </button>
          <nav className="header-nav" style={{ display: "flex", gap: 2 }}>
            {[
              { id: "reps", label: "My Reps" },
              { id: "map", label: "Map" },
              { id: "alerts", label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
              { id: "search", label: "Search" },
              { id: "constitution", label: "Constitution" },
            ].map(tab => (
              <button key={tab.id} className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.id); clearRep() }}
                style={{ background: "none", border: "none", color: activeTab === tab.id ? S.gold : S.gray, cursor: "pointer", padding: "8px 12px", fontSize: 12, fontFamily: "inherit", letterSpacing: 0.5, transition: "all 0.2s", borderBottom: `2px solid ${activeTab === tab.id ? S.gold : "transparent"}`, fontWeight: activeTab === tab.id ? 600 : 400 }}>
                {tab.label}
              </button>
            ))}
            <a href="/about"
              style={{ background: "none", border: "none", color: S.gray, padding: "8px 12px", fontSize: 12, fontFamily: "inherit", letterSpacing: 0.5, textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.color = S.gold}
              onMouseLeave={e => e.currentTarget.style.color = S.gray}>
              About
            </a>
          </nav>
          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push('/leaderboard')}
              style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, color: S.gold, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
              🏆 Leaderboard
            </button>
            {unreadCount > 0 && (
              <div className="pulse" onClick={() => setActiveTab("alerts")}
                style={{ background: S.red, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {unreadCount}
              </div>
            )}
            {!isSignedIn ? (
              <button onClick={() => openSignIn()}
                style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.5 }}>
                Sign In / Sign Up →
              </button>
            ) : (
              <>
                {!isPro && (
                  <button onClick={() => router.push('/pro')}
                    style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.5 }}>
                    ★ Go Pro
                  </button>
                )}
                {/* Avatar button — opens settings panel */}
                <button
                  onClick={() => setSettingsPanelOpen(true)}
                  title="Account settings"
                  aria-label="Open account settings"
                  style={{ width: 34, height: 34, borderRadius: "50%", padding: 0, border: `2px solid ${isPro ? S.gold : S.border}`, cursor: "pointer", overflow: "hidden", background: S.navyLight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user?.imageUrl ? (
                    <Image src={user.imageUrl} alt="Account" width={34} height={34} style={{ objectFit: "cover", borderRadius: "50%", width: "100%", height: "100%" }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.gold }}>
                      {[user?.firstName, user?.lastName].filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      {/* STATS BANNER */}
      <div style={{ background: `linear-gradient(135deg, #070C1A, ${S.navyMid})`, borderBottom: `1px solid rgba(212,175,55,0.2)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}
          className="stats-banner-grid">
          {[
            { value: statsDisplay.filings.toLocaleString(), label: "Filings" },
            { value: statsDisplay.trades.toLocaleString(), label: "Trades" },
            { value: statsDisplay.representatives.toLocaleString(), label: "Representatives" },
            { value: "Daily", label: "Updated" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center", padding: "8px 4px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: S.gold, lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: 10, color: S.gray, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 600px) { .stats-banner-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

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
                <option value="state">State</option>
              </select>
              <select value={filterParty} onChange={e => setFilterParty(e.target.value)}
                style={{ padding: "10px 14px", background: S.navyMid, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, fontFamily: "inherit", fontSize: 13 }}>
                <option value="all">All Parties</option>
                <option value="democrat">Democrat</option>
                <option value="republican">Republican</option>
              </select>
            </div>
            {loadingReps && (
              <div style={{ textAlign: "center", padding: "60px 0", color: S.gray }}>
                <div className="pulse" style={{ fontSize: 40, marginBottom: 16 }}>🏛️</div>
                <div style={{ fontSize: 16 }}>Loading your representatives…</div>
              </div>
            )}
            {(filterLevel === 'state' || filterLevel === 'all') && !civicAddress && (
              <div style={{ background: `rgba(212,175,55,0.06)`, border: `1px solid ${S.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Find Your State Representatives</div>
                  <div style={{ fontSize: 12, color: S.gray, lineHeight: 1.5 }}>Enter your address or ZIP code to find your state senators and state house representatives.</div>
                </div>
                {isSignedIn ? (
                  <div style={{ display: "flex", gap: 8, flex: "1 1 300px" }}>
                    <input
                      placeholder="123 Main St, City, State or ZIP"
                      value={civicAddressInput}
                      onChange={e => setCivicAddressInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && civicAddressInput.trim() && setCivicAddress(civicAddressInput.trim())}
                      style={{ flex: 1, padding: "10px 14px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, fontFamily: "inherit", fontSize: 13, outline: "none" }}
                    />
                    <button
                      onClick={() => civicAddressInput.trim() && setCivicAddress(civicAddressInput.trim())}
                      style={{ padding: "10px 18px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                      Find Reps
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openSignIn()}
                    style={{ padding: "10px 22px", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
                    Sign In to Look Up Your Address →
                  </button>
                )}
              </div>
            )}
            {(filterLevel === 'state' || filterLevel === 'all') && civicAddress && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12, color: S.gray }}>
                  Showing all representatives for: <span style={{ color: S.gold }}>{civicAddress}</span>
                  {municipalReps.length > 0 && <span style={{ color: S.gray }}> · {municipalReps.length} state + federal</span>}
                </div>
                <button onClick={() => { setCivicAddress(""); setCivicAddressInput(""); setMunicipalReps([]) }}
                  style={{ fontSize: 12, background: "none", border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray, cursor: "pointer", padding: "4px 12px", fontFamily: "inherit" }}>
                  Change Address
                </button>
              </div>
            )}
            {loadingMunicipal && (
              <div style={{ textAlign: "center", padding: "40px 0", color: S.gray }}>
                <div className="pulse" style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
                <div style={{ fontSize: 14 }}>Loading state legislators…</div>
              </div>
            )}
            {municipalError && (
              <div style={{ padding: "14px 18px", background: "rgba(178,34,52,0.1)", border: `1px solid rgba(178,34,52,0.3)`, borderRadius: 10, color: "#FF6B6B", fontSize: 13, marginBottom: 16 }}>
                Could not load state legislators: {municipalError}
              </div>
            )}
            {!loadingReps && !loadingMunicipal && filteredReps.length === 0 && filterLevel !== 'state' && (
              <div style={{ textAlign: "center", padding: "60px 0", color: S.gray, border: `1px dashed ${S.border}`, borderRadius: 16 }}>
                <PlaceholderAvatar size={80} style={{ margin: "0 auto 20px" }} />
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: S.white, marginBottom: 8 }}>No Representatives Found</div>
                <div style={{ fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                  {liveReps.length === 0
                    ? `Representative data for ${selectedState} could not be loaded from the Congress API. Select a state on the map or try again.`
                    : "No representatives match your current search or filter. Try adjusting your filters."}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {filteredReps.map(rep => {
                const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
                const isTracked = tracked.includes(rep.id)
                return (
                  <div key={rep.id} className="rep-card"
                    style={{ background: `linear-gradient(145deg, rgba(27,42,107,0.6), rgba(10,14,30,0.9))`, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: rep.party === "Democrat" ? "#1565C0" : rep.party === "Republican" ? "#CC2020" : rep.party === "Independent" ? "#D4B800" : rep.party === "Green" ? "#22A05A" : "#334466" }} />
                    <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                      <div style={{ position: "relative" }}>
                        {rep.photo ? (
                          <>
                            <Image src={rep.photo} alt={rep.name} width={68} height={68} style={{ borderRadius: "50%", border: `3px solid ${S.gold}`, objectFit: "cover" }}
                              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                            <InitialsAvatar name={rep.name} party={rep.party} size={68} style={{ display: 'none', border: `3px solid ${S.gold}` }} />
                          </>
                        ) : (
                          <InitialsAvatar name={rep.name} party={rep.party} size={68} style={{ border: `3px solid ${S.gold}` }} />
                        )}
                        {isTracked && <div style={{ position: "absolute", bottom: 0, right: -2, background: S.gold, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{rep.name}</div>
                        <div style={{ fontSize: 11, color: S.gold, marginBottom: 6 }}>{rep.title} · {rep.district}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span className={`badge ${rep.party === "Democrat" ? "dem-badge" : rep.party === "Republican" ? "rep-badge" : rep.party === "Independent" ? "ind-badge" : rep.party === "Green" ? "green-badge" : "rep-badge"}`}>{rep.party}</span>
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
                      <a href={rep.email ? `mailto:${rep.email}` : (rep.contactForm || rep.website)} target="_blank" rel="noreferrer" className="btn-contact" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, textAlign: "center", padding: "7px 0", background: S.navyLight, borderRadius: 8, fontSize: 12, color: "white", textDecoration: "none", transition: "all 0.2s", fontWeight: 600 }}>✉️ {rep.email ? 'Email' : 'Contact Form'}</a>
                      <a href={rep.website} target="_blank" rel="noreferrer" className="btn-contact" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, textAlign: "center", padding: "7px 0", background: `rgba(212,175,55,0.15)`, borderRadius: 8, fontSize: 12, color: S.gold, textDecoration: "none", border: `1px solid ${S.border}`, transition: "all 0.2s", fontWeight: 600 }}>🌐 Web</a>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => selectRep(rep)}
                        style={{ flex: 1, padding: "9px 0", background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>
                        Full Profile →
                      </button>
                      <button onClick={() => toggleTrack(rep)}
                        style={{ padding: "9px 12px", background: isTracked ? `rgba(212,175,55,0.2)` : "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, borderRadius: 8, color: isTracked ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                        {isTracked ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── LOCAL GOVERNMENT SECTION ── */}
            {civicAddress && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>
                    🏙️ Local Government
                  </div>
                  {hasCiceroData && (
                    <span style={{ fontSize: 10, color: S.gray, padding: '2px 8px', border: `1px solid ${S.border}`, borderRadius: 6 }}>
                      via Cicero
                    </span>
                  )}
                </div>

                {/* Cicero officials — mayor, council, supervisors, school board */}
                {hasCiceroData ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
                    {municipalReps.filter(r => ['local','county','school','district'].includes(r.level)).map(rep => {
                      const isTracked = tracked.includes(rep.id)
                      const levelColor = rep.level === 'county' ? '#C8A84B'
                        : rep.level === 'school' ? '#5B9CFF'
                        : rep.level === 'district' ? '#90EE90'
                        : S.gold
                      return (
                        <div key={rep.id} className="rep-card"
                          style={{ background: `linear-gradient(145deg, rgba(27,42,107,0.6), rgba(10,14,30,0.9))`, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: rep.party === 'Democrat' ? '#1565C0' : rep.party === 'Republican' ? '#CC2020' : rep.party === 'Independent' ? '#D4B800' : rep.party === 'Green' ? '#22A05A' : '#334466' }} />
                          <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                            <div style={{ position: 'relative' }}>
                              {rep.photo
                                ? <Image src={rep.photo} alt={rep.name} width={68} height={68} style={{ borderRadius: '50%', border: `3px solid ${levelColor}`, objectFit: 'cover' }}
                                    onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block' }} />
                                : null}
                              <InitialsAvatar name={rep.name} party={rep.party} size={68}
                                style={{ display: rep.photo ? 'none' : 'block', border: `3px solid ${levelColor}` }} />
                              {isTracked && <div style={{ position: 'absolute', bottom: 0, right: -2, background: S.gold, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{rep.name}</div>
                              <div style={{ fontSize: 12, color: levelColor, marginBottom: 6 }}>{rep.title}{rep.district ? ` · ${rep.district}` : ''}</div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: rep.party === 'Democrat' ? 'rgba(21,101,192,0.2)' : rep.party === 'Republican' ? 'rgba(204,32,32,0.2)' : rep.party === 'Independent' ? 'rgba(212,184,0,0.18)' : rep.party === 'Green' ? 'rgba(34,160,90,0.18)' : 'rgba(255,255,255,0.08)', color: rep.party === 'Democrat' ? '#5B9CFF' : rep.party === 'Republican' ? '#FF6B6B' : rep.party === 'Independent' ? '#F0D000' : rep.party === 'Green' ? '#4CAF76' : S.gray, fontSize: 10, padding: '2px 8px', borderRadius: 6 }}>{rep.party}</span>
                                {rep.level !== 'federal' && rep.level !== 'Federal' && <span className="badge" style={{ background: `rgba(212,175,55,0.1)`, color: levelColor, fontSize: 10, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{rep.level}</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            {rep.phone && (
                              <a href={`tel:${rep.phone}`} className="btn-contact" onClick={e => e.stopPropagation()}
                                style={{ flex: 1, textAlign: 'center', padding: '7px 0', background: 'rgba(34,197,94,0.15)', borderRadius: 8, fontSize: 12, color: '#22C55E', textDecoration: 'none', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 600 }}>
                                📞 Call
                              </a>
                            )}
                            {rep.website && (
                              <a href={rep.website} target="_blank" rel="noreferrer" className="btn-contact" onClick={e => e.stopPropagation()}
                                style={{ flex: 1, textAlign: 'center', padding: '7px 0', background: `rgba(212,175,55,0.15)`, borderRadius: 8, fontSize: 12, color: S.gold, textDecoration: 'none', border: `1px solid ${S.border}`, fontWeight: 600 }}>
                                🌐 Web
                              </a>
                            )}
                            <button onClick={() => toggleTrack(rep)}
                              style={{ padding: '7px 12px', background: isTracked ? `rgba(212,175,55,0.2)` : 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 8, color: isTracked ? S.gold : S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                              {isTracked ? '★' : '☆'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* No Cicero data — show honest "no data" state with labeled search links */
                  municipalityInfo && (
                    <div style={{ padding: '20px 24px', background: S.cardBg, border: `1px dashed ${S.border}`, borderRadius: 12 }}>
                      <div style={{ fontSize: 13, color: S.grayLight, marginBottom: 6 }}>
                        Local official data isn't available for{' '}
                        <span style={{ color: S.white, fontWeight: 600 }}>
                          {[municipalityInfo.city, municipalityInfo.county].filter(Boolean).join(', ')}
                        </span>{' '}yet.
                      </div>
                      <div style={{ fontSize: 12, color: S.gray, marginBottom: 16, lineHeight: 1.5 }}>
                        CivicWatch currently covers federal and state legislators. Local council and board data requires a Cicero API integration.
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {municipalityInfo.city && (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(municipalityInfo.city + ' city council members')}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray, textDecoration: 'none' }}>
                            Search: {municipalityInfo.city} City Council ↗
                          </a>
                        )}
                        {municipalityInfo.county && (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(municipalityInfo.county + ' board of supervisors')}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray, textDecoration: 'none' }}>
                            Search: {municipalityInfo.county} Board ↗
                          </a>
                        )}
                        {municipalityInfo.schoolDistrict && (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(municipalityInfo.schoolDistrict + ' school board')}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray, textDecoration: 'none' }}>
                            Search: {municipalityInfo.schoolDistrict} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* REP DETAIL */}
        {activeTab === "reps" && selectedRep && (
          <RepDetail rep={selectedRep} onBack={clearRep} tracked={tracked} toggleTrack={toggleTrack} repTab={repTab} setRepTab={setRepTab} pollVotes={pollVotes} handlePollVote={handlePollVote} handleSubscribe={handleSubscribe} handleBillingPortal={handleBillingPortal} isPro={isPro} S={S} />
        )}

        {/* MAP */}
        {activeTab === "map" && (
  <div className="slide-in">
    <SectionHeader
      title="District Map"
      subtitle={mapView === 'state' && zoomedState
        ? `${zoomedState.name} — click a district to view its representative.`
        : "Click any state to explore its congressional districts."}
    />

    {/* Back to national map button */}
    {mapView === 'state' && (
      <button
        onClick={() => { setMapView('national'); setZoomedState(null); setSelectedDistrict(null); setHoveredDistrict(null) }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${S.border}`, borderRadius: 8, padding: '6px 14px', color: S.gold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, marginBottom: 16 }}
      >
        ← Back to US Map
      </button>
    )}

    <div className="map-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
      <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20 }}>
        {mounted ? (
          <>
            {/* ── NATIONAL VIEW ────────────────────────────── */}
            {mapView === 'national' && (
              <ComposableMap projection="geoAlbersUsa" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <Geographies geography="https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json">
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const abbr = STATE_ABBR[geo.properties.name] || ''
                      const isSelected = abbr === selectedState
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (!abbr) return
                            setSelectedState(abbr)
                            const stateData = STATE_MAP_DATA.find(s => s.state === abbr)
                            setZoomedState({ abbreviation: abbr, name: stateData?.label || abbr, fips: STATE_FIPS[abbr] })
                            setMapView('state')
                            setSelectedDistrict(null)
                            setHoveredDistrict(null)
                          }}
                          style={{
                            default: { fill: isSelected ? S.gold : 'rgba(100,110,130,0.6)', stroke: isSelected ? '#F8F9FF' : 'rgba(255,255,255,0.2)', strokeWidth: isSelected ? 1.5 : 0.5, outline: 'none', cursor: 'pointer' },
                            hover: { fill: 'rgba(150,160,175,0.8)', stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1, outline: 'none', cursor: 'pointer' },
                            pressed: { fill: S.gold, stroke: '#F8F9FF', strokeWidth: 1.5, outline: 'none' },
                          }}
                        />
                      )
                    })
                  }
                </Geographies>
                {Object.entries(STATE_CENTROIDS).map(([abbr, coords]) => {
                  const callout = SMALL_STATE_CALLOUTS[abbr]
                  const labelStyle = { fontWeight: 700, fill: '#fff', stroke: 'rgba(0,0,0,0.75)', strokeWidth: 3, paintOrder: 'stroke', pointerEvents: 'none' }
                  if (callout) {
                    const { dx, dy } = callout
                    return (
                      <Annotation key={abbr} subject={coords} dx={dx} dy={dy}
                        connectorProps={{ stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.7, strokeLinecap: 'round' }}>
                        <text
                          x={dx > 0 ? 3 : dx < 0 ? -3 : 0}
                          textAnchor={dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'}
                          dy=".35em"
                          fontSize={10}
                          style={labelStyle}
                        >{abbr}</text>
                      </Annotation>
                    )
                  }
                  return (
                    <Marker key={abbr} coordinates={coords}>
                      <text textAnchor="middle" dy=".35em" fontSize={11} style={labelStyle}>{abbr}</text>
                    </Marker>
                  )
                })}
              </ComposableMap>
            )}

            {/* ── STATE / DISTRICT VIEW ────────────────────── */}
            {mapView === 'state' && zoomedState && (
              districtPaths.length > 0 ? (
              <div style={{ position: 'relative', userSelect: 'none' }}>
                {/* Zoom controls */}
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { label: '+', title: 'Zoom in',  fn: () => { setMapScale(s => { const ns = Math.min(20, s * 1.4); setMapTx(tx => 300 - (300 - tx) * (ns / s)); setMapTy(ty => 200 - (200 - ty) * (ns / s)); return ns }) } },
                    { label: '−', title: 'Zoom out', fn: () => { setMapScale(s => { const ns = Math.max(1,  s / 1.4); setMapTx(tx => 300 - (300 - tx) * (ns / s)); setMapTy(ty => 200 - (200 - ty) * (ns / s)); return ns }) } },
                    { label: '⊙', title: 'Reset zoom', fn: () => { setMapScale(1); setMapTx(0); setMapTy(0) } },
                  ].map(({ label, title, fn }) => (
                    <button key={label} title={title} onClick={fn} style={{
                      width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.border}`,
                      background: 'rgba(10,22,40,0.85)', color: S.white,
                      fontSize: label === '⊙' ? 14 : 18, lineHeight: 1,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'monospace',
                    }}>{label}</button>
                  ))}
                </div>

                {/* Zoom level badge */}
                {mapScale > 1.05 && (
                  <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10, fontSize: 10, color: S.gray, background: 'rgba(10,22,40,0.7)', padding: '2px 6px', borderRadius: 4 }}>
                    {mapScale.toFixed(1)}×
                  </div>
                )}

                <svg
                  ref={mapSvgRef}
                  viewBox="0 0 600 400"
                  style={{ width: '100%', height: 'auto', display: 'block', cursor: mapPanning ? 'grabbing' : mapScale > 1 ? 'grab' : 'default', touchAction: 'none' }}
                  onWheel={e => {
                    e.preventDefault()
                    const rect = mapSvgRef.current.getBoundingClientRect()
                    // Mouse position in SVG coordinate space
                    const cx = (e.clientX - rect.left) / rect.width  * 600
                    const cy = (e.clientY - rect.top)  / rect.height * 400
                    const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3
                    setMapScale(s => {
                      const ns = Math.max(1, Math.min(20, s * factor))
                      setMapTx(tx => cx - (cx - tx) * (ns / s))
                      setMapTy(ty => cy - (cy - ty) * (ns / s))
                      return ns
                    })
                  }}
                  onMouseDown={e => {
                    if (mapScale <= 1) return
                    mapDidDrag.current = false
                    setMapPanning(true)
                    const rect = mapSvgRef.current.getBoundingClientRect()
                    const svgX = (e.clientX - rect.left) / rect.width  * 600
                    const svgY = (e.clientY - rect.top)  / rect.height * 400
                    mapDragAnchor.current = { ax: svgX - mapTx, ay: svgY - mapTy }
                  }}
                  onMouseMove={e => {
                    if (!mapPanning || !mapDragAnchor.current) return
                    mapDidDrag.current = true
                    const rect = mapSvgRef.current.getBoundingClientRect()
                    const svgX = (e.clientX - rect.left) / rect.width  * 600
                    const svgY = (e.clientY - rect.top)  / rect.height * 400
                    setMapTx(svgX - mapDragAnchor.current.ax)
                    setMapTy(svgY - mapDragAnchor.current.ay)
                  }}
                  onMouseUp={() => { setMapPanning(false) }}
                  onMouseLeave={() => { setMapPanning(false) }}
                >
                  <g transform={`translate(${mapTx},${mapTy}) scale(${mapScale})`}>
                  {districtPaths.map((p, i) => {
                    const isSelected = selectedDistrict === p.districtNum
                    const isHovered = hoveredDistrict === p.districtNum
                    const rep = districtReps[p.districtNum]
                    const partyFill = rep?.party === 'Democrat'
                      ? 'rgba(21,101,192,0.75)'
                      : rep?.party === 'Republican'
                        ? 'rgba(204,32,32,0.75)'
                        : rep?.party === 'Independent'
                          ? 'rgba(212,184,0,0.7)'
                          : rep?.party === 'Green'
                            ? 'rgba(34,160,90,0.75)'
                            : 'rgba(80,95,130,0.7)'
                    return (
                      <path
                        key={i}
                        d={p.d}
                        fill={isSelected ? S.gold : partyFill}
                        stroke="#ffffff"
                        strokeWidth={1.5 / mapScale}
                        opacity={isHovered ? 1 : 0.85}
                        style={{ cursor: mapDidDrag.current ? 'grabbing' : 'pointer', outline: 'none' }}
                        onMouseEnter={() => !mapPanning && setHoveredDistrict(p.districtNum)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => {
                          if (mapDidDrag.current) return // suppress click after drag
                          setSelectedDistrict(p.districtNum)
                          if (rep) { setSelectedRep(rep); setActiveTab('reps') }
                        }}
                      />
                    )
                  })}
                  </g>
                </svg>
              </div>
              ) : districtLoading ? (
                <div style={{ width: '100%', aspectRatio: '1.6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gray, fontSize: 13 }}>
                  Loading districts…
                </div>
              ) : (
                <div style={{ width: '100%', aspectRatio: '1.6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: S.gray, fontSize: 13 }}>
                  <div style={{ fontSize: 28 }}>⚠️</div>
                  <div style={{ color: S.white, fontWeight: 600 }}>{districtError || 'Could not load district map.'}</div>
                  <button
                    onClick={() => {
                      const fips = zoomedState?.fips
                      if (!fips) return
                      setDistrictLoading(true)
                      setDistrictError(null)
                      setDistrictGeoJson(null)
                      fetch(`/api/district-boundaries?fips=${fips}`)
                        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
                        .then(data => {
                          if (data?.features?.length) setDistrictGeoJson(data)
                          else setDistrictError('No district boundary data is available for this state.')
                        })
                        .catch(() => setDistrictError('Failed to load district boundaries. Please try again.'))
                        .finally(() => setDistrictLoading(false))
                    }}
                    style={{ padding: '8px 18px', background: S.navyMid, border: `1px solid ${S.border}`, borderRadius: 8, color: S.white, cursor: 'pointer', fontSize: 12 }}
                  >
                    Retry
                  </button>
                </div>
              )
            )}
          </>
        ) : (
          <div style={{ width: '100%', aspectRatio: '1.6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gray, fontSize: 13 }}>
            Loading map…
          </div>
        )}

        {/* Map hint / hover label */}
        <div style={{ textAlign: 'center', fontSize: 11, color: S.gray, marginTop: 4, minHeight: 16 }}>
          {mapView === 'state' && hoveredDistrict
            ? (() => {
                const rep = districtReps[hoveredDistrict]
                const label = hoveredDistrict === '00' ? 'At-Large' : `District ${parseInt(hoveredDistrict)}`
                return rep ? `${label} — ${rep.name} (${rep.party?.charAt(0) || '?'})` : label
              })()
            : mapView === 'state'
              ? 'Click a district to view its representative'
              : 'Click any state to zoom into its congressional districts'}
        </div>
      </div>

      {/* ── SIDEBAR ────────────────────────────────────── */}
      <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
          {mapView === 'state' && zoomedState ? zoomedState.name : STATE_MAP_DATA.find(s => s.state === selectedState)?.label || selectedState}
        </div>
        <div style={{ fontSize: 11, color: S.gray, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          {mapView === 'state' ? 'Congressional Districts' : 'Representatives'}
        </div>
        {loadingReps ? (
          <div style={{ textAlign: 'center', padding: 32, color: S.gray }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
            Loading…
          </div>
        ) : (() => {
          const stateLabel = STATE_MAP_DATA.find(s => s.state === selectedState)?.label
          const stateReps = displayReps
            .filter(r => r.state === stateLabel || r.state === selectedState)
            .sort((a, b) => {
              const aIsSen = a.title?.includes('Senator')
              const bIsSen = b.title?.includes('Senator')
              if (aIsSen !== bIsSen) return aIsSen ? -1 : 1
              if (aIsSen && bIsSen) {
                const aLast = a.name?.split(',')[0] || a.name || ''
                const bLast = b.name?.split(',')[0] || b.name || ''
                return aLast.localeCompare(bLast)
              }
              // Both House members — sort by district number, at-large (0) last
              const aNum = parseInt((a.district || '').match(/\d+/)?.[0] ?? '999')
              const bNum = parseInt((b.district || '').match(/\d+/)?.[0] ?? '999')
              const aSort = aNum === 0 ? 999 : aNum
              const bSort = bNum === 0 ? 999 : bNum
              return aSort - bSort
            })
          if (stateReps.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: 28, color: S.gray }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: S.white, marginBottom: 8 }}>
                  {mapView === 'state' ? 'Loading districts…' : 'Click a state on the map'}
                </div>
                <div style={{ fontSize: 12, color: S.gray, lineHeight: 1.6 }}>Select a state to explore its congressional districts, votes, and disclosures.</div>
              </div>
            )
          }
          return stateReps.map(r => {
            const distMatch = (r.district || '').match(/\d+/)
            const distNum = distMatch ? String(parseInt(distMatch[0])).padStart(2, '0') : null
            const isHighlighted = mapView === 'state' && distNum && (distNum === hoveredDistrict || distNum === selectedDistrict)
            return (
              <div key={r.id || r.bioguideId}
                style={{ display: "flex", gap: 10, marginBottom: 10, padding: 10, background: isHighlighted ? `rgba(212,175,55,0.15)` : "rgba(27,42,107,0.3)", border: `1px solid ${isHighlighted ? S.gold : S.border}`, borderRadius: 10, cursor: "pointer", transition: 'background 0.15s, border-color 0.15s' }}
                onMouseEnter={() => mapView === 'state' && distNum && setHoveredDistrict(distNum)}
                onMouseLeave={() => mapView === 'state' && setHoveredDistrict(null)}
                onClick={() => { selectRep(r); setActiveTab("reps") }}
                className="rep-card">
                {r.photo ? (
                  <>
                    <Image src={r.photo} alt={r.name} width={38} height={38} style={{ borderRadius: "50%", border: `2px solid ${S.gold}`, objectFit: "cover", flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                    <InitialsAvatar name={r.name} party={r.party} size={38} style={{ display: 'none', border: `2px solid ${S.gold}`, flexShrink: 0 }} />
                  </>
                ) : (
                  <InitialsAvatar name={r.name} party={r.party} size={38} style={{ border: `2px solid ${S.gold}`, flexShrink: 0 }} />
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: S.gold }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: S.gray }}>{r.district}</div>
                </div>
              </div>
            )
          })
        })()}
      </div>
    </div>

    {/* RECENT DISCLOSURES FEED */}
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pulse" style={{ width: 10, height: 10, background: '#f87171', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: S.white }}>Recent Disclosures</span>
        </div>
        <button
          onClick={doFeedFetch}
          disabled={feedLoading}
          style={{ background: 'none', border: `1px solid ${S.border}`, borderRadius: 8, padding: '6px 14px', color: S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, opacity: feedLoading ? 0.5 : 1 }}
        >↻ Refresh</button>
      </div>
      {feedLoading && !feedData ? (
        <div style={{ textAlign: 'center', padding: 40, color: S.gray }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 10px' }} />
          Loading disclosures…
        </div>
      ) : (feedData?.trades?.length || 0) === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: S.gray, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
          No recent disclosures — check back soon
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {feedData.trades.map((trade, i) => {
            const normalize = s => (s || '').toLowerCase().replace(/[^a-z]/g, '')
            const tn = normalize(trade.name)
            const matchedRep = liveReps.find(r => { const rn = normalize(r.name); return rn === tn || rn.includes(tn) || tn.includes(rn) })
            const photo = matchedRep?.photo
            const party = matchedRep?.party
            const partyClass = party === 'Democrat' ? 'dem-badge' : party === 'Republican' ? 'rep-badge' : party === 'Independent' ? 'ind-badge' : party === 'Green' ? 'green-badge' : null
            const partyShort = party === 'Democrat' ? 'D' : party === 'Republican' ? 'R' : party === 'Green' ? 'G' : party ? 'I' : null
            const tradeType = (trade.type || '').toUpperCase()
            const tradeColor = tradeType === 'BUY' ? '#4CAF50' : tradeType === 'SELL' ? '#f87171' : S.gray
            const shareText = `${trade.name} ${tradeType === 'BUY' ? 'bought' : tradeType === 'SELL' ? 'sold' : 'exchanged'} ${trade.amount || ''} of ${trade.ticker || trade.asset}${trade.date ? ` on ${trade.date}` : ''} 🏛️ civicwatch.app`
            return (
              <div key={i}
                onClick={matchedRep ? () => { selectRep(matchedRep); setActiveTab('reps') } : undefined}
                className="rep-card"
                style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, cursor: matchedRep ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                    <InitialsAvatar name={trade.name} party={party || ''} size={40} />
                    {photo && <Image src={photo} alt="" fill style={{ borderRadius: '50%', objectFit: 'cover', border: `2px solid ${S.gold}` }} onError={e => { e.currentTarget.style.display = 'none' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trade.name}</div>
                    {partyClass && partyShort && <span className={`badge ${partyClass}`} style={{ display: 'inline-block', marginTop: 3 }}>{partyShort}</span>}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (navigator.share) navigator.share({ text: shareText, url: 'https://civicwatch.app' }).catch(() => {})
                      else navigator.clipboard.writeText(shareText).catch(() => {})
                    }}
                    title="Share this trade"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: S.gray, fontSize: 14, opacity: 0.6, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                  >📤</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: tradeColor + '22', color: tradeColor, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{tradeTypeLabel(tradeType) || 'Trade'}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: S.white }}>{trade.ticker || trade.asset || '—'}</span>
                  {trade.amount && <span style={{ fontSize: 12, color: S.gray }}>{trade.amount}</span>}
                </div>
                <div style={{ fontSize: 11, color: S.gray }}>{timeAgo(trade.date)}</div>
              </div>
            )
          })}
        </div>
      )}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase" }}>Choose Representatives to Track</div>
                  <div style={{ fontSize: 11, color: S.gray, marginTop: 3 }}>
                    {tracked.length === 0 ? "No one selected — tap a name below to start tracking." : `Tracking ${tracked.length} rep${tracked.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      if (!isSignedIn) { openSignIn(); return }
                      const stateLabel = STATE_MAP_DATA.find(s => s.state === selectedState)?.label
                      const stateRepIds = displayReps.filter(r => r.state === stateLabel || r.state === selectedState).map(r => r.id)
                      setTracked(prev => [...new Set([...prev, ...stateRepIds])])
                    }}
                    style={{ padding: "6px 12px", background: "rgba(212,175,55,0.12)", border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, cursor: "pointer", fontFamily: "inherit", fontSize: 11, whiteSpace: "nowrap" }}>
                    + Select All from My State
                  </button>
                  {tracked.length > 0 && (
                    <button
                      onClick={() => setTracked([])}
                      style={{ padding: "6px 12px", background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 8, color: S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 11, whiteSpace: "nowrap" }}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {displayReps.map(r => (
                  <div key={r.id} onClick={() => toggleTrack(r.id)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: tracked.includes(r.id) ? `rgba(212,175,55,0.12)` : S.cardBg, border: `1px solid ${tracked.includes(r.id) ? S.gold : S.border}`, borderRadius: 30, cursor: "pointer" }}>
                    <Image src={r.photo} alt={r.name} width={26} height={26} style={{ borderRadius: "50%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = 'none' }} />
                    <span style={{ fontSize: 12, color: tracked.includes(r.id) ? S.gold : S.gray }}>{r.name.split(" ").slice(-1)[0]}</span>
                    {tracked.includes(r.id) && <span style={{ color: S.gold, fontSize: 11 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* ── Notification Settings ──────────────────────────────────── */}
            <div style={{ marginBottom: 24, padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase' }}>Notification Settings</div>
                {prefsSaved && (
                  <span style={{ fontSize: 11, color: S.green, fontWeight: 600, letterSpacing: 0.5 }}>Saved ✓</span>
                )}
              </div>

              {/* Email address */}
              {isSignedIn && user?.primaryEmailAddress?.emailAddress && (
                <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginBottom: 4 }}>Alerts sent to</div>
                  <div style={{ fontSize: 13, color: S.grayLight }}>{user.primaryEmailAddress.emailAddress}</div>
                </div>
              )}

              {/* Frequency */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: S.grayLight, marginBottom: 8, fontWeight: 600 }}>Frequency</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { value: 'daily',   label: 'Daily digest',  hint: 'One email per day' },
                    { value: 'weekly',  label: 'Weekly digest', hint: 'Every Monday' },
                    { value: 'instant', label: 'Instant',       hint: 'Same-day (checks run daily)' },
                  ].map(({ value, label, hint }) => {
                    const active = prefs.alert_frequency === value
                    return (
                      <button key={value} onClick={() => updatePref('alert_frequency', value)}
                        title={hint}
                        style={{ padding: '7px 14px', background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? S.gold : S.border}`, borderRadius: 8, color: active ? S.gold : S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Alert types */}
              <div>
                <div style={{ fontSize: 11, color: S.grayLight, marginBottom: 8, fontWeight: 600 }}>Alert Types</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'alert_trades',      label: 'New trade disclosures (PTR filings)', tier: 'Free',    tierColor: '#2a9d4c', tierBg: 'rgba(42,157,76,0.12)' },
                    { key: 'alert_committees',   label: 'Committee assignments',              tier: 'Sign In',  tierColor: '#5B9CFF', tierBg: 'rgba(91,156,255,0.12)' },
                    { key: 'alert_networth',     label: 'Net worth updates (annual financial disclosures)', tier: 'Pro', tierColor: S.gold, tierBg: 'rgba(212,175,55,0.12)' },
                    { key: 'alert_legislation',  label: 'Sponsored legislation',             tier: 'Pro',      tierColor: S.gold, tierBg: 'rgba(212,175,55,0.12)' },
                  ].map(({ key, label, tier, tierColor, tierBg }) => {
                    const checked = prefs[key]
                    return (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <div onClick={() => updatePref(key, !checked)}
                          style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? S.gold : S.border}`, background: checked ? 'rgba(212,175,55,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer' }}>
                          {checked && <span style={{ color: S.gold, fontSize: 12, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: checked ? S.grayLight : S.gray, flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 10, background: tierBg, color: tierColor, border: `1px solid ${tierColor}44`, flexShrink: 0 }}>{tier}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {loadingAlerts && (
                <div style={{ textAlign: 'center', padding: 32, color: S.gray }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                  Loading latest activity for tracked representatives…
                </div>
              )}
              {!loadingAlerts && (() => {
                const mockTrackedAlerts = alerts.filter(a => tracked.includes(a.repId))
                const allAlerts = [...liveAlerts, ...mockTrackedAlerts]
                if (allAlerts.length === 0) return (
                  <div style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                    {tracked.length === 0 ? (
                      <>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: S.white, marginBottom: 8 }}>No representatives selected</div>
                        <div style={{ fontSize: 13, color: S.gray, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>Use the chips above to choose who to track, or click "Select All from My State" to get started.</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: S.white, marginBottom: 8 }}>You're all caught up!</div>
                        <div style={{ fontSize: 13, color: S.gray, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>We'll notify you when your tracked representatives make new trades or file disclosures.</div>
                      </>
                    )}
                  </div>
                )
                return allAlerts.map(alert => {
                  const photo = alert.photo || displayReps.find(r => r.id === alert.repId)?.photo
                  const typeIcon = { vote: "⚖️", trade: "💰", docket: "📋", townhall: "🏛️" }[alert.type]
                  const typeColor = { vote: S.gold, trade: "#FF6B6B", docket: "#5B9CFF", townhall: "#90EE90" }[alert.type]
                  const displayTime = alert.time && alert.time.match(/^\d{4}-\d{2}-\d{2}/) ? timeAgo(alert.time) : alert.time
                  return (
                    <div key={alert.id} className={alert.read ? "" : "alert-unread"}
                      style={{ padding: "14px 16px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{typeIcon}</span>
                      {photo && <Image src={photo} alt="" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.message}</div>
                        <div style={{ fontSize: 11, color: S.gray }}>{displayTime}</div>
                      </div>
                      <span className="badge" style={{ background: `rgba(212,175,55,0.12)`, color: typeColor, textTransform: "uppercase", flexShrink: 0 }}>{alert.type}</span>
                      {!alert.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.gold, flexShrink: 0 }} />}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* SEARCH */}
        {activeTab === "search" && (
          <div className="slide-in">
            <SectionHeader title="Search Representatives" subtitle="Find any U.S. representative or senator by name." />
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                placeholder="Search by name (e.g. Pelosi, AOC, Ocasio…)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '12px 40px 12px 14px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, color: S.white, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchError('') }}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: S.gray, cursor: 'pointer', fontSize: 20, padding: '0 4px', lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>
            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: S.gray }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
                Searching…
              </div>
            )}
            {!searchLoading && searchError && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: S.gray }}>{searchError}</div>
            )}
            {!searchLoading && !searchError && searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.map(member => {
                  const isSen = member.isSenator
                  const nameParts = (member.name || '').split(', ')
                  const displayName = nameParts.length >= 2
                    ? `${nameParts[1].split(' ')[0]} ${nameParts[0]}`
                    : member.name || ''
                  const nameSlug = displayName.toLowerCase()
                    .replace(/[^a-z\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                  const photo = `/api/rep-photo/${member.bioguideId}`
                  const partyColor = member.party === 'Democrat' ? '#1565C0' : member.party === 'Republican' ? '#CC2020' : member.party === 'Independent' ? '#D4B800' : member.party === 'Green' ? '#22A05A' : '#334466'
                  const rep = {
                    id: member.bioguideId,
                    name: member.name,
                    title: isSen ? 'U.S. Senator' : 'U.S. Representative',
                    party: member.party === 'Democratic' ? 'Democrat' : member.party || 'Unknown',
                    state: member.state || '',
                    district: member.district || 'Statewide',
                    level: 'federal',
                    photo,
                    email: '',
                    phone: isSen ? '(202) 224-3121' : '(202) 225-3121',
                    contactForm: deriveContactUrl(member.officialWebsiteUrl, isSen),
                    website: `https://www.congress.gov/member/${nameSlug}/${member.bioguideId}`,
                    officeHours: 'Mon-Fri 9am-5pm',
                    officeLocation: `U.S. ${isSen ? 'Senate' : 'House'}, Washington DC`,
                    bio: `${displayName} is a ${member.party} ${isSen ? 'Senator' : 'Representative'} from ${member.state}.`,
                    peers: [], peerComparison: {},
                    netWorthBefore: null, netWorthCurrent: null, yearsInOffice: null,
                    trades: [], votes: [], docket: [], townHall: [],
                    communityPoll: { healthcare: 0, climate: 0, housing: 0, education: 0 },
                    isLive: false,
                  }
                  return (
                    <div key={member.bioguideId}
                      onClick={() => { selectRep(rep); setActiveTab('reps') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: `linear-gradient(145deg, rgba(27,42,107,0.6), rgba(10,14,30,0.9))`, border: `1px solid ${S.border}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = S.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: partyColor }} />
                      <div style={{ position: 'relative', flexShrink: 0, marginTop: 3 }}>
                        <Image src={photo} alt={displayName}
                          width={56} height={56}
                          style={{ borderRadius: '50%', border: `2px solid ${partyColor}`, objectFit: 'cover' }}
                          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                        <InitialsAvatar name={displayName} party={member.party} size={56} style={{ display: 'none', border: `2px solid ${partyColor}` }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: S.gold, marginBottom: 5 }}>
                          {isSen ? 'U.S. Senator' : 'U.S. Representative'} · {member.state} · {member.district}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${partyColor}22`, color: partyColor, border: `1px solid ${partyColor}44` }}>
                            {member.party === 'Democrat' ? 'D' : member.party === 'Republican' ? 'R' : 'I'}
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(212,175,55,0.1)', color: S.gold, border: `1px solid ${S.border}` }}>
                            {isSen ? 'Senate' : 'House'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: S.gray, flexShrink: 0 }}>View Profile →</div>
                    </div>
                  )
                })}
              </div>
            )}
            {!searchLoading && !searchError && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: S.gray }}>
                No results found for &ldquo;{searchQuery.trim()}&rdquo;
              </div>
            )}
            {!searchLoading && searchQuery.trim().length < 2 && (
              <div style={{ textAlign: 'center', padding: '56px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ color: S.gray, fontSize: 14 }}>Type at least 2 characters to search for a representative</div>
              </div>
            )}
          </div>
        )}

        {/* CONSTITUTION */}
        {activeTab === "constitution" && (
          <div className="slide-in">
            <SectionHeader title="The Constitution of the United States" subtitle="The supreme law of the United States — every Article and key Amendment, with plain-language explanations." />

            {/* Header image */}
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20, border: `1px solid ${S.border}` }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Constitution_of_the_United_States%2C_page_1.jpg/960px-Constitution_of_the_United_States%2C_page_1.jpg"
                alt="Constitution of the United States, page 1"
                referrerPolicy="no-referrer"
                style={{ width: "100%", maxHeight: 260, objectFit: "cover", objectPosition: "top", display: "block" }}
              />
            </div>

            {/* Intro */}
            <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.8, marginBottom: 24, padding: "16px 20px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
              The Constitution of the United States is the supreme law of the land, ratified in 1788. It establishes the framework of the federal government and guarantees fundamental rights to all Americans.
            </p>

            {/* Section toggle + archive link */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
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
                  <ConstitutionCard key={art.id} title={art.title} plain={art.plain} original={art.original} S={S} />
                ))}
              </div>
            )}
            {constitSection === "amendments" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {AMENDMENTS.map(am => (
                  <div key={am.num} style={{ padding: 18, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 40, height: 40, background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14 }}>{am.num}</div>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13, color: S.offWhite, marginBottom: 2 }}>Amendment {am.num}</div>
                        <div style={{ fontSize: 12, color: S.gold, fontWeight: 600 }}>{am.title}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: S.gold, lineHeight: 1.7, marginBottom: 10 }}>{am.plain}</p>
                    <p style={{ fontSize: 12, color: S.gray, lineHeight: 1.7, fontStyle: "italic", borderLeft: `3px solid rgba(212,175,55,0.3)`, paddingLeft: 12, margin: 0 }}>{am.original}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── ONBOARDING MODAL ── */}
      {showOnboarding && (
        <div className="onboarding-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,30,0.88)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="onboarding-card slide-in" style={{ maxWidth: 460, width: '100%', background: `linear-gradient(145deg, ${S.navyMid}, #0d1a3a)`, border: `1px solid ${S.border}`, borderRadius: 20, padding: '40px 32px 28px', position: 'relative' }}>
            <div className="star-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.25, borderRadius: 'inherit', pointerEvents: 'none' }} />

            {/* × dismiss */}
            <button
              onClick={() => finishOnboarding(false)}
              aria-label="Skip onboarding"
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: S.gray, fontSize: 22, lineHeight: 1, cursor: 'pointer', zIndex: 1, padding: 4 }}>
              ×
            </button>

            <div style={{ position: 'relative' }}>

              {/* ── Step 1: Welcome ── */}
              {onboardingStep === 1 && (
                <div className="slide-in">
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ fontSize: 60, marginBottom: 14, lineHeight: 1 }}>🏛️</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 24, marginBottom: 10 }}>
                      Welcome to CIVIC<span style={{ color: S.gold }}>WATCH</span>
                    </div>
                    <div style={{ fontSize: 14, color: S.gray, lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                      Track your representatives' stock trades, net worth, legislation, and more. Real accountability, in real time.
                    </div>
                  </div>
                  <button
                    onClick={() => setOnboardingStep(2)}
                    style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: 'none', borderRadius: 12, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 0.5 }}>
                    Get Started →
                  </button>
                </div>
              )}

              {/* ── Step 2: Find Your Reps ── */}
              {onboardingStep === 2 && (
                <div className="slide-in">
                  <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>📍</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 21, marginBottom: 10 }}>
                      Find Your Representatives
                    </div>
                    <div style={{ fontSize: 13, color: S.gray, lineHeight: 1.7 }}>
                      We'll use your location to show you your House and Senate representatives. You can also search by name.
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 11, color: S.gray, marginBottom: 7, letterSpacing: 1, textTransform: 'uppercase' }}>Select your state</label>
                    <select
                      value={onboardingSelectedState}
                      onChange={e => setOnboardingSelectedState(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', background: 'rgba(10,14,30,0.8)', border: `1px solid ${S.border}`, borderRadius: 10, color: S.white, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', outline: 'none' }}>
                      {Object.entries(STATE_ABBR).sort((a, b) => a[0].localeCompare(b[0])).map(([name, abbr]) => (
                        <option key={abbr} value={abbr} style={{ background: S.navy }}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setOnboardingStep(3)}
                      style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 12, color: S.gray, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                      Skip
                    </button>
                    <button
                      onClick={() => { setSelectedState(onboardingSelectedState); setOnboardingStep(3) }}
                      style={{ flex: 2, padding: '11px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: 'none', borderRadius: 12, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5 }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Track Someone ── */}
              {onboardingStep === 3 && (
                <div className="slide-in">
                  <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>🔔</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 21, marginBottom: 10 }}>
                      Track a Representative
                    </div>
                    <div style={{ fontSize: 13, color: S.gray, lineHeight: 1.7 }}>
                      Get email alerts when your representatives make new trade disclosures. Tap the bell icon on any rep to start tracking.
                    </div>
                  </div>
                  {/* Visual hint */}
                  <div style={{ background: 'rgba(27,42,107,0.5)', border: `1px solid ${S.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flexShrink: 0, background: 'rgba(178,34,52,0.18)', border: `1px solid rgba(178,34,52,0.4)`, borderRadius: 8, padding: '8px 12px', fontSize: 18 }}>🔔</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Look for the Track button</div>
                      <div style={{ fontSize: 11, color: S.gray, lineHeight: 1.5 }}>
                        On each representative's card, tap <strong style={{ color: S.gold }}>🔔 Track</strong> to receive alerts for new votes and trade disclosures.
                      </div>
                    </div>
                    <div style={{ fontSize: 18, opacity: 0.5, flexShrink: 0 }}>←</div>
                  </div>
                  <button
                    onClick={() => finishOnboarding(true)}
                    style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${S.gold}, #b8952d)`, border: 'none', borderRadius: 12, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 0.5 }}>
                    Done — Let's Go! 🏛️
                  </button>
                </div>
              )}

              {/* Progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 22 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: s === onboardingStep ? S.gold : 'rgba(212,175,55,0.25)', transition: 'background 0.25s', cursor: s < onboardingStep ? 'pointer' : 'default' }} onClick={() => { if (s < onboardingStep) setOnboardingStep(s) }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: 48, borderTop: `1px solid ${S.border}`, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, white 33%, white 66%, ${S.navyMid} 66%)`, marginBottom: 14, borderRadius: 2 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", color: S.gold, fontSize: 14, marginBottom: 8 }}>CivicWatch™ · A Democracy Accountability Platform</div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 10, fontSize: 12 }}>
            <a href="/about" style={{ color: S.gray, textDecoration: "none" }}>About</a>
            <a href="/press" style={{ color: S.gray, textDecoration: "none" }}>Press</a>
            <a href="/privacy" style={{ color: S.gray, textDecoration: "none" }}>Privacy Policy</a>
            <a href="/terms" style={{ color: S.gray, textDecoration: "none" }}>Terms of Service</a>
            <a href="mailto:marcshelton@gmail.com" style={{ color: S.gray, textDecoration: "none" }}>Contact</a>
            <a href="/data-deletion" style={{ color: S.gray, textDecoration: "none" }}>Data Deletion</a>
          </div>
          <div style={{ fontSize: 11, color: S.gray }}>Data sourced from <a href="https://congress.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>Congress.gov</a>, <a href="https://disclosures-clerk.house.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>House Clerk STOCK Act Disclosures</a>, <a href="https://efts.senate.gov" target="_blank" rel="noreferrer" style={{ color: S.gray }}>Senate Financial Disclosures</a>, and <a href="https://legiscan.com" target="_blank" rel="noreferrer" style={{ color: S.gray }}>LegiScan LLC (CC BY 4.0)</a>.</div>
        </div>
      </footer>

      {/* ACCOUNT SETTINGS PANEL */}
      <SettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        trackedReps={liveReps.filter(r => tracked.includes(r.id)).map(r => ({ bioguide_id: r.id || r.bioguideId, rep_name: r.name }))}
        onUntrack={id => toggleTrack(id)}
        isPro={isPro}
        user={user}
        tracked={tracked}
        liveReps={liveReps}
        toggleTrack={toggleTrack}
        prefs={prefs}
        updatePref={updatePref}
        prefsSaved={prefsSaved}
        handleBillingPortal={handleBillingPortal}
      />

      {/* PWA INSTALL BANNER */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: `linear-gradient(135deg, #0d1a35, ${S.navyMid})`,
          borderTop: `1px solid ${S.gold}`,
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
          animation: 'slideInUp 0.35s ease',
        }}>
          <style>{`@keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
          <span style={{ fontSize: 14, color: S.offWhite, display: 'flex', alignItems: 'center', gap: 8 }}>
            📲 <span>Add <strong>CivicWatch</strong> to your home screen</span>
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={async () => {
                if (installPrompt) {
                  installPrompt.prompt()
                  const { outcome } = await installPrompt.userChoice
                  if (outcome === 'accepted') {
                    setInstallPrompt(null)
                    setShowInstallBanner(false)
                    try { localStorage.setItem('cw_install_dismissed', '1') } catch {}
                  }
                } else {
                  setShowInstallBanner(false)
                }
              }}
              style={{
                padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: S.gold, color: '#0a0f1e', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              }}
            >
              Install
            </button>
            <button
              onClick={() => { setShowInstallBanner(false); try { localStorage.setItem('cw_install_dismissed', '1') } catch {} }}
              style={{
                padding: '7px 10px', borderRadius: 6, border: `1px solid ${S.border}`, cursor: 'pointer',
                background: 'transparent', color: S.gray, fontSize: 15, fontFamily: 'inherit', lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RepDetail({ rep, onBack, tracked, toggleTrack, repTab, setRepTab, pollVotes, handlePollVote, handleSubscribe, handleBillingPortal, isPro: isProProp, S }) {
  const [liveVotes, setLiveVotes] = useState(null)
  const [liveTrades, setLiveTrades] = useState(null)
  const [tradesMeta, setTradesMeta] = useState(null)
  const [liveBio, setLiveBio] = useState(null)
  const [liveSponsored, setLiveSponsored] = useState(null)
  const [liveCommittees, setLiveCommittees] = useState(null)
  const [liveDocket, setLiveDocket] = useState(null)
  const [liveDocketSource, setLiveDocketSource] = useState(null)
  const [liveTownHall, setLiveTownHall] = useState(null)
  const [liveTownHallMeta, setLiveTownHallMeta] = useState(null)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [loadingTrades, setLoadingTrades] = useState(false)
  const [loadingBio, setLoadingBio] = useState(false)
  const [loadingDocket, setLoadingDocket] = useState(false)
  const [loadingTownHall, setLoadingTownHall] = useState(false)
  const [liveNonprofits, setLiveNonprofits] = useState(null)
  const [loadingNonprofits, setLoadingNonprofits] = useState(false)
  const [netWorthHistory, setNetWorthHistory] = useState(null)
  const [disclosures, setDisclosures] = useState(null)
  const [loadingDisclosures, setLoadingDisclosures] = useState(false)
  const [ptrResults, setPtrResults] = useState({})   // docId → { trades, loading, error }
  const [expandedPtr, setExpandedPtr] = useState(null)
  const [shareToast, setShareToast] = useState(null)
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [fdNetWorth, setFdNetWorth] = useState(null)
  const [fdNetWorthMeta, setFdNetWorthMeta] = useState(null)
  const [loadingFdNetWorth, setLoadingFdNetWorth] = useState(false)
  const [nwHoverIdx, setNwHoverIdx] = useState(null)
  const [compareQuery, setCompareQuery] = useState('')
  const [compareResults, setCompareResults] = useState([])
  const [compareSearchLoading, setCompareSearchLoading] = useState(false)
  const [compareRep, setCompareRep] = useState(null)
  const [compareData, setCompareData] = useState(null)
  const [compareDataLoading, setCompareDataLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  const partyAbbr = p => p === 'Democrat' ? 'D' : p === 'Republican' ? 'R' : p === 'Independent' ? 'I' : (p || 'I').charAt(0).toUpperCase()
  const actionWord = type => type === 'BUY' ? 'bought' : type === 'SELL' ? 'sold' : type === 'EXCHANGE' ? 'exchanged' : (type || '').toLowerCase()

  const handleShare = (text, url) => {
    const shareUrl = url || `https://civicwatch.app?rep=${rep.id}`
    if (navigator.share) {
      navigator.share({ text, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text}\n${shareUrl}`).then(() => {
        setShareToast('Copied!')
        setTimeout(() => setShareToast(null), 2000)
      }).catch(() => {})
    }
  }

  // Reset all live data when the rep changes so stale data from the
  // previous rep never briefly flashes for the newly selected rep
  useEffect(() => {
    setLiveVotes(null); setLiveTrades(null); setTradesMeta(null)
    setLiveBio(null); setLiveSponsored(null); setLiveCommittees(null)
    setLiveDocket(null); setLiveDocketSource(null)
    setLiveTownHall(null); setLiveTownHallMeta(null)
    setLiveNonprofits(null); setNetWorthHistory(null)
    setDisclosures(null); setPtrResults({}); setExpandedPtr(null)
    setLoadingVotes(false); setLoadingTrades(false); setLoadingBio(false)
    setLoadingDocket(false); setLoadingTownHall(false); setLoadingNonprofits(false)
    setLoadingDisclosures(false)
    setFdNetWorth(null); setFdNetWorthMeta(null); setLoadingFdNetWorth(false); setNwHoverIdx(null)
    setCompareQuery(''); setCompareResults([]); setCompareRep(null); setCompareData(null); setCompareDataLoading(false); setCompareMode(false)
  }, [rep.id])

  const isLive = rep.isLive

  useEffect(() => {
    if ((repTab === 'votes' || repTab === 'overview') && isLive && !liveVotes && !loadingVotes) {
      setLoadingVotes(true)
      fetch(`/api/congress?type=votes&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveVotes(d.votes || []); setLoadingVotes(false) })
        .catch(() => { setLiveVotes([]); setLoadingVotes(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if ((repTab === 'wealth' || repTab === 'overview') && isLive && !liveTrades && !loadingTrades) {
      setLoadingTrades(true)
      fetch(`/api/congress?type=trades&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => {
          setLiveTrades(d.trades || [])
          setTradesMeta({ buys: d.buys || 0, sells: d.sells || 0, topTickers: d.topTickers || [], disclosureUrl: d.disclosureUrl || null, source: d.source })
          if (d.netWorthHistory?.length > 0) setNetWorthHistory(d.netWorthHistory)
          setLoadingTrades(false)
        })
        .catch(() => { setLiveTrades([]); setLoadingTrades(false) })
    }
  }, [repTab, rep.id])

  // Fetch House Clerk filing index for federal House members
  useEffect(() => {
    if ((repTab === 'wealth' || repTab === 'overview') && isLive && rep.source !== 'openstates' && !disclosures && !loadingDisclosures) {
      const lastName = (rep.name || '').split(',')[0].trim().split(' ').pop()
      const stateDst = (rep.state || '') + (rep.district ? String(rep.district).padStart(2, '0') : '')
      if (!lastName) return
      setLoadingDisclosures(true)
      fetch(`/api/disclosures?lastName=${encodeURIComponent(lastName)}&stateDst=${encodeURIComponent(stateDst)}`)
        .then(r => r.json())
        .then(d => { setDisclosures(d); setLoadingDisclosures(false) })
        .catch(() => { setDisclosures({ filings: [], ptrCount: 0, annualCount: 0 }); setLoadingDisclosures(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (repTab === 'wealth' && rep.source !== 'openstates' && !fdNetWorth && !loadingFdNetWorth) {
      setLoadingFdNetWorth(true)
      const lastName = (rep.name || '').split(',')[0].trim()
      const stateAbbr = STATE_ABBR[rep.state] || (rep.state || '').slice(0, 2).toUpperCase()
      fetch(`/api/networth?bioguideId=${rep.id}&lastName=${encodeURIComponent(lastName)}&state=${encodeURIComponent(stateAbbr)}`)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
        .then(d => { setFdNetWorth(d.history || []); setFdNetWorthMeta(d) })
        .catch(() => { setFdNetWorth([]); setFdNetWorthMeta(null) })
        .finally(() => setLoadingFdNetWorth(false))
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (repTab === 'bio' && isLive && !liveBio && !loadingBio) {
      setLoadingBio(true)
      Promise.all([
        fetch(`/api/congress?type=member&bioguideId=${rep.id}`).then(r => r.json()),
        fetch(`/api/congress?type=sponsored&bioguideId=${rep.id}`).then(r => r.json()),
        fetch(`/api/congress?type=committees&bioguideId=${rep.id}`).then(r => r.json()),
      ]).then(([bioData, sponsoredData, committeeData]) => {
        setLiveBio(bioData.member || null)
        setLiveSponsored(sponsoredData.bills || [])
        setLiveCommittees(committeeData.committees || [])
        setLoadingBio(false)
      }).catch(() => { setLoadingBio(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (compareQuery.trim().length < 2) {
      setCompareResults([])
      setCompareSearchLoading(false)
      return
    }
    setCompareSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/congress?type=search&name=${encodeURIComponent(compareQuery.trim())}`)
        const data = await res.json()
        setCompareResults(data.members || [])
      } catch {
        setCompareResults([])
      } finally {
        setCompareSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [compareQuery])

  useEffect(() => {
    if (!compareRep) return
    setCompareDataLoading(true)
    Promise.all([
      fetch(`/api/congress?type=member&bioguideId=${compareRep.bioguideId}`).then(r => r.json()),
      fetch(`/api/congress?type=trades&bioguideId=${compareRep.bioguideId}`).then(r => r.json()),
    ]).then(([bioData, tradesData]) => {
      setCompareData({
        bio: bioData.member || {},
        trades: tradesData.trades || [],
        topTickers: tradesData.topTickers || [],
        netWorthHistory: tradesData.netWorthHistory || [],
      })
      setCompareDataLoading(false)
    }).catch(() => {
      setCompareData({ bio: {}, trades: [], topTickers: [], netWorthHistory: [] })
      setCompareDataLoading(false)
    })
  }, [compareRep?.bioguideId])

  useEffect(() => {
    if ((repTab === 'docket' || repTab === 'overview') && isLive && !liveDocket && !loadingDocket) {
      setLoadingDocket(true)
      const state = rep.state || 'US'
      fetch(`/api/congress?type=schedule&state=${state}&bioguideId=${rep.id}`)
        .then(r => r.json())
        .then(d => { setLiveDocket(d.schedule || []); setLiveDocketSource(d.source || null); setLoadingDocket(false) })
        .catch(() => { setLiveDocket([]); setLoadingDocket(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (repTab === 'townhall' && isLive && !liveTownHall && !loadingTownHall) {
      setLoadingTownHall(true)
      const stateAbbr = rep.stateAbbr || rep.state?.substring(0, 2).toUpperCase() || 'US'
      fetch(`/api/congress?type=townhall&bioguideId=${rep.id}&state=${stateAbbr}`)
        .then(r => r.json())
        .then(d => {
          setLiveTownHall(d.events || [])
          setLiveTownHallMeta({ officialEventsUrl: d.officialEventsUrl, googleSearchUrl: d.googleSearchUrl, source: d.source, isSenator: d.isSenator })
          setLoadingTownHall(false)
        })
        .catch(() => { setLiveTownHall([]); setLoadingTownHall(false) })
    }
  }, [repTab, rep.id])

  useEffect(() => {
    if (repTab === 'nonprofits' && !liveNonprofits && !loadingNonprofits) {
      setLoadingNonprofits(true)
      const stateParam = rep.state ? `&state=${encodeURIComponent(rep.state)}` : ''
      fetch(`/api/nonprofits?name=${encodeURIComponent(rep.name)}${stateParam}`)
        .then(r => r.json())
        .then(d => { setLiveNonprofits(d.organizations || []); setLoadingNonprofits(false) })
        .catch(() => { setLiveNonprofits([]); setLoadingNonprofits(false) })
    }
  }, [repTab, rep.id])

  const votes = isLive ? (liveVotes || rep.votes) : rep.votes
  const trades = isLive ? (liveTrades || rep.trades) : rep.trades
  const enr = enrichment(rep.netWorthBefore, rep.netWorthCurrent)
  const isTracked = tracked.includes(rep.id)

  const parseTradeUpperBound = (amount) => {
    if (typeof amount === 'number') return amount
    const m = String(amount).replace(/[$,]/g, '').match(/\d+\s*[-–]\s*(\d+)/)
    return m ? parseInt(m[1]) : 0
  }
  const largestTrade = trades?.length > 0
    ? trades.reduce((max, t) => parseTradeUpperBound(t.amount) > parseTradeUpperBound(max.amount) ? t : max, trades[0])
    : null
  const tradedLast90 = trades?.some(t => t.date && (Date.now() - new Date(t.date).getTime()) < 90 * 24 * 60 * 60 * 1000) ?? false

  const loadPtr = (docId, year) => {
    if (ptrResults[docId]) { setExpandedPtr(expandedPtr === docId ? null : docId); return }
    setPtrResults(prev => ({ ...prev, [docId]: { loading: true } }))
    setExpandedPtr(docId)
    fetch(`/api/ptr-trades?docId=${docId}&year=${year}`)
      .then(r => r.json())
      .then(d => setPtrResults(prev => ({ ...prev, [docId]: { trades: d.trades || [], pdfUrl: d.pdfUrl, error: d.error } })))
      .catch(() => setPtrResults(prev => ({ ...prev, [docId]: { trades: [], error: 'Failed to load' } })))
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "votes", label: "Votes" },
    { id: "docket", label: "Today's Docket" },
    { id: "wealth", label: "Wealth & Trades" },
    { id: "bio", label: "Bio" },
    { id: "townhall", label: "Town Hall" },
    { id: "nonprofits", label: "🏦 Nonprofits" },
    { id: "ai", label: "🤖 AI Analysis" },
  ]

  return (
    <div className="slide-in">
      {shareToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: S.gold, color: '#0a0e1e', fontWeight: 700, fontSize: 13, padding: '8px 20px', borderRadius: 20, zIndex: 9999, pointerEvents: 'none' }}>
          {shareToast}
        </div>
      )}
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1px solid ${S.border}`, color: S.gray, cursor: "pointer", padding: "8px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 12, marginBottom: 20 }}>
        ← Back
      </button>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, rgba(27,42,107,0.8), rgba(10,14,30,0.95))`, border: `1px solid ${S.border}`, borderRadius: 20, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div className="star-pattern" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div style={{ position: "relative", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          {rep.photo ? (
            <>
              <Image src={rep.photo} alt={rep.name} width={90} height={90} style={{ borderRadius: "50%", border: `4px solid ${S.gold}`, objectFit: "cover" }}
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
              <InitialsAvatar name={rep.name} party={rep.party} size={90}
                style={{ display: 'none', border: `4px solid ${S.gold}` }} />
            </>
          ) : (
            <InitialsAvatar name={rep.name} party={rep.party} size={90}
              style={{ border: `4px solid ${S.gold}` }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>{rep.name}</div>
            <div style={{ fontSize: 13, color: S.gold, marginBottom: 8 }}>{rep.title} · {rep.state} · {rep.district}</div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: S.grayLight, flexWrap: "wrap" }}>
              <span>🏛️ {rep.officeLocation}</span>
              <span className="rep-office-hours">🕐 {rep.officeHours}</span>
            </div>
          </div>
          <div className="rep-hero-actions" style={{ display: "flex", gap: 8 }}>
            <a href={`tel:${rep.phone}`} style={{ padding: "9px 16px", background: S.green, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>📞 {rep.phone}</a>
            <a href={rep.email ? `mailto:${rep.email}` : (rep.contactForm || rep.website)} target="_blank" rel="noreferrer" style={{ padding: "9px 16px", background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>✉️ {rep.email ? 'Email' : 'Contact Form'}</a>
            <a href={rep.website} target="_blank" rel="noreferrer" style={{ padding: "9px 16px", background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 10, color: S.gold, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>🌐 Website</a>
            <button onClick={() => toggleTrack(rep)} style={{ padding: "9px 16px", background: isTracked ? `rgba(212,175,55,0.15)` : "rgba(255,255,255,0.05)", border: `1px solid ${isTracked ? S.gold : S.border}`, borderRadius: 10, color: isTracked ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
              {isTracked ? "★ Tracking" : "☆ Track"}
            </button>
            <button onClick={() => {
              if (compareMode) {
                setCompareMode(false)
                setCompareRep(null)
                setCompareQuery('')
                setCompareResults([])
                setCompareData(null)
              } else {
                setCompareMode(true)
              }
            }} style={{ padding: "9px 16px", background: compareMode ? `rgba(212,175,55,0.2)` : "rgba(255,255,255,0.05)", border: `1px solid ${compareMode ? S.gold : S.border}`, borderRadius: 10, color: compareMode ? S.gold : S.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
              ⚖️ {compareMode ? 'Exit Compare' : 'Compare'}
            </button>
          </div>
        </div>
      </div>

      {/* COMPARE PANEL */}
      {compareMode && (() => {
        const repDisplayName = (() => {
          const parts = (rep.name || '').split(', ')
          return parts.length >= 2 ? `${parts[1].split(' ')[0]} ${parts[0]}` : rep.name || ''
        })()
        const repPartyColor = rep.party === 'Democrat' ? '#5B9CFF' : rep.party === 'Republican' ? S.red : rep.party === 'Independent' ? '#F0D000' : rep.party === 'Green' ? '#4CAF76' : S.gray
        return (
          <div style={{ marginBottom: 20, background: `linear-gradient(145deg, rgba(10,22,40,0.95), rgba(27,42,107,0.35))`, border: `1px solid ${compareRep ? S.gold : S.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid rgba(212,175,55,0.15)` }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: S.gold, textTransform: 'uppercase', fontWeight: 600 }}>⚖️ Compare Mode</div>
              <button
                onClick={() => { setCompareMode(false); setCompareRep(null); setCompareQuery(''); setCompareResults([]); setCompareData(null) }}
                style={{ padding: '5px 12px', background: 'none', border: `1px solid ${S.border}`, borderRadius: 8, color: S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                Exit Compare
              </button>
            </div>
            {!compareRep ? (
              <div style={{ padding: 16 }}>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input
                    placeholder="Search a second rep to compare (e.g. Pelosi, Sanders…)"
                    value={compareQuery}
                    onChange={e => setCompareQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 40px 12px 14px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, color: S.white, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {compareQuery && (
                    <button
                      onClick={() => { setCompareQuery(''); setCompareResults([]) }}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: S.gray, cursor: 'pointer', fontSize: 20, padding: '0 4px', lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>
                {compareSearchLoading && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: S.gray }}>
                    <div style={{ width: 24, height: 24, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 8px' }} />
                    Searching…
                  </div>
                )}
                {!compareSearchLoading && compareResults.filter(m => m.bioguideId !== rep.id).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {compareResults.filter(m => m.bioguideId !== rep.id).map(member => {
                      const nameParts = (member.name || '').split(', ')
                      const displayName = nameParts.length >= 2 ? `${nameParts[1].split(' ')[0]} ${nameParts[0]}` : member.name || ''
                      const photo = `/api/rep-photo/${member.bioguideId}`
                      const partyColor = member.party === 'Democrat' ? '#1565C0' : member.party === 'Republican' ? '#CC2020' : member.party === 'Independent' ? '#D4B800' : member.party === 'Green' ? '#22A05A' : '#334466'
                      return (
                        <div key={member.bioguideId}
                          onClick={() => { setCompareRep({ ...member, displayName, photo, partyColor }); setCompareQuery(''); setCompareResults([]) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = S.gold}
                          onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Image src={photo} alt={displayName}
                              width={40} height={40}
                              style={{ borderRadius: '50%', border: `2px solid ${partyColor}`, objectFit: 'cover' }}
                              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                            <InitialsAvatar name={displayName} party={member.party} size={40} style={{ display: 'none', border: `2px solid ${partyColor}` }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{displayName}</div>
                            <div style={{ fontSize: 11, color: S.gold }}>{member.isSenator ? 'U.S. Senator' : 'U.S. Representative'} · {member.state}</div>
                          </div>
                          <span style={{ fontSize: 12, color: S.gray, flexShrink: 0 }}>Select →</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {!compareSearchLoading && compareQuery.trim().length >= 2 && compareResults.filter(m => m.bioguideId !== rep.id).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: S.gray, fontSize: 13 }}>
                    No results for &ldquo;{compareQuery.trim()}&rdquo;
                  </div>
                )}
                {!compareSearchLoading && compareQuery.trim().length < 2 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: S.gray, fontSize: 13 }}>
                    Type at least 2 characters to search for a rep to compare
                  </div>
                )}
              </div>
            ) : compareDataLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: S.gray }}>
                <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 10px' }} />
                Loading comparison data…
              </div>
            ) : (
              <>
                <div className="compare-card-header">
                  <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    {rep.photo
                      ? <Image src={rep.photo} alt={repDisplayName}
                          width={60} height={60}
                          style={{ borderRadius: '50%', border: `3px solid ${S.gold}`, objectFit: 'cover', margin: '0 auto 10px', display: 'block' }}
                          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                      : null}
                    <InitialsAvatar name={rep.name} party={rep.party} size={60}
                      style={{ display: rep.photo ? 'none' : 'block', border: `3px solid ${S.gold}`, margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: 13, color: S.offWhite, marginBottom: 3 }}>{repDisplayName}</div>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${repPartyColor}22`, color: repPartyColor, border: `1px solid ${repPartyColor}44` }}>
                      {rep.party === 'Democrat' ? 'D' : rep.party === 'Republican' ? 'R' : 'I'} · {rep.state}
                    </span>
                  </div>
                  <div className="compare-divider-vert" style={{ width: 1, background: `linear-gradient(to bottom, transparent, ${S.gold}, transparent)`, margin: '16px 0' }} />
                  <div className="compare-vs-mobile">VS</div>
                  <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 60, margin: '0 auto 10px' }}>
                      <Image src={compareRep.photo} alt={compareRep.displayName}
                        width={60} height={60}
                        style={{ borderRadius: '50%', border: `3px solid ${compareRep.partyColor}`, objectFit: 'cover', display: 'block' }}
                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                      <InitialsAvatar name={compareRep.name} party={compareRep.party} size={60}
                        style={{ display: 'none', border: `3px solid ${compareRep.partyColor}` }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: S.offWhite, marginBottom: 3 }}>{compareRep.displayName}</div>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${compareRep.partyColor}22`, color: compareRep.partyColor, border: `1px solid ${compareRep.partyColor}44` }}>
                      {compareRep.party === 'Democrat' ? 'D' : compareRep.party === 'Republican' ? 'R' : 'I'} · {compareRep.state}
                    </span>
                  </div>
                </div>
                {[
                  {
                    icon: '💰',
                    label: 'Est. Net Worth',
                    left: (() => { const nw = netWorthHistory?.[0]; if (!nw) return 'N/A'; return fmt((nw.netWorthMin + nw.netWorthMax) / 2) })(),
                    right: (() => { const nw = compareData?.netWorthHistory?.[0]; if (!nw) return 'N/A'; return fmt((nw.netWorthMin + nw.netWorthMax) / 2) })(),
                  },
                  {
                    icon: '📊',
                    label: 'Total Trades',
                    left: liveTrades != null ? String(liveTrades.length) : '—',
                    right: compareData?.trades != null ? String(compareData.trades.length) : '—',
                  },
                  {
                    icon: '🏛️',
                    label: 'Terms Served',
                    left: liveBio?.terms?.length ? String(liveBio.terms.length) : '—',
                    right: compareData?.bio?.terms?.length ? String(compareData.bio.terms.length) : '—',
                  },
                  {
                    icon: '📅',
                    label: 'Serving Since',
                    left: (() => { const terms = liveBio?.terms || []; if (!terms.length) return '—'; const sorted = [...terms].sort((a, b) => (a.congress || 0) - (b.congress || 0)); const first = sorted[0]; return String(first.startYear || congressToYear(first.congress)) })(),
                    right: (() => { const terms = compareData?.bio?.terms || []; if (!terms.length) return '—'; const sorted = [...terms].sort((a, b) => (a.congress || 0) - (b.congress || 0)); const first = sorted[0]; return String(first.startYear || congressToYear(first.congress)) })(),
                  },
                  {
                    icon: '🎂',
                    label: 'Age',
                    left: liveBio?.birthYear ? String(new Date().getFullYear() - liveBio.birthYear) : '—',
                    right: compareData?.bio?.birthYear ? String(new Date().getFullYear() - compareData.bio.birthYear) : '—',
                  },
                  {
                    icon: '🏦',
                    label: 'Top Ticker',
                    left: tradesMeta?.topTickers?.[0] || '—',
                    right: compareData?.topTickers?.[0] || '—',
                  },
                ].map(({ icon, label, left, right }) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', borderTop: `1px solid rgba(212,175,55,0.12)` }}>
                    <div style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: S.offWhite }}>{left}</div>
                    </div>
                    <div style={{ padding: '13px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 76, borderLeft: `1px solid rgba(212,175,55,0.12)`, borderRight: `1px solid rgba(212,175,55,0.12)` }}>
                      <div style={{ fontSize: 14 }}>{icon}</div>
                      <div style={{ fontSize: 9, color: S.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
                    </div>
                    <div style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: S.offWhite }}>{right}</div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: 12, borderTop: `1px solid rgba(212,175,55,0.12)` }}>
                  <button
                    onClick={() => { setCompareRep(null); setCompareQuery(''); setCompareResults([]); setCompareData(null) }}
                    style={{ display: 'block', width: '100%', padding: '10px 0', background: 'none', border: `1px solid ${S.border}`, borderRadius: 10, color: S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.color = S.gold }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.gray }}
                  >
                    Change Rep
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* TABS */}
      <div className="rep-tabs-row" style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} className={`rep-tab ${repTab === t.id ? "active" : ""}`}
            onClick={() => setRepTab(t.id)}
            style={{ padding: "8px 14px", border: `1px solid ${repTab === t.id ? "transparent" : S.border}`, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: repTab === t.id ? S.red : t.id === "ai" ? `rgba(212,175,55,0.08)` : S.cardBg, color: repTab === t.id ? "white" : t.id === "ai" ? S.gold : S.gray, transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0, minWidth: "max-content" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {repTab === "overview" && (
        <div className="slide-in mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, minWidth: 0 }}>

          {/* Wealth Change */}
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Wealth & Trades</div>
            {(() => {
              const recentTrade = trades.length > 0 && trades.some(t => {
                const d = new Date(t.transaction_date || t.date)
                return !isNaN(d) && (Date.now() - d) < 90 * 24 * 60 * 60 * 1000
              })
              const largestTrade = trades.length > 0 ? trades.reduce((best, t) => (!best || (t.amount_max || 0) > (best.amount_max || 0)) ? t : best, null) : null
              return (
                <>
                  {trades.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: recentTrade ? 'rgba(42,157,76,0.15)' : 'rgba(100,100,120,0.15)', color: recentTrade ? '#4CAF50' : S.gray, border: `1px solid ${recentTrade ? '#4CAF5044' : '#33446644'}` }}>
                        {recentTrade ? 'Traded last 90 days' : 'No trades last 90 days'}
                      </span>
                    </div>
                  )}
                  {largestTrade && (
                    <div style={{ fontSize: 11, color: S.gray, marginBottom: 6 }}>
                      Largest: <span style={{ color: S.grayLight }}>{largestTrade.ticker || largestTrade.asset || 'Unknown'}</span>{largestTrade.amount_min != null ? ` · $${(largestTrade.amount_min / 1000).toFixed(0)}k–$${(largestTrade.amount_max / 1000).toFixed(0)}k` : largestTrade.amount ? ` · ${largestTrade.amount}` : ''}
                    </div>
                  )}
                </>
              )
            })()}
            {rep.netWorthBefore ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div><div style={{ fontSize: 10, color: S.gray }}>Before</div><div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18 }}>{fmt(rep.netWorthBefore)}</div></div>
                  <div><div style={{ fontSize: 10, color: S.gray }}>Current</div><div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "#FF6B6B" }}>{fmt(rep.netWorthCurrent)}</div></div>
                </div>
                <div style={{ padding: "6px 10px", background: "rgba(178,34,52,0.1)", borderRadius: 6, textAlign: "center", fontSize: 13, color: "#FF6B6B", fontWeight: 700 }}>+{enr.pct}% · {fmt(enr.delta)} gained</div>
              </>
            ) : loadingTrades ? (
              <div style={{ fontSize: 12, color: S.gray }}>Loading…</div>
            ) : trades.length > 0 ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {tradesMeta && (
                    <span style={{ fontSize: 11, color: S.gray, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px' }}>
                      {tradesMeta.buys} buys · {tradesMeta.sells} sells
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: tradedLast90 ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.06)', color: tradedLast90 ? '#4CAF50' : S.gray }}>
                    {tradedLast90 ? 'Traded last 90 days' : 'No trades last 90 days'}
                  </span>
                </div>
                {largestTrade && (
                  <div style={{ fontSize: 12, color: S.grayLight, marginBottom: 8 }}>
                    Largest trade: <span style={{ color: S.offWhite, fontWeight: 600 }}>{typeof largestTrade.amount === 'number' ? fmt(largestTrade.amount) : largestTrade.amount}</span>
                  </div>
                )}
                <button onClick={() => setRepTab('wealth')} style={{ fontSize: 11, color: S.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>
                  See full trading history →
                </button>
              </>
            ) : rep.source === 'openstates' ? (
              <div style={{ fontSize: 12, color: S.gray }}>State legislators file disclosures at the state level.{' '}
                <a href="https://www.followthemoney.org/research/institute-research/personal-financial-disclosures/" target="_blank" rel="noreferrer" style={{ color: S.gold }}>FollowTheMoney →</a>
              </div>
            ) : loadingDisclosures ? (
              <div style={{ fontSize: 12, color: S.gray }}>Loading disclosures…</div>
            ) : disclosures?.filings?.length > 0 ? (
              <div>
                <div style={{ fontSize: 12, color: S.grayLight, marginBottom: 6 }}>
                  <span style={{ color: '#4CAF50', fontWeight: 700 }}>{disclosures.filings.length}</span> STOCK Act filing{disclosures.filings.length !== 1 ? 's' : ''} on record
                  {disclosures.ptrCount > 0 && <span style={{ color: S.gray }}> · {disclosures.ptrCount} trade report{disclosures.ptrCount !== 1 ? 's' : ''}</span>}
                </div>
                {disclosures.filings[0]?.date && (
                  <div style={{ fontSize: 11, color: S.gray, marginBottom: 8 }}>Most recent filing: {disclosures.filings[0].date}</div>
                )}
                {disclosures.filings[0]?.date && (() => {
                  const filedLast90 = (Date.now() - new Date(disclosures.filings[0].date).getTime()) < 90 * 24 * 60 * 60 * 1000
                  return (
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', marginBottom: 10, background: filedLast90 ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.06)', color: filedLast90 ? '#4CAF50' : S.gray }}>
                      {filedLast90 ? 'Filed last 90 days' : 'No filings last 90 days'}
                    </span>
                  )
                })()}
                <div>
                  <button onClick={() => setRepTab('wealth')} style={{ fontSize: 11, color: S.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>
                    See full trading history →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: S.gray, lineHeight: 1.6 }}>Not all representatives file financial disclosures — some may not be required to.{' '}
                <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noreferrer" style={{ color: S.gold }}>House Clerk →</a>
              </div>
            )}
          </div>

          {/* Recent Votes */}
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Recent Votes</div>
            {loadingVotes ? (
              <div style={{ fontSize: 12, color: S.gray }}>Loading…</div>
            ) : votes.length > 0 ? (
              votes.slice(0, 3).map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <span style={{ color: S.grayLight, flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.bill.split(" – ")[1] || v.bill.split(" - ")[1] || v.bill}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: v.vote === "YEA" ? "#4ade80" : v.vote === "NAY" ? "#f87171" : S.gray, flexShrink: 0 }}>{v.vote}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: S.gray }}>
                {rep.source === 'openstates'
                  ? <>State voting records via <a href={rep.website} target="_blank" rel="noreferrer" style={{ color: S.gold }}>OpenStates →</a></>
                  : <>No votes found. <a href={`https://www.govtrack.us/congress/members/${rep.id}`} target="_blank" rel="noreferrer" style={{ color: S.gold }}>GovTrack →</a></>
                }
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Active Legislation</div>
            {loadingDocket ? (
              <div style={{ fontSize: 12, color: S.gray }}>Loading…</div>
            ) : (liveDocket || []).length > 0 ? (
              (liveDocket || []).slice(0, 3).map((d, i) => (
                <div key={i} style={{ marginBottom: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: S.grayLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>
                    {d.number && <span style={{ color: S.gold, marginRight: 6 }}>{d.number}</span>}
                    {d.lastActionDate || d.role || ''}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: S.gray }}>
                {rep.source === 'openstates'
                  ? <>State bills via <a href={rep.website} target="_blank" rel="noreferrer" style={{ color: S.gold }}>OpenStates →</a></>
                  : <>View on <a href={rep.website} target="_blank" rel="noreferrer" style={{ color: S.gold }}>Congress.gov →</a></>
                }
              </div>
            )}
          </div>

          {/* Contact / Office */}
          <div style={{ background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: "uppercase", marginBottom: 10 }}>Contact & Office</div>
            {rep.phone && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: S.gray, marginBottom: 2 }}>Phone</div>
                <a href={`tel:${rep.phone}`} style={{ fontSize: 13, color: S.grayLight, textDecoration: 'none' }}>{rep.phone}</a>
              </div>
            )}
            {rep.officeLocation && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: S.gray, marginBottom: 2 }}>Office</div>
                <div style={{ fontSize: 12, color: S.grayLight }}>{rep.officeLocation}</div>
              </div>
            )}
            {rep.officeHours && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: S.gray, marginBottom: 2 }}>Hours</div>
                <div style={{ fontSize: 12, color: S.grayLight }}>{rep.officeHours}</div>
              </div>
            )}
            {rep.website && (
              <a href={rep.website} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 4, fontSize: 12, color: S.gold, textDecoration: 'none' }}>
                Official website →
              </a>
            )}
          </div>

        </div>
      )}

      {/* ── VOTES ── */}
      {repTab === "votes" && (
        <div className="slide-in">
          {loadingVotes && (
            <div style={{ textAlign: 'center', padding: 48, color: S.gray }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
              Loading voting record…
            </div>
          )}
          {!loadingVotes && votes.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
              <div style={{ fontSize: 14, color: S.gray, marginBottom: 8 }}>No vote records found for this member.</div>
              <div style={{ fontSize: 12, color: S.gray }}>This member may be a state legislator or vote data is not yet available.</div>
            </div>
          )}
          {!loadingVotes && votes.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase' }}>Recent Votes — {votes.length} records</div>
                <div style={{ fontSize: 11, color: S.gray }}>via GovTrack</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {votes.map((v, i) => {
                  const voteColor = v.vote === 'YEA' ? '#4ade80' : v.vote === 'NAY' ? '#f87171' : v.vote === 'PRESENT' ? S.gold : S.gray
                  const totalVotes = (v.totalYea ?? 0) + (v.totalNay ?? 0) + (v.totalOther ?? 0)
                  const yeaPct = totalVotes > 0 ? Math.round((v.totalYea ?? 0) / totalVotes * 100) : null
                  return (
                    <div key={i} style={{ padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10 }}>
                      {/* Row 1: vote badge, outcome, date */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: voteColor, background: `${voteColor}18`, borderRadius: 6, padding: '3px 10px', letterSpacing: 1 }}>{v.vote}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: v.outcome === 'PASSED' ? '#4ade80' : '#f87171', background: v.outcome === 'PASSED' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 4, padding: '2px 8px' }}>{v.outcome}</span>
                        {v.category && <span style={{ fontSize: 11, color: S.gray, background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 8px' }}>{v.category}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: S.gray, whiteSpace: 'nowrap' }}>{v.date}</span>
                      </div>
                      {/* Row 2: bill/question title — links to Congress.gov bill or GovTrack vote */}
                      {v.billUrl ? (
                        <a href={v.billUrl} target="_blank" rel="noreferrer"
                          style={{ display: 'block', fontSize: 13, color: S.grayLight, lineHeight: 1.5, marginBottom: v.totalYea != null ? 8 : 0, wordBreak: 'break-word', textDecoration: 'none', borderBottom: `1px solid ${S.border}`, paddingBottom: v.totalYea != null ? 8 : 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = S.gold}
                          onMouseLeave={e => e.currentTarget.style.color = S.grayLight}>
                          {v.bill}
                        </a>
                      ) : (
                        <div style={{ fontSize: 13, color: S.grayLight, lineHeight: 1.5, marginBottom: v.totalYea != null ? 8 : 0, wordBreak: 'break-word' }}>{v.bill}</div>
                      )}
                      {/* Row 3: chamber vote totals */}
                      {v.totalYea != null && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {yeaPct != null && (
                            <div style={{ flex: 1, minWidth: 120, height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(248,113,113,0.3)' }}>
                              <div style={{ height: '100%', width: `${yeaPct}%`, background: '#4ade80', borderRadius: 2 }} />
                            </div>
                          )}
                          <span style={{ fontSize: 11, color: '#4ade80', whiteSpace: 'nowrap' }}>✓ {v.totalYea} Yea</span>
                          <span style={{ fontSize: 11, color: '#f87171', whiteSpace: 'nowrap' }}>✗ {v.totalNay} Nay</span>
                          {(v.totalOther ?? 0) > 0 && <span style={{ fontSize: 11, color: S.gray, whiteSpace: 'nowrap' }}>{v.totalOther} Other</span>}
                          {v.chamber && <span style={{ fontSize: 11, color: S.gray, marginLeft: 'auto' }}>{v.chamber}{v.congress ? ` · ${congressToYear(v.congress)}–${congressToYear(v.congress) + 2 > new Date().getFullYear() ? 'present' : congressToYear(v.congress) + 2}` : ''}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DOCKET ── */}
      {repTab === "docket" && (
        <div className="slide-in">
          {loadingDocket && (
            <div style={{ textAlign: 'center', padding: 48, color: S.gray }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
              Loading legislative schedule from LegiScan…
            </div>
          )}
          {!loadingDocket && (isLive ? (liveDocket || []) : rep.docket).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, color: S.gray, marginBottom: 6 }}>No active bills found for this session.</div>
              <div style={{ fontSize: 12, color: S.gray, marginBottom: 16 }}>Legislative data provided by LegiScan LLC — CC BY 4.0</div>
              <a href={rep.website} target="_blank" rel="noreferrer"
                style={{ padding: '8px 20px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
                View on Congress.gov →
              </a>
            </div>
          ) : !loadingDocket && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: "uppercase" }}>Active Legislative Docket</div>
                <div style={{ fontSize: 11, color: S.gold }}>
                  {liveDocketSource === 'congress' ? '🔄 Congress.gov' : '🔄 LegiScan LLC — CC BY 4.0'}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(isLive ? (liveDocket || []) : rep.docket).map((d, i) => {
                  const statusColors = { 1: S.gray, 2: "#5B9CFF", 3: S.gold, 4: "#4CAF50" }
                  const statusLabels = { 1: "Introduced", 2: "Engrossed", 3: "Enrolled", 4: "Passed" }
                  const statusColor = statusColors[d.status] || S.gray
                  return (
                    <div key={i} style={{ padding: "14px 16px", background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {d.number && <span style={{ fontSize: 11, fontWeight: 700, color: S.gold, background: "rgba(212,175,55,0.12)", borderRadius: 4, padding: "2px 8px" }}>{d.number}</span>}
                          {d.status && <span style={{ fontSize: 11, color: statusColor, background: `rgba(${statusColor === S.gold ? '212,175,55' : statusColor === '#4CAF50' ? '76,175,80' : '91,156,255'},0.12)`, borderRadius: 4, padding: "2px 8px" }}>{statusLabels[d.status] || 'Active'}</span>}
                          {d.role && <span style={{ fontSize: 11, color: d.role === 'Sponsor' ? '#5B9CFF' : S.gray, background: 'rgba(91,156,255,0.1)', borderRadius: 4, padding: "2px 8px" }}>{d.role}</span>}
                          {d.policyArea && <span style={{ fontSize: 11, color: S.gray }}>{d.policyArea}</span>}
                        </div>
                        {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: S.gold, border: `1px solid ${S.border}`, padding: "2px 10px", borderRadius: 6, whiteSpace: "nowrap", textDecoration: "none" }}>View →</a>}
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 4, wordBreak: "break-word", overflowWrap: "anywhere" }}>{d.title}</div>
                      {d.lastAction && <div style={{ fontSize: 11, color: S.gray }}>Last action: {d.lastAction}{d.lastActionDate ? ` · ${d.lastActionDate}` : ''}</div>}
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

          {/* ── State rep ── */}
          {rep.source === 'openstates' && (
            <div style={{ padding: 28, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🏛️</div>
              <div style={{ fontSize: 14, color: S.grayLight, marginBottom: 6 }}>State legislators file financial disclosures at the state level</div>
              <div style={{ fontSize: 12, color: S.gray }}>The federal STOCK Act and House Clerk disclosures apply only to U.S. Congress members.</div>
            </div>
          )}

          {/* ── Federal rep ── */}
          {rep.source !== 'openstates' && (() => {
            const TYPE_COLOR = { P: '#4CAF50', D: '#4CAF50', A: '#5B9CFF', O: '#5B9CFF', G: '#5B9CFF', X: S.gray, E: S.gray, W: '#f87171' }
            const TYPE_ICON  = { P: '📊', D: '📝', A: '📋', O: '📋', G: '📋', X: '⏳', E: '⏳', W: '✗' }
            const FILING_TYPE_BADGE = { P: 'PTR', D: 'Amendment', A: 'Annual', O: 'Annual', G: 'New Member', X: 'Extension', E: 'Extension', W: 'Withdrawal', C: 'Candidate', H: 'Due Date' }

            return (
              <>
                {/* ── Net Worth Deep-Dive ── */}
                {loadingFdNetWorth && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: S.gray, fontSize: 12 }}>Loading net worth history…</div>
                )}
                {!loadingFdNetWorth && (() => {
                  const fmtY = v => {
                    if (v == null || !isFinite(v)) return 'N/A'
                    const abs = Math.abs(v)
                    const sign = v < 0 ? '-' : ''
                    if (abs >= 1e9) return `${sign}$${(abs/1e9).toFixed(1)}B`
                    if (abs >= 1e6) return `${sign}$${(abs/1e6).toFixed(1)}M`
                    if (abs >= 1e3) return `${sign}$${Math.round(abs/1e3)}K`
                    return `${sign}$${Math.round(abs)}`
                  }

                  if (!fdNetWorth || fdNetWorth.length === 0) {
                    return (
                      <div style={{ padding: '16px 20px', background: 'rgba(212,175,55,0.05)', border: `1px solid ${S.border}`, borderRadius: 10, marginBottom: 20, textAlign: 'center', fontSize: 12, color: S.gray }}>
                        No financial disclosure records found for this member. Our dataset covers a subset of House members — data may not be available for all representatives, particularly former members or those who filed before our coverage window.{' '}
                        <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noreferrer" style={{ color: S.gold, textDecoration: 'underline' }}>View official House disclosures →</a>
                      </div>
                    )
                  }

                  const history = fdNetWorth
                  const midpoints = history.map(d => (d.min_value + d.max_value) / 2)
                  const meta = fdNetWorthMeta || {}
                  const entryWorth = meta.entry_worth ?? midpoints[0]
                  const currentWorth = meta.current_worth ?? midpoints[midpoints.length - 1]
                  const entryYear = meta.entry_year ?? history[0]?.year
                  const currentYear = meta.current_year ?? history[history.length - 1]?.year
                  const growthAmt = meta.growth_amount ?? (currentWorth - entryWorth)
                  const growthPct = meta.growth_pct ?? (entryWorth > 0 ? Math.round((growthAmt / entryWorth) * 100) : null)
                  const salaryTotal = meta.salary_total ?? null
                  const isEstimated = history.some(d => d.min_value !== d.max_value)

                  const chartBlock = history.length >= 2 && (() => {
                    const allVals = [...history.map(d => d.min_value), ...history.map(d => d.max_value)]
                    const rawMin = Math.min(...allVals)
                    const rawMax = Math.max(...allVals)
                    const span = rawMax - rawMin || rawMax * 0.1 || 1
                    const yMin = rawMin - span * 0.08
                    const yMax = rawMax + span * 0.08
                    const W = 520, H = 160
                    const pad = { t: 14, r: 12, b: 28, l: 60 }
                    const cW = W - pad.l - pad.r
                    const cH = H - pad.t - pad.b
                    const n = history.length
                    const xS = i => pad.l + (i / (n - 1)) * cW
                    const yS = v => pad.t + cH - ((v - yMin) / (yMax - yMin)) * cH
                    const areaTop = history.map((d, i) => `${i === 0 ? 'M' : 'L'}${xS(i)},${yS(d.max_value)}`).join(' ')
                    const areaBot = [...history].reverse().map((d, i) => `L${xS(n - 1 - i)},${yS(d.min_value)}`).join(' ')
                    const areaPath = `${areaTop} ${areaBot} Z`
                    const linePath = midpoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${xS(i)},${yS(v)}`).join(' ')
                    const yTickVals = [0, 0.25, 0.5, 0.75, 1].map(t => yMin + t * (yMax - yMin))
                    return (
                      <div style={{ marginBottom: 16, padding: '16px 16px 12px', background: '#0b1220', border: `1px solid ${S.border}`, borderRadius: 12 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 10 }}>Wealth Timeline</div>
                        <div style={{ position: 'relative' }}>
                          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                            {yTickVals.map((v, i) => (
                              <g key={i}>
                                <line x1={pad.l} y1={yS(v)} x2={W - pad.r} y2={yS(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                                <text x={pad.l - 6} y={yS(v)} textAnchor="end" dominantBaseline="middle" fill="#556070" fontSize={9}>{fmtY(v)}</text>
                              </g>
                            ))}
                            <path d={areaPath} fill="rgba(212,175,55,0.13)" />
                            <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            {history.map((d, i) => (
                              <text key={i} x={xS(i)} y={H - 6} textAnchor="middle" fill="#556070" fontSize={9}>{d.year}</text>
                            ))}
                            {history.map((d, i) => (
                              <g key={i}>
                                <rect x={xS(i) - 18} y={pad.t} width={36} height={cH} fill="transparent"
                                  onMouseEnter={() => setNwHoverIdx(i)} onMouseLeave={() => setNwHoverIdx(null)} />
                                <circle cx={xS(i)} cy={yS(midpoints[i])} r={nwHoverIdx === i ? 5 : 3}
                                  fill={nwHoverIdx === i ? '#D4AF37' : '#0b1220'} stroke="#D4AF37"
                                  strokeWidth={nwHoverIdx === i ? 2 : 1.5} style={{ pointerEvents: 'none' }} />
                              </g>
                            ))}
                          </svg>
                          {nwHoverIdx !== null && (() => {
                            const d = history[nwHoverIdx]
                            const mid = (d.min_value + d.max_value) / 2
                            const pct = n > 1 ? nwHoverIdx / (n - 1) : 0.5
                            const clampedLeft = Math.max(6, Math.min(94, pct * 100))
                            return (
                              <div style={{
                                position: 'absolute', bottom: 32, left: `${clampedLeft}%`,
                                transform: 'translateX(-50%)',
                                background: '#1a2538', border: '1px solid #D4AF37', borderRadius: 8,
                                padding: '8px 12px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>{d.year}</div>
                                <div style={{ fontSize: 11, color: '#c8d0dc', marginTop: 2 }}>~{fmtY(mid)}</div>
                                <div style={{ fontSize: 10, color: '#556070', marginTop: 1 }}>{fmtY(d.min_value)} – {fmtY(d.max_value)}</div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })()

                  const deepDiveContent = (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase' }}>Net Worth</div>
                        {isEstimated && <div style={{ fontSize: 10, color: S.gray }}>Est. from disclosed asset ranges</div>}
                      </div>

                      {history.length === 1 ? (
                        <div style={{ padding: 18, background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.22)`, borderRadius: 12, marginBottom: 14 }}>
                          <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginBottom: 6 }}>Net Worth ({history[0].year})</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 26, color: S.gold }}>
                            {fmtY(midpoints[0])}
                          </div>
                          <div style={{ fontSize: 11, color: S.gray, marginTop: 6 }}>1 year of disclosure data available</div>
                        </div>
                      ) : (
                        <>
                          <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div style={{ padding: 16, background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.22)`, borderRadius: 12 }}>
                              <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginBottom: 6 }}>When Entering Office</div>
                              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>{entryYear}</div>
                              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: S.gold, letterSpacing: -0.5 }}>
                                {fmtY(entryWorth)}
                              </div>
                            </div>
                            <div style={{ padding: 16, background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.22)`, borderRadius: 12 }}>
                              <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginBottom: 6 }}>Net Worth Today</div>
                              <div style={{ fontSize: 11, color: S.gray, marginBottom: 4 }}>{currentYear}</div>
                              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: S.gold, letterSpacing: -0.5 }}>
                                {fmtY(currentWorth)}
                              </div>
                            </div>
                          </div>

                          {growthPct !== null && salaryTotal !== null && (
                            <div style={{ padding: '13px 16px', background: 'rgba(212,175,55,0.06)', border: `1px solid rgba(212,175,55,0.22)`, borderRadius: 10, marginBottom: 14, fontSize: 13, color: S.grayLight, lineHeight: 1.6 }}>
                              <span style={{ color: growthAmt >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                                {growthAmt >= 0 ? '+' : ''}{fmtY(growthAmt)} ({growthAmt >= 0 ? '+' : ''}{growthPct}%)
                              </span>
                              {' '}while earning{' '}
                              <span style={{ color: S.gold, fontWeight: 600 }}>{fmtY(salaryTotal)}</span>
                              {' '}in congressional salary ({currentYear - entryYear + 1} yrs × $174K)
                            </div>
                          )}
                        </>
                      )}

                      {chartBlock}

                      <div style={{ padding: '11px 14px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 11, color: S.gray }}>
                        Asset category breakdown available in annual disclosure filings
                      </div>
                    </div>
                  )

                  if (!isProProp) {
                    return (
                      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
                          {deepDiveContent}
                        </div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'rgba(10,14,30,0.72)', backdropFilter: 'blur(2px)', borderRadius: 12 }}>
                          <div style={{ fontSize: 32 }}>🔒</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, textAlign: 'center', color: S.offWhite }}>
                            Net Worth Analysis · Pro Only
                          </div>
                          <p style={{ fontSize: 12, color: S.gray, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
                            Unlock the full wealth timeline, entry vs. today comparison, and growth vs. salary analysis.
                          </p>
                          <button
                            onClick={handleSubscribe}
                            style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, border: 'none', borderRadius: 10, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5, boxShadow: `0 4px 20px rgba(212,175,55,0.3)` }}>
                            ★ Upgrade to Pro · $9.99/mo
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return deepDiveContent
                })()}

                {/* Loading spinner while both sources are fetching */}
                {(loadingTrades || loadingDisclosures) && (
                  <div style={{ textAlign: 'center', padding: 32, color: S.gray }}>
                    <div style={{ width: 28, height: 28, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                    Loading financial disclosure records…
                  </div>
                )}

                {!loadingTrades && !loadingDisclosures && (
                  <>
                    {/* ── STOCK Act trades from DB / Senate EFTS ── */}
                    {trades.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>STOCK Act Periodic Transaction Reports</div>

                        {/* Stats row */}
                        <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                          <div style={{ padding: 14, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: S.grayLight }}>{trades.length}</div>
                            <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginTop: 4 }}>Trades</div>
                          </div>
                          <div style={{ padding: 14, background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#4CAF50' }}>{tradesMeta?.buys ?? 0}</div>
                            <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginTop: 4 }}>Purchases</div>
                          </div>
                          <div style={{ padding: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#f87171' }}>{tradesMeta?.sells ?? 0}</div>
                            <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginTop: 4 }}>Sales</div>
                          </div>
                        </div>

                        {/* Top tickers */}
                        {tradesMeta?.topTickers?.length > 0 && (
                          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: S.gray, letterSpacing: 1 }}>TOP TRADED:</span>
                            {tradesMeta.topTickers.map(t => (
                              <span key={t} style={{ fontSize: 12, fontWeight: 700, color: S.gold, background: 'rgba(212,175,55,0.12)', borderRadius: 4, padding: '2px 8px' }}>{t}</span>
                            ))}
                          </div>
                        )}

                        {/* Buy/sell bar */}
                        {(tradesMeta?.buys + tradesMeta?.sells) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 6 }}>
                              <div style={{ background: '#4CAF50', width: `${Math.round(tradesMeta.buys / (tradesMeta.buys + tradesMeta.sells) * 100)}%` }} />
                              <div style={{ background: '#f87171', flex: 1 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: S.gray }}>
                              <span style={{ color: '#4CAF50' }}>{Math.round(tradesMeta.buys / (tradesMeta.buys + tradesMeta.sells) * 100)}% Buy</span>
                              <span style={{ color: '#f87171' }}>{Math.round(tradesMeta.sells / (tradesMeta.buys + tradesMeta.sells) * 100)}% Sell</span>
                            </div>
                          </div>
                        )}

                        {/* Individual trades */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {trades.map((t, i) => (
                            <div key={i} style={{ padding: '12px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ minWidth: 50, fontWeight: 700, fontSize: 12, color: t.type === 'BUY' ? '#4CAF50' : t.type === 'SELL' ? '#f87171' : S.gray }}>{tradeTypeLabel(t.type)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.asset}{t.ticker ? ` (${t.ticker})` : ''}
                                </div>
                                <div style={{ fontSize: 11, color: S.gray, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {t.date}{t.owner && t.owner !== 'Self' ? ` · ${t.owner}` : ''}
                                  {t.chamber && (
                                    <span style={{
                                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                                      padding: '1px 5px', borderRadius: 4,
                                      background: t.chamber === 'senate' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                                      color: t.chamber === 'senate' ? '#a78bfa' : '#60a5fa',
                                    }}>
                                      {t.chamber === 'senate' ? 'Senate' : 'House'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 600 }}>
                                {typeof t.amount === 'number' ? fmt(t.amount) : t.amount}
                              </div>
                              <button
                                onClick={() => handleShare(`${rep.name} (${partyAbbr(rep.party)}-${rep.state}) ${actionWord(t.type)} ${typeof t.amount === 'number' ? fmt(t.amount) : (t.amount || '')} of ${t.ticker || t.asset}${t.date ? ` on ${t.date}` : ''} 🏛️ civicwatch.app`)}
                                title="Share this trade"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: S.gray, fontSize: 14, opacity: 0.6, flexShrink: 0, lineHeight: 1 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                              >📤</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── House Clerk Filing History (from XML index) ── */}
                    {disclosures?.filings?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase' }}>
                            House Clerk Filing History — {disclosures.filings.length} records
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                            {disclosures.ptrCount > 0 && <span style={{ color: '#4CAF50' }}>📊 {disclosures.ptrCount} trade report{disclosures.ptrCount !== 1 ? 's' : ''}</span>}
                            {disclosures.annualCount > 0 && <span style={{ color: '#5B9CFF' }}>📋 {disclosures.annualCount} annual filing{disclosures.annualCount !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {disclosures.filings.map(f => {
                            const ptResult = ptrResults[f.docId]
                            const isOpen = expandedPtr === f.docId
                            return (
                              <div key={f.docId} style={{ background: S.cardBg, border: `1px solid ${isOpen ? S.gold : S.border}`, borderRadius: 10, overflow: 'hidden' }}>
                                {/* Filing row */}
                                <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <span style={{ fontSize: 18 }}>{TYPE_ICON[f.type] || '📄'}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: S.grayLight, marginBottom: 2 }}>{f.typeLabel}</div>
                                    <div style={{ fontSize: 11, color: S.gray }}>
                                      Filed {f.filingDate} · Year {f.year} · {f.stateDst}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLOR[f.type] || S.gray, background: `${TYPE_COLOR[f.type] || S.gray}18`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                                    {FILING_TYPE_BADGE[f.type] || f.type}
                                  </span>
                                  {f.isPtr && (
                                    <button
                                      onClick={() => loadPtr(f.docId, f.year)}
                                      style={{ fontSize: 11, color: isOpen ? S.gold : S.grayLight, background: isOpen ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOpen ? S.gold : S.border}`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      {ptResult?.loading ? '…' : isOpen ? 'Hide' : 'Load Trades'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleShare(`${rep.name} (${partyAbbr(rep.party)}-${rep.state}) filed a ${f.typeLabel}${f.filingDate ? ` on ${f.filingDate}` : ''} 🏛️ civicwatch.app`)}
                                    title="Share this filing"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: S.gray, fontSize: 14, opacity: 0.6, flexShrink: 0, lineHeight: 1 }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                  >📤</button>
                                </div>

                                {/* Expanded PTR trade detail */}
                                {f.isPtr && isOpen && (
                                  <div style={{ borderTop: `1px solid ${S.border}`, padding: '12px 16px' }}>
                                    {ptResult?.loading && (
                                      <div style={{ textAlign: 'center', padding: 16, color: S.gray }}>
                                        <div style={{ width: 20, height: 20, border: `2px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 8px' }} />
                                        Parsing disclosure PDF…
                                      </div>
                                    )}
                                    {ptResult && !ptResult.loading && ptResult.trades?.length > 0 && (
                                      <>
                                        <div style={{ fontSize: 10, letterSpacing: 1.5, color: S.gray, textTransform: 'uppercase', marginBottom: 10 }}>
                                          {ptResult.trades.length} transaction{ptResult.trades.length !== 1 ? 's' : ''} from this report
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                          {ptResult.trades.map((t, ti) => (
                                            <div key={ti} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                                              <span style={{ fontWeight: 700, fontSize: 12, color: t.type === 'BUY' ? '#4CAF50' : t.type === 'SELL' ? '#f87171' : S.gray, minWidth: 50 }}>{tradeTypeLabel(t.type)}</span>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                  {t.asset}{t.ticker ? ` (${t.ticker})` : ''}
                                                </div>
                                                <div style={{ fontSize: 10, color: S.gray }}>{t.date}{t.owner && t.owner !== 'Self' ? ` · ${t.owner}` : ''}</div>
                                              </div>
                                              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{t.amount}</div>
                                              <button
                                                onClick={() => handleShare(`${rep.name} (${partyAbbr(rep.party)}-${rep.state}) ${actionWord(t.type)} ${t.amount || ''} of ${t.ticker || t.asset}${t.date ? ` on ${t.date}` : ''} 🏛️ civicwatch.app`)}
                                                title="Share this trade"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: S.gray, fontSize: 13, opacity: 0.6, flexShrink: 0, lineHeight: 1 }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                              >📤</button>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                    {ptResult && !ptResult.loading && ptResult.trades?.length === 0 && (
                                      <div style={{ fontSize: 12, color: S.gray, textAlign: 'center', padding: '8px 0' }}>
                                        No transactions parsed — this may be a scanned or non-machine-readable PDF.
                                      </div>
                                    )}
                                    {ptResult?.error && (
                                      <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', padding: '8px 0' }}>
                                        Could not load trades. PDF may be unavailable.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* No trades, no filing history */}
                    {trades.length === 0 && (!disclosures || disclosures.filings?.length === 0) && (
                      <div style={{ padding: 32, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: S.white, marginBottom: 8 }}>No trade disclosures found</div>
                        <div style={{ fontSize: 13, color: S.gray, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>This representative may not have filed any PTR reports, or their filings may be in a non-machine-readable format.</div>
                      </div>
                    )}

                    {/* No PTR trades but has annual filings — explain clearly */}
                    {trades.length === 0 && disclosures?.ptrCount === 0 && disclosures?.annualCount > 0 && (
                      <div style={{ padding: 14, background: 'rgba(91,156,255,0.06)', border: '1px solid rgba(91,156,255,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: S.gray }}>
                        ℹ️ This member has not filed any Periodic Transaction Reports (PTRs). Under the STOCK Act, PTRs are only required when a transaction occurs — members who do not actively trade stocks will have no PTR filings.
                      </div>
                    )}

                    {/* ── Net Worth History (from Supabase fd_net_worth, keyed by bioguide_id) ── */}
                    {fdNetWorth?.length > 0 && (() => {
                      const fmtRange = (min, max) => {
                        if (min == null) return '—'
                        const fmtN = v => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v/1e3)}K` : `$${v}`
                        return max && max !== min ? `${fmtN(min)} – ${fmtN(max)}` : fmtN(min)
                      }
                      return (
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>Net Worth — Annual Financial Disclosures</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {fdNetWorth.map((n, i) => {
                              const nwMid = n.min_value != null ? Math.round((n.min_value + (n.max_value ?? n.min_value)) / 2) : null
                              const prevMid = fdNetWorth[i+1]?.min_value != null ? Math.round((fdNetWorth[i+1].min_value + (fdNetWorth[i+1].max_value ?? fdNetWorth[i+1].min_value)) / 2) : null
                              const delta = nwMid != null && prevMid != null ? nwMid - prevMid : null
                              return (
                                <div key={n.year} style={{ padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <div style={{ minWidth: 44, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: S.gold }}>{n.year}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: S.grayLight, marginBottom: 2 }}>
                                      Net Worth: {fmtRange(n.min_value, n.max_value)}
                                    </div>
                                    {n.filing_date && (
                                      <div style={{ fontSize: 11, color: S.gray }}>Filed: {n.filing_date}</div>
                                    )}
                                  </div>
                                  {delta != null && (
                                    <div style={{ fontSize: 12, fontWeight: 600, color: delta >= 0 ? '#4CAF50' : '#f87171', whiteSpace: 'nowrap' }}>
                                      {delta >= 0 ? '▲ +' : '▼ '}{Math.abs(delta) >= 1e6 ? `$${(Math.abs(delta)/1e6).toFixed(1)}M` : `$${Math.round(Math.abs(delta)/1e3)}K`}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </>
            )
          })()}
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
                {liveBio ? (
                  <>
                    <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.8, margin: '0 0 14px' }}>
                      {rep.name} represents {rep.state} in the {rep.title === 'U.S. Senator' ? 'U.S. Senate' : 'U.S. House of Representatives'}.
                      {liveBio.birthYear ? ` Born ${liveBio.birthYear}.` : ''}
                      {liveBio.terms?.length ? ` Has served ${liveBio.terms.length} term${liveBio.terms.length > 1 ? 's' : ''} in Congress.` : ''}
                    </p>
                    {formatLeadershipRoles(liveBio.leadership).length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 8 }}>Leadership Roles</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {formatLeadershipRoles(liveBio.leadership).map(({ role, spans }) => (
                            <li key={role} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
                              <span style={{ color: S.gold, flexShrink: 0, fontSize: 14 }}>•</span>
                              <span style={{ fontSize: 13, color: S.grayLight, lineHeight: 1.6 }}>
                                <span style={{ color: S.offWhite, fontWeight: 600 }}>{role}</span>
                                {' '}{spans.join(', ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {liveCommittees && liveCommittees.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 8 }}>Committee Memberships</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {liveCommittees.map((c, i) => (
                            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
                              <span style={{ color: S.gold, flexShrink: 0, fontSize: 14 }}>•</span>
                              <span style={{ fontSize: 13, color: S.grayLight, lineHeight: 1.6 }}>
                                <span style={{ color: S.offWhite }}>{c.name}</span>
                                {c.chamber && <span style={{ color: S.gray }}>{' — '}{c.chamber}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {liveBio.terms?.length > 0 && (() => {
                      const currentYear = new Date().getFullYear()
                      const sortedTerms = [...liveBio.terms].sort((a, b) => (a.congress || 0) - (b.congress || 0))
                      const currentChamber = sortedTerms[sortedTerms.length - 1]?.chamber || ''

                      // Group consecutive terms in the same chamber+state+district into ranges
                      const grouped = []
                      for (const term of sortedTerms) {
                        const startYr = term.startYear || congressToYear(term.congress)
                        const endYr = term.endYear || (congressToYear(term.congress) + 2)
                        const last = grouped[grouped.length - 1]
                        if (last && last.chamber === term.chamber && last.stateCode === term.stateCode && last.district === term.district && startYr <= last.endYr + 1) {
                          last.endYr = Math.max(last.endYr, endYr)
                        } else {
                          grouped.push({ chamber: term.chamber, stateCode: term.stateCode, district: term.district, startYr, endYr })
                        }
                      }

                      const currentGroups = grouped.filter(g => g.chamber === currentChamber)
                      const servingSince = currentGroups.length > 0 ? currentGroups[0].startYr : null
                      const totalYears = Math.round(grouped.reduce((sum, g) => sum + (Math.min(g.endYr, currentYear) - g.startYr), 0))

                      // For display: group consecutive entries by chamber so each chamber gets one heading
                      const displayChamberGroups = []
                      for (const g of [...grouped].reverse()) {
                        const last = displayChamberGroups[displayChamberGroups.length - 1]
                        if (last && last.chamber === g.chamber) {
                          last.rows.push(g)
                        } else {
                          displayChamberGroups.push({ chamber: g.chamber, rows: [g] })
                        }
                      }

                      return (
                        <div style={{ marginTop: 18 }}>
                          <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>Congressional Service</div>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                            {servingSince && (
                              <div style={{ padding: '8px 14px', background: 'rgba(212,175,55,0.08)', border: `1px solid ${S.border}`, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: S.gray, marginBottom: 3, letterSpacing: 1 }}>SERVING SINCE</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: S.gold, lineHeight: 1 }}>{servingSince}</div>
                              </div>
                            )}
                            {totalYears > 0 && (
                              <div style={{ padding: '8px 14px', background: 'rgba(212,175,55,0.08)', border: `1px solid ${S.border}`, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: S.gray, marginBottom: 3, letterSpacing: 1 }}>TOTAL SERVICE</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: S.gold, lineHeight: 1 }}>{totalYears} yr{totalYears !== 1 ? 's' : ''}</div>
                              </div>
                            )}
                          </div>
                          <div style={{ borderLeft: `2px solid ${S.border}`, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {displayChamberGroups.map((cg, i) => {
                              const isCurrent = cg.rows.some(r => r.endYr > currentYear)
                              const chamberLabel = cg.chamber?.toLowerCase().includes('senate') ? 'U.S. Senate' : 'U.S. House'
                              const isSenate = cg.chamber?.toLowerCase().includes('senate')
                              return (
                                <div key={i} style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: -20, top: 5, width: 8, height: 8, borderRadius: '50%', background: isCurrent ? S.gold : 'rgba(212,175,55,0.35)' }} />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: S.offWhite }}>{chamberLabel}</span>
                                    {isCurrent && (
                                      <span style={{ fontSize: 10, background: 'rgba(212,175,55,0.15)', color: S.gold, border: `1px solid rgba(212,175,55,0.5)`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>● Current</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 12, color: S.gray, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {cg.rows.map((r, j) => {
                                      const districtStr = !isSenate && r.district ? ` · District ${r.district}` : ''
                                      const yearsStr = r.endYr > currentYear ? `${r.startYr}–present` : `${r.startYr}–${r.endYr}`
                                      return (
                                        <div key={j}>{r.stateCode}{districtStr} · {yearsStr}</div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.8, margin: 0 }}>{rep.bio}</p>
                )}
                {liveBio?.officialWebsiteUrl && (
                  <a href={liveBio.officialWebsiteUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 12, padding: '7px 16px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
                    Official Website →
                  </a>
                )}
                {rep.peers?.length > 0 && <div style={{ marginTop: 10, fontSize: 12, color: S.gray }}>Peers: {rep.peers.join(" · ")}</div>}
              </div>

              {liveCommittees && liveCommittees.length > 0 && (() => {
                const currentYear = new Date().getFullYear()
                const currentCongress = Math.floor((currentYear - 1789) / 2) + 1
                const currentCs = liveCommittees.filter(c => c.endCongress >= currentCongress - 1)
                const pastCs = liveCommittees.filter(c => c.endCongress < currentCongress - 1)
                const renderCommittee = c => {
                  const startYr = congressToYear(c.startCongress)
                  const endYr = congressToYear(c.endCongress) + 2
                  const isCurrent = c.endCongress >= currentCongress - 1
                  const dateStr = isCurrent
                    ? (c.startCongress === c.endCongress ? `(${startYr}–present)` : `(${startYr}–present)`)
                    : (startYr === endYr - 2 ? `(${startYr}–${endYr})` : `(${startYr}–${endYr})`)
                  return (
                    <div key={c.name} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ color: isCurrent ? S.gold : 'rgba(212,175,55,0.35)', flexShrink: 0, fontSize: 12 }}>●</span>
                      <span style={{ fontSize: 13, color: S.grayLight, lineHeight: 1.5 }}>
                        <span style={{ color: isCurrent ? S.offWhite : S.gray, fontWeight: isCurrent ? 600 : 400 }}>{c.name}</span>
                        {' '}
                        <span style={{ color: S.gray, fontSize: 11 }}>{dateStr}</span>
                        {isCurrent && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(212,175,55,0.12)', color: S.gold, border: `1px solid rgba(212,175,55,0.35)`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>Current</span>}
                      </span>
                    </div>
                  )
                }
                return (
                  <div style={{ padding: 22, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 18 }}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>Committee Assignments</div>
                    {currentCs.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, marginBottom: 8 }}>CURRENT</div>
                        {currentCs.map(renderCommittee)}
                      </>
                    )}
                    {pastCs.length > 0 && (
                      <>
                        <div style={{ fontSize: 10, color: S.gray, letterSpacing: 1, marginTop: currentCs.length > 0 ? 14 : 0, marginBottom: 8 }}>PAST</div>
                        {pastCs.map(renderCommittee)}
                      </>
                    )}
                  </div>
                )
              })()}

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

              {Object.keys(rep.peerComparison || {}).length === 0 && isLive && (
                <div style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textAlign: 'center', color: S.gray, fontSize: 13 }}>
                  Peer comparison data is manually curated and not yet available for all members.
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <a href={`https://www.congress.gov/member/${rep.id}`} target="_blank" rel="noreferrer" style={{ color: S.gold, textDecoration: 'none' }}>View voting record on Congress.gov →</a>
                  </div>
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
          {loadingTownHall ? (
            <div style={{ textAlign: 'center', padding: 48, color: S.gray, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏛️</div>
              Searching for upcoming events…
            </div>
          ) : (() => {
            const events = liveTownHall || []
            const meta = liveTownHallMeta || {}
            const hasEvents = events.length > 0
            const isSenator = meta.isSenator ?? (rep.title || '').toLowerCase().includes('senator')

            // Derive official website base URL + contact page from events URL
            let officialBase = null
            if (meta.officialEventsUrl) {
              try { officialBase = new URL(meta.officialEventsUrl).origin } catch {}
            }
            const contactUrl = officialBase
              ? (isSenator ? `${officialBase}/content/contact-senator` : `${officialBase}/contact`)
              : null

            // DC office address
            const dcAddress = isSenator
              ? 'United States Senate · Washington, D.C. 20510'
              : 'United States House of Representatives · Washington, D.C. 20515'

            // Name parts — Congress API uses "LASTNAME, Firstname" format
            const nameParts = (rep.name || '').split(',')
            const rawLast = nameParts[0]?.trim() || ''
            const rawFirst = nameParts[1]?.trim().split(' ')[0] || ''
            const displayLast = rawLast.charAt(0).toUpperCase() + rawLast.slice(1).toLowerCase()
            const displayFirst = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()
            const displayName = displayFirst && displayLast ? `${displayFirst} ${displayLast}` : rep.name || ''
            const salutation = isSenator ? `Senator ${displayLast}` : `Representative ${displayLast}`
            const websiteDomain = officialBase
              ? officialBase.replace(/^https?:\/\/(www\.)?/, '')
              : null

            // Write-to-them template
            const districtSuffix = rep.district && rep.district !== 'Statewide' ? `, ${rep.district}` : ''
            const messageTemplate = `Dear ${salutation},

I am a constituent from ${rep.state}${districtSuffix}. I am writing to urge you to [YOUR MESSAGE HERE].

Thank you for your time and service.

Sincerely,
[Your Name]
[Your City, State]`

            return (
              <div>
                {/* ── How to Reach Them ── */}
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                  How to Reach {displayName}
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                  {/* Call */}
                  <a href={`tel:${rep.phone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(26,122,74,0.1)', border: '1px solid rgba(26,122,74,0.35)', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 26 }}>📞</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#4CAF50', marginBottom: 3 }}>Call</div>
                      <div style={{ fontSize: 15, color: S.grayLight, fontWeight: 600 }}>{rep.phone}</div>
                      <div style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>Washington, D.C. office · Calls are most effective</div>
                    </div>
                    <span style={{ fontSize: 18, color: '#4CAF50' }}>→</span>
                  </a>

                  {/* Contact Form */}
                  <a href={contactUrl || rep.website} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(91,156,255,0.08)', border: '1px solid rgba(91,156,255,0.3)', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 26 }}>✉️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#5B9CFF', marginBottom: 3 }}>Contact Form</div>
                      <div style={{ fontSize: 13, color: S.grayLight }}>Official online contact form</div>
                      <div style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>Copy the template below to paste your message</div>
                    </div>
                    <span style={{ fontSize: 18, color: '#5B9CFF' }}>→</span>
                  </a>

                  {/* Visit / DC address */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: `rgba(212,175,55,0.07)`, border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 12 }}>
                    <span style={{ fontSize: 26 }}>🏛️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.gold, marginBottom: 3 }}>Visit DC Office</div>
                      <div style={{ fontSize: 13, color: S.grayLight }}>{dcAddress}</div>
                      <div style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>Mon – Fri · 9 am – 5 pm ET</div>
                    </div>
                  </div>
                </div>

                {/* ── Official Website ── */}
                {officialBase && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                      Official Website
                    </div>
                    <a href={officialBase} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontSize: 20 }}>🌐</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{websiteDomain}</div>
                        <div style={{ fontSize: 11, color: S.gray }}>Official congressional website</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: S.gray, fontSize: 12 }}>→</span>
                    </a>
                  </div>
                )}

                {/* ── Write to Them ── */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                    Write to Them
                  </div>
                  <div style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: S.gray, marginBottom: 12, lineHeight: 1.6 }}>
                      Copy this template, then paste it into{' '}
                      {contactUrl
                        ? <a href={contactUrl} target="_blank" rel="noreferrer" style={{ color: S.gold }}>their contact form →</a>
                        : 'their contact form'}
                    </div>
                    <pre style={{ fontFamily: 'inherit', fontSize: 12, color: S.grayLight, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '14px 16px', margin: '0 0 14px', whiteSpace: 'pre-wrap', lineHeight: 1.75, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {messageTemplate}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(messageTemplate).then(() => {
                          setCopiedTemplate(true)
                          setTimeout(() => setCopiedTemplate(false), 2500)
                        })
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: copiedTemplate ? 'rgba(26,122,74,0.2)' : 'rgba(212,175,55,0.12)', border: `1px solid ${copiedTemplate ? 'rgba(26,122,74,0.5)' : S.gold}`, borderRadius: 8, color: copiedTemplate ? '#4CAF50' : S.gold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}>
                      {copiedTemplate ? '✓ Copied!' : '📋 Copy Template'}
                    </button>
                  </div>
                </div>

                {/* ── Upcoming Events ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase' }}>
                    Upcoming Events {hasEvents && <span style={{ color: S.gold }}>({events.length})</span>}
                  </div>
                  {hasEvents && (
                    <span style={{ fontSize: 10, color: S.gray }}>via Mobilize America</span>
                  )}
                </div>

                {hasEvents ? (
                  <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                    {events.map((ev, i) => (
                      <div key={ev.id || i} style={{ padding: 16, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, flex: 1, paddingRight: 12 }}>{ev.title}</div>
                          {ev.isVirtual && (
                            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(91,156,255,0.15)', border: '1px solid rgba(91,156,255,0.4)', borderRadius: 6, color: '#5B9CFF', whiteSpace: 'nowrap' }}>
                              Virtual
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: S.gray, marginBottom: 4 }}>
                          📅 {ev.date}{ev.time ? ` · ${ev.time}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: S.gray, marginBottom: ev.description ? 8 : 12 }}>
                          📍 {ev.location || 'Location not listed'}
                        </div>
                        {ev.description && (
                          <div style={{ fontSize: 12, color: S.grayLight, marginBottom: 12, lineHeight: 1.5 }}>
                            {ev.description}
                          </div>
                        )}
                        {ev.rsvpUrl && (
                          <a href={ev.rsvpUrl} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-block', padding: '7px 16px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, borderRadius: 8, color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                            RSVP →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 0 24px', color: S.gray, fontSize: 13 }}>
                    No upcoming town halls found in our live feed for {rep.name.split(',')[0]}. Check back soon or use the links below.
                  </div>
                )}

                {/* ── Find More Events ── */}
                <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                  Find More Events
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                  {meta.officialEventsUrl && (
                    <a href={meta.officialEventsUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontSize: 20 }}>🏛️</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Official Events Page</div>
                        <div style={{ fontSize: 11, color: S.gray }}>
                          {websiteDomain || (isSenator ? 'senate.gov' : 'house.gov')} — Scheduled events &amp; appearances
                        </div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: S.gray, fontSize: 12 }}>→</span>
                    </a>
                  )}
                  {meta.googleSearchUrl && (
                    <a href={meta.googleSearchUrl} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ fontSize: 20 }}>🔍</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Search for Town Halls</div>
                        <div style={{ fontSize: 11, color: S.gray }}>Google News — Recent announcements &amp; upcoming events</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: S.gray, fontSize: 12 }}>→</span>
                    </a>
                  )}
                  <a href="https://www.mobilize.us/events/?event_types=TOWN_HALL" target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 20 }}>📣</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Mobilize America</div>
                      <div style={{ fontSize: 11, color: S.gray }}>Browse all upcoming town halls nationwide</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: S.gray, fontSize: 12 }}>→</span>
                  </a>
                  <a href={`https://townhallproject.com`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 20 }}>🗺️</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Town Hall Project</div>
                      <div style={{ fontSize: 11, color: S.gray }}>Nationwide tracking of congressional town halls</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: S.gray, fontSize: 12 }}>→</span>
                  </a>
                </div>

                {/* ── Community Poll ── */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>Community Priority Poll</div>
                  <div style={{ padding: 20, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: S.grayLight, marginBottom: 16 }}>What should {displayLast || rep.name.split(' ').pop()} prioritize?</div>
                    {Object.entries(rep.communityPoll).map(([issue, count]) => {
                      const hasVoted = pollVotes[`${rep.id}-${issue}`]
                      const total = Object.values(rep.communityPoll).reduce((a, b) => a + b, 0)
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={issue} style={{ marginBottom: 14, opacity: hasVoted ? 0.7 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{issue}</span>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: S.gray }}>{count} · {pct}%</span>
                              {!hasVoted && (
                                <button onClick={() => handlePollVote(rep.id, issue)}
                                  style={{ padding: '3px 10px', background: S.navyLight, border: `1px solid ${S.border}`, borderRadius: 6, color: S.gold, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
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
            )
          })()}
        </div>
      )}

      {/* ── AI ANALYSIS ── */}
      {/* ── NONPROFITS ── */}
      {repTab === "nonprofits" && (
        <div className="slide-in">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: S.gray, lineHeight: 1.7 }}>
              Nonprofit organizations matching <span style={{ color: S.gold }}>{rep.name.split(',')[0]}</span> in the IRS 990 database,
              sourced from <a href="https://projects.propublica.org/nonprofits/" target="_blank" rel="noreferrer" style={{ color: S.gold }}>ProPublica Nonprofit Explorer</a>.
              Results include personal foundations, affiliated organizations, and nonprofits registered in {rep.state || 'this state'}.
            </div>
          </div>

          {loadingNonprofits ? (
            <div style={{ textAlign: 'center', padding: 48, color: S.gray, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏦</div>
              Searching IRS 990 filings…
            </div>
          ) : (liveNonprofits || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
              <div style={{ fontSize: 14, color: S.gray, marginBottom: 8 }}>No matching nonprofits found.</div>
              <a href={`https://projects.propublica.org/nonprofits/search?q=${encodeURIComponent(rep.name.split(',')[0])}`}
                target="_blank" rel="noreferrer"
                style={{ padding: '8px 20px', background: `rgba(212,175,55,0.15)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, textDecoration: 'none', fontSize: 12 }}>
                Search ProPublica Directly →
              </a>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 24 }}>
                {(liveNonprofits || []).map(org => (
                  <a key={org.ein} href={org.profileUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'block', padding: 18, background: S.cardBg, border: `1px solid ${S.border}`, borderRadius: 14, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = S.gold}
                    onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: S.white, lineHeight: 1.3, flex: 1 }}>
                        {org.name}
                      </div>
                      {org.revenueLabel && (
                        <div style={{ fontSize: 12, color: '#4CAF50', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {org.revenueLabel}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {org.category && (
                        <span style={{ fontSize: 10, padding: '2px 8px', background: `rgba(212,175,55,0.1)`, border: `1px solid ${S.border}`, borderRadius: 6, color: S.gold }}>
                          {org.category}
                        </span>
                      )}
                      {org.subsection && (
                        <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray }}>
                          {org.subsection}
                        </span>
                      )}
                      {(org.city || org.state) && (
                        <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, color: S.gray }}>
                          📍 {[org.city, org.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: S.gray }}>
                      EIN: {org.ein} · View 990 filings →
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 11, color: S.gray, textAlign: 'center', padding: '12px 0', borderTop: `1px solid ${S.border}` }}>
                Data sourced from IRS 990 filings via{' '}
                <a href="https://projects.propublica.org/nonprofits/" target="_blank" rel="noreferrer" style={{ color: S.gold }}>
                  ProPublica Nonprofit Explorer
                </a>
                . Revenue figures from most recent available filing. Results match the representative's name — verify connections via the full filing.
              </div>
            </>
          )}
        </div>
      )}

      {repTab === "ai" && (
        <AIAnalysisTab rep={rep} S={S} handleSubscribe={handleSubscribe} handleBillingPortal={handleBillingPortal} isProProp={isProProp} />
      )}
    </div>
  )
}


function AIAnalysisTab({ rep, S, handleSubscribe, handleBillingPortal, isProProp }) {
  const { user } = useUser()
  const [status, setStatus] = useState('idle') // idle | loading | preview | full | error
  const [preview, setPreview] = useState('')
  const [fullReport, setFullReport] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Prefer prop (from parent) so both stay in sync; fall back to local user read
  const isPro = isProProp ?? (user?.publicMetadata?.isPro === true)

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
    if (!isPro) {
      return (
        <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22 }}>
            AI Analysis is a Pro feature
          </div>
          <p style={{ fontSize: 14, color: S.gray, lineHeight: 1.8, maxWidth: 380, margin: 0 }}>
            Get a nonpartisan AI-generated accountability report on any member of Congress — voting record, stock trades, wealth trajectory, and peer standing.
          </p>
          <a href="/pro"
            style={{ padding: '13px 32px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, border: 'none', borderRadius: 10, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5, textDecoration: 'none', boxShadow: `0 4px 20px rgba(212,175,55,0.3)` }}>
            Go Pro →
          </a>
        </div>
      )
    }
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
          onClick={() => runAnalysis('full')}
          style={{ padding: '13px 32px', background: `linear-gradient(135deg, ${S.red}, ${S.navyLight})`, border: 'none', borderRadius: 10, color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5, boxShadow: `0 4px 20px rgba(178,34,52,0.35)` }}>
          Generate Analysis →
        </button>
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
            <span style={{ fontSize: 11, color: S.gold, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Gemini AI · Nonpartisan Analysis</span>
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
              {rep.netWorthBefore && rep.netWorthCurrent
                ? `On wealth accumulation, a ${(((rep.netWorthCurrent - rep.netWorthBefore) / rep.netWorthBefore) * 100).toFixed(0)}% increase over ${rep.yearsInOffice} years in office significantly outpaces typical congressional wealth growth.`
                : 'Wealth trajectory analysis covers net worth growth relative to years in office and peer norms.'}
              {' '}Peer comparison data reveals their issue positioning as notably divergent in key areas.
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
            ) : isPro ? (
              <button
                onClick={handleBillingPortal}
                style={{ padding: '11px 28px', background: `linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))`, border: `1px solid ${S.gold}`, borderRadius: 10, color: S.gold, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5 }}>
                ★ Manage Pro Subscription
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, border: 'none', borderRadius: 10, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 0.5 }}>
                ★ Upgrade to Pro · $9.99/mo
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: 11, color: S.gray, textAlign: 'center' }}>
          Analysis powered by Gemini AI · For informational purposes only · Not legal or financial advice
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
            🤖 Powered by Gemini AI · Nonpartisan · For informational purposes only
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

function ConstitutionCard({ title, plain, original, S }) {
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
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#D4AF37', marginBottom: 12 }}>{plain}</p>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: S.gray, fontStyle: "italic", borderLeft: `3px solid rgba(212,175,55,0.3)`, paddingLeft: 16, margin: 0 }}>{original}</p>
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
