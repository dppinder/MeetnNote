---
name: Warm Editorial Executive Notepad
colors:
  surface: '#141315'
  surface-dim: '#141315'
  surface-bright: '#3a393b'
  surface-container-lowest: '#0f0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2b292c'
  surface-container-highest: '#363436'
  on-surface: '#e6e1e4'
  on-surface-variant: '#d5c4b3'
  inverse-surface: '#e6e1e4'
  inverse-on-surface: '#313032'
  outline: '#9d8e7f'
  outline-variant: '#504538'
  surface-tint: '#f9bb6d'
  primary: '#ffc680'
  on-primary: '#472a00'
  primary-container: '#e5a95d'
  on-primary-container: '#643e00'
  inverse-primary: '#83540e'
  secondary: '#a6d1af'
  on-secondary: '#10371f'
  secondary-container: '#284f34'
  on-secondary-container: '#95bf9e'
  tertiary: '#a7d5ff'
  on-tertiary: '#003351'
  tertiary-container: '#84bae9'
  on-tertiary-container: '#004a72'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb7'
  primary-fixed-dim: '#f9bb6d'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#c1edca'
  secondary-fixed-dim: '#a6d1af'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#284f34'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#96ccfc'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#141315'
  on-background: '#e6e1e4'
  surface-variant: '#363436'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 30px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the calm, discreet intelligence of an executive notepad paired with subtle, ambient AI enrichment. It targets founders, product leaders, researchers, and senior professionals who spend their days listening and synthesizing rather than configuring dashboards.

The visual narrative blends the stillness of traditional book typography with the razor-sharp precision of high-end productivity software. Rather than treating artificial intelligence as a flashy, luminous chatbot, the UI treats AI as an invisible editor that cleans up unstructured thoughts into quiet prose. The aesthetic is anchored in warm minimalism: deep espresso undertones instead of cold developer dark-modes, tactile paper-like surface transitions, natural cream typography, and intentional editorial whitespace.

## Colors

The palette is built around an organic, nocturnal library ambiance:
- **Base Canvas (`#111012`)**: A warm obsidian base infused with espresso tones to prevent optical fatigue.
- **Surface Elevated (`#1a191d`)**: Subtle lifted container background resembling charcoal card stock.
- **Surface Hover / Highlight (`#222026`)**: Interactive state background for rows, chips, and quiet controls.
- **Primary Accent (`#e5a95d`)**: A muted honey amber reserved for synthesized AI takeaways, active audio playheads, and focal states.
- **Secondary Accent (`#8eb897`)**: A soft sage wash used for completed states, attendee presence, and affirmative confirmations.
- **Text Dominant (`#f5f3ef`)**: Off-white cream that softens contrast against the dark substrate.
- **Text Muted (`#8e8c89`)**: Quiet warm stone for timestamps, secondary metadata, and original raw transcripts.
- **Borders & Dividers (`#27252a`)**: Ultra-thin hairline strokes providing structural separation without visual obstruction.

## Typography

Typography relies on a deliberate balance between Newsreader (classical editorial authority) and Inter (neutral, modern utility):
- **Newsreader** handles document titles, meeting designations, AI-generated summary overviews, and quote highlights. Its optical sizing conveys human authorship and literary calm.
- **Inter** supports long-form note entry, action items, system UI, timecode indicators, and transcript views.
- Line heights are deliberately generous (up to 1.65x on body text) to invite long reading sessions and calm scanning.

## Layout & Spacing

The canvas is structured around a focused dual-pane workflow:
- **Desktop (>= 1200px)**: A centered master document canvas with an optimal max reading width of 760px, flanked by an optional collapsible left rail for meeting history (280px) and an optional right slide-over for synchronized audio transcripts (340px). Section gutters remain fixed at `1.5rem`.
- **Tablet (768px – 1199px)**: Full single-column document view with drawer toggles for transcripts and AI summaries. Margin compresses to `1.5rem`.
- **Mobile (< 768px)**: Stacked single-column experience with bottom-sheet controls for audio scrubbers and drawer-based AI synthesis tabs. Gutter reduces to `1rem`, outer margins to `1rem`.

Vertical flow maintains breathing room: document headers use `space-xl` separation, while related notes cluster tightly with `space-sm`.

## Elevation & Depth

Visual hierarchy uses flat tonal layering paired with razor-thin containment rather than heavy dropshadows:
- **Base Level (`#111012`)**: The foundational desktop workspace background.
- **Card & Editor Panels (`#1a191d`)**: Elevated containers isolated via a solid `1px` border using `#27252a`.
- **Floating Overlays & Menus (`#222026`)**: High-order dropdowns and scrubber bars feature an ultra-diffused shadow (`0 12px 32px rgba(0, 0, 0, 0.45)`) bound by an internal hairline border of `#343238` to retain sharp geometric boundaries against the background.
- **No Heavy Glass Blurs**: Frosted effects are restricted solely to the persistent mini audio bar when anchored over scrolling text (`backdrop-filter: blur(16px)` with 85% opacity of `#1a191d`).

## Shapes

The design uses balanced rounded geometry:
- Default components (action cards, dropdown panels, text inputs) use `0.5rem` (`rounded-md`).
- Primary modal dialogs and the floating audio scrubber use `1rem` (`rounded-lg`).
- Interactive pills, tags, audio toggles, and attendee badges strictly use fully circular caps (`rounded-full` / `9999px`) to contrast against the rectangular document sheet.

## Components

### Action Checkboxes
- **Unchecked**: Subtle `16px` square, `4px` rounded corners, border `1px` solid `#3d3b42`, transparent background.
- **Checked**: Smooth fill transition to `#8eb897` with an embedded `#111012` micro-checkmark. Accompanying label adopts `#8e8c89` with a delicate strikethrough.

### Buttons & Pills
- **Primary Pill**: `#f5f3ef` background with `#111012` bold text for immediate actions (e.g., "Share Note", "Enhance with AI").
- **Subtle Pill**: Border `1px` solid `#27252a`, background transparent, text `#f5f3ef`. Hover induces `#1a191d` background with `#e5a95d` border highlight.
- **AI Indicator Tag**: Compact `20px` height pill, background `rgba(229, 169, 93, 0.12)`, border `1px` solid `rgba(229, 169, 93, 0.3)`, text `#e5a95d` in `label-sm`.

### Audio Scrubber Bar
- **Track**: `3px` height `#27252a` rounded rail.
- **Buffer/Progress**: `#e5a95d` fill line.
- **Scrubber Knob**: `12px` solid `#f5f3ef` circle with gentle hover expansion to `14px`.
- **Timestamp**: Monospace-adjusted `label-sm` in `#8e8c89`.

### Note Lists & Human/AI Duality
- **Human Bullet**: Standard soft cream text (`#f5f3ef`) with `#8e8c89` circular disc bullet.
- **AI Synthesis Block**: Embedded inline with a subtle left accent line (`2px` solid `rgba(229, 169, 93, 0.4)`), indented by `space-md`, featuring slightly muted italicized lead text and clean summary bullet clusters.

### Input Fields & Title Editors
- Seamless, zero-border inline editing for the title (`Newsreader` headline scale), showing only a subtle `#3d3b42` bottom indicator line during active focus.