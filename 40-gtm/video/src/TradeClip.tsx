import React from "react";
import {
  AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme, partyLabel, money, prettyDate, Trade } from "./theme";
import { SampleWatermark } from "./SampleWatermark";

// Load only the weights actually used, latin only. The default pulls every
// weight and subset -- 126 network requests per render, which is slow and
// makes rendering depend on the network being up.
const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

/** Scene boundaries, in frames at 30fps. */
export const SCENES = { hook: 0, card: 60, timing: 210, cta: 330, end: 390 };

const Rise: React.FC<{ delay?: number; children: React.ReactNode }> = ({
  delay = 0, children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      {children}
    </div>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      fontFamily,
      background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bgDeep} 100%)`,
      color: theme.fg,
      padding: 80,
      justifyContent: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Hook: React.FC<{ t: Trade }> = ({ t }) => (
  <Shell>
    <Rise>
      <div style={{ fontSize: 44, letterSpacing: 6, color: theme.muted, fontWeight: 600 }}>
        {t.chamber.toUpperCase()} DISCLOSURE
      </div>
    </Rise>
    <Rise delay={8}>
      <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1.05, marginTop: 28 }}>
        A member of Congress{"\n"}
        <span style={{ color: t.action === "BUY" ? theme.buy : theme.sell }}>
          {t.action === "BUY" ? "bought" : "sold"}
        </span>{" "}
        {t.ticker}
      </div>
    </Rise>
    <Rise delay={18}>
      <div style={{ fontSize: 46, color: theme.muted, marginTop: 36 }}>
        {t.context}.
      </div>
    </Rise>
  </Shell>
);

const Card: React.FC<{ t: Trade }> = ({ t }) => {
  const party = theme.party[t.party] ?? theme.muted;
  return (
    <Shell>
      <Rise>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
          <span style={{
            background: party, color: "#0B1020", fontWeight: 800, fontSize: 32,
            padding: "8px 22px", borderRadius: 999,
          }}>
            {partyLabel[t.party] ?? t.party}
          </span>
          <span style={{ fontSize: 32, color: theme.muted }}>{t.state} · {t.chamber}</span>
        </div>
      </Rise>

      <Rise delay={8}>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1 }}>{t.member}</div>
      </Rise>
      <Rise delay={14}>
        <div style={{ fontSize: 34, color: theme.muted, marginTop: 12 }}>{t.committee}</div>
      </Rise>

      <Rise delay={22}>
        <div style={{
          marginTop: 56, border: `2px solid ${theme.border}`, borderRadius: 28,
          padding: 44, background: "rgba(255,255,255,0.03)",
        }}>
          {/* Direction is carried by a word AND a glyph, never colour alone. */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{
              fontSize: 56, fontWeight: 800,
              color: t.action === "BUY" ? theme.buy : theme.sell,
            }}>
              {t.action === "BUY" ? "▲ BOUGHT" : "▼ SOLD"}
            </span>
          </div>
          <div style={{ fontSize: 130, fontWeight: 800, marginTop: 14, letterSpacing: -2 }}>
            {t.ticker}
          </div>
          <div style={{ fontSize: 36, color: theme.muted }}>{t.company}</div>
          <div style={{
            fontSize: 72, fontWeight: 700, marginTop: 34,
            fontVariantNumeric: "tabular-nums",
          }}>
            {money(t.amountLow)} – {money(t.amountHigh)}
          </div>
        </div>
      </Rise>
    </Shell>
  );
};

const Timing: React.FC<{ t: Trade }> = ({ t }) => {
  const frame = useCurrentFrame();
  const gap = Math.round(
    (new Date(t.disclosedDate).getTime() - new Date(t.tradeDate).getTime()) / 86_400_000
  );
  const shown = Math.round(
    interpolate(frame, [10, 45], [0, gap], { extrapolateRight: "clamp" })
  );
  return (
    <Shell>
      <Rise>
        <div style={{ fontSize: 48, color: theme.muted, letterSpacing: 4 }}>THE TIMING</div>
      </Rise>
      <Rise delay={8}>
        <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.1, marginTop: 30 }}>
          {t.context}.
        </div>
      </Rise>
      <Rise delay={20}>
        <div style={{ marginTop: 60 }}>
          <div style={{ fontSize: 40, color: theme.muted }}>Disclosed</div>
          <div style={{
            fontSize: 160, fontWeight: 800, color: theme.accent,
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>
            {shown}
          </div>
          <div style={{ fontSize: 44, color: theme.muted }}>
            days after the trade — {prettyDate(t.tradeDate)} → {prettyDate(t.disclosedDate)}
          </div>
        </div>
      </Rise>
    </Shell>
  );
};

const Cta: React.FC = () => (
  <Shell>
    <Rise>
      <div style={{ fontSize: 62, color: theme.muted }}>Track every trade, free</div>
    </Rise>
    <Rise delay={8}>
      <div style={{ fontSize: 128, fontWeight: 800, marginTop: 20, color: theme.accent }}>
        CivicWatch
      </div>
    </Rise>
    <Rise delay={16}>
      <div style={{ fontSize: 40, color: theme.muted, marginTop: 40, lineHeight: 1.5 }}>
        Source: public financial disclosures{"\n"}filed under the STOCK Act.
      </div>
    </Rise>
  </Shell>
);

export const TradeClip: React.FC<{ trade: Trade; isSample?: boolean }> = ({
  trade, isSample = true,
}) => (
  <AbsoluteFill style={{ background: theme.bgDeep }}>
    <Sequence durationInFrames={SCENES.card}><Hook t={trade} /></Sequence>
    <Sequence from={SCENES.card} durationInFrames={SCENES.timing - SCENES.card}>
      <Card t={trade} />
    </Sequence>
    <Sequence from={SCENES.timing} durationInFrames={SCENES.cta - SCENES.timing}>
      <Timing t={trade} />
    </Sequence>
    <Sequence from={SCENES.cta}><Cta /></Sequence>
    {isSample ? <SampleWatermark /> : null}
  </AbsoluteFill>
);
