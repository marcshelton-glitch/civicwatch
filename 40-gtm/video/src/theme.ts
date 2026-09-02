/**
 * Design tokens from ui-ux-pro-max ("Dark Mode (OLED)" + financial-data brief).
 *
 * One deliberate deviation: the generated palette proposed pink as primary,
 * which is wrong for a civic product. Blue accent is kept; party colours are
 * held in a SEPARATE scale from BUY/SELL, because US party colours are already
 * red and blue and reusing them for trade direction would make colour ambiguous.
 * BUY/SELL is always carried by a word and a glyph, never by colour alone.
 */
export const theme = {
  bg: "#0F172A",
  bgDeep: "#080D18",
  fg: "#FFFFFF",
  muted: "#94A3B8",
  border: "rgba(255,255,255,0.10)",
  accent: "#2563EB",
  buy: "#22C55E",
  sell: "#F97316",
  warn: "#DC2626",
  party: { R: "#E2564D", D: "#4C7DE0", I: "#A78BFA" } as Record<string, string>,
} as const;

export const partyLabel: Record<string, string> = {
  R: "Republican",
  D: "Democrat",
  I: "Independent",
};

export type Trade = {
  id: string;
  member: string;
  party: string;
  chamber: string;
  state: string;
  ticker: string;
  company: string;
  action: "BUY" | "SELL";
  amountLow: number;
  amountHigh: number;
  tradeDate: string;
  disclosedDate: string;
  context: string;
  committee: string;
};

export const money = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${Math.round(n / 1000)}K`;

export const prettyDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
