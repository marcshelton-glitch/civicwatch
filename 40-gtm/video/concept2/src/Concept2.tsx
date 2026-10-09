import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";

const NAVY = "#0A1128", NAVY2 = "#0F1B3D", GOLD = "#C9A227", WHITE = "#F5F6FA", MUTED = "#9AA6C0";
const serif = "Lora, 'Liberation Serif', Georgia, serif";
const sans = "Inter, system-ui, sans-serif";

const useFade = (dur: number, inF = 10, outF = 10) => {
  const f = useCurrentFrame();
  return interpolate(f, [0, inF, dur - outF, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};
const rise = (f: number, delay = 0) =>
  interpolate(f, [delay, delay + 18], [28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
const appear = (f: number, delay = 0) =>
  interpolate(f, [delay, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Caption = ({ children, sub }: { children: React.ReactNode; sub?: string }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 120, bottom: 120, maxWidth: 1100, opacity: appear(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
      <div style={{ fontFamily: serif, fontSize: 62, lineHeight: 1.15, color: WHITE, fontWeight: 600 }}>{children}</div>
      {sub && <div style={{ fontFamily: sans, fontSize: 26, color: MUTED, marginTop: 18 }}>{sub}</div>}
      <div style={{ width: 120, height: 3, background: GOLD, marginTop: 24 }} />
    </div>
  );
};

const Scene = ({ dur, children, hold = false }: { dur: number; children: React.ReactNode; hold?: boolean }) => {
  const o = useFade(dur, 10, hold ? 0.0001 : 10);
  return <AbsoluteFill style={{ opacity: o, background: NAVY }}>{children}</AbsoluteFill>;
};

// 1: Capitol dome (real photo, cropped to exclude baked-in og text)
const S1 = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 70], [1.0, 1.05]);
  return (
    <Scene dur={70}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 40%, ${NAVY2}, ${NAVY})` }} />
      <div style={{ position: "absolute", right: 150, top: 110, width: 700, height: 722, overflow: "hidden", borderRadius: 14,
        border: "2px solid rgba(201,162,39,.45)", boxShadow: "0 30px 80px rgba(0,0,0,.55)" }}>
        <Img src={staticFile("capitol-dome.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,17,40,0) 70%, rgba(10,17,40,.75) 100%)" }} />
      </div>
      <Caption>Public records.<br />Hidden in plain sight.</Caption>
    </Scene>
  );
};

// 2: Two separate systems
const Card = ({ title, delay }: { title: string; delay: number }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: 520, padding: "48px 40px", border: `2px solid rgba(201,162,39,.55)`, borderRadius: 18, background: NAVY2, textAlign: "center",
      opacity: appear(f, delay), transform: `translateY(${rise(f, delay)}px)` }}>
      <div style={{ fontFamily: serif, fontSize: 64, color: WHITE, fontWeight: 600 }}>{title}</div>
      <div style={{ fontFamily: sans, fontSize: 26, color: MUTED, marginTop: 14, letterSpacing: 2 }}>STOCK ACT DISCLOSURES</div>
      <div style={{ fontFamily: sans, fontSize: 24, color: GOLD, marginTop: 10 }}>its own separate system</div>
    </div>
  );
};
const S2 = () => (
  <Scene dur={60}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${NAVY2}, ${NAVY})` }} />
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
      <Card title="House" delay={4} />
      <Card title="Senate" delay={12} />
    </div>
    <Caption>The House and Senate publish them separately.</Caption>
  </Scene>
);

// 3: real stats screenshot
const Panel = ({ src, w, h, right, top, left }: { src: string; w: number; h: number; right?: number; top: number; left?: number }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, right, left, width: w, height: h, borderRadius: 14, overflow: "hidden",
      border: "2px solid rgba(255,255,255,.16)", boxShadow: "0 30px 80px rgba(0,0,0,.55)", background: NAVY,
      opacity: appear(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
    </div>
  );
};
const S3 = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={75}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 30%, ${NAVY2}, ${NAVY})` }} />
      <Panel src="shot-stats.png" w={1080} h={575} right={90} top={110} />
      <div style={{ position: "absolute", left: 110, top: 240, opacity: appear(f, 10), transform: `translateY(${rise(f, 10)}px)` }}>
        <div style={{ fontFamily: serif, fontSize: 118, color: GOLD, fontWeight: 700, lineHeight: 1 }}>13,100+</div>
        <div style={{ fontFamily: sans, fontSize: 28, color: WHITE, marginTop: 10 }}>disclosed trades on file</div>
      </div>
      <Caption sub="Live from official STOCK Act filings">CivicWatch pulls them into one place.</Caption>
    </Scene>
  );
};

// 4: real profile screenshot, conflict-score panel only (no member name visible)
const S4 = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={55}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 28%, ${NAVY2}, ${NAVY})` }} />
      <Panel src="shot-profile.png" w={1560} h={420} left={180} top={120} />
      <div style={{ position: "absolute", left: 180, top: 568, width: 1560, textAlign: "right", fontFamily: sans, fontSize: 26, color: "#AEB9D2", opacity: appear(f, 18) }}>
        Committee conflict score is an analytical indicator, not proof of wrongdoing.
      </div>
      <Caption>Every member's profile shows a committee conflict score. Free.</Caption>
    </Scene>
  );
};

// 5: end card
const S5 = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={40} hold>
      <AbsoluteFill style={{ background: "#0C1D3F", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("lockup-trans.png")} style={{ width: 1000, opacity: appear(f, 2), transform: `translateY(${rise(f, 2)}px)` }} />
        <div style={{ fontFamily: sans, fontSize: 30, letterSpacing: 8, color: GOLD, marginTop: 60, opacity: appear(f, 10) }}>EXPLORE THE RECORD. HOLD POWER ACCOUNTABLE.</div>
        <div style={{ fontFamily: sans, fontSize: 40, color: WHITE, marginTop: 44, padding: "16px 56px", border: `2px solid ${GOLD}`, borderRadius: 60, opacity: appear(f, 16) }}>civicwatch.app</div>
      </AbsoluteFill>
    </Scene>
  );
};

export const Concept2 = () => (
  <AbsoluteFill style={{ background: NAVY }}>
    <Sequence from={0} durationInFrames={70}><S1 /></Sequence>
    <Sequence from={70} durationInFrames={60}><S2 /></Sequence>
    <Sequence from={130} durationInFrames={75}><S3 /></Sequence>
    <Sequence from={205} durationInFrames={55}><S4 /></Sequence>
    <Sequence from={260} durationInFrames={40}><S5 /></Sequence>
  </AbsoluteFill>
);
