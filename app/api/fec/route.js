import { NextResponse } from "next/server"
import { auth } from '@clerk/nextjs/server'

export const dynamic = "force-dynamic"

const FEC_IDS = {
  "S001150": { fecId: "S8CA00282", name: "Adam Schiff" },
  "P000145": { fecId: "S4CA00265", name: "Alex Padilla" },
  "K000401": { fecId: "H2CA03262", name: "Kevin Kiley" },
  "D000563": { fecId: "S2IL00177", name: "Richard Durbin" },
  "D000622": { fecId: "S0IL00304", name: "Tammy Duckworth" },
  "P000197": { fecId: "H8CA05033", name: "Nancy Pelosi" },
}

export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const bioguideId = searchParams.get("bioguideId") || ""
  const name = searchParams.get("name") || ""
  const known = FEC_IDS[bioguideId]
  const fecId = known?.fecId
  return NextResponse.json({
    bioguideId,
    fecId: fecId || null,
    fecUrl: fecId ? "https://www.fec.gov/data/candidate/" + fecId + "/" : "https://www.fec.gov/data/candidates/?q=" + encodeURIComponent(name),
    fecSearchUrl: "https://www.fec.gov/data/candidates/?q=" + encodeURIComponent(name),
    source: "static"
  })
}