# BodyOS — Web Frontend Specification

**Version**: 2.1
**Date**: 2026-02-12
**Platform**: React 19 + Vite 6 + TypeScript 5.9
**Media directory**: `/Users/neo/Neo/gymcam/front-end/media`

---

## 1. Product Definition

BodyOS is a personal body intelligence system.

It sits at the intersection of movement science, computer vision, and coaching intelligence. Its foundations include fascial continuity and movement chain thinking (Thomas Myers' Anatomy Trains), functional movement screening principles (Gray Cook's FMS methodology), and tensegrity-based body architecture — the understanding that the body is a unified tension network, not isolated muscle groups.

BodyOS doesn't just score a squat. It understands that a shoulder imbalance affects hip loading, that ankle mobility governs knee tracking, and that yesterday's training stress shapes today's movement quality.

### Core Pillars

**SEE** — Analyze body and movement through computer vision and structured observation.  
**LEARN** — Remember the user's longitudinal data: body checkpoints, workout history, movement patterns, coaching conversations.  
**GROW** — Guide training decisions and behavior over time with contextual intelligence.

### Product Promise

> "Your body. Optimized."

> "A world-class coach that remembers your body, sessions, and context."

### Web Platform Role

The mobile app is the primary product — real-time camera analysis, live workout filming, on-the-go coaching. The web platform is the **command center complement**:

- **Retrospective analysis hub** — review recorded sessions, browse frame-by-frame pose data
- **Progress dashboard** — track posture evolution, movement trends, body checkpoints over time
- **Coach interface** — AI conversations with full context, workout plan management
- **Data visualization** — charts, body blueprints, comparative timelines, training analytics

Features that are mobile-native (body scan photo capture, live form analysis, workout filming) surface on web as elegant **coming soon** states that direct users to the mobile app.

---

## 2. Theme and Experience DNA

### Visual Direction

- Dark-only, calm, premium, engineered
- Blueprint/system-intelligence aesthetic — not flashy sci-fi, not clinical medical
- Soft depth, subtle gradients, restrained glow
- Performance-athlete tone: elite training facility control room, not hospital dashboard

### What This Is

- A calm intelligence layer over the body
- Precision instrumentation with warmth
- The feeling of having a brilliant coach who knows your history and speaks quietly

### What This Is Not

- Not a medical HUD. No clinical/hospital language, no "diagnosis" framing.
- Not a neon sci-fi game UI. No aggressive glow, no pulsing effects.
- Not a generic fitness app. No stock-photo energy, no "crush it" copy.

---

## 3. Design System

### 3.1 Color Palette

```
BACKGROUNDS
  primary:     #0E0F12     Main canvas
  secondary:   #15171C     Elevated surfaces, sidebar
  tertiary:    #1C1E26     Cards, panels
  overlay:     #1A1D27     Modals, dropdowns

ACCENTS
  primary:     #5B7CFA     Blue-purple — buttons, links, active states
  secondary:   #4ECDC4     Teal — positive/success accent, body score highlights
  brand amber: #D4A574     Logo gold — achievement badges, premium moments, logo lockups only

SEMANTIC
  success:     #4ECDC4     Form score ≥85, positive states
  warning:     #F5A623     Form score 60-84, caution states
  error:       #E74C3C     Form score <60, destructive actions
  info:        #5AC8FA     Informational highlights

TEXT
  primary:     #E6E8EC     High contrast body text
  secondary:   #9CA3AF     Muted labels, descriptions
  tertiary:    #6B7280     Dim metadata, timestamps
  disabled:    #3E4A5C     Disabled controls
  inverse:     #0E0F12     Text on light backgrounds

BORDERS
  subtle:      rgba(91, 124, 250, 0.10)
  default:     rgba(91, 124, 250, 0.18)
  strong:      rgba(91, 124, 250, 0.30)
```

### Quick Action Card Tints

From the mobile app, quick action cards use subtle colored background tints:

```
Body Scan:   rgba(78, 205, 196, 0.12)    Teal tint
Record:      rgba(231, 76, 60, 0.10)     Warm/rose tint
Ask Coach:   rgba(91, 124, 250, 0.12)    Blue tint
```

### Glass Effects

```
background:  rgba(21, 23, 28, 0.75)
blur:        backdrop-filter: blur(12px)
border:      rgba(91, 124, 250, 0.12)
```

### Gradients

```
accentPrimary:  linear-gradient(135deg, #5B7CFA 0%, #4ECDC4 100%)
darkOverlay:    linear-gradient(180deg, rgba(14,15,18,0) 0%, rgba(14,15,18,0.9) 100%)
shimmer:        linear-gradient(90deg, transparent, rgba(230,232,236,0.08), transparent)
cardSubtle:     linear-gradient(145deg, #15171C 0%, #1C1E26 100%)
```

### Shadows

```
sm:         0 1px 2px 0 rgba(0, 0, 0, 0.25)
md:         0 4px 12px 0 rgba(0, 0, 0, 0.35)
lg:         0 8px 24px 0 rgba(0, 0, 0, 0.45)
glow:       0 0 20px 0 rgba(91, 124, 250, 0.25)
tealGlow:   0 0 20px 0 rgba(78, 205, 196, 0.20)
```

### 3.2 Typography

**Font Stack**:
- `Inter` — all body text, labels, descriptions, navigation
- `JetBrains Mono` — numeric readouts, scores, metrics, timestamps, data values
- `Space Grotesk` — page titles, section headers, hero text

```
Font loading:
  Inter:          400, 500, 600, 700
  JetBrains Mono: 400, 500
  Space Grotesk:  600, 700
```

**Type Scale**:

```
xs:    12px     timestamps, badges
sm:    14px     secondary text, labels
base:  16px     body text
lg:    18px     emphasized body
xl:    20px     section headers
2xl:   24px     card titles
3xl:   30px     page subtitles
4xl:   36px     page titles
5xl:   48px     hero numbers (scores)
6xl:   60px     landing hero
```

**Letter Spacing**:
- Headlines: `-0.02em`
- Body: `0`
- Uppercase labels/badges: `0.05em` to `0.1em`

### 3.3 Spacing, Radius, Breakpoints

Spacing follows Tailwind's 4px base scale. Use standard utility classes.

**Border Radius**:

```
sm:    4px      badges, small elements
base:  8px      inputs, small cards
md:    12px     standard cards
lg:    16px     large cards, panels
xl:    24px     hero cards
full:  9999px   pills, avatars
```

**Breakpoints**:

```
sm:    640px
md:    768px
lg:    1024px
xl:    1280px
xxl:   1536px
```

### 3.4 Tailwind CSS v4 Configuration

Tailwind CSS v4 uses **CSS-first configuration**. There is no `tailwind.config.ts` file. All design tokens are defined via `@theme` in the main CSS entry file.

**Vite plugin** (not PostCSS):
```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
});
```

**CSS entry file** (`src/index.css`):
```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0E0F12;
  --color-bg-secondary: #15171C;
  --color-bg-tertiary: #1C1E26;
  --color-accent-primary: #5B7CFA;
  --color-accent-secondary: #4ECDC4;
  --color-brand-amber: #D4A574;
  --color-success: #4ECDC4;
  --color-warning: #F5A623;
  --color-error: #E74C3C;
  --color-info: #5AC8FA;
  --color-text-primary: #E6E8EC;
  --color-text-secondary: #9CA3AF;
  --color-text-tertiary: #6B7280;
  /* ...remaining tokens from Section 3.1 */

  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --font-display: "Space Grotesk", sans-serif;
}
```

Content detection is **automatic** — Tailwind v4 scans all template files by heuristic. No `content` array needed. Files in `.gitignore` are automatically excluded.

**Key v4 migration notes**:
- `@tailwind base/components/utilities` → `@import "tailwindcss"`
- `ring` utility default changed from 3px to 1px (use `ring-3` for old behavior)
- `outline-none` renamed to `outline-hidden`
- Custom utilities use `@utility` directive (not `@layer utilities`)

---

## 4. Technical Stack

```
React 19.x            UI library (19.2+)
Vite 6.x              Build tool & dev server (with @tailwindcss/vite plugin)
TypeScript ~5.9       Type safety
React Router 7        Client-side routing (library mode — not framework mode)
TanStack Query 5      Server state management (@tanstack/react-query)
Zustand 5             Client state management
Motion 12+            Animation library (formerly Framer Motion; import from "motion/react")
Recharts 3            Data visualization (v3 — improved a11y defaults, no react-smooth dep)
Lucide React          Icon library (20px default, 16px small, 24px large)
date-fns 4            Date utilities (v4 — first-class timezone support)
Tailwind CSS 4        Utility-first styling (CSS-first config via @theme, NOT tailwind.config.ts)
Sonner 2              Toast notifications (theme="dark")
Supabase JS 2         Auth + Database + Storage + Edge Functions + Realtime
```

**Deploy**: Vercel (auto HTTPS, CDN, preview deployments on PR).

### Version Rationale

| Library | Spec Version | Why Not Higher/Lower |
|---------|-------------|---------------------|
| React | 19.x | 19 stable since Dec 2024. React 18 is legacy. |
| Vite | 6.x | Vite 7 (Jan 2026) is current but still maturing. Vite 6 is the stable conservative choice with full ecosystem support. Upgrade to 7 when Vitest 3.2+ and plugin ecosystem catch up. |
| React Router | 7 (library mode) | v7 stable. Library mode = same SPA patterns as v6 but consolidated `react-router` package. Framework mode not needed (no SSR). |
| Tailwind CSS | 4 | v4 uses CSS-first config (`@theme` in CSS, not `tailwind.config.ts`). Auto content detection. `@tailwindcss/vite` plugin replaces PostCSS setup. |
| Motion | 12+ | Rebranded from `framer-motion` to `motion` (Nov 2024). Import: `"motion/react"`. Both packages identical — `motion` is the forward path. |
| TypeScript | ~5.9 | 5.9.3 is latest stable. TS 6.0 in beta (Feb 2026) — wait for stable. |

### Dual Mode Architecture

The app supports two runtime modes — this is a core product behavior, not a dev convenience:

- **Demo mode**: fully offline, seeded sample data, no auth required. Used for product demos, onboarding exploration, and QA.
- **Real mode**: authenticated via Supabase, live data, persistent state.

Every data-fetching path resolves through an adapter layer that returns demo or real implementations based on the active mode. This is documented in `BODYOS_DATA_REFERENCE.md`.

---

## 5. Route Map

### Public

| Route | Purpose |
|-------|---------|
| `/` | Landing — product narrative, value prop, CTAs |
| `/auth` | Sign in / sign up |

### App (authenticated or demo session)

| Route | Page |
|-------|------|
| `/app/home` | Daily command center |
| `/app/body-intelligence` | Checkpoint list + new scan CTA |
| `/app/body-intelligence/:id` | Checkpoint detail — scores, focus areas, photos |
| `/app/sessions` | Recorded session browser (web-enriched) |
| `/app/sessions/:id` | Session replay — video + skeleton overlay + analysis |
| `/app/coach` | AI coaching chat |
| `/app/workouts` | Workout plan overview |
| `/app/workouts/:planId` | Plan detail with day cards |
| `/app/workout-session/:dayId` | Active session logger — sets, reps, RPE, rest timer |
| `/app/exercises/:exerciseId` | Exercise detail — cues, demo video |
| `/app/progress` | Timeline + photos + trend charts |
| `/app/progress/compare` | Side-by-side photo comparison |
| `/app/profile` | Stats, identity, streak |
| `/app/settings` | Preferences, account, mode toggle |
| `/app/achievements` | Badge collection |
| `/app/whatsapp` | WhatsApp coaching bridge (coming soon) |

---

## 6. Layout System

### AppShell

Root layout: fixed sidebar left + scrollable main content.

- Sidebar: 260px wide, `background.secondary`, subtle gradient to `background.primary` at bottom
- Main content: flexible width, scrollable, max-width 1440px centered on wide screens
- Mobile: sidebar collapses to hamburger. Bottom nav bar mirrors mobile tab order: Home → Scan → Camera (center) → Coach → Profile

### Sidebar

Structure top to bottom:

1. **Logo** — `grey-logo-cropped-square3.png`
2. **User mini-profile** — avatar, name, streak count
3. **Nav sections** with grouped items:

```
Overview
  Home
  Sessions
  Progress

Body
  Body Intelligence
  Workouts
  Exercises

Intelligence
  Coach
  Achievements
  WhatsApp

Settings (bottom)
Mode badge ("Demo" or "Live")
```

**Active item**: `accent.primary` left border + text, subtle glow background.  
**Inactive**: `text.tertiary` icon + text. `background.tertiary` on hover.

### PageContainer

Standard page wrapper applied to every app route:

- **Title**: `Space Grotesk`, text-3xl, bold, `text.primary`
- **Subtitle**: `Inter`, text-sm, `text.secondary`
- **Breadcrumbs**: text-xs, `text.tertiary`, separated by `/`
- **Action slot**: top-right button area
- **Padding**: 32px desktop, 16px mobile

---

## 7. Component Library

### 7.1 Design Rules

- Glassmorphism only on GlassCard and Modal — nowhere else
- Blur effects limited to those two components (performance)
- All motion under 300ms except persistent live indicators
- Skeleton shimmer loading for all async content
- WCAG 2.1 AA contrast on all text
- Full keyboard navigation + ARIA labels on interactive elements

### 7.2 Core Components

**GlassCard** — primary content container. Three variants:
- `default` — standard card with glass background, subtle border, md shadow
- `elevated` — stronger shadow + faint accent glow
- `subtle` — minimal, nearly flat
- Optional `hover` prop adds translateY(-1px) + border highlight on hover

**Button** — four variants:
- `primary` — accent gradient (blue→teal), white text, glow on hover
- `secondary` — transparent, accent border + text, fills on hover
- `ghost` — transparent, `text.secondary`, subtle bg on hover
- `danger` — error red background, white text

All buttons: three sizes (sm/md/lg), loading state with spinner, disabled state at 0.5 opacity. Hover scale 1.02, active scale 0.98.

**Badge** — semantic status pill. Variants: success, warning, error, info, neutral. Rounded-full, text-xs, wide letter-spacing.

**MetricCard** — icon + label + value + optional trend. Value in `JetBrains Mono`, large and bold. Trend shows directional arrow in success/error color.

**FormScoreRing** — SVG circular progress. Score determines color (≥85 success, 60-84 warning, <60 error). Spring animation on mount. Center label in mono font.

**BodyBlueprint** — SVG skeleton visualization matching the mobile app's body status card. Base skeleton in `accent.primary` with subtle glow. Highlighted nodes in warning/error with pulse animation. Connected landmarks with 2px lines and 6px dots. Optional concentric circle background from blueprint asset.

**ChatBubble** — user messages right-aligned with accent gradient bg; assistant messages left-aligned with glass bg. Markdown rendering. Timestamp in text-xs tertiary.

**Skeleton** — shimmer loading placeholder. Gradient animation using accent color at very low opacity. Three variants: text, circular, rectangular.

**StreakBadge** — flame icon + count, matching mobile's top-right streak indicator. Uses `brand.amber` for the flame.

**QuickActionCard** — icon + label + subtitle on colored tint background. Each card gets its own tint color. Rounded-lg, padding generous, icon centered above text.

### 7.3 Form Components

- **Input** — `background.tertiary`, `border.default`, `border.strong` on focus. Label above in `text.secondary`.
- **Select** — same styling. Headless UI or Radix for accessibility.
- **Switch** — pill toggle, `accent.primary` when active.
- **DatePicker** — dark-themed, date-fns based.

### 7.4 Overlay Components

- **Modal** — dark backdrop with blur, GlassCard content, Motion scale-in animation. Max-width 600px centered.
- **Drawer** — slide-in panel (right or bottom). Same glass treatment.
- **Toast** — Sonner library, dark theme, top-right position. Success/error/info variants.

### 7.5 Data Visualization

- **LineChart** — Recharts. Transparent background, subtle grid at 0.3 opacity, 2px smooth curve in accent color, dots on hover in secondary accent. Tooltip styled as mini GlassCard.
- **HeatMap** — SVG body outline with colored overlays for area intensity.
- **ProgressPhotoGrid** — grid of checkpoint photos with date labels and comparison selection.

---

## 8. Page Specifications

### 8.1 Landing Page (`/`)

**Hero section**:
- Blueprint background (`bodyos-blueprints-landscape.jpeg`, low opacity overlay)
- Logo (`color-landscape.png`)
- Headline: "Your body. Optimized."
- Subhead: "A body intelligence system that sees how you move, learns your patterns, and guides your growth."
- Primary CTA: "Get Started" → `/auth`
- Secondary: "Try Demo" → demo mode → `/app/home`

**Value prop sections** — one for each pillar:
- SEE: movement analysis + visual
- LEARN: longitudinal tracking + checkpoint visual
- GROW: AI coaching + workout intelligence

**Philosophy teaser**: "Built on the science of movement chains, tensegrity, and decades of coaching research." Brief, not academic.

**Footer**: links, social, legal.

### 8.2 Auth (`/auth`)

Background: `bodyos-blueprints-vertical.jpeg` at low opacity. Centered GlassCard (elevated) with:
- Logo (`grey-logo-cropped-square3.png`)
- Tab toggle: Sign In / Sign Up
- Email + password fields
- OAuth buttons: Google, Apple
- "Try Demo Mode" link at bottom

### 8.3 Home (`/app/home`)

The daily command center. Matches the mobile Home tab layout:

**Top bar**: "Good morning, Athlete" greeting left. Streak flame badge with count top-right.

**Quick Actions** — horizontal row of three tinted cards:
- Body Scan (teal tint, scan icon) — "AI intelligence"
- Record (rose tint, camera icon) — "Film your set" → coming soon / mobile redirect
- Ask Coach (blue tint, chat icon) — "AI guidance"

**Today's Workout** — GlassCard with:
- Workout type icon (dumbbell in teal circle)
- Workout name ("Upper Push"), muscle groups ("Chest, Shoulders, Triceps"), exercise count in accent
- Chevron right
- Full-width "Start Workout" button (primary)
- Only shows if an active plan has a scheduled day

**Body Status** — GlassCard with:
- BodyBlueprint skeleton visualization (left)
- Score in mono font, large (e.g., "78"), "/100 Posture Score" subtitle
- Focus area count in warning color ("1 focus area detected")
- "View Details" secondary button
- Matches the mobile app's body status card exactly

**Recent Activity** — vertical list of ActivityCards:
- Icon + title + subtitle + relative timestamp
- Examples: "Upper Pull — Completed with mood: tough — 5d ago"
- Streak and achievement activity items with their own icon treatments

### 8.4 Body Intelligence (`/app/body-intelligence`)

**Hero CTA card** (elevated GlassCard):
- Headline: "Body Checkpoint"
- Description: "Capture 4 angles on mobile to get your full body analysis."
- CTA button: "Open Mobile App" (with smartphone icon)
- Web cannot capture photos — this is a deliberate redirect

**Checkpoint Timeline** — vertical list of CheckpointCards:
- 4 photo thumbnails in mini-grid (anterior, posterior, lateral L/R)
- Date, score badge, status badge (completed/processing/failed)
- Focus area count
- Click → detail view

#### Checkpoint Detail (`/app/body-intelligence/:id`)

Two-column layout on desktop, stacked on mobile:

**Left column**: BodyBlueprint at large size with highlighted focus nodes and pose landmarks.

**Right column** (stacked GlassCards):
1. Overall score with FormScoreRing
2. Focus Areas list — icon (warning/error by severity) + name + description for each
3. AI Summary — natural language assessment from the coach
4. Photos — 2×2 grid of checkpoint photos

### 8.5 Sessions (`/app/sessions`)

Recorded workout session browser. Web-enriched — this has no direct mobile equivalent.

**Filter bar**: exercise type, date range, sort by (recent / form score / duration).

**Session grid** — 3 columns desktop, 2 tablet, 1 mobile. Each SessionCard:
- Video thumbnail (play preview on hover — first 2 seconds loop)
- Form score badge (top-right overlay)
- Duration (bottom-left overlay)
- Exercise name, date below
- Hover: scale 1.02 + glow shadow

#### Session Detail (`/app/sessions/:id`)

The web platform's **hero page**. Frame-by-frame analysis of a recorded session.

**Video player** (top, full-width GlassCard):
- Video with standard controls
- Toggleable skeleton overlay (SVG on top of video, synced to pose data)
- "Show/Hide Skeleton" and "Frame-by-Frame" controls below

**Analysis tabs** below video:
- **Overview** — form score metric card, reps detected, avg tempo. AI feedback list (positive items with check icon, improvement items with alert icon).
- **Form Analysis** — form score per rep line chart. Joint quality breakdown.
- **Range of Motion** — coming soon (joint angle analysis over time)
- **Tempo** — coming soon (eccentric-concentric timing breakdown)

**Top action**: "Export Report" button.

### 8.6 Coach (`/app/coach`)

Two-panel layout:

**Left panel** (conversation list, 280px):
- "New Conversation" button (primary)
- Scrollable conversation list: title + last message preview + timestamp
- Active conversation highlighted

**Right panel** (chat):
- Mode badge (Demo/Live) at top
- Message stream with ChatBubbles
- Suggestion chips after AI responses or when conversation is empty
- Composer input at bottom: text field + send button
- Placeholder: "Ask about your movement, request a plan, review your progress..."

Every AI request assembles a structured context payload (profile, body state, training trends, streak, conversation history). This is documented in `BODYOS_DATA_REFERENCE.md`.

### 8.7 Workouts (`/app/workouts`)

**Tabs**: Active Plan / Plan Library

**Active Plan tab**:
- If plan exists: WorkoutPlanCard with day cards, exercise prescriptions, and start buttons
- If no plan: EmptyState with "No Active Plan" + "Browse Plans" CTA

**Plan Library tab**: grid of PlanCards — name, goal, days/week, difficulty.

#### Workout Session Logger (`/app/workout-session/:dayId`)

Active session page:
- Exercise list with coaching cues
- Per-exercise set logger: rows for each set with reps, weight, RPE inputs
- "Add Set" button per exercise
- Rest timer with configurable duration
- "Complete Workout" primary button at bottom

### 8.8 Progress (`/app/progress`)

**Tabs**: Timeline / Photos / Trends

- **Timeline**: vertical activity feed with workout completions, checkpoints, streaks, achievements
- **Photos**: grid of progress photos with dates. Selection mode for side-by-side comparison.
- **Trends**: posture score trend chart (last 90 days), training consistency chart (sessions/week)

### 8.9 Profile (`/app/profile`)

- Avatar, name, email, streak badge
- Stats grid: total sessions, avg form score, best streak, total checkpoints

### 8.10 Settings (`/app/settings`)

**Tabs**: Preferences / Account

**Preferences**:
- Units (metric/imperial)
- Skeleton overlay toggle
- Voice coaching toggle
- App mode toggle (Demo ↔ Real) with explanation text

**Account**:
- Change password
- Export data
- Danger zone: delete account

### 8.11 WhatsApp (`/app/whatsapp`)

Coming soon CTA page:
- Large icon, headline "Coach on WhatsApp"
- Description of benefits (coaching, reminders, check-ins on WhatsApp)
- "Connect WhatsApp" button
- "Coming soon" label

### 8.12 Achievements (`/app/achievements`)

Badge grid. Each AchievementCard:
- Icon, title, description
- Unlocked: full color with `brand.amber` glow
- Locked: dimmed with `text.disabled`
- Unlock date for earned badges

---

## 9. Copy and Tone

### Voice

Elite performance coach who understands systems thinking. Calm authority. Precise but warm. Never robotic, never hyped.

### Do

- Action-oriented phrasing: "Analyze your movement" not "Upload video"
- Reinforce progress: "Your shoulder mobility improved 12% this month"
- Body-systems thinking where relevant: "Your hip pattern affects your knee tracking"
- Specific CTAs: "View frame-by-frame" not "See details"
- Informative errors: "Video processing failed. Check format (MP4, MOV) and retry."

### Do Not

- Medicalize: no "diagnosis", "clinical", "pathology", "patient"
- Shame: no "you need to fix", "your form is bad"
- Hype: no "beast mode", "crush it", "let's go"
- Be vague with errors

### Preferred Reframing

| Avoid | Use Instead |
|-------|-------------|
| issues | focus areas |
| fix | improve, enhance |
| problem | opportunity |
| diagnosis | assessment |
| patient | athlete |
| medical-grade | performance-grade |

---

## 10. Asset Usage

### Available Assets (exact filenames)

**Brand**: `logo-square.jpeg`, `logo-landscape.jpeg`, `color-landscape.png`, `grey-logo-vertical.png`, `grey-logo-cropped.png`, `grey-logo-cropped-square.png`, `grey-logo-cropped-square2.png`, `grey-logo-cropped-square3.png`

**Backgrounds**: `bodyos-blueprints-landscape.jpeg`, `bodyos-blueprints-vertical.jpeg`, `bodyos-blueprints-vertical-shaped.png`, `loading-screen.png`

**Demo videos**: `demo-videos/pushup_heavy_overlay.mov`, `demo-videos/lunge_heavy_overlay.mov`, `demo-videos/pushup.mov`, `demo-videos/lunge.MOV`

### Per-Screen Mapping

| Screen | Asset | Usage |
|--------|-------|-------|
| Landing hero | `color-landscape.png` | Logo in hero |
| Landing background | `bodyos-blueprints-landscape.jpeg` | Subtle texture, low opacity |
| Auth background | `bodyos-blueprints-vertical.jpeg` | Behind auth card |
| Sidebar logo | `grey-logo-cropped-square3.png` | Top of sidebar |
| Dashboard accents | `bodyos-blueprints-landscape.jpeg` | Subtle section background |
| Loading/splash | `loading-screen.png` | Route transition placeholder |
| Demo sessions | `demo-videos/*` | Session detail demo content |

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |
| Initial bundle (gzipped) | < 300KB |

Key strategies: code-split page components, limit `backdrop-filter: blur()` to GlassCard and Modal only, virtualize lists over 50 items, tree-shake Recharts, lazy-load images, prefetch next-page data on link hover.

---

## 12. Security and Privacy

- Supabase Auth with JWT, HTTP-only cookies, CSRF protection
- OAuth: Google, Apple
- Row-Level Security on all tables — users access only their own data
- Videos in private Supabase Storage buckets with signed URLs
- Data export endpoint ("Export My Data" in settings)
- Account deletion cascades all user data
- Cookie consent banner on landing
- Privacy policy page in footer

---

## 13. Delivery Phases

### Phase 1 — Shell + Core
App shell, sidebar, responsive layout. Landing + Auth. Demo/Real mode toggle. Home dashboard (full mobile-matching implementation). Coach chat (demo + real). Profile + Settings. Complete design token system.

### Phase 2 — Body Intelligence + Progress
Body Intelligence pages (list + detail). Progress page (timeline, photos, trends). BodyBlueprint + FormScoreRing components. Achievements.

### Phase 3 — Workouts + Sessions
Workout plans (browse, detail, session logger). Exercise library. Sessions browser (web-only). Session Detail page (video replay + skeleton overlay + analysis tabs).

### Phase 4 — Advanced
Session upload flow (video → cloud analysis → results). Advanced analysis tabs (ROM, tempo). Progress photo comparison. Richer AI context. WhatsApp integration (when backend ready).

---

## 14. Implementation Notes

- **Mobile is source of truth**. When in doubt about naming, layout, or flow — match the mobile app.
- **Naming consistency**: "Body Intelligence" (not "Body Scan" or "Posture"), "Coach" (not "AI Coach"), "Focus Areas" (not "Issues"), "Checkpoint" (not "Assessment").
- **Camera features are mobile-only**. Web educates and redirects. No live camera analysis on web.
- **"Coming Soon" is fine**. ROM tabs, tempo charts, WhatsApp — visible but clearly marked as upcoming.
- **Session Detail is the web's hero page**. Frame-by-frame video with skeleton overlay is the reason to visit the web platform.
- **Philosophy references are educational, not marketing**. Anatomy Trains, FMS, tensegrity appear in coaching responses and exercise cues, not plastered on marketing surfaces.

### Stack-Specific Setup Notes

**React Router 7 (library mode)**:
- Install: `npm install react-router` (NOT `react-router-dom` — consolidated in v7)
- Import: `import { BrowserRouter, Routes, Route } from "react-router"` (not `react-router-dom`)
- Library mode requires no Vite plugin and no `routes.ts` file — standard `<BrowserRouter>` wrapping
- Data loading via `useLoaderData` / `useActionData` is available but optional in library mode

**Motion (formerly Framer Motion)**:
- Install: `npm install motion` (NOT `framer-motion`)
- Import: `import { motion, AnimatePresence } from "motion/react"` (NOT `"framer-motion"`)
- API is identical to Framer Motion — same components, same props, same hooks

**Tailwind CSS v4 + Vite**:
- Install: `npm install tailwindcss @tailwindcss/vite`
- No `tailwind.config.ts` — design tokens defined in CSS via `@theme` (see Section 3.4)
- No `postcss.config.js` needed when using the Vite plugin
- No `content` array — automatic template detection

**React 19 considerations**:
- `use()` hook available for reading promises and context in render
- `forwardRef` no longer needed — `ref` is a regular prop
- `<Context>` can be used directly as a provider (no `.Provider` needed)
- React Compiler (optional) can auto-memoize — reduces need for manual `useMemo`/`useCallback`

---

*Data models, TypeScript interfaces, AI context contract, adapter pattern, API contracts, and glossary are in `BODYOS_DATA_REFERENCE.md`.*

*"SEE • LEARN • GROW"*
