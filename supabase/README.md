# Optional data and coaching foundation

The web demo does not require a database. Connect your own Supabase project only when you are ready to integrate real accounts and data. Start with a new empty project; the SQL is historical schema setup, not an idempotent production upgrade.

Review and apply these scripts in order using your project's SQL editor:

1. `migration.sql`
2. `bodyos_database_expansion.sql`
3. `archetype_checkpoint_migration.sql`

Review the policies and exercise your intended paths with two separate users before handling client records. The mobile local history and some web adapters need integration; see `../docs/STATUS.md`. Do not apply these scripts blindly to an existing installation.

The optional `chat-coach` function verifies the caller's session and conversation ownership before accessing messages. Deploy it with JWT verification enabled. Configure `OPENAI_API_KEY` as a Supabase function secret; the platform supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never copy these secrets into the web or mobile app. The provider may charge for calls; add the usage controls appropriate for your installation before making it public.

No live database is changed by cloning this repository. Schema and function changes require the installation owner's authorization.
