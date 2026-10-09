import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";

const GOLD = "#C9A227", WHITE = "#F5F6FA", MUTED = "#AEB9D2";
const serif = "Lora, 'Liberation Serif', Georgia, serif";
const sans = "Inter, system-ui, sans-serif";

/** One shared stage, so all three presenters stand in the same room. */
const STAGE_W = 2400, TOP = 200, FIG_H = 1100;
const FIGS = [
  { src: "fig-1.png", w: 752, x: 80, line: "Congress discloses its stock trades." },
  { src: "fig-2.png", w: 676, x: 892, line: "Public, but buried in two separate systems." },
  { src: "fig-3.png", w: 692, x: 1628, line: "CivicWatch puts 13,100+ in one place." },
];
const cx = (i: number) => FIGS[i].x + FIGS[i].w / 2;
const BEAT = [24, 144, 264];
const GROUP = 384, PANEL = 444, END = 540;

const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/** 0 dark → 1 lit. Rises over 1s, holds, falls over 1s as the words arrive. */
const lightFor = (f: number, i: number) => {
  const s = BEAT[i];
  const solo = interpolate(f, [s, s + 30, s + 70, s + 100], [0, 1, 1, 0], clamp);
  const group = interpolate(f, [GROUP, GROUP + 30], [0, 1], clamp); // holds lit to the end
  return Math.max(solo, group);
};

export const Concept4 = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tall = height > width;

  // Portrait has no room for a three-wide lineup, so the camera pushes in on each
  // presenter and pulls back for the reveal. Landscape holds the whole room and
  // lets the spotlight do the work, drifting gently toward whoever is lit.
  const keys = [0, 24, 134, 154, 254, 274, 374, 394, END];
  const camX = tall
    ? interpolate(f, keys, [cx(0), cx(0), cx(0), cx(1), cx(1), cx(2), cx(2), 1200, 1200], ease)
    : interpolate(f, keys, [1200, 1140, 1140, 1200, 1200, 1260, 1260, 1200, 1200], ease);
  const camY = tall
    ? interpolate(f, keys, [600, 600, 600, 600, 600, 600, 600, 640, 640], ease)
    : 600;
  const camS = tall
    ? interpolate(f, keys, [1.08, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 0.55, 0.55], ease)
    : interpolate(f, [0, END], [0.78, 0.84], clamp);

  // the splash fades in and stays up for the rest of the film
  const panel = interpolate(f, [PANEL, PANEL + 30], [0, 1], clamp);
  const dim = 1 - 0.78 * panel;

  const textTop = tall ? 1380 : height - 268;
  const labelTop = tall ? 1700 : height - 82;

  return (
    <AbsoluteFill style={{ background: "#04060C" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 120% 70% at 50% 42%, #0A1128 0%, #04060C 70%)" }} />

      <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: 1500, transformOrigin: "0 0",
        transform: `translate(${width / 2}px, ${height / 2}px) scale(${camS}) translate(${-camX}px, ${-camY}px)` }}>
        {FIGS.map((fig, i) => {
          const l = lightFor(f, i) * dim;
          return (
            <div key={fig.src}>
              <div style={{ position: "absolute", left: fig.x + fig.w / 2 - 620, top: TOP - 260, width: 1240, height: 1700,
                background: "radial-gradient(ellipse 42% 46% at 50% 34%, rgba(198,214,255,.17), rgba(198,214,255,.05) 55%, rgba(0,0,0,0) 72%)",
                opacity: l, pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: fig.x + fig.w / 2 - 450, top: TOP + FIG_H - 150, width: 900, height: 300,
                background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(190,208,255,.16), rgba(0,0,0,0) 70%)",
                opacity: l * 0.9 }} />
              <Img src={staticFile(fig.src)} style={{ position: "absolute", left: fig.x, top: TOP, width: fig.w, height: FIG_H,
                filter: `brightness(${(0.09 + 0.91 * l).toFixed(3)}) saturate(${(0.55 + 0.45 * l).toFixed(3)}) contrast(${(1.04 - 0.04 * l).toFixed(3)})` }} />
            </div>
          );
        })}
      </div>

      {/* the words arrive at the bottom as each light goes out */}
      {FIGS.map((fig, i) => {
        const s = BEAT[i];
        const o = interpolate(f, [s + 70, s + 90, s + 114, s + 120], [0, 1, 1, 0], clamp);
        const y = interpolate(f, [s + 70, s + 95], [22, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <div key={fig.src} style={{ position: "absolute", left: tall ? 100 : 180, right: tall ? 100 : 180, top: textTop,
            opacity: o, transform: `translateY(${y}px)`, textAlign: tall ? "left" : "center" }}>
            <div style={{ fontFamily: serif, fontSize: tall ? 60 : 56, lineHeight: 1.2, color: WHITE, fontWeight: 600,
              textShadow: "0 4px 30px rgba(0,0,0,.85)" }}>{fig.line}</div>
            <div style={{ width: 110, height: 4, background: GOLD, marginTop: 24, marginLeft: tall ? 0 : "auto", marginRight: tall ? 0 : "auto" }} />
          </div>
        );
      })}

      {/* closing splash — holds to the final frame */}
      <AbsoluteFill style={{ opacity: panel, alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <AbsoluteFill style={{ background: "rgba(4,6,12,.86)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Img src={staticFile("lockup-trans.png")} style={{ width: tall ? 780 : 860 }} />
          <div style={{ fontFamily: sans, fontSize: tall ? 27 : 29, letterSpacing: 6, color: GOLD, marginTop: tall ? 50 : 44, textAlign: "center" }}>
            EXPLORE THE RECORD. HOLD POWER ACCOUNTABLE.
          </div>
          <div style={{ fontFamily: sans, fontSize: tall ? 40 : 42, color: WHITE, marginTop: tall ? 52 : 46, padding: "18px 56px",
            border: `2px solid ${GOLD}`, borderRadius: 60 }}>
            civicwatch.app
          </div>
          <div style={{ fontFamily: sans, fontSize: 27, color: MUTED, marginTop: 34 }}>Free to browse. All 535 members.</div>
        </div>
      </AbsoluteFill>

      {/* required disclosure, on screen for the full duration */}
      <div style={{ position: "absolute", left: 0, right: 0, top: labelTop, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: sans, fontSize: 27, color: "#E8ECF5", background: "rgba(8,13,26,.82)",
          border: "1px solid rgba(201,162,39,.55)", borderRadius: 10, padding: "14px 28px" }}>
          AI presenters — data from public STOCK Act filings
        </div>
      </div>
    </AbsoluteFill>
  );
};
