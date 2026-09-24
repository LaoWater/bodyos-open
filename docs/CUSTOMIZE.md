# Make BodyOS your own

Start small: make the web demo look and sound like your practice, then choose one real workflow to connect.

## With an AI coding assistant

Open the repository in your coding tool. It should read [AGENTS.md](../AGENTS.md). Copy this brief, replace the brackets, and give it to the assistant:

> Read AGENTS.md, docs/STATUS.md and apps/web/README.md. I am a [trainer / gym owner / developer]. My practice is called [name]. I want [one specific change]. Explain your plan in everyday language, implement the smallest useful change and show me how to inspect it. Keep demo data. Do not connect paid services or deploy anything without asking me. Do not run builds or checks unless I ask.

Try: change colours and the welcome copy; add your exercise instructions; simplify a screen for first-time clients. Describe the result you want rather than guessing filenames.

## By hand

The web landing is `apps/web/src/pages/Landing.tsx`; shared styling lives in its `src` folder. The web demo and real adapters are separate. Mobile screens and services live under `apps/mobile/src`. The native camera bridge is under `apps/mobile/ios/BodyOS`.

Change one screen, run its dev server and inspect it on a narrow and a wide screen. When connecting real accounts, use a new Supabase project and the setup guide in `supabase/`. Keep secrets out of browser and mobile environment variables. Decide how client records are protected and deleted before collecting them.

The license allows your own business use, including paying fitness clients. Selling the resulting software or a hosted platform for other gyms requires separate permission.
