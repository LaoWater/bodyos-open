# How the pieces fit

```mermaid
flowchart LR
  Camera[iOS camera] --> Native[Swift / MediaPipe]
  Native --> Landmarks[33 landmarks]
  Landmarks --> Mobile[React Native training UI]
  Mobile --> Local[Local workout and checkpoint storage]
  Mobile --> Coach[Optional chat-coach function]
  Coach --> DB[(Supabase Postgres / Auth)]
  Coach --> AI[AI provider]
  Web[React web workspace] --> Demo[Sample data adapter]
  Web -. integration adapters .-> DB
  Research[Python research] --> Train[Label / train / export]
```

The solid paths describe implemented code paths; the web adapters require integration work described in [Status](STATUS.md). The native camera produces coordinates on the device. Mobile React state and the geometric analysis functions consume them. AsyncStorage keeps local training history.

Supabase holds the account and conversation foundation, with SQL for sessions, plans and checkpoints. The optional coaching function verifies the caller and conversation owner before reading messages or invoking its provider. Keep provider keys in server secrets.

The ML workspace is independent of the running apps. Its notebooks describe a custom phase/correction model using normalized landmarks and an exercise identifier. Training and exporting that model does not automatically connect it to the mobile runtime.
