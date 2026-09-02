import { Composition } from "remotion";
import { TradeClip, SCENES } from "./TradeClip";
import { Trade } from "./theme";
import sample from "./data/trades.sample.json";

const trades = sample as Trade[];

export const RemotionRoot: React.FC = () => (
  <>
    {trades.map((t, i) => (
      <Composition
        key={t.id}
        id={`Trade-${String(i + 1).padStart(2, "0")}`}
        component={TradeClip}
        durationInFrames={SCENES.end}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ trade: t, isSample: true }}
      />
    ))}
  </>
);
