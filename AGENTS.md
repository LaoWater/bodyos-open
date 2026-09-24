# Working on BodyOS

Read README.md, docs/STATUS.md and the README of the folder you will change. Ask what the user wants to achieve and match your explanation to their technical experience. Make the smallest coherent change and give a short way to inspect it.

## Map
- apps/web: React / TypeScript / Vite; start with `npm run dev`.
- apps/mobile: Expo / React Native, plus custom native iOS sources. Never regenerate or delete `ios/` without preserving and explaining the native plugin changes. Do not use `expo prebuild --clean` as a routine step.
- ml: Python research; work from that folder, notebooks from `ml/notebooks`.
- supabase: optional SQL and server functions. Read its README before proposing a database change.

Keep demo and connected behavior explicit. Do not turn simulated measurements into clinical claims, or describe unconnected data as synchronized. Preserve user changes. Do not read out credentials. Use `.env.example` placeholders; provider secrets belong on a server.

Do not install dependencies for unrelated parts. Do not run builds, lint, type checks, database environments or deploy unless the user asks. Use the dev server for visual review when available. Before a paid service, live database change, deployment or publication, explain the target and effect and obtain the user's authorization. Existing authorization remains valid.

Maintain the English public docs when behavior changes. Record known limitations in docs/STATUS.md, not an accumulating agent diary. Contributions use the root license; preserve third-party notices. Do not change release terms on the user's behalf without an explicit request.
