import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";

const NAVY = "#0A1128", NAVY2 = "#0F1B3D", GOLD = "#C9A227", WHITE = "#F5F6FA", MUTED = "#AEB9D2";
const serif = "Lora, 'Liberation Serif', Georgia, serif";
const sans = "Inter, system-ui, sans-serif";

const appear = (f: number, d = 0) =>
  interpolate(f, [d, d + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const rise = (f: number, d = 0) =>
  interpolate(f, [d, d + 16], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

/**
 * One slide per presenter. Each narrates one beat of the same argument —
 * narration only, never a testimonial, never shown as a user of the product.
 * No names are shown: these are AI-generated faces, not real people.
 */
const Slide = ({ src, dur, line, index }: { src: string; dur: number; line: React.ReactNode; index: number }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12, dur - 12, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const drift = interpolate(f, [0, dur], [0, -10]);
  return (
    <AbsoluteFill style={{ opacity: o, background: NAVY }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 34%, ${NAVY2}, ${NAVY})` }} />
      {/* Portrait is pre-cropped to head-through-pin, so the shield lapel pin is always in frame. */}
      <div style={{ position: "absolute", left: 140, top: 56, width: 800, height: 1240, borderRadius: 16, overflow: "hidden",
        border: "2px solid rgba(201,162,39,.40)", boxShadow: "0 30px 80px rgba(0,0,0,.6)",
        transform: `translateY(${drift + rise(f, 0)}px)` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
      </div>
      <div style={{ position: "absolute", left: 140, top: 1340, display: "flex", gap: 12, opacity: appear(f, 6) }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: i === index ? 40 : 14, height: 6, borderRadius: 3, background: i === index ? GOLD : "rgba(255,255,255,.28)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 140, right: 140, top: 1386, opacity: appear(f, 6), transform: `translateY(${rise(f, 6)}px)` }}>
        <div style={{ fontFamily: serif, fontSize: 58, lineHeight: 1.22, color: WHITE, fontWeight: 600 }}>{line}</div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard = ({ dur }: { dur: number }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: o, background: NAVY }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${NAVY2}, ${NAVY})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img src={staticFile("lockup-trans.png")} style={{ width: 760, opacity: appear(f, 2), transform: `translateY(${rise(f, 2)}px)` }} />
        <div style={{ fontFamily: sans, fontSize: 27, letterSpacing: 6, color: GOLD, marginTop: 54, opacity: appear(f, 12), textAlign: "center" }}>
          EXPLORE THE RECORD. HOLD POWER ACCOUNTABLE.
        </div>
        <div style={{ fontFamily: sans, fontSize: 40, color: WHITE, marginTop: 56, padding: "18px 56px", border: `2px solid ${GOLD}`, borderRadius: 60, opacity: appear(f, 20) }}>
          civicwatch.app
        </div>
        <div style={{ fontFamily: sans, fontSize: 28, color: MUTED, marginTop: 40, opacity: appear(f, 28) }}>
          Free to browse. All 535 members.
        </div>
        <div style={{ display: "flex", gap: 34, marginTop: 92, opacity: appear(f, 34) }}>
          {["head-1.jpg", "head-2.jpg", "head-3.jpg"].map((h) => (
            <Img key={h} src={staticFile(h)} style={{ width: 150, height: 150, borderRadius: 75, objectFit: "cover", border: "2px solid rgba(201,162,39,.45)" }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Required disclosure. On screen for the full duration. Do not remove. */
const AiLabel = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1660, display: "flex", justifyContent: "center" }}>
    <div style={{ fontFamily: sans, fontSize: 27, color: "#E8ECF5", background: "rgba(8,13,26,.82)",
      border: "1px solid rgba(201,162,39,.55)", borderRadius: 10, padding: "14px 28px" }}>
      AI presenters — data from public STOCK Act filings
    </div>
  </div>
);

export const Concept3 = () => (
  <AbsoluteFill style={{ background: NAVY }}>
    <Sequence from={0} durationInFrames={78}>
      <Slide src="cast-1-crop.jpg" dur={78} index={0} line={<>Congress discloses its stock trades.</>} />
    </Sequence>
    <Sequence from={78} durationInFrames={78}>
      <Slide src="cast-2-crop.jpg" dur={78} index={1} line={<>Public, but buried in two separate systems.</>} />
    </Sequence>
    <Sequence from={156} durationInFrames={78}>
      <Slide src="cast-3-crop.jpg" dur={78} index={2} line={<>CivicWatch puts 13,100+ in one place.</>} />
    </Sequence>
    <Sequence from={234} durationInFrames={66}>
      <EndCard dur={66} />
    </Sequence>
    <AiLabel />
  </AbsoluteFill>
);
