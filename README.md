# BodyOS

A gift from [MGLO Software](https://mglo-software.com) to the fitness community.

A web workspace, a mobile training app, native iOS pose detection, a Supabase data foundation and the Python research behind the movement work. Take the parts you need, adapt them to your practice, and share what you learn.

[Explore the demo](https://bodyox.ey.r.appspot.com/) · [Start here](docs/START_HERE.md) · [Customize with an agent](docs/CUSTOMIZE.md) · [Contribute](CONTRIBUTING.md)

## Try the web app

For a guided start, run `node scripts/start-web.mjs` from the repository root. It asks before installing the web dependencies, then starts the demo. The manual steps are below.

With Node.js 22+ installed, open a terminal in this folder:

```sh
cd apps/web
npm ci
npm run dev
```

Open the address Vite prints and choose **Try Demo**. No account, API key or database is needed for the sample workspace. Hosting and optional AI providers have their own costs.

## Find your part

| Folder | Contents |
| --- | --- |
| [apps/web](apps/web) | React, TypeScript, Vite: landing, sessions, checkpoints, workout planning and coaching interface |
| [apps/mobile](apps/mobile) | Expo / React Native with native Swift MediaPipe pose detection on iOS |
| [ml](ml) | Landmark extraction, labeling, normalization, model training and export research |
| [supabase](supabase) | SQL for profiles, sessions, plans and conversations; optional coaching function |
| [docs](docs) | Setup, architecture, customization and release scope |

The web demo contains sample data. The mobile camera has native pose detection; its workout and checkpoint history is local. The custom correction model is research code, not a supplied trained model. [The short scope note](docs/STATUS.md) explains the boundaries before you connect real clients.

## Yours to adapt

Use BodyOS personally or in your gym, training or coaching business, including with paying clients. You may pay someone to customize it for you and share your modifications free of charge. You may not resell the software or offer it as a competing software service. See the [BodyOS Community License](LICENSE) for the full terms.

These are **source-available community terms**, not an OSI open-source license. Prior MIT grants remain valid for copies already received under them; see [the license history](docs/licenses/README.md).

Tell us what you changed. A clearer screen, a better setup guide or an exercise you understand well is a useful contribution.
