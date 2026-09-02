# CivicWatch Clips

Vertical (1080×1920) social videos rendered from congressional trade data.
Built with [Remotion](https://remotion.dev): video is React, rendered locally.

**Why not AI video generation.** Viewmax and Runway charge credits per render
and you have none. More importantly they make generic B-roll — they cannot
render "bought $250K of NVDA twelve days before the vote" as a data card. The
asset here is the *data*, not imagery. Remotion costs **$0 per clip**, forever.

## Use

```bash
npm run dev              # Remotion Studio — live preview while editing
./render-clips.sh        # render every clip to out/
./render-clips.sh Trade-02
```

First render downloads a ~100MB headless shell, once. After that a 13-second
clip renders in about 25 seconds.

## ⚠️ Before rendering anything real

**This content names real people and makes claims about their finances.**

`src/data/trades.sample.json` is fabricated. Clips built from it render with a
large **SAMPLE DATA** watermark so they cannot be posted by mistake — that is
deliberate, not decoration.

Do not point this at live data until these are done:

- **#23** — `bioguide_id` is broken on all 5,076 `fd_trades` rows. That is the
  field mapping a trade to *a specific member of Congress*. Publishing with it
  broken means attributing a real trade to the wrong person.
- **#24** — 27 future-dated trades
- **#25** — the ingest date parser is broken, so "N days before" arithmetic
  cannot currently be trusted

One video naming the wrong senator, screenshotted, does more damage than a
hundred videos never posted.

## Going live

1. Land #23, #24, #25
2. Add a query that pulls the most striking real trades from Supabase into the
   same shape as `trades.sample.json`
3. Render with `isSample: false` to drop the watermark
4. **Review each clip against the source disclosure before posting.** Keep the
   human in the loop; the review is the feature, not the friction.

## Structure

| File | Does |
|---|---|
| `src/Root.tsx` | one composition per trade in the data file |
| `src/TradeClip.tsx` | the four scenes: hook → card → timing → CTA |
| `src/theme.ts` | design tokens, money/date formatting, the `Trade` type |
| `src/SampleWatermark.tsx` | the guard against posting fabricated data |
| `render-clips.sh` | batch render |

## Design notes

Tokens come from ui-ux-pro-max ("Dark Mode (OLED)" + financial data): near-black
background, white text, blue accent, Inter. Two deliberate decisions:

- The generated palette proposed pink as primary. Wrong for a civic product;
  blue accent kept instead.
- Party colours are a **separate scale** from BUY/SELL. US party colours are
  already red and blue, so reusing them for trade direction would make colour
  ambiguous. Direction is always carried by a word and a glyph (▲ BOUGHT /
  ▼ SOLD), never by colour alone.

Content sits in the middle third of the frame, because TikTok and Reels overlay
their own UI top and bottom.
