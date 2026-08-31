# Design System: CivicWatch — Federal Intelligence Terminal

## 1. Visual Theme & Atmosphere

A precision accountability platform where civic data meets editorial gravitas. The aesthetic sits between a Bloomberg terminal and a premium investigative journalism interface — deeply functional, authoritative, and purposefully restrained. Near-black surfaces with a single warm amber accent communicate authority and urgency without resorting to neon gimmicks. This is where democracy happens in high definition.

- **Density:** 6/10 — "Data-rich but breathable." Cards have generous internal padding; the grid breathes. Information hierarchy is earned through spacing and weight, not cramming.
- **Variance:** 6/10 — Asymmetric layout decisions (left-rail nav, split content areas) without visual chaos. Structure over decoration.
- **Motion:** 4/10 — Precise, purposeful. Hover states reveal depth. No theatrical entrance animations. Data loads with skeletal shimmer. State transitions: 150ms ease.

---

## 2. Color Palette & Roles

- **Void Black** (#0A0A0B) — Primary canvas background. Off-black with a barely-warm undertone.
- **Surface Ink** (#111113) — Card and panel fill. 1 step lighter than canvas.
- **Elevated Surface** (#1A1A1E) — Hover/active card state. Secondary panels.
- **Deep Divide** (#222226) — Subtle section separators, inactive tabs.
- **Whisper Border** (rgba(255,255,255,0.07)) — Default 1px card/panel borders.
- **Active Border** (rgba(255,255,255,0.14)) — Hover/focus borders.
- **Primary Text** (#F4F4F5) — Zinc-100. Body copy, card titles.
- **Secondary Text** (#A1A1AA) — Zinc-400. Subtitles, metadata, descriptions.
- **Muted Text** (#52525B) — Zinc-600. Labels, disabled states, timestamps.
- **Gold Accountability** (#C8922A) — THE single accent. CTAs, active nav states, the "WATCH" logotype, focus rings, alert badges.
- **Amber Dim** (rgba(200,146,42,0.12)) — Accent tint for backgrounds (active nav item bg, highlighted rows).
- **Democrat Signal** (#3B82F6) — Left-border accent on Democrat rep cards. Party badge fill.
- **Republican Signal** (#EF4444) — Left-border accent on Republican rep cards. Party badge fill.
- **Independent Signal** (#8B5CF6) — Left-border accent on Independent rep cards.

No purple/neon. No gradients on buttons. No warm/cool gray mixing — all neutral grays are Zinc-family only.

---

## 3. Typography Rules

- **Display / Page Titles:** `Geist` or `Outfit` — Weight 700–800. Letter-spacing -0.02em. Used for page headers, section titles. Size scale: 28px / 22px / 18px.
- **Logo Mark:** ALL CAPS. "CIVIC" in Primary Text (#F4F4F5), "WATCH" in Gold Accountability (#C8922A). Font-size 13px, letter-spacing 0.15em, weight 700.
- **Body / Card Content:** `Geist` — Weight 400–500. Line-height 1.6. Size 14px–15px. Color: Secondary Text for descriptions, Primary Text for key data.
- **Monospace / Data:** `Geist Mono` or `JetBrains Mono` — All vote counts, trade counts, dollar amounts, dates, conflict scores, and timestamps MUST use monospace. Weight 500. This is non-negotiable.
- **Labels / Eyebrows:** 11px, weight 500, letter-spacing 0.06em, ALL CAPS, Muted Text (#52525B). Used above section headers.
- **Party Badges:** 11px, weight 600, monospace, ALL CAPS. 4px rounded. White text on party signal color.

**Banned:** Inter font. Georgia, Times New Roman, or any generic serif. Gradient text on any element larger than 24px.

---

## 4. Component Stylings

### Navigation (Left Sidebar — 240px)
- Background: Surface Ink (#111113). Right border: 1px Whisper Border.
- Logo at top: 64px height zone, vertically centered.
- Nav items: 40px height, 16px horizontal padding. Icon (20px) + Label side by side.
- Inactive: Muted Text (#52525B) label, zinc-600 icon.
- Hover: bg rgba(255,255,255,0.04), Primary Text label.
- Active: bg Amber Dim (rgba(200,146,42,0.12)), Gold Accountability text, 2px solid gold left-border inset.
- Bottom zone: User avatar + name + "Upgrade to Pro" pill button.
- "Upgrade" button: 100% width, amber border only (ghost variant), amber text. On hover: amber fill, black text. Transition 150ms.

### Top Bar
- Height: 48px. Full width above main content (to right of sidebar). Background: transparent, border-bottom Whisper Border.
- Left: Page title (22px, weight 700).
- Right: search icon, notification bell with unread dot, user avatar.

### Filter Pills (Level + Party selectors)
- Pill shape: 6px radius. Height: 32px. Horizontal padding: 14px.
- Inactive: border 1px Whisper Border, Muted Text label, transparent bg.
- Active: bg Amber Dim, Gold Accountability text, border-color rgba(200,146,42,0.4).
- Hover (inactive): border Active Border, Secondary Text.
- No dropdowns — inline pill group only.

### Representative Cards
- Dimensions: Full width, 80px min-height.
- Background: Surface Ink (#111113). Border: 1px Whisper Border.
- Left accent border: 3px solid [party signal color]. This replaces all party emoji.
- Radius: 6px. Padding: 16px 20px.
- Layout: [Party bar] | [Avatar 36px circle] | [Name + Role stack] | [State/District badge] | [...flex spacer...] | [Stats row in mono] | [Tracked toggle]
- Hover: bg Elevated Surface (#1A1A1E), border Active Border. Transition 150ms ease.
- Name: 15px, weight 600, Primary Text.
- Role title: 13px, weight 400, Secondary Text (#A1A1AA).
- Stats (Votes, Trades): monospace, 13px weight 600. Label: 10px uppercase muted.
- "STOCK Act" alert: Small amber badge — "ACTIVE FILING" in 10px mono caps when trades exist.
- No circular spinner loaders. Skeleton shimmer matching card dimensions.

### Primary CTA Button
- Background: Gold Accountability (#C8922A). Text: #0A0A0B (void black). Weight 700. 14px.
- Height: 40px. Radius: 6px. Horizontal padding: 20px.
- Hover: brightness(1.1). Active: translateY(1px). Transition 120ms ease.
- No gradient. No outer glow. No neon. No border-radius > 8px.

### Ghost/Secondary Button
- Border: 1px solid rgba(200,146,42,0.5). Text: Gold Accountability. Transparent bg.
- Hover: bg Amber Dim. Active: translateY(1px).

### Data Inputs / Search
- Height: 38px. Border: 1px Whisper Border. Background: Surface Ink.
- Radius: 6px. Padding: 0 12px. Placeholder: Muted Text.
- Focus: border Gold Accountability, box-shadow 0 0 0 2px rgba(200,146,42,0.2).
- No floating labels. Label above if needed (12px, muted, uppercase).

### Conflict Score Indicator
- Circular gauge badge. Score 0–100.
- 0–30: zinc-500 (low risk). 31–60: amber (moderate). 61–100: #EF4444 (high conflict).
- Displayed as monospace number with small gauge arc around it.
- Never fabricate a score — only render if real data is available.

### Loading / Skeleton States
- Shimmer animation: bg-gradient sweeping left to right across placeholder shapes.
- Shimmer colors: from rgba(255,255,255,0.04) to rgba(255,255,255,0.08) and back.
- Skeleton shapes MUST match the exact layout dimensions of the content they replace.
- No circular spinners. Never use a generic loading indicator.

### Empty States
- Centered in content area. Icon (24px, zinc-600) + primary message (16px weight 600) + helper text (14px secondary) + CTA button.
- "Find your representatives" empty state: Address input prominently placed, not buried.

---

## 5. Layout Principles

- **Left sidebar navigation:** Fixed 240px left rail. Main content scrolls independently. Never collapse the sidebar below 1024px — instead implement a 64px icon-only collapsed mode.
- **Content max-width:** 1400px centered within main area.
- **Grid for rep cards:** CSS Grid. Single column on mobile. Two-column on ≥1200px for dense layouts. Never three equal columns.
- **Section anatomy:** Eyebrow label (uppercase 11px muted) → Section title → Content. No cards stacked in equal-sized 3-column rows.
- **Filter bar:** Sticky below top bar. Blurs content beneath via `backdrop-blur` with a 1px bottom border.
- **Spatial separation:** Every element occupies its own clean zone. No overlapping positioned elements. No `z-index` stacking hacks.
- **Full-height container:** `min-h-[100dvh]`. Never `h-screen`.
- **Overflow:** `overflow-hidden` on root, `overflow-y-auto` on content areas only. No horizontal overflow at any viewport.

---

## 6. Motion & Interaction

- **Default spring:** stiffness 100, damping 20. Used for any panel slide/reveal.
- **Micro-transitions:** 150ms ease for hover state changes (bg, border, text color). 120ms ease for button active states.
- **Card reveal on load:** Staggered cascade — each card mounts with a 40ms delay per item. Opacity 0 → 1, translateY(4px) → 0.
- **Skeleton shimmer:** Perpetual loop — keyframe animation sweeping gradient across placeholder shapes. Cancels on data load.
- **Tracked toggle:** Spring-physics toggle: icon rotates 180° on state change (150ms spring).
- **Filter pill transitions:** Active indicator slides between pills via layout animation (not just color swap).
- **Never animate:** `top`, `left`, `width`, `height`. Only `transform` and `opacity`. No grain/noise on interactive elements.
- **No autoplay carousels, no scroll-jacking, no parallax.**

---

## 7. Anti-Patterns (Banned)

- **No emojis.** Anywhere. In any context. Replace with precise inline SVG icons.
- **No Inter font.** Use Geist, Outfit, or Cabinet Grotesk.
- **No pure black (#000000).** Use Void Black (#0A0A0B) or Surface Ink (#111113).
- **No neon outer glows.** No `box-shadow: 0 0 20px rgba(200,146,42,0.8)` — diffused shadows only.
- **No gradient buttons.** The red-to-purple gradient CTA is deleted. Solid amber fill only.
- **No centered onboarding modals** blocking the dashboard. Onboarding belongs in a right-side panel or inline empty state.
- **No 3-column equal card grids.** Use asymmetric layouts, 2-column zig-zag, or single full-width rows.
- **No generic placeholder names** ("John Doe", "Acme Corp", "Nexus").
- **No fabricated statistics.** Never invent uptime percentages, response times, or performance metrics. Use `[metric]` as placeholder if real data isn't available.
- **No `LABEL // YEAR` typography conventions.** ("SYSTEM // 2024" is an AI cliché, not design.)
- **No AI copywriting clichés.** "Elevate", "Seamless", "Unleash", "Next-Gen", "Supercharge" are banned.
- **No filler scroll cues.** No "Scroll to explore", bouncing chevrons, or scroll arrow icons.
- **No broken Unsplash links.** Use `picsum.photos` or SVG avatars for rep photos.
- **No custom mouse cursors.**
- **No oversaturated accent colors.** Gold stays below 80% saturation.
- **No floating labels** on form inputs.
