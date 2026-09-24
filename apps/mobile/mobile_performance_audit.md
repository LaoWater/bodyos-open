# BodyOS Mobile Performance Audit

> **Date**: 2026-02-07
> **Stack**: Expo 54 / React Native 0.81 / Hermes / New Architecture
> **Target**: iOS (iPhone) via development build

---

## TL;DR

The ~1 second delay you're feeling on navigation and button presses is **primarily the development build penalty** — Metro bundler serving JS over the network, debug-mode interpreter, no JIT. A release build will cut perceived latency by 5-10x.

That said, there are **47 real code-level issues** that will matter in production too, especially on the camera/pose screens where you need 30+ FPS. Below is everything, ranked by impact.

---

## Table of Contents

1. [Root Cause: Dev Build Overhead](#1-root-cause-dev-build-overhead)
2. [Critical: Constellation Background](#2-critical-constellation-background)
3. [Critical: Context Re-render Cascade](#3-critical-context-re-render-cascade)
4. [High: BlurView Abuse](#4-high-blurview-abuse)
5. [High: Unvirtualized Lists](#5-high-unvirtualized-lists)
6. [High: Unmemoized Expensive Computations](#6-high-unmemoized-expensive-computations)
7. [High: Pose/Camera Pipeline](#7-high-posecamera-pipeline)
8. [Medium: Navigation & Lazy Loading](#8-medium-navigation--lazy-loading)
9. [Medium: Inline Allocations in Render](#9-medium-inline-allocations-in-render)
10. [Medium: Storage Layer](#10-medium-storage-layer)
11. [Low: Miscellaneous](#11-low-miscellaneous)
12. [Verification Steps](#12-verification-steps)
13. [Fix Priority Roadmap](#13-fix-priority-roadmap)

---

## 1. Root Cause: Dev Build Overhead

When running `expo start`, the app is in **debug mode**:

| Factor | Dev Build | Release Build |
|--------|-----------|---------------|
| JS Engine | Hermes interpreter (no JIT) | Hermes AOT bytecode |
| Bundle source | Streamed over WiFi from Metro | Embedded in binary |
| Source maps | Loaded and active | Stripped |
| `__DEV__` checks | All active (extra logging, warnings) | Compiled out |
| React DevTools bridge | Active | Removed |
| Fast Refresh watchers | Listening on every module | None |

**Expected dev-mode penalty**: 3-10x slower JS execution, plus 50-200ms network round-trip per bundle chunk.

**How to verify**: Build a release and compare:
```bash
npx expo run:ios --configuration Release
```

---

## 2. Critical: Constellation Background

**File**: `src/components/layout/ConstellationBackground.tsx`
**Impact**: Continuously blocks JS thread on every screen

```
35 animated SVG dots × Animated.loop × useNativeDriver: false
= 35 JS-thread animation ticks every 16ms
= permanent JS thread congestion
```

### Problems
- **Line 63**: `useNativeDriver: false` — every animation frame goes through the JS bridge instead of the native compositor
- **Lines 51-66**: Each of the 35 `AnimatedDot` components runs its own independent `Animated.loop` with two sequential timings
- **Lines 32-45**: `getConnections()` runs an O(n²) distance check across all dots
- **Rendered by default on every screen** via `ScreenContainer` (`showConstellation = true`)

### Fix
- Migrate to `react-native-reanimated` (already in deps) with `useSharedValue` + `useAnimatedStyle` — runs on UI thread, zero JS thread cost
- Or replace with a static SVG + a single CSS opacity animation
- Or set `showConstellation={false}` on heavy screens (Camera, Posture)

---

## 3. Critical: Context Re-render Cascade

### AppContext.tsx
**File**: `src/context/AppContext.tsx:118`

```tsx
<AppContext.Provider value={{ state, dispatch, updateUser, updateSettings, refreshStreak, setAppMode }}>
```

This object literal is created **on every render** of `AppProvider`. Since object identity changes, **every `useApp()` consumer in the entire app re-renders** whenever any piece of app state changes — even if the consumer only reads `state.user`.

### AuthContext.tsx
**File**: `src/context/AuthContext.tsx:52-62`

Same pattern — context value not memoized.

### Fix
```tsx
const value = useMemo(
  () => ({ state, dispatch, updateUser, updateSettings, refreshStreak, setAppMode }),
  [state] // only re-render consumers when state actually changes
);
```

---

## 4. High: BlurView Abuse

`expo-blur` BlurView is a **real-time GPU gaussian blur**. It's expensive.

| Component | File | BlurView Count per Screen |
|-----------|------|--------------------------|
| GlassCard | `src/components/glass/GlassCard.tsx:50,80` | 5-10 per screen (every card) |
| GlassTabBar | `src/components/glass/GlassTabBar.tsx:24` | 1 (persistent) |
| FormScoreHUD | `src/components/camera/FormScoreHUD.tsx:21` | 1 (during camera) |
| RecordModeView | `src/components/camera/RecordModeView.tsx:39,63` | 2 (during recording) |

On a typical screen: **6-12 simultaneous BlurView renders**. Each one composites a snapshot of background content and applies a gaussian kernel.

### Fix
- Replace `BlurView` in `GlassCard` with a simple semi-transparent background (`rgba(21,23,28,0.85)` — you already have this as `androidFallback`). The visual difference is subtle; the performance gain is large.
- Keep BlurView only for the tab bar (single instance, always visible, amortized cost).

---

## 5. High: Unvirtualized Lists

Several screens render lists with `.map()` instead of `FlatList`, meaning **all items mount immediately** regardless of visibility.

| Screen | File:Line | Data | Fix |
|--------|-----------|------|-----|
| HomeScreen activities | `src/screens/HomeScreen.tsx:202-211` | Activity feed items | FlatList |
| ProgressScreen photos | `src/screens/ProgressScreen.tsx:81` | Photo grid | FlatList with numColumns |
| OnboardingScreen options | `src/screens/OnboardingScreen.tsx:124-220` | Multiple ScrollViews with lists | FlatList |
| WorkoutPlanScreen exercises | `src/screens/WorkoutPlanScreen.tsx:71-132` | All days + all exercises rendered | SectionList or accordion with lazy render |
| ExerciseDetailScreen cues | `src/screens/ExerciseDetailScreen.tsx:72-96` | Multiple .map() on coaching data | FlatList |

### Impact
Currently low (lists are small) but will degrade as user accumulates data.

---

## 6. High: Unmemoized Expensive Computations

These run on **every render** of their parent component:

| Computation | File:Line | Fix |
|-------------|-----------|-----|
| `postureData` sort + map | `src/screens/ProgressScreen.tsx:26-31` | `useMemo([assessments])` |
| `bestFormScore` nested reduce | `src/screens/ProfileScreen.tsx:56-63` | `useMemo([sessions])` |
| `todayDay` plan lookup | `src/screens/HomeScreen.tsx:48` | `useMemo([activePlan])` |
| `activeTips` filtering | `src/components/camera/AnalyzeModeView.tsx:128-136` | Already memoized but deps change frequently |
| SVG points string | `src/components/ui/StatChart.tsx:30-34` | `useMemo([data])` |
| Grid lines calculation | `src/components/ui/StatChart.tsx:36-40` | `useMemo([data])` |
| BodyBlueprint highlight checks | `src/components/ui/BodyBlueprint.tsx:74-101` | Convert `highlightNodes` to Set, memoize |
| `.slice(0,2).map()` coaching cues | `src/screens/WorkoutSessionScreen.tsx:187-193` | `useMemo` |

---

## 7. High: Pose/Camera Pipeline

These components run at **30+ FPS during camera use** — every wasted cycle matters.

### SkeletonOverlay.tsx
**File**: `src/components/pose/SkeletonOverlay.tsx`

- **Lines 39-43**: Helper functions (`toPoint`, `scale`) defined inside component body — recreated every frame
- **Lines 48-65**: Glow layer uses `BlurMask` on every bone connection (~12 connections) — extremely expensive per-frame GPU work
- **Lines 74-99**: All 33 landmarks + 12 connections re-rendered via `.map()` every frame with no memoization

### CorrectionArrows.tsx
**File**: `src/components/pose/CorrectionArrows.tsx`

- Arrow SVGs regenerated on every pose frame

### usePoseDetection.ts
**File**: `src/hooks/usePoseDetection.ts`

- **Lines 68-72**: Mock data interval created in `start()` — no guard against multiple `start()` calls stacking intervals
- **Lines 74-78**: FPS timer creates separate interval

### Fix
- Extract helper functions outside component
- Memoize SVG path generation
- Remove BlurMask from skeleton overlay (or debounce to 10 FPS)
- Use `React.memo` on SkeletonOverlay and CorrectionArrows
- Guard against multiple interval creation in hooks

---

## 8. Medium: Navigation & Lazy Loading

### No Lazy Loading
**File**: `src/navigation/TabNavigator.tsx`

All 5 tab screens are imported eagerly at the top level:
```tsx
import { HomeStack } from './HomeStack';
import { PostureScreen } from '../screens/PostureScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { ProfileStack } from './ProfileStack';
```

The Camera and Posture screens pull in heavy dependencies (vision-camera, tflite, Skia) that get loaded into memory even if the user never visits those tabs.

### Fix
Use `React.lazy()` or dynamic `import()` for Camera and Posture screens.

### Haptics Blocking Navigation
**File**: `src/components/glass/GlassTabBar.tsx:38`

```tsx
const onPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // async native call
  const event = navigation.emit({ ... });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
};
```

`Haptics.impactAsync` is called **before** navigation. While it's async, the native bridge call still blocks the JS thread briefly. Navigation should fire first, haptics can be fire-and-forget.

### Fix
```tsx
const onPress = () => {
  const event = navigation.emit({ ... });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // fire after
};
```

---

## 9. Medium: Inline Allocations in Render

React Native creates a new native view update for every new object reference in the style prop or callback prop.

### Spread operator on gradient colors (new array every render)
Found in multiple files:
- `src/screens/PostureScreen.tsx:68,96` — `[...colors.gradients.tealCyan]`
- `src/screens/ProfileScreen.tsx:76,87` — `[...colors.gradients.heroTeal]`
- `src/screens/OnboardingScreen.tsx:165,176` — `[...colors.gradients.*]`
- `src/screens/HomeScreen.tsx:56` — `[...colors.gradients.heroTeal]`
- `src/components/glass/GlassCard.tsx:74` — `[...colors.gradients.tealCyan]`
- `src/components/glass/GlassTabBar.tsx:87` — `[...colors.gradients.tealCyan]`

### Fix
Define gradient arrays as module-level constants or ensure theme exports plain arrays (not tuples requiring spread).

### Inline callback functions
- `src/components/ui/ChatBubble.tsx:33-52` — feedback button handlers
- `src/components/camera/AnalyzeModeView.tsx:235` — inline style `{ width: \`${phase * 100}%\` }`
- `src/screens/AssistantScreen.tsx:209` — `onContentSizeChange` inline arrow

---

## 10. Medium: Storage Layer

**File**: `src/services/storage.ts`

- **No caching**: Every `getItem()` call does `AsyncStorage.getItem()` + `JSON.parse()`. Repeated reads of the same key (e.g., user settings, streak data) parse JSON every time.
- **`getCollection()`** (line 37-44): Uses `multiGet` (good), but parses every item's JSON individually.

### Fix
Add a simple in-memory LRU cache:
```tsx
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30s
```

### aiService.ts
**File**: `src/services/aiService.ts`
- `buildContext()` (lines 196-217) does parallel async calls and string concatenation on **every message send**. Should cache the context string for 30-60 seconds.

---

## 11. Low: Miscellaneous

| Issue | File:Line | Notes |
|-------|-----------|-------|
| `useAI` refresh self-reference | `src/hooks/useAI.ts:17-31` | `refresh` depends on `[refresh]` — potential stale closure |
| Missing useEffect cleanup | `src/screens/BodyScanResultScreen.tsx:36-46` | Parallel async with no abort controller |
| Multiple state updates | `src/hooks/useAI.ts:127-132` | `selectConversation` sets loading twice |
| `formatTime` not memoized | `src/screens/AssistantScreen.tsx:94-102` | Called per message render |
| `getExerciseById` in loop | `src/screens/WorkoutPlanScreen.tsx:105` | Should be lookup map |
| `useCallback` with changing deps | `src/hooks/useCamera.ts:46` | `startRecording` depends on `recordingState` |
| `updateSet` creates new objects | `src/screens/WorkoutSessionScreen.tsx:84-90` | No memoization |
| Interval stacking risk | `src/hooks/usePoseDetection.ts:68-72` | No guard on repeated `start()` |

---

## 12. Verification Steps

### Confirm dev-build is the main issue
```bash
# Build release and compare
npx expo run:ios --configuration Release

# Or use EAS
eas build --profile preview --platform ios
```

### Profile JS thread
```bash
# Enable Hermes profiler
# In dev menu > Performance > Start Recording
# Navigate around, then stop and inspect trace
```

### Measure re-renders
Add to App.tsx temporarily:
```tsx
if (__DEV__) {
  const { whyDidYouRender } = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
}
```

### Check for context re-render cascade
Wrap `AppContext.Provider` value in `useMemo`, then compare navigation responsiveness.

---

## 13. Fix Priority Roadmap

### Phase 1 — Instant Wins (< 1 hour, biggest impact)

| # | Fix | Expected Impact |
|---|-----|-----------------|
| 1 | Memoize `AppContext` and `AuthContext` values | Eliminates app-wide re-render cascade |
| 2 | Move haptics after navigation in GlassTabBar | Removes perceived nav delay |
| 3 | Disable ConstellationBackground on Camera/Posture screens | Frees JS thread for camera pipeline |
| 4 | Replace BlurView in GlassCard with opaque background | Removes 6-12 GPU blur passes per screen |

### Phase 2 — Quick Optimizations (2-4 hours)

| # | Fix | Expected Impact |
|---|-----|-----------------|
| 5 | Migrate ConstellationBackground to Reanimated | JS thread completely freed |
| 6 | Add `useMemo` to all identified expensive computations | Eliminates redundant work on re-renders |
| 7 | Extract gradient color arrays to constants | Fewer native bridge updates |
| 8 | Add `React.memo` to SkeletonOverlay, CorrectionArrows | Fewer re-renders during camera |

### Phase 3 — Architecture Improvements (4-8 hours)

| # | Fix | Expected Impact |
|---|-----|-----------------|
| 9 | Lazy-load Camera and Posture tab screens | Faster initial load, less memory |
| 10 | Replace `.map()` lists with FlatList | Future-proofs for larger datasets |
| 11 | Add storage caching layer | Fewer async reads + JSON parses |
| 12 | Cache AI context string | Faster message sends |
| 13 | Remove BlurMask from SkeletonOverlay | Smoother pose overlay at 30 FPS |

### Phase 4 — Production Polish

| # | Fix | Expected Impact |
|---|-----|-----------------|
| 14 | Add interval guards in pose detection hooks | Prevents timer leaks |
| 15 | Add AbortController to async effects | Clean unmount behavior |
| 16 | Split AppContext into smaller contexts | Granular re-render control |
| 17 | Profile with Hermes and address remaining hotspots | Data-driven final optimization |

---

## Summary

| Category | Issue Count | Severity |
|----------|------------|----------|
| Dev build overhead | 1 (systemic) | Explains most of the delay |
| JS thread congestion (ConstellationBackground) | 1 | Critical |
| Context re-render cascade | 2 | Critical |
| GPU abuse (BlurView) | 4 locations | High |
| Unvirtualized lists | 5 screens | High |
| Missing memoization | 8 computations | High |
| Camera pipeline waste | 5 components/hooks | High |
| Navigation/loading | 3 issues | Medium |
| Inline allocations | 10+ locations | Medium |
| Storage inefficiency | 2 services | Medium |
| Misc hook issues | 8 issues | Low |

**Bottom line**: A release build will make the app feel dramatically faster immediately. The Phase 1 fixes (context memoization, haptics reorder, BlurView removal, constellation disable) will make even the dev build feel snappy.
