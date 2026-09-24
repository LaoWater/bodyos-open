# BodyOS web

From this folder, use Node.js 22+:

```sh
npm ci
npm run dev
```

Choose **Try Demo** on the landing page. It uses the sample adapter and needs no environment file. To connect your own backend, copy `.env.example` to `.env.local`, fill in your own Supabase URL and public anon key, and read `../../supabase/README.md` and `../../docs/STATUS.md` first.

`src/pages/Landing.tsx` carries the community landing; the rotating hero cards remain in its existing visual components. `src/adapters` separates demo and real data. `src/stores` holds mode and authentication. Real adapters are a starting point: map them to your schema before using client data.

The existing scripts include `build`, `lint` and `preview`; run them when explicitly requested by the operator. The maintainer reviews UI changes through the dev server.

The App Engine configuration expects `dist/`. For a cloud build, the root `cloudbuild.web.yaml` installs and builds only this app, then deploys a preview with no live traffic to the explicitly selected GCP project. Follow [the deployment guide](../../docs/DEPLOYMENT.md) to review and promote it. It builds demo mode without production credentials. Hosting costs belong to the operator.
