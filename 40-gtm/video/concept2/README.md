# CivicWatch launch-week video concepts (Gantt #52)

Built with Remotion. $0 per render, no paid services used. All cuts are silent.

| File | Format | Where it runs |
|---|---|---|
| `concept2-capitol-16x9.mp4` | 1920×1080, 10s | Product Hunt gallery, Show HN, press kit |
| `concept1-presenter-9x16.mp4` | 1080×1920, 10s | Organic social launch week Oct 13–16 → /pro |
| `concept3-cast-9x16.mp4` | 1080×1920, 10s | Organic social, cast slideshow → civicwatch.app |
| `concept4-spotlight-9x16.mp4` | 1080×1920, 18s | Organic social, spotlight room → civicwatch.app |
| `concept4-spotlight-16x9.mp4` | 1920×1080, 18s | Press kit, Product Hunt gallery, YouTube |

## Re-rendering

```bash
npm install
npx remotion render src/index.ts Concept1 out/concept1-presenter-9x16.mp4
npx remotion render src/index.ts Concept2 out/concept2-capitol-16x9.mp4
npx remotion render src/index.ts Concept3 out/concept3-cast-9x16.mp4
npx remotion render src/index.ts Concept4 out/concept4-spotlight-9x16.mp4
npx remotion render src/index.ts Concept4Wide out/concept4-spotlight-16x9.mp4
```

## Concept 3 — the cast slideshow

Three presenters, one beat of the argument each, then the end card.
Cast used: `cast-black-man`, `cast-latina-woman-40s`, `cast-young-adult`
(widest demographic spread and three visibly different settings). To swap one,
change the `src` in `src/Concept3.tsx` and re-crop with the snippet in
"Portrait crops" below.

The lower-third reads **"AI presenters"** (plural) on this cut, since three faces
appear. Concept 1 keeps the singular wording from the media plan.

### Portrait crops

Each portrait is pre-cropped to the top 88% of the source image so the shield
lapel pin stays in frame; the card is sized to that aspect and the image is drawn
with `objectFit: fill`, so nothing re-crops it at render time. Do not add a zoom
to these cards — a zoom crops the pin out.

```python
from PIL import Image
im = Image.open("public/cast-N.jpg")
im.crop((0, 0, im.width, int(im.height * 0.88))).save("public/cast-N-crop.jpg", quality=95)
```

## Concept 4 — the spotlight room

All three presenters stand in one dark room. A spotlight raises on each in turn
and falls as their line arrives at the bottom; at the end all three are lit, the
closing panel fades in over them, then fades out.

The three portraits were generated in different rooms (brick wall, kitchen,
desk), so each figure is matted out of its original background and composited
onto a shared stage. `public/fig-1..3.png` are those cutouts — figures only,
normalized to a common height, with the lower body faded into darkness because
the source frames cut the shoulders flat at the image edge.

Regenerate the cutouts (free, runs locally, no paid service):

```bash
pip install rembg onnxruntime      # downloads a ~176MB model once
```
```python
from rembg import remove, new_session
from PIL import Image
s = new_session("u2net_human_seg")
remove(Image.open("cast-N.jpg"), session=s, post_process_mask=True).save("fig-N.png")
# then: keep the largest alpha blob, crop to the figure, scale to a common
# height, and ramp alpha to 0 between 58% and 97% of the height
```

Both framings come from the same component, which reads `useVideoConfig()` and
branches on aspect. Portrait has no room for a three-wide lineup, so the camera
pushes in on each presenter and pulls back for the reveal. Landscape holds the
whole room — all three are visible throughout and the spotlight does the work,
with the camera drifting gently toward whoever is lit. Captions are left-aligned
in portrait and centred in landscape.

The closing splash fades in at frame 444 and holds to the final frame; the room
dims to 22% beneath it rather than going black.

The camera is a single transform on a shared stage in `src/Concept4.tsx`;
`FIGS` holds each figure's stage position and line, and `BEAT` their spotlight
timings. Lighting is a `brightness()` filter driven by `lightFor()`, not baked
into the images, so retiming needs no re-export.

Note: the closing panel's dark veil is absolutely positioned, so the panel
content carries `position: relative` to paint above it. Without that the type
renders underneath the veil and looks washed out.

## Labeling rules applied

- Concepts 1, 3 and 4 carry the persistent AI lower-third for the full 10 seconds,
  positioned clear of the platform UI zone. Do not remove it.
- Set the platform AI-content flag on upload for Concepts 1, 3 and 4.
- Concept 2 contains no presenter, so no AI lower-third is required.
- The presenters narrate only. None is shown as a user, none gives a testimonial,
  and none is given a name — these are AI-generated faces, not real people.
- Every presenter wears the real shield lapel pin, visible in frame.

## Content provenance

- Every screenshot is a real CivicWatch page, cropped from
  `40-gtm/producthunt/gallery/`. No mockups, no invented members, no sample scores.
- The conflict-score crop shows "None flagged" and no member name, and Concepts 1
  and 2 carry the line "An analytical indicator, not proof of wrongdoing."
- 13,100+ verified 2026-10-08 against `https://civicwatch.app/api/stats`
  (`trades: 13117`). The "5,000+" on the home page is the pre-fetch placeholder
  in `app/page.js`, not the real figure.
- 535 members confirmed by the same endpoint (`representatives: 535`).
- Capitol photo is `public/og-capitol.jpg` from the site, cropped to remove the
  baked-in OG text.

## Not included

- No audio on any cut. Narration is on-screen captions.
- No lip-sync. Presenters are stills, since generated video and text-to-speech
  both cost money.
