# Hybrid Architecture Guide  
## React Frontend + Swift Native Engine (MediaPipe / BlazePose)

**Goal:**  
Keep **UI, frontend logic, and API/database calls** in React  
while running **real-time camera + ML (BlazePose)** natively in Swift.

This document is meant to be handed directly to developers as an **architecture and implementation playbook**.

---

## 1. Core Principle (Non-Negotiable)

React owns **UX and product logic**.  
Swift owns **camera, ML, and real-time performance**.

React must **never** be part of the hot camera / ML loop.

---

## 2. High-Level Architecture

React Layer  
- UI / UX  
- Navigation  
- State management  
- API & database calls  
- User settings  

↓ (typed native bridge)

Native Bridge  
- Minimal API surface  
- Commands + events  

↓  

Swift Engine  
- Camera (AVFoundation)  
- MediaPipe BlazePose  
- GPU / Metal  
- Landmark smoothing  
- Posture math  

---

## 3. Responsibility Split

### React (JavaScript / TypeScript) Owns
- Screens & navigation
- UI rendering and animations
- Authentication
- Backend API calls
- Database reads / writes
- User preferences
- Analytics
- Feature flags
- Business logic

### Swift Owns
- Camera lifecycle
- Frame acquisition
- MediaPipe graphs
- GPU acceleration
- Landmark smoothing
- Posture calculations
- Real-time overlays
- Performance guarantees

React must **not**:
- Process camera frames
- Run pose estimation
- Handle high-frequency (30–60 FPS) data

---

## 4. Data Flow Contract

Swift emits **semantic posture signals**, not raw landmarks.

Bad example (too heavy, unstable):  
- Raw landmarks (33 points × 60 FPS)

Good example (stable, intentional):  
- Head forward angle  
- Shoulder tilt  
- Pelvic tilt  
- Posture score  
- Confidence value  

Swift acts as a **sensor**.  
React acts as the **decision and presentation layer**.

---

## 5. Native Module Interface

### Commands (React → Swift)
- startSession
- stopSession
- setMode (calibration / tracking)
- setSensitivity

### Events (Swift → React)
- postureUpdate  
  - postureScore  
  - headForwardAngle  
  - shoulderTilt  
  - confidence  

- postureStateChange  
  - good / warning / bad  

Event rules:
- Throttle events (≈10–15 Hz)
- Never stream raw frames
- Never block the camera thread

---

## 6. Swift Engine Internal Structure

Recommended module layout:

PostureEngine  
- CameraManager  
- PosePipeline (MediaPipe BlazePose)  
- LandmarkSmoother  
- PostureAnalyzer  
- PostureStateMachine  
- OverlayRenderer  
- BridgeAdapter  

Only the **BridgeAdapter** communicates with React.

---

## 7. Posture Logic Placement

Swift:
- Vector math
- Angle computation
- Temporal smoothing
- State transitions
- Noise rejection

React:
- Visual feedback
- Notifications
- Rewards and streaks
- UX timing
- Copy and language

---

## 8. UI Rendering Strategy

### Option A — Native Overlay (Recommended)
- Swift draws skeletons and posture guides
- React renders UI around the camera view

Benefits:
- Lowest latency
- Highest visual stability

### Option B — Hybrid Overlay
- Swift computes posture
- React renders posture cues

Only acceptable if overlays are low-frequency and non-critical.

---

## 9. Database & API Calls

All backend interaction lives in React:
- Save posture sessions
- Sync statistics
- Fetch user goals
- Upload analytics

Swift must never:
- Call APIs
- Handle auth tokens
- Know backend schemas

---

## 10. App Lifecycle Ownership

React controls:
- Navigation
- Session start / stop
- App mode changes

Swift controls:
- Camera start / pause
- Thermal and performance scaling
- Background safety

Example flow:
- React navigates to Posture Screen  
- React calls startSession  
- Swift initializes camera and pose pipeline  

---

## 11. Performance Rules

- Swift runs at full FPS
- React receives reduced, stable updates
- Never pass images or pixel buffers to JS
- Never block the camera or GPU thread
- Always prefer GPU delegate when available

---

## 12. Build & Tooling Strategy

Recommended:
- Bare React Native
- Visible native iOS project
- Swift code inside ios directory

Expo:
- Allowed only if fully ejected
- No managed workflow assumptions

---

## 13. Testing Strategy

Swift:
- Recorded video replay tests
- Landmark stability analysis
- Posture math unit tests

React:
- Mock posture signals
- UI logic tests
- UX experiments without camera dependency

---

## 14. Migration Path (Expo → Hybrid)

1. Freeze existing Expo UI
2. Eject to bare React Native
3. Add native iOS module
4. Implement Swift posture engine
5. Expose minimal bridge API
6. Gradually replace mocked posture data

---

## 15. One-Line Rule for Developers

If it touches pixels at 60 FPS, it belongs in Swift.  
If it touches users or servers, it belongs in React.

---

## 16. Why This Architecture Scales

- Clear ownership boundaries
- Replaceable ML models
- Fast UI iteration
- Platform-level performance
- App Store compliant
- Long-term maintainability
