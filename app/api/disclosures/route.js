import { NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

const HOUSE_CLERK = 'https://disclosures-clerk.house.gov/public_disc'

const TYPE_LABELS = {
  P: 'Periodic Transaction Report',
  A: 'Annual Financial Disclosure',
  O: 'Annual Financial Disclosure',
  D: 'PTR Amendment',
  G: 'New Member Report',
  X: 'Extension Request',
  C: 'Candidate Filing',
  W: 'Withdrawal',
  H: 'Due Date Notice',
}

async function fetchFDIndex(year) {
  try {
    const res = await fetch(`${HOUSE_CLERK}/financial-pdfs/${year}FD.zip`, {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    })
    if (!res.ok) return []
    const buf = Buffer.from(await res.arrayBuffer())
    const zip = new AdmZip(buf)
    const entry = zip.getEntries().find(e => e.entryName.endsWith('.xml'))
    if (!entry) return []
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true })
    const doc = parser.parse(entry.getData().toString('utf8'))
    return [doc.FinancialDisclosure?.Member].flat().filter(Boolean)
  } catch { return [] }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lastName = (searchParams.get('lastName') || '').trim().toLowerCase()
  const stateDst  = (searchParams.get('stateDst')  || '').trim().toUpperCase()

  if (!lastName) return NextResponse.json({ error: 'lastName required' }, { status: 400 })

  const currentYear = new Date().getFullYear()
  // Fetch last 4 years in parallel — annual FDs are filed in the following year
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]
  const allMembers = (await Promise.all(years.map(fetchFDIndex))).flat()

  // Match by last name and optional state prefix (e.g. "CA" from "CA03")
  const statePrefix = stateDst.slice(0, 2)
  const matches = allMembers.filter(m => {
    const mLast  = (m.Last  || '').trim().toLowerCase()
    const mState = (m.StateDst || '').trim().toUpperCase()
    const nameMatch  = mLast === lastName
    const stateMatch = !statePrefix || mState.startsWith(statePrefix)
    return nameMatch && stateMatch
  })

  // Deduplicate by DocID
  const seen = new Set()
  const filings = matches
    .filter(m => {
      const key = String(m.DocID)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(m => {
      const type  = (m.FilingType || '').trim()
      const year  = parseInt(m.Year, 10) || currentYear
      const docId = String(m.DocID)
      const isPtr = type === 'P' || type === 'D'
      const isAnnual = type === 'A' || type === 'O' || type === 'G'
      return {
        docId,
        type,
        typeLabel: TYPE_LABELS[type] || type,
        isPtr,
        isAnnual,
        year,
        filingDate: m.FilingDate || null,
        firstName:  (m.First    || '').trim(),
        lastName:   (m.Last     || '').trim(),
        stateDst:   (m.StateDst || '').trim(),
        pdfUrl: isPtr
          ? `${HOUSE_CLERK}/ptr-pdfs/${year}/${docId}.pdf`
          : `${HOUSE_CLERK}/financial-pdfs/${year}/${docId}.pdf`,
      }
    })
    .sort((a, b) => {
      const da = a.filingDate ? new Date(a.filingDate) : new Date(0)
      const db = b.filingDate ? new Date(b.filingDate) : new Date(0)
      return db - da
    })

  return NextResponse.json({
    filings,
    ptrCount:    filings.filter(f => f.isPtr).length,
    annualCount: filings.filter(f => f.isAnnual).length,
    memberName:  filings[0] ? `${filings[0].firstName} ${filings[0].lastName}` : null,
  })
}
