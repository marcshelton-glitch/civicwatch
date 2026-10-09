import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";

const NAVY = "#0A1128", NAVY2 = "#0F1B3D", GOLD = "#C9A227", WHITE = "#F5F6FA", MUTED = "#AEB9D2";
const serif = "Lora, 'Liberation Serif', Georgia, serif";
const sans = "Inter, system-ui, sans-serif";

const appear = (f: number, d = 0) =>
  interpolate(f, [d, d + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, d = 0) =>
  interpolate(f, [d, d + 18], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

const Scene = ({ dur, children, hold = false }: { dur: number; children: React.ReactNode; hold?: boolean }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, dur - (hold ? 0.0001 : 10), dur], [0, 1, 1, hold ? 1 : 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, background: NAVY }}>{children}</AbsoluteFill>;
};

// Narration line, in the middle third (platform UI covers top and bottom).
const Line = ({ children, sub, top = 1120 }: { children: React.ReactNode; sub?: string; top?: number }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, opacity: appear(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
      <div style={{ fontFamily: serif, fontSize: 68, lineHeight: 1.18, color: WHITE, fontWeight: 600 }}>{children}</div>
      {sub && <div style={{ fontFamily: sans, fontSize: 30, color: MUTED, marginTop: 16 }}>{sub}</div>}
      <div style={{ width: 110, height: 4, background: GOLD, marginTop: 26 }} />
    </div>
  );
};

const Card = ({ src, top, h }: { src: string; top: number; h: number }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 60, width: 960, top, height: h, borderRadius: 14, overflow: "hidden",
      border: "2px solid rgba(255,255,255,.16)", boxShadow: "0 24px 70px rgba(0,0,0,.6)", background: NAVY,
      opacity: appear(f, 6), transform: `translateY(${rise(f, 6)}px)` }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
    </div>
  );
};

// Persistent disclosure, required on publish. Never removed.
const AiLabel = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: sans, fontSize: 27, letterSpacing: 0.3, color: "#E8ECF5", background: "rgba(8,13,26,.82)",
      border: "1px solid rgba(201,162,39,.55)", borderRadius: 10, padding: "14px 28px" }}>
      AI presenter — data from public STOCK Act filings
    </div>
  </div>
);

// 1 — the presenter, framed. He narrates; he is never shown as a user.
const S1 = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 80], [1.04, 1.1]);
  return (
    <Scene dur={80}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile("presenter-a3.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,17,40,.55) 0%, rgba(10,17,40,0) 28%, rgba(10,17,40,.72) 62%, ${NAVY} 88%)` }} />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: appear(f, 2) }}>
        <Img src={staticFile("lockup-trans.png")} style={{ width: 560 }} />
      </div>
      <Line top={1120}>Congressional stock trades are public.<br />They're just buried.</Line>
    </Scene>
  );
};

// 2 — real aggregate figures
const S2 = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={70}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${NAVY2}, ${NAVY})` }} />
      <div style={{ position: "absolute", left: 80, top: 200, opacity: appear(f, 2), transform: `translateY(${rise(f, 2)}px)` }}>
        <div style={{ fontFamily: serif, fontSize: 150, color: GOLD, fontWeight: 700, lineHeight: 1 }}>13,100+</div>
        <div style={{ fontFamily: sans, fontSize: 34, color: WHITE, marginTop: 12 }}>disclosed trades on file</div>
      </div>
      <Card src="shot-stats.png" top={470} h={512} />
      <Line top={1090} sub="Live from official STOCK Act filings">CivicWatch puts them in one place.</Line>
    </Scene>
  );
};

// 3 — conflict score, described as an indicator
const S3 = () => {
  const f = useCurrentFrame();
  return (
    <Scene dur={70}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 32%, ${NAVY2}, ${NAVY})` }} />
      <Card src="shot-tradecounts.png" top={600} h={65} />
      <Card src="shot-conflict.png" top={710} h={115} />
      <div style={{ position: "absolute", left: 60, width: 960, top: 860, fontFamily: sans, fontSize: 27, color: MUTED, opacity: appear(f, 18) }}>
        An analytical indicator, not proof of wrongdoing.
      </div>
      <Line top={1120}>Every member's profile shows a committee conflict score. Free.</Line>
    </Scene>
  );
};

// 4 — close
const S4 = () => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 80], [1.0, 1.06]);
  return (
    <Scene dur={80} hold>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile("capitol-dome.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,17,40,.72) 0%, rgba(10,17,40,.5) 30%, ${NAVY} 72%)` }} />
      <div style={{ position: "absolute", left: 80, right: 80, top: 940, opacity: appear(f, 2), transform: `translateY(${rise(f, 2)}px)` }}>
        <div style={{ fontFamily: serif, fontSize: 70, lineHeight: 1.18, color: WHITE, fontWeight: 600 }}>
          It's your government.<br />Your money. Your right to know.
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, display: "flex", flexDirection: "column", alignItems: "center", opacity: appear(f, 20) }}>
        <Img src={staticFile("lockup-trans.png")} style={{ width: 640 }} />
        <div style={{ fontFamily: sans, fontSize: 38, color: WHITE, marginTop: 34, padding: "16px 52px", border: `2px solid ${GOLD}`, borderRadius: 60 }}>
          civicwatch.app/pro
        </div>
      </div>
    </Scene>
  );
};

export const Concept1 = () => (
  <AbsoluteFill style={{ background: NAVY }}>
    <Sequence from={0} durationInFrames={80}><S1 /></Sequence>
    <Sequence from={80} durationInFrames={70}><S2 /></Sequence>
    <Sequence from={150} durationInFrames={70}><S3 /></Sequence>
    <Sequence from={220} durationInFrames={80}><S4 /></Sequence>
    <AiLabel />
  </AbsoluteFill>
);
