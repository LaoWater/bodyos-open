# BodyOS — Product Specification & Frontend Development Guide

**Version**: 1.0.0
**Platform**: iOS (React Native + Expo)
**Design Language**: Glassmorphism + Neural Blueprint Aesthetic
**Core Technology**: Real-time pose detection via MediaPipe PoseLandmarker

---

## 🎯 Product Vision

> **"Your body. Optimized."**

BodyOS is an AI-powered movement intelligence platform that transforms your smartphone camera into a biomechanics analysis lab. Unlike traditional fitness apps that track reps and sets, BodyOS understands *how* you move — analyzing posture, joint alignment, and movement quality in real-time to provide personalized coaching feedback.

### The Core Problem
Every gym-goer who records their workouts faces the same frustration: **the moment you hit record, your music stops**. Beyond this UX pain, recording alone doesn't provide actionable insights. BodyOS solves both: continuous music playback during recording AND real-time biomechanical analysis that turns your camera into a personal movement coach.

### Product Philosophy
- **Movement as Intelligence**: The body is a complex system. BodyOS treats movement data as high-resolution biometric intelligence, not just rep counting.
- **Real-time Feedback Loop**: Instant visual and audio coaching during exercises, not post-workout analysis.
- **Archetype-Driven Personalization**: Adaptive coaching based on user's pain points, movement philosophies, experience level, and biometric profile.
- **Progressive Disclosure**: Complex ML/biomechanics hidden behind intuitive glass-morphic UI with instant skeleton overlays.

---

## 🏗️ Technical Architecture

### Stack Overview
```
React Native 0.81.5
├── Expo SDK 54 (Dev Builds Only — No Expo Go)
├── TypeScript (Strict Mode)
├── Navigation: React Navigation 7
├── Camera: react-native-vision-camera 4.7.3
├── ML: MediaPipe PoseLandmarker (iOS Native SDK)
├── Audio: ElevenLabs TTS (Adam voice)
├── State: Context API (AppContext + AuthContext)
├── Storage: AsyncStorage
└── Backend: Supabase (auth + data sync)
```

### App Modes
BodyOS operates in two distinct runtime modes, chosen once at launch:

1. **Demo Mode** (`'demo'`)
   - Pre-recorded workout videos with simulated ML metrics
   - No camera/mic permissions required
   - Showcases full UX flow for onboarding/demos
   - Videos: `assets/demo-videos/lunge.mp4`, `assets/demo-videos/pushup.mp4`

2. **Real Mode** (`'real'`)
   - Live camera pose detection
   - Real-time skeleton overlay with form scoring
   - Audio coaching cues via TTS
   - Full workout recording and analysis

**Mode Selection**: On first launch, `AppNavigator` shows `ModeSelectScreen` when `appMode === null`. Once selected, mode persists in AsyncStorage. User can reset via Settings → "Change Mode" → `clearAppMode()`.

---

## 🎨 Design System

### Visual Identity

**Brand Assets**:
- Logo (Square): `assets/grey-logo-cropped-square3.png`
- Logo (Landscape): `assets/logo-landscape.jpeg`
- Hero Blueprint: `assets/bodyos-blueprints-vertical-shaped.png`
- Loading Screen: `assets/loading-screen.png`

**Core Design Language**: **Glassmorphism + Neural Blueprint Aesthetic**

Think of the UI as a HUD overlay on a biomechanics lab. Every card, button, and panel uses frosted glass effects with subtle depth, surgical precision borders, and data-visualization-inspired accents.

### Color Palette

```typescript
// Background Layers
background.primary:   '#0E0F12'  // Deep space black
background.secondary: '#15171C'  // Elevated surfaces
background.tertiary:  '#2A2D34'  // Interactive elements
background.camera:    '#000000'  // Pure black for camera views

// Glass Effects
glass.background:     'rgba(21, 23, 28, 0.80)'  // Frosted glass
glass.backgroundDark: 'rgba(21, 23, 28, 0.60)'  // Lighter glass
glass.border:         'rgba(42, 45, 52, 0.60)'  // Subtle borders
glass.borderSubtle:   'rgba(42, 45, 52, 0.30)'  // Very subtle

// Primary Accent (Teal-Blue)
accent.primary:       '#5B7CFA'  // Primary actions, skeleton lines
accent.primaryLight:  '#7B96FB'  // Hover states
accent.primaryMuted:  'rgba(91, 124, 250, 0.15)'  // Tinted backgrounds
accent.primaryDark:   '#4A68D4'  // Pressed states

// Secondary Accent (Coral-Pink)
secondary.primary:      '#E8657A'  // Warnings, corrections
secondary.primaryLight: '#F0889A'
secondary.primaryMuted: 'rgba(232, 101, 122, 0.12)'

// Semantic Colors
semantic.success: '#4ECDC4'  // Form score ≥85
semantic.warning: '#F5A623'  // Form score 60-84
semantic.error:   '#E74C3C'  // Form score <60
semantic.info:    '#5AC8FA'

// Text Hierarchy
text.primary:   '#E6E8EC'  // Headlines, primary content
text.secondary: '#9CA3AF'  // Descriptions, labels
text.tertiary:  '#6B7280'  // Muted info, timestamps
text.inverse:   '#FFFFFF'  // On dark/accent backgrounds

// Skeleton Overlay (Pose Detection)
nodes.dot:        'rgba(91, 124, 250, 0.35)'  // Inactive joints
nodes.dotActive:  '#5B7CFA'                    // Active/visible joints
nodes.line:       'rgba(91, 124, 250, 0.12)'  // Connecting bones
nodes.lineActive: 'rgba(91, 124, 250, 0.30)'  // Active bones

// Gradients (Linear)
gradients.tealCyan:   ['#5B7CFA', '#4ECDC4']  // Primary actions
gradients.coralPink:  ['#E8657A', '#F0889A']  // Warnings
gradients.warmSunset: ['#F5A623', '#FF8C42']  // Achievements
gradients.bluePurple: ['#5AC8FA', '#7B61FF']  // AI/Coach features

// Glows (Box Shadows)
glows.teal:  'rgba(91, 124, 250, 0.25)'
glows.coral: 'rgba(232, 101, 122, 0.25)'
glows.amber: 'rgba(245, 166, 35, 0.25)'
```

### Typography

```typescript
fontFamily:
  regular:   'Inter_400Regular'
  medium:    'Inter_500Medium'
  semiBold:  'Inter_600SemiBold'
  bold:      'Inter_700Bold'

fontSize:
  xs:   11
  sm:   13
  base: 15
  md:   17
  lg:   21
  xl:   26
  '2xl': 32
  '3xl': 38

textStyles:
  h1:       { fontFamily: bold, fontSize: '3xl', letterSpacing: -0.5 }
  h2:       { fontFamily: bold, fontSize: '2xl', letterSpacing: -0.3 }
  h3:       { fontFamily: semiBold, fontSize: xl }
  body:     { fontFamily: regular, fontSize: base }
  bodyMd:   { fontFamily: regular, fontSize: md }
  caption:  { fontFamily: medium, fontSize: sm }
  small:    { fontFamily: regular, fontSize: xs }
  button:   { fontFamily: semiBold, fontSize: base, letterSpacing: 0.5 }
  buttonSm: { fontFamily: semiBold, fontSize: sm, letterSpacing: 0.3 }
```

### Spacing System

```typescript
spacing:
  xs:   4
  sm:   8
  base: 12
  md:   16
  lg:   20
  xl:   24
  '2xl': 32
  '3xl': 48
```

### Border Radius

```typescript
borderRadius:
  sm:   4
  base: 8
  md:   12
  lg:   16
  xl:   20
  full: 9999
```

### Shadows & Depth

```typescript
shadows:
  glass:         // Standard glass card
    shadowColor: '#000'
    shadowOffset: { width: 0, height: 4 }
    shadowOpacity: 0.1
    shadowRadius: 12
    elevation: 3

  glassElevated: // Hero cards, active elements
    shadowColor: '#000'
    shadowOffset: { width: 0, height: 8 }
    shadowOpacity: 0.15
    shadowRadius: 24
    elevation: 6

  glassSubtle:   // Nested cards, low emphasis
    shadowColor: '#000'
    shadowOffset: { width: 0, height: 2 }
    shadowOpacity: 0.08
    shadowRadius: 8
    elevation: 1

  glowTeal:      // Skeleton overlay, body blueprint
    shadowColor: '#5B7CFA'
    shadowOffset: { width: 0, height: 0 }
    shadowOpacity: 0.4
    shadowRadius: 16
    elevation: 4
```

---

## 🧩 Component Library

### Glass Components (`src/components/glass/`)

#### **GlassCard**
The fundamental building block. Wraps all content in frosted glass with optional gradient borders and inner glows.

```tsx
<GlassCard
  variant="default" | "elevated" | "subtle"
  tint="light" | "accent"
  padding="xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl"
  gradientBorder={false}
  innerGlow="teal" | "coral" | "amber"
  style={ViewStyle}
>
  {children}
</GlassCard>
```

**iOS Implementation**: Uses `BlurView` with `intensity` prop. Android fallback to `rgba(21, 23, 28, 0.85)`.

**Gradient Border**: When `gradientBorder={true}`, wraps card in 1.5px gradient border (LinearGradient) for premium emphasis.

**Inner Glow**: Adds a subtle colored overlay at 15% opacity for semantic highlighting (teal for body scans, coral for warnings).

---

#### **GlassButton**
Pressable buttons with haptic feedback (respects user settings).

```tsx
<GlassButton
  title="Start Workout"
  onPress={() => {}}
  variant="default" | "accent" | "outline"
  size="sm" | "md" | "lg"
  icon="barbell" // Ionicons name (optional)
  disabled={false}
  loading={false}
  style={ViewStyle}
/>
```

**Variants**:
- `default`: Glass background, white text
- `accent`: Teal gradient background, white text
- `outline`: Transparent background, teal border + text

**Haptics**: Uses `Pressable` (not TouchableOpacity) for zero-delay response. Calls `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` only if `settings.haptics === true`.

---

#### **GlassTabBar**
Custom bottom tab bar with glassmorphic background and blur.

```tsx
// Automatically used by TabNavigator
<Tab.Navigator
  tabBar={(props) => <GlassTabBar {...props} />}
>
  ...
</Tab.Navigator>
```

**UX Notes**:
- Active tab: Teal icon + gradient accent underline
- Inactive tabs: Gray icons
- Haptic feedback on tab press (respects settings)
- Blur intensity: 50 (iOS) / solid fallback (Android)

---

#### **GradientAccent**
Circular gradient background wrapper for icons.

```tsx
<GradientAccent preset="teal" | "coral" | "blue" size={44}>
  <Ionicons name="barbell" size={22} color="#FFF" />
</GradientAccent>
```

---

### UI Components (`src/components/ui/`)

#### **FeatureCard**
Horizontal card with icon, title, subtitle, and gradient accent. Used for Quick Actions on HomeScreen.

```tsx
<FeatureCard
  icon="body-outline"
  title="Body Scan"
  subtitle="AI intelligence"
  gradient="teal" | "coral" | "blue" | "amber"
  onPress={() => navigation.navigate('Posture')}
/>
```

**Implementation**: Uses `gradientBorder` GlassCard with a gradient background and shadow glow.

---

#### **BodyBlueprint**
SVG skeleton visualization with optional node highlighting.

```tsx
<BodyBlueprint
  width={120}
  height={192}
  highlightNodes={[2, 3, 10, 11]} // Array of MediaPipe landmark indices
  opacity={0.8}
/>
```

**Visual**: Gray human wireframe skeleton. Highlighted nodes glow teal with pulsing animation.

**Usage**: PostureScreen checkpoints, HomeScreen body status card, onboarding.

---

#### **Skeleton**
Loading placeholders for progressive rendering.

```tsx
// Predefined layouts
<Skeleton.Card />
<Skeleton.Hero />
<Skeleton.ActionRow />
<Skeleton.BodyCard />
<Skeleton.Timeline />
<Skeleton.Home /> // Full HomeScreen skeleton

// Custom skeleton
<Skeleton width={200} height={40} />
```

**Animation**: Subtle opacity pulse (0.3 → 0.6 → 0.3) with native driver.

**Performance**: Used extensively in HomeScreen to defer heavy data fetch until screen transition completes (`InteractionManager.runAfterInteractions()`).

---

#### **StreakIndicator**
Flame icon + streak count badge.

```tsx
<StreakIndicator streak={7} size="sm" | "md" | "lg" />
```

**Colors**:
- 1-6 days: Amber flame
- 7-29 days: Orange flame
- 30+ days: Teal flame with glow

---

#### **TimelineCard**
Activity feed item with icon, title, description, timestamp, and optional metric.

```tsx
<TimelineCard
  type="workout" | "assessment" | "achievement" | "photo" | "streak" | "plan"
  title="Upper Body Strength"
  description="8 exercises · 45min"
  time="2024-02-10T14:30:00Z"
  metric="Form: 87/100"
/>
```

**Layout**: Vertical line on left (connecting timeline), icon in circle, content on right.

---

#### **ExerciseCard**
Exercise preview card with muscle groups, difficulty, and coaching cue count.

```tsx
<ExerciseCard
  exercise={exerciseData}
  onPress={() => navigation.navigate('ExerciseDetail', { exerciseId })}
/>
```

---

#### **MetricCard**
Small stat card with icon, label, and value.

```tsx
<MetricCard
  icon="flame"
  label="Streak"
  value="7 days"
  color="amber"
/>
```

---

#### **ProgressRing**
Circular progress indicator (SVG-based).

```tsx
<ProgressRing
  progress={0.75} // 0-1
  size={120}
  strokeWidth={8}
  color="teal" | "coral" | "amber"
  label="75%"
/>
```

---

#### **OnboardingStep**
Standardized onboarding step wrapper with title, description, skip button, and Next/Continue button.

```tsx
<OnboardingStep
  title="What are your goals?"
  description="Select all that apply"
  currentStep={2}
  totalSteps={8}
  onNext={() => {}}
  onSkip={() => {}} // Optional
  canProceed={selectedGoals.length > 0}
>
  {/* Custom content */}
</OnboardingStep>
```

**Skip Logic**: Every step except Welcome/Summary has a skip button. Skipped fields remain `undefined` in `UserProfile` (backward compatible).

---

### Camera Components (`src/components/camera/`)

#### **ModeToggle**
Segmented control for camera mode switching.

```tsx
export type CameraMode = 'upload' | 'analyze' | 'demo';

<ModeToggle
  mode={mode}
  onModeChange={(newMode) => setMode(newMode)}
/>
```

**UX**: Horizontal pill switcher with glass background. Active segment has teal gradient background + white text. Haptic feedback on switch.

---

#### **AnalyzeModeView**
Real-time pose detection with skeleton overlay.

```tsx
<AnalyzeModeView isActive={isFocused} />
```

**Pipeline**:
1. `react-native-vision-camera` Camera with `frameProcessor={poseFrameProcessor}`
2. Frame processor calls native `detectPose()` plugin (MediaPipe PoseLandmarker)
3. Native plugin returns 33 landmarks (x, y, z, visibility) in portrait coordinates
4. `usePoseDetection` hook receives results via `onPoseDetected()`
5. Hook applies confidence gating, EMA smoothing, form analysis
6. `SkeletonOverlay` renders 33 dots + connecting lines over camera preview
7. `FormScoreHUD` displays real-time form score (0-100)
8. `CoachingCaption` shows live coaching cues ("Keep your back straight")
9. `FeedbackPanel` shows joint-level quality indicators

**Performance**:
- Frame processor throttled to ~10 FPS via `runAtTargetFps(10, ...)`
- Form analysis runs every 3rd frame only (not every detection)
- Skeleton overlay uses `React.memo` to prevent unnecessary re-renders
- Glow effect implemented as semi-transparent wider line (no BlurMask)

**ML Model**:
- MediaPipe PoseLandmarker Lite (`pose_landmarker_lite.task`)
- iOS Native SDK (pod: `MediaPipeTasksVision`)
- 33-point landmark output (MediaPipe format)
- Confidence thresholds: 0.35 (relaxed for mobile)

**Framing Check**: Initial prompt "Step into the frame" with 4-second auto-pass timeout to avoid nagging.

---

#### **DemoModeView**
Pre-recorded workout video player with simulated metrics.

```tsx
<DemoModeView />
```

**Features**:
- Video player (muted, looping) with demo videos
- Animated progress bar synced to video timeline
- Metrics (reps, form score, ROM, tempo) update every 800ms
- Values synced to video position via sine wave (no random jitter)
- Crossfade transitions between exercises (350ms)
- Staggered fade-in for metric items (80ms per item)
- Animated form score with spring scale + glow pulse
- Pulsing "LIVE" tag indicator
- Coaching audio cues (TTS) at 2.5s first cue, then 5-10s intervals

**Exercise Order**: Lunge → Push-Up → Squat → Plank (first two have videos)

---

#### **UploadModeView**
Two sub-modes: `'upload'` (gallery pick) and `'record'` (live recording).

**Upload Sub-Mode**:
- Shows icon + description: "Select a video from your gallery"
- Button: "Choose Video"
- Placeholder for cloud compute analysis (TODO)

**Record Sub-Mode**:
- Full-screen camera with recording controls
- State flow: `'selecting'` → `'ready'` → `'recording'` → `'recorded'`
- Exercise selection before recording
- Duration timer during recording
- Confirmation screen after recording with Send/Retake/Cancel
- Cloud upload is TODO (simulated with Alert for now)

---

#### **FormScoreHUD**
Floating HUD showing current form score.

```tsx
<FormScoreHUD score={87} />
```

**Layout**: Top-right corner, glass card with large score number (0-100).

**Color Coding**:
- 85-100: Success green
- 60-84: Warning amber
- 0-59: Error red

---

#### **CoachingCaption**
Floating caption showing current coaching cue.

```tsx
<CoachingCaption text="Keep your back straight" />
```

**Layout**: Bottom center, glass card with white text. Fades in/out on cue changes.

---

#### **FeedbackPanel**
Expandable panel showing joint-level quality indicators.

```tsx
<FeedbackPanel
  jointQualities={jointQualitiesMap}
  feedback={feedbackArray}
/>
```

**Display**: List of joints with color-coded quality indicators (good/warning/error).

---

### Pose Components (`src/components/pose/`)

#### **SkeletonOverlay**
Canvas overlay rendering 33 pose landmarks and connecting lines.

```tsx
<SkeletonOverlay
  pose={poseResult}
  width={screenWidth}
  height={screenHeight}
/>
```

**Rendering**:
- Wrapped in `React.memo` for performance
- Uses SVG for precise line rendering
- Glow effect: semi-transparent wider line (no BlurMask)
- Visibility threshold: 0.05 (very permissive to show conservative ML outputs)
- Active joints: `nodes.dotActive`, inactive: `nodes.dot`
- Lines: `nodes.lineActive` when both endpoints visible

**Pose Connections**: MediaPipe standard skeleton (33 landmarks, 35 connections).

---

#### **CorrectionArrows**
Overlay showing directional arrows for joint corrections.

```tsx
<CorrectionArrows corrections={correctionsArray} />
```

**Future**: Currently stubbed. Will use `usePoseCorrection` hook when pose correction model is trained.

---

### Layout Components (`src/components/layout/`)

#### **ScreenContainer**
Standard screen wrapper with safe area insets and scrolling.

```tsx
<ScreenContainer>
  <Text>Your content</Text>
</ScreenContainer>
```

**Features**:
- `ScrollView` with content padding
- Safe area insets (top/bottom)
- Background color: `background.primary`
- Optional `scrollEnabled={false}` prop

---

#### **SectionHeader**
Sticky section headers with title and optional subtitle.

```tsx
<SectionHeader
  title="Recent Activity"
  subtitle="Last 7 days"
  action={<GlassButton title="See All" variant="outline" size="sm" />}
/>
```

---

#### **ConstellationBackground**
Animated starfield background for auth/onboarding screens.

```tsx
<ConstellationBackground />
```

**Performance**:
- Static SVG with 5 native-driver opacity pulses (was 35 JS-driven animations)
- Zero setState calls
- Optimized for 60fps

---

---

## 📱 Screen Specifications

### Navigation Structure

```
App
├── ModeSelectScreen (if appMode === null)
└── TabNavigator
    ├── Home Tab
    │   ├── HomeScreen
    │   ├── WorkoutPlanScreen
    │   ├── ExerciseDetailScreen
    │   └── ProgressScreen
    ├── Camera Tab
    │   └── CameraScreen (AnalyzeModeView | UploadModeView | DemoModeView)
    ├── Posture Tab
    │   ├── PostureScreen
    │   └── BodyScanResultScreen
    └── Profile Tab
        ├── ProfileScreen
        ├── SettingsScreen
        ├── AchievementsScreen
        ├── AssistantScreen (AI Coach)
        └── WhatsAppScreen

Modal Screens (outside tabs):
├── OnboardingScreen (if !onboardingComplete)
├── AuthScreen (if !authenticated)
├── PermissionsScreen (if camera/mic permissions needed)
├── WorkoutSessionScreen
└── ProgressPhotoCompareScreen
```

---

### 🏠 HomeScreen

**Purpose**: Central dashboard showing workout plan, body status, and activity feed.

**Layout**:

1. **Hero Header** (Gradient Background)
   - BodyOS logo (top-left)
   - Streak indicator (top-right, if streak > 0)
   - Greeting: "Good morning/afternoon/evening, {userName}"
   - Tagline: "Your body. Optimized."

2. **Quick Actions** (Horizontal ScrollView)
   - FeatureCard: "Body Scan" → Navigate to PostureScreen
   - FeatureCard: "Record" → Navigate to CameraScreen
   - FeatureCard: "Ask Coach" → Navigate to AssistantScreen

3. **Today's Workout** (if active plan exists)
   - GlassCard with workout name, focus, exercise count
   - "Start Workout" button → WorkoutSessionScreen

4. **Body Status** (Latest Posture Assessment)
   - BodyBlueprint with highlighted issue nodes
   - Score: "{score}/100 Posture Score"
   - Issue count: "{n} issues detected"
   - "View Details" button → BodyScanResultScreen
   - OR "No Assessment Yet" state with "Start Assessment" button

5. **Recent Activity** (Timeline)
   - Last 5 activity feed items (workouts, assessments, achievements)
   - "View All Progress" button → ProgressScreen
   - OR Empty state: "No sessions yet"

**Progressive Rendering**:
- Hero header renders instantly (no data dependency)
- Quick actions render instantly (static)
- Today's workout shows `Skeleton.Card` until `useWorkouts` loads
- Body status shows `Skeleton.BodyCard` until `useAssessments` loads
- Activity feed shows `Skeleton.Timeline` until `activityService.getFeed()` resolves
- Uses `InteractionManager.runAfterInteractions()` to defer heavy fetches

**Performance Notes**:
- All data hooks (`useAssessments`, `useWorkouts`) use single batched setState
- Skeleton components prevent layout shift
- Activity fetch deferred until screen transition completes

---

### 📷 CameraScreen

**Purpose**: Immersive camera interface for real-time pose analysis, demo playback, and workout recording.

**Layout**:

1. **Mode Toggle** (Top Center, Overlay)
   - 3-segment control: Upload | Analyze | Demo
   - Default: Analyze

2. **Mode Views** (Full Screen)
   - **AnalyzeModeView**: Live camera + skeleton overlay + form HUD
   - **DemoModeView**: Video player + simulated metrics
   - **UploadModeView**: Gallery picker OR live recording camera

**Performance**:
- Shows `CameraLoadingSkeleton` on first mount (deferred via `InteractionManager`)
- Mode views stay mounted (hidden via `display:'none'`) to avoid TFLite model reload
- Skeleton shows mode-aware icon + loading text

**UX Notes**:
- Top scrim gradient for visual depth
- No bottom tab bar (immersive mode)
- Haptic feedback on mode switch

---

### 🧍 PostureScreen

**Purpose**: Body checkpoint capture and timeline.

**Layout**:

1. **Header**
   - Title: "Body Checkpoints"
   - Subtitle: "Track your posture evolution"

2. **New Checkpoint Card**
   - "Capture New Checkpoint" button
   - Icon: camera-outline

3. **Checkpoint Timeline**
   - List of past checkpoints (newest first)
   - Each card shows:
     - Date
     - Status badge (pending/processing/completed/failed)
     - 4 photo thumbnails (anterior/posterior/lateral_left/lateral_right)
     - Tap to view details → BodyScanResultScreen

**Checkpoint Flow**:
1. Tap "Capture New Checkpoint"
2. Camera opens for 4 angles (expo-image-picker)
3. Submit for Analysis
4. Mock ML processing (2-3s delay)
5. Results displayed with posture score + issue highlights

**Data**:
- Service: `checkpointService.ts` (AsyncStorage)
- Hook: `useCheckpoints.ts`
- Types: `BodyCheckpoint`, `CheckpointPhoto`, `ProcessingStatus`, `CheckpointPhotoType`

---

### 🏋️ WorkoutSessionScreen

**Purpose**: Active workout tracker with set logging and real-time form feedback.

**Layout**:

1. **Header**
   - Workout name (if from plan)
   - Timer (session duration)

2. **Exercise List**
   - Current exercise highlighted
   - Sets/reps targets
   - Checkboxes for completed sets

3. **Active Set Logger**
   - Weight input
   - Reps input
   - RPE slider (optional)
   - "Log Set" button

4. **Camera Quick Launch**
   - Button to open AnalyzeModeView for current exercise

5. **Finish Workout**
   - "Complete Workout" button
   - Mood selector (great/good/okay/tough)
   - Notes input

**Data**:
- Service: `workoutService.ts`
- Hook: `useWorkouts.ts`
- Type: `WorkoutSession`, `SessionSet`

---

### 👤 ProfileScreen

**Purpose**: User profile overview and archetype data.

**Layout**:

1. **Profile Header**
   - User name
   - Join date
   - Streak indicator

2. **Archetype Summary**
   - Biometrics (height, weight, age, gender)
   - Experience level
   - Pain points (with severity colors)
   - Movement philosophies

3. **Goals**
   - Selected fitness goals

4. **Quick Actions**
   - "Edit Profile" → OnboardingScreen (edit mode)
   - "Settings" → SettingsScreen
   - "Achievements" → AchievementsScreen

---

### ⚙️ SettingsScreen

**Purpose**: App preferences and account management.

**Layout**:

1. **Preferences**
   - Haptic Feedback (toggle)
   - Skeleton Overlay (toggle)
   - Voice Feedback (toggle)
   - Notifications (toggle)
   - Units (metric/imperial)

2. **Mode**
   - Current mode badge (Demo/Real)
   - "Change Mode" button → `clearAppMode()` → ModeSelectScreen

3. **Account**
   - "Sign Out" button
   - "Delete Account" button (danger)

**Data**:
- Context: `AppContext.updateSettings()`
- Storage: `userService.ts`

---

### 🎓 OnboardingScreen

**Purpose**: 8-step user archetype collection.

**Steps**:

1. **Welcome** (No skip)
   - BodyOS logo
   - "Let's optimize your body"

2. **Goals**
   - Multi-select: build_strength, improve_posture, increase_mobility, lose_weight, general_fitness, body_performance, recovery, pain_management, general_wellness
   - Skip: Sets `goals: []`

3. **Biometric**
   - Date of birth (date picker)
   - Height (cm/in)
   - Weight (kg/lbs)
   - Gender (male/female/other/prefer_not_to_say)
   - Skip: Leaves all `undefined`

4. **Pain Points**
   - Body area grid (10 areas: neck, shoulders, upper_back, lower_back, knees, ankles, wrists, hips, elbows, feet)
   - Tap to add (mild), tap again to cycle severity (mild→moderate→severe→remove)
   - Color-coded borders (mild: amber, moderate: orange, severe: coral)
   - Skip: Sets `painPoints: []`

5. **Movement DNA**
   - Multi-select movement philosophies: calisthenics, strength_training, powerlifting, olympic_lifting, yoga_flexibility, martial_arts, sprint_agility, functional_fitness, rehabilitation, hybrid_mixed
   - Skip: Sets `movementPhilosophies: []`

6. **Schedule**
   - Days of week (multi-select)
   - Time preference (morning/afternoon/evening)
   - Session duration (30/45/60/90 min)
   - Skip: Sets defaults (weekend only, evening, 45min)

7. **Equipment**
   - Multi-select: full_gym, dumbbells, bodyweight, resistance_bands, kettlebells, pull_up_bar
   - Skip: Sets `equipment: ['bodyweight']`

8. **Summary** (No skip)
   - Review all selections
   - "Complete Setup" button → `updateUser({ ...profile, onboardingComplete: true })`

**UX Notes**:
- Progress indicator: "{currentStep} / 8"
- Every step has OnboardingStep wrapper
- Skip button sets field to `undefined` or empty array (backward compatible)
- Glassmorphic cards with gradient accents
- ConstellationBackground for depth

---

### 🤖 AssistantScreen (AI Coach)

**Purpose**: Conversational AI coaching interface.

**Layout**:

1. **Chat History**
   - ScrollView with ChatBubble components
   - Assistant messages (left, glass card)
   - User messages (right, teal gradient)

2. **Input Bar**
   - Text input
   - Send button
   - Microphone button (future)

3. **Suggested Questions**
   - Chips with common queries ("How's my form?", "What should I focus on?")

**Data**:
- Service: `aiService.ts`
- Hook: `useAI.ts`
- Type: `AIConversation`, `AIMessage`, `AIMessageRole`, `AIMessageFeedback`

---

---

## 🧠 Data Models

### Core Types (`src/types/models.ts`)

```typescript
export type AppMode = 'demo' | 'real';

export type FitnessGoal =
  | 'build_strength'
  | 'improve_posture'
  | 'increase_mobility'
  | 'lose_weight'
  | 'general_fitness'
  | 'body_performance'
  | 'recovery'
  | 'pain_management'
  | 'general_wellness';

export type Equipment =
  | 'full_gym'
  | 'dumbbells'
  | 'bodyweight'
  | 'resistance_bands'
  | 'kettlebells'
  | 'pull_up_bar';

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday'
  | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimePreference = 'morning' | 'afternoon' | 'evening';
export type SessionDuration = 30 | 45 | 60 | 90;
export type UnitSystem = 'metric' | 'imperial';

// Archetype types
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PainSeverity = 'mild' | 'moderate' | 'severe';

export type BodyArea =
  | 'neck' | 'shoulders' | 'upper_back' | 'lower_back'
  | 'knees' | 'ankles' | 'wrists' | 'hips' | 'elbows' | 'feet';

export type MovementPhilosophy =
  | 'calisthenics' | 'strength_training' | 'powerlifting'
  | 'olympic_lifting' | 'yoga_flexibility' | 'martial_arts'
  | 'sprint_agility' | 'functional_fitness' | 'rehabilitation' | 'hybrid_mixed';

export interface PainPoint {
  area: BodyArea;
  severity: PainSeverity;
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  goals: FitnessGoal[];
  scheduleDays: DayOfWeek[];
  timePreference: TimePreference;
  sessionDuration: SessionDuration;
  equipment: Equipment[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;

  // Archetype fields (optional)
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  gender?: Gender;
  painPoints?: PainPoint[];
  experienceLevel?: ExperienceLevel;
  movementPhilosophies?: MovementPhilosophy[];
}

export interface UserSettings {
  haptics: boolean;
  skeletonOverlay: boolean;
  notifications: boolean;
  units: UnitSystem;
  voiceFeedback: boolean;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActivityDate: string;
}
```

### Pose Types (`src/types/pose.ts`)

```typescript
export interface Landmark {
  x: number;        // 0-1 (normalized screen coordinates)
  y: number;        // 0-1
  z: number;        // Depth (not used in overlay)
  visibility: number; // 0-1 (confidence)
}

export interface PoseResult {
  landmarks: Landmark[]; // 33 MediaPipe landmarks
  timestamp: number;
}

export enum LandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

export type FormQuality = 'good' | 'warning' | 'error';

export interface FormAnalysis {
  score: number; // 0-100
  jointQualities: Map<LandmarkIndex, FormQuality>;
  tips: string[];
}
```

### Checkpoint Types

```typescript
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CheckpointPhotoType = 'anterior' | 'posterior' | 'lateral_left' | 'lateral_right';

export interface CheckpointPhoto {
  id: string;
  checkpointId: string;
  photoType: CheckpointPhotoType;
  photoUrl: string;
  overlayUrl?: string;
  rawLandmarks?: number[];
  analysisResults?: {
    score: number;
    issues: { area: string; description: string; severity: string }[];
  };
  processingStatus: ProcessingStatus;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  createdAt: string;
}

export interface BodyCheckpoint {
  id: string;
  checkpointDate: string;
  status: ProcessingStatus;
  notes?: string;
  photos: CheckpointPhoto[];
  createdAt: string;
}
```

---

## 🔌 Services & Hooks

### Services (`src/services/`)

**Purpose**: Data persistence, API calls, business logic. Never directly imported in components — always wrapped in hooks.

#### **storage.ts**
Low-level AsyncStorage wrapper.

```typescript
async function getItem<T>(key: string): Promise<T | null>
async function setItem<T>(key: string, value: T): Promise<void>
async function removeItem(key: string): Promise<void>
async function clear(): Promise<void>
```

**Critical Gotcha**: `setItem(key, null)` stores `"null"` string, not actual null. Use `removeItem(key)` instead.

---

#### **userService.ts**
User profile, settings, streak, app mode persistence.

```typescript
async function getProfile(): Promise<UserProfile | null>
async function updateProfile(profile: UserProfile): Promise<void>
async function getSettings(): Promise<UserSettings>
async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>
async function getStreak(): Promise<UserStreak>
async function updateStreak(date: string): Promise<UserStreak>
async function getAppMode(): Promise<AppMode | null>
async function setAppMode(mode: AppMode): Promise<void>
async function clearAppMode(): Promise<void>
```

---

#### **checkpointService.ts**
Body checkpoint CRUD (AsyncStorage).

```typescript
async function getAllCheckpoints(): Promise<BodyCheckpoint[]>
async function getCheckpoint(id: string): Promise<BodyCheckpoint | null>
async function createCheckpoint(checkpoint: Omit<BodyCheckpoint, 'id' | 'createdAt'>): Promise<BodyCheckpoint>
async function updateCheckpoint(id: string, updates: Partial<BodyCheckpoint>): Promise<void>
async function deleteCheckpoint(id: string): Promise<void>
```

---

#### **bodyAnalysisService.ts**
Mock ML analysis for checkpoints (simulates cloud processing).

```typescript
async function analyzeCheckpointPhotos(photos: CheckpointPhoto[]): Promise<CheckpointPhoto[]>
```

**Simulation**: 2-3s delay, returns mock posture scores + issue highlights.

---

#### **workoutService.ts**
Workout plans and sessions.

```typescript
async function getActivePlan(): Promise<WorkoutPlan | null>
async function getPlan(id: string): Promise<WorkoutPlan | null>
async function getAllPlans(): Promise<WorkoutPlan[]>
async function createPlan(plan: WorkoutPlan): Promise<void>
async function logSession(session: WorkoutSession): Promise<void>
async function getSessions(limit?: number): Promise<WorkoutSession[]>
```

---

#### **assessmentService.ts**
Posture assessments.

```typescript
async function getLatestAssessment(): Promise<PostureAssessment | null>
async function getAllAssessments(): Promise<PostureAssessment[]>
async function saveAssessment(assessment: PostureAssessment): Promise<void>
```

---

#### **aiService.ts**
AI coach conversation management.

```typescript
async function getConversations(): Promise<AIConversation[]>
async function getConversation(id: string): Promise<AIConversation | null>
async function createConversation(title: string): Promise<AIConversation>
async function sendMessage(conversationId: string, content: string): Promise<AIMessage>
async function getResponse(conversationId: string, userMessage: string): Promise<AIMessage>
```

---

#### **elevenLabsTTS.ts**
Text-to-speech for coaching cues.

```typescript
async function speak(text: string): Promise<void>
async function preloadCues(cues: string[]): Promise<void>
async function stopSpeaking(): Promise<void>
```

**Voice**: Adam (`pNInz6obpgDQGcFmaJgB`), stability 0.50 for natural variation.
**Cache**: `FileSystem.cacheDirectory + 'tts-cache-v2/'`

---

#### **activityService.ts**
Activity feed generation.

```typescript
async function getFeed(limit?: number): Promise<ActivityFeedItem[]>
async function logActivity(item: Omit<ActivityFeedItem, 'id' | 'createdAt'>): Promise<void>
```

---

### Hooks (`src/hooks/`)

**Purpose**: Wrap services with React state management. Always expose loading states.

#### **usePoseDetection**
Real-time pose detection state manager.

```typescript
interface UsePoseDetectionOptions {
  useMockData?: boolean;
  enabled?: boolean;
}

const {
  pose,              // PoseResult | null
  formScore,         // 0-100
  jointQualities,    // Map<LandmarkIndex, FormQuality>
  feedback,          // string[] (coaching tips)
  fps,               // number
  isRunning,         // boolean
  start,             // () => void
  stop,              // () => void
  onPoseDetected,    // (result: PoseResult | null) => void
} = usePoseDetection({ useMockData: false, enabled: true });
```

**Pipeline**:
1. Receives pose results from frame processor via `onPoseDetected()`
2. Applies confidence gating (enter threshold, stay threshold, stable frames)
3. Applies EMA smoothing to reduce jitter
4. Runs form analysis every 3rd frame
5. Single batched setState update
6. Exposes pose + analysis results to UI

**Performance**: Zero setState calls during form analysis skip frames.

---

#### **useCoachingAudio**
TTS coaching cue manager.

```typescript
const {
  currentCue,        // string | null
  isPlaying,         // boolean
  playNextCue,       // () => Promise<void>
  stopAudio,         // () => void
} = useCoachingAudio(exerciseId);
```

**Timing**:
- First cue at 2.5s (was 6-12s random)
- Subsequent cues at 5-10s intervals
- Stops on component unmount

---

#### **useAssessments**
Posture assessment data hook.

```typescript
const {
  latest,            // PostureAssessment | null
  assessments,       // PostureAssessment[]
  loading,           // boolean
  refresh,           // () => Promise<void>
  save,              // (assessment: PostureAssessment) => Promise<void>
} = useAssessments();
```

**Performance**: Single batched setState (was 3 separate calls).

---

#### **useWorkouts**
Workout plan and session data hook.

```typescript
const {
  activePlan,        // WorkoutPlan | null
  plans,             // WorkoutPlan[]
  sessions,          // WorkoutSession[]
  loading,           // boolean
  refresh,           // () => Promise<void>
  logSession,        // (session: WorkoutSession) => Promise<void>
} = useWorkouts();
```

**Performance**: Single batched setState.

---

#### **useCheckpoints**
Body checkpoint data hook.

```typescript
const {
  checkpoints,       // BodyCheckpoint[]
  activeCheckpoint,  // BodyCheckpoint | null
  analyzing,         // boolean
  createCheckpoint,  // (photos: ...) => Promise<void>
  refresh,           // () => Promise<void>
} = useCheckpoints();
```

---

#### **useAchievements**
Achievement tracking hook.

```typescript
const {
  achievements,      // Achievement[]
  unlocked,          // UserAchievement[]
  checkAchievements, // () => Promise<void>
} = useAchievements();
```

---

---

## 🎬 User Flows

### First Launch Flow

```
App Launch
  ↓
AppContext initializes (loads appMode from storage)
  ↓
appMode === null?
  YES → ModeSelectScreen
    ↓
    User selects Demo or Real
    ↓
    setAppMode(mode) → AsyncStorage
    ↓
    AppNavigator re-renders
  NO → Continue
  ↓
onboardingComplete === false?
  YES → OnboardingScreen (8 steps)
    ↓
    User completes/skips all steps
    ↓
    updateUser({ ...profile, onboardingComplete: true })
    ↓
    TabNavigator
  NO → Continue
  ↓
authenticated === false?
  YES → AuthScreen (Supabase login/signup)
  NO → Continue
  ↓
TabNavigator → HomeScreen
```

---

### Posture Assessment Flow

```
HomeScreen → Quick Action: "Body Scan"
  ↓
PostureScreen
  ↓
"Capture New Checkpoint" button
  ↓
expo-image-picker (4 angles: anterior, posterior, lateral_left, lateral_right)
  ↓
"Submit for Analysis" button
  ↓
checkpointService.createCheckpoint({ photos: [...], status: 'pending' })
  ↓
useCheckpoints → analyzing = true
  ↓
bodyAnalysisService.analyzeCheckpointPhotos() (2-3s mock delay)
  ↓
Returns: photos with analysisResults (score, issues)
  ↓
checkpointService.updateCheckpoint({ status: 'completed', photos: [...] })
  ↓
useCheckpoints → analyzing = false
  ↓
PostureScreen shows completed checkpoint
  ↓
Tap checkpoint card → BodyScanResultScreen
  ↓
Display: BodyBlueprint with highlighted issues + AI summary
```

---

### Real-Time Analysis Flow (Analyze Mode)

```
CameraScreen → Mode: Analyze
  ↓
AnalyzeModeView mounts
  ↓
Camera starts with frameProcessor={poseFrameProcessor}
  ↓
Frame processor runs at ~10 FPS (runAtTargetFps)
  ↓
Native detectPose plugin called (MediaPipe PoseLandmarker)
  ↓
Plugin returns 33 landmarks (x, y, z, visibility)
  ↓
usePoseDetection.onPoseDetected() receives result
  ↓
Confidence gating (enter threshold, stable frames)
  ↓
EMA smoothing applied
  ↓
Form analysis (every 3rd frame)
  ↓
Single batched setState
  ↓
SkeletonOverlay renders 33 dots + lines
  ↓
FormScoreHUD shows score (0-100)
  ↓
CoachingCaption shows cue ("Keep your back straight")
  ↓
useCoachingAudio plays TTS cue (first at 2.5s, then 5-10s intervals)
  ↓
FeedbackPanel shows joint-level quality indicators
```

---

### Workout Session Flow

```
HomeScreen → "Start Workout" button
  ↓
WorkoutSessionScreen (planDayId)
  ↓
Load exercises from plan
  ↓
Display exercise list + active set logger
  ↓
User logs set (weight, reps, RPE)
  ↓
Checkbox marks set complete
  ↓
User taps "Camera" icon → CameraScreen (Analyze mode)
  ↓
Real-time form feedback during set
  ↓
Return to WorkoutSessionScreen
  ↓
User completes all exercises
  ↓
"Complete Workout" button
  ↓
Mood selector (great/good/okay/tough)
  ↓
Optional notes input
  ↓
workoutService.logSession({ exercises: [...], mood, notes, completedAt })
  ↓
activityService.logActivity({ type: 'workout', ... })
  ↓
Navigate back to HomeScreen
  ↓
Activity feed updated
```

---

---

## ⚡ Performance Guidelines

### Critical Optimizations Applied

1. **Progressive Rendering**
   - Use `InteractionManager.runAfterInteractions()` to defer data fetches
   - Show Skeleton placeholders during loading
   - Example: HomeScreen defers activity feed until screen transition completes

2. **Batched State Updates**
   - NEVER call setState multiple times in sequence
   - Batch related state into single object update
   - Example: `usePoseDetection` batches pose + formScore + jointQualities + feedback

3. **Native Driver Animations**
   - Use `useNativeDriver: true` for transform/opacity animations
   - Avoid animating layout properties (width, height, padding)
   - Example: ConstellationBackground uses native-driver opacity pulses

4. **Memoization**
   - Wrap expensive components in `React.memo`
   - Example: SkeletonOverlay wrapped in memo to prevent re-renders

5. **Worklet Throttling**
   - Frame processors use `runAtTargetFps(10, ...)` to cap at 10 FPS
   - Avoid logging in worklets (causes serialization overhead)

6. **Form Analysis Throttling**
   - Only run form analysis every 3rd pose update
   - Cache last analysis result for skipped frames

7. **Keep Heavy Views Mounted**
   - AnalyzeModeView stays mounted (hidden via `display:'none'`) to avoid TFLite reload
   - Use `isActive` prop to control camera lifecycle, not unmount/remount

8. **Avoid Over-Rendering**
   - Use `useCallback` for event handlers passed to children
   - Use `useMemo` for expensive calculations
   - Avoid inline object/array creation in render

---

### Performance Anti-Patterns to Avoid

❌ **Multiple setState calls in sequence**
```tsx
// BAD
setState1(value1);
setState2(value2);
setState3(value3);

// GOOD
setState(prev => ({
  ...prev,
  field1: value1,
  field2: value2,
  field3: value3,
}));
```

❌ **Logging in worklets**
```tsx
// BAD
'worklet';
console.log('Frame processed'); // Serialization overhead

// GOOD
// No logging, or use telemetry counters
```

❌ **Unmounting heavy components**
```tsx
// BAD
{mode === 'analyze' && <AnalyzeModeView />} // Reloads TFLite model

// GOOD
<AnalyzeModeView isActive={mode === 'analyze'} style={{ display: mode === 'analyze' ? 'flex' : 'none' }} />
```

❌ **Animating layout properties**
```tsx
// BAD
Animated.timing(width, { toValue: 200, useNativeDriver: true }) // Error

// GOOD
Animated.timing(opacity, { toValue: 1, useNativeDriver: true })
```

---

---

## 🧪 Testing & Debugging

### Debug Modes

**Demo Mode Testing**:
- No camera/mic permissions needed
- Videos auto-loop with simulated metrics
- TTS coaching audio still plays
- Useful for UI/UX testing without ML overhead

**Real Mode Testing**:
- Requires physical device (Expo Go not supported)
- Run: `npx expo run:ios --device`
- Check Xcode console for native logs
- Metro logs show JS-side pose detection telemetry

---

### Common Issues

**Issue**: Skeleton overlay never appears (stuck at "Step into frame")

**Diagnosis**:
1. Check Metro logs for `[PoseFrameProcessor] worklet tick` — if missing, frame processor not running
2. Check Xcode console for `MediaPipePosePlugin: frame ...` — if missing, native plugin not called
3. Verify `react-native-vision-camera` has `enableFrameProcessors: true` in app.json
4. Verify `$VCEnableFrameProcessors = true` in ios/Podfile
5. Rebuild: `npx expo prebuild --platform ios --clean && npx expo run:ios --device`

**Root Cause**: Usually frame processor disabled in native build OR camera `pixelFormat` incompatible with MediaPipe (use `rgb`, not `yuv`).

---

**Issue**: TFLite model reloads on every mode switch (lag)

**Diagnosis**: AnalyzeModeView being unmounted/remounted.

**Fix**: Keep AnalyzeModeView mounted always, hide via `display:'none'`.

---

**Issue**: `setItem(key, null)` not clearing storage

**Diagnosis**: AsyncStorage stores `"null"` string, not actual null.

**Fix**: Use `removeItem(key)` instead.

---

**Issue**: Overlay upside-down or rotated

**Diagnosis**: MediaPipe returns landmarks in sensor orientation, not UI orientation.

**Fix**: Native plugin applies portrait normalization + 180° flip in `MediaPipePosePlugin.swift`.

---

---

## 📚 Developer Onboarding Checklist

### Prerequisites
- [ ] macOS with Xcode 15+
- [ ] Node.js 18+
- [ ] iOS device (physical, not simulator — camera required)
- [ ] Apple Developer account (for device provisioning)
- [ ] ElevenLabs API key (for TTS, optional for demo mode)
- [ ] Supabase project (for auth/data sync, optional for local dev)

### Setup Steps
1. Clone repo: `git clone <repo-url>`
2. Install deps: `npm install`
3. Install pods: `cd ios && pod install && cd ..`
4. Create `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_ELEVENLABS_API_KEY=...
   ```
5. Prebuild: `npx expo prebuild --platform ios --clean`
6. Run on device: `npx expo run:ios --device`
7. Select device from Xcode device list
8. Wait for Metro bundler to start
9. App launches on device

### First Run
1. Select **Demo Mode** (no permissions needed)
2. Complete onboarding (can skip all steps)
3. Navigate to HomeScreen
4. Tap "Record" → CameraScreen → Demo tab
5. Watch demo video with simulated metrics
6. Tap "Body Scan" → PostureScreen → Capture New Checkpoint
7. Submit 4 photos → wait for mock analysis
8. View results in BodyScanResultScreen

---

---

## 🚀 Future Roadmap

### Phase 1: Core ML Pipeline (Current)
- [x] MediaPipe PoseLandmarker integration
- [x] Real-time skeleton overlay
- [x] Form scoring algorithm
- [x] Coaching cue generation
- [x] TTS audio feedback
- [ ] Pose correction model training (arrows overlay)

### Phase 2: Cloud Compute
- [ ] Upload mode: Cloud video analysis (Google Cloud Run + MediaPipe)
- [ ] Workout recording → cloud processing → form report
- [ ] Checkpoint photo processing (real ML, not mock)
- [ ] Exercise library with reference videos

### Phase 3: Social & Gamification
- [ ] Leaderboards (form score, streak)
- [ ] Achievement system (badges, milestones)
- [ ] Share workouts (social feed)
- [ ] Coach-athlete connections

### Phase 4: Advanced Analytics
- [ ] Range of motion tracking
- [ ] Tempo analysis (eccentric/concentric)
- [ ] Movement pattern recognition (squat depth, bar path)
- [ ] Injury risk prediction (asymmetries, compensations)

### Phase 5: Platform Expansion
- [ ] Android support (MediaPipe Tasks Vision Android SDK)
- [ ] Web dashboard (progress tracking, analytics)
- [ ] Wearable integration (Apple Watch, Whoop)

---

---

## 🎯 Brand Voice & Messaging

### Tone
- **Clinical Precision**: Data-driven, scientific, but not academic
- **Empowering**: "Your body. Optimized." not "Fix your posture."
- **Futuristic**: Neural blueprint aesthetic, AI-powered
- **Accessible**: Complex ML hidden behind intuitive UX

### Copywriting Guidelines
- **Headlines**: Bold, imperative, max 3 words ("Body Scan", "Start Workout")
- **Descriptions**: Concise, benefits-focused, max 10 words ("AI intelligence to optimize your movement")
- **Errors**: Never blame user, offer solutions ("Step into frame" not "No person detected")
- **Success**: Celebrate, but don't patronize ("87/100 Form Score" not "Great job!")

### Example Copy

**HomeScreen Hero**:
> Good morning, Neo
> Your body. Optimized.

**Quick Actions**:
- Body Scan · AI intelligence
- Record · Film your set
- Ask Coach · AI guidance

**Posture Assessment**:
> Your body's alignment map
> Capture from 4 angles to unlock posture insights

**Coaching Cue**:
> Keep your back straight
> *(Not: "You need to straighten your back")*

**Empty State**:
> No sessions yet
> Your workout history and form scores will appear here
> *(Not: "You haven't worked out yet")*

---

---

## 📦 Assets Reference

### Images
- **Logo Square**: `assets/grey-logo-cropped-square3.png` (674KB, transparent PNG)
- **Logo Landscape**: `assets/logo-landscape.jpeg` (237KB)
- **Blueprint Vertical**: `assets/bodyos-blueprints-vertical-shaped.png` (2.88MB, hero image)
- **Blueprint Landscape**: `assets/bodyos-blueprints-landscape.jpeg` (318KB)
- **Loading Screen**: `assets/loading-screen.png` (2.75MB, full-screen splash)
- **Color Landscape**: `assets/color-landscape.png` (2.88MB, alternate splash)

### Videos
- **Lunge**: `assets/demo-videos/lunge.mp4`
- **Push-Up**: `assets/demo-videos/pushup.mp4`
- *(Note: Demo mode plays these on loop with simulated metrics)*

### Icons
- **App Icon**: `assets/grey-logo-cropped-square2.png` (1.86MB)
- **Splash Icon**: `assets/splash-icon.png` (17KB)
- **Favicon**: `assets/favicon.png` (1.4KB)

### ML Models
- **Pose Landmarker**: `assets/models/pose_landmarker_lite.task` (MediaPipe model)
- **iOS Bundle**: `ios/BodyOS/pose_landmarker_lite.task` (copied to Xcode resources)

---

---

## 🔐 Security & Privacy

### Permissions
- **Camera**: Required for Analyze mode and checkpoint capture
- **Microphone**: Required for workout recording (Upload → Record sub-mode)
- **Photo Library**: Required for saving workout videos and checkpoint photos

### Data Storage
- **Local**: AsyncStorage (user profile, settings, workouts, checkpoints)
- **Cloud**: Supabase (auth tokens, synced data)
- **Cache**: FileSystem.cacheDirectory (TTS audio, temp videos)

### Privacy Principles
1. **On-Device First**: Pose detection runs locally (no video upload in Analyze mode)
2. **Explicit Consent**: Permissions requested with clear explanations
3. **Data Ownership**: User can export/delete all data
4. **No Tracking**: No analytics/tracking in demo mode
5. **Optional Cloud**: App fully functional offline (local storage only)

### Permission Prompts
- **Camera**: "BodyOS needs camera access to analyze your posture and form"
- **Microphone**: "BodyOS needs microphone access to capture audio with your workout recordings"
- **Photo Library**: "BodyOS saves workout recordings to your camera roll"

---

---

## 🛠️ Build & Deployment

### Development Build
```bash
# Start Metro bundler
npx expo start

# Build and run on iOS device
npx expo run:ios --device

# Build and run in Xcode (for native debugging)
open ios/BodyOS.xcworkspace
```

### Production Build
```bash
# Prebuild (generate native projects)
npx expo prebuild --platform ios --clean

# Build with Expo EAS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Build Profiles (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

---

## 📞 Support & Contact

### GitHub Issues
Report bugs, request features: [github.com/LaoWater/bodyos/issues](https://github.com/LaoWater/bodyos/issues)

### Developer
- **Name**: Raul Baciu (Neo)
- **GitHub**: [@LaoWater](https://github.com/LaoWater)
- **LinkedIn**: [raul-baciu-918ab213a](https://linkedin.com/in/raul-baciu-918ab213a)
- **Location**: Cluj-Napoca, Romania

### Stack Overflow
Tag questions with: `react-native`, `expo`, `mediapipe`, `pose-detection`

---

---

## 🏁 Quick Start (TLDR)

**For Product Managers**:
> BodyOS turns your phone camera into an AI movement coach. Real-time pose detection + audio feedback. Glassmorphic UI. Demo mode = no permissions. Real mode = live ML analysis.

**For Designers**:
> Glassmorphism + neural blueprint aesthetic. Teal accent (#5B7CFA), dark space background (#0E0F12). Inter font. Frosted glass cards with gradient borders. BodyBlueprint SVG = skeleton wireframe. Assets in `/assets/`.

**For Developers**:
> React Native + Expo (Dev Builds). MediaPipe PoseLandmarker (iOS native). Vision Camera frame processor at 10 FPS. Pose → form analysis → skeleton overlay. TTS coaching via ElevenLabs. AsyncStorage + Supabase. Glass components in `/src/components/glass/`. Run: `npx expo run:ios --device`.

**For Users**:
> 1. Select Demo/Real mode
> 2. Complete onboarding (skip all OK)
> 3. Tap "Record" → see skeleton overlay
> 4. Get real-time form feedback
> 5. Track posture evolution

---

---

## 📖 Appendix: File Structure

```
GymCam/
├── App.tsx                        # Root component
├── app.json                       # Expo config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── babel.config.js                # Babel config
├── eas.json                       # EAS Build config
│
├── assets/                        # Images, videos, models
│   ├── grey-logo-cropped-square3.png
│   ├── bodyos-blueprints-vertical-shaped.png
│   ├── loading-screen.png
│   ├── demo-videos/
│   │   ├── lunge.mp4
│   │   └── pushup.mp4
│   └── models/
│       └── pose_landmarker_lite.task
│
├── ios/                           # Native iOS project (generated)
│   ├── BodyOS.xcworkspace
│   ├── BodyOS/
│   │   ├── MediaPipePosePlugin.swift
│   │   ├── MediaPipePosePlugin.m
│   │   ├── BodyOS-Bridging-Header.h
│   │   └── pose_landmarker_lite.task
│   └── Podfile
│
└── src/
    ├── components/
    │   ├── glass/                 # GlassCard, GlassButton, GlassTabBar
    │   ├── camera/                # Mode views, overlays, HUDs
    │   ├── pose/                  # SkeletonOverlay, CorrectionArrows
    │   ├── layout/                # ScreenContainer, SectionHeader, ConstellationBackground
    │   └── ui/                    # FeatureCard, MetricCard, Skeleton, etc.
    │
    ├── screens/                   # All screen components
    │   ├── HomeScreen.tsx
    │   ├── CameraScreen.tsx
    │   ├── PostureScreen.tsx
    │   ├── OnboardingScreen.tsx
    │   └── ...
    │
    ├── navigation/
    │   ├── AppNavigator.tsx       # Root navigator
    │   ├── TabNavigator.tsx       # Bottom tabs
    │   └── types.ts               # Navigation types
    │
    ├── context/
    │   ├── AppContext.tsx         # Global app state
    │   └── AuthContext.tsx        # Auth state
    │
    ├── hooks/
    │   ├── usePoseDetection.ts    # Pose ML hook
    │   ├── useCoachingAudio.ts    # TTS hook
    │   ├── useAssessments.ts      # Posture data
    │   ├── useWorkouts.ts         # Workout data
    │   └── ...
    │
    ├── services/
    │   ├── storage.ts             # AsyncStorage wrapper
    │   ├── userService.ts         # User CRUD
    │   ├── checkpointService.ts   # Checkpoint CRUD
    │   ├── workoutService.ts      # Workout CRUD
    │   ├── aiService.ts           # AI coach API
    │   ├── elevenLabsTTS.ts       # TTS API
    │   └── supabase.ts            # Supabase client
    │
    ├── utils/
    │   ├── poseFrameProcessor.ts  # Vision Camera worklet
    │   ├── formAnalysis.ts        # Form scoring algorithm
    │   ├── framingCheck.ts        # Body framing validation
    │   ├── cueGenerator.ts        # Coaching cue logic
    │   └── permissions.ts         # Permission helpers
    │
    ├── types/
    │   ├── models.ts              # All data models
    │   └── pose.ts                # Pose types
    │
    ├── data/
    │   ├── coachingCueBank.ts     # Coaching cue templates
    │   └── demoExercises.ts       # Demo mode exercises
    │
    └── theme/
        ├── colors.ts              # Color palette
        ├── typography.ts          # Font styles
        ├── spacing.ts             # Spacing scale
        ├── shadows.ts             # Shadow styles
        └── index.ts               # Unified theme export
```

---

---

**END OF SPECIFICATION**

*Version 1.0.0 — Last Updated: 2026-02-12*

---

## Quick Reference Card

```
PROJECT: BodyOS
TECH: React Native 0.81.5 + Expo SDK 54
ML: MediaPipe PoseLandmarker (iOS Native)
DESIGN: Glassmorphism + Neural Blueprint
COLORS: Teal (#5B7CFA), Dark (#0E0F12)
FONT: Inter (Regular/Medium/SemiBold/Bold)
MODES: Demo (videos) | Real (live camera)
FPS: 10 (frame processor throttled)
FORM: 0-100 score, every 3rd frame
TTS: ElevenLabs Adam voice
STORAGE: AsyncStorage (local) + Supabase (cloud)
BUILD: npx expo run:ios --device
ASSETS: /assets/ (logos, videos, models)
```

---

*"Your body. Optimized."*
