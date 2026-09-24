# BodyOS mobile

Expo / React Native, with a custom Swift camera plugin for iOS.

```sh
npm ci
npm start
```

The development server alone cannot provide the native pose plugin in Expo Go. For the camera path, use macOS with Xcode, install CocoaPods dependencies from `ios/`, open the BodyOS workspace and choose your signing team and device. The checked-in native sources must be kept.

Download `pose_landmarker_lite.task` from the [official MediaPipe Pose Landmarker models page](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker#models), place it in `ios/BodyOS/` and ensure it is included in Copy Bundle Resources. Review the model's terms. See [the native integration guide](ML_deployment_ios_guide.MD). Do not run `expo prebuild --clean`: it can remove the manual native integration.

Copy `.env.example` to `.env.local` only if you want your own Supabase connection. Provider secrets must never be put in `EXPO_PUBLIC_*` variables. The old direct voice-provider integration is disabled in the community edition; use a server proxy if you add voice.

Android UI code is included; Android native pose integration is not supplied. Workout/checkpoint history is stored locally. See [the release scope](../../docs/STATUS.md) before connecting real clients.
