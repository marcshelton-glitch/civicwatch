import { AbsoluteFill } from "remotion";
import { theme } from "./theme";

/**
 * Rendered whenever a clip is built from sample data.
 *
 * This exists because the trade data is about NAMED REAL PEOPLE. Posting a
 * clip built from placeholder rows would be a factual claim about someone's
 * finances that is simply untrue. Making sample output visibly unusable is
 * cheaper than relying on remembering.
 */
export const SampleWatermark: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <div
      style={{
        transform: "rotate(-24deg)",
        fontSize: 150,
        fontWeight: 800,
        letterSpacing: 8,
        color: theme.warn,
        opacity: 0.22,
        border: `10px solid ${theme.warn}`,
        padding: "24px 56px",
        borderRadius: 24,
        whiteSpace: "nowrap",
      }}
    >
      SAMPLE DATA
    </div>
  </AbsoluteFill>
);
