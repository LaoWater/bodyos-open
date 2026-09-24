# Community release

Public repository: https://github.com/LaoWater/bodyos-open

The community edition has a clean Git history. The original development checkout retains the older applications under `archive/` and private local assets. Keep that development history private.

To prepare a fresh snapshot, from the development repository run:

```sh
python scripts/export-community.py ../bodyos-release-next
```

Choose a new output folder. The script excludes local environment files, dependency folders, private recordings, generated training data/results, signing settings, editor settings and archives. It clears notebook outputs, removes the Expo project association and clears the Xcode signing team in the snapshot. The mobile demo uses its optional-video fallback until you add your own consented recordings. It reports credential signatures by filename only and stops if any are found. This is a focused check, not a guarantee that every possible secret format is recognized; review the selected files before publishing.

Use `AGENTS.md` and the per-app guides when changing code. The maintainer owns runtime review; the initial community preparation did not run app builds, lint, type checks, native builds or database migrations.

## Hosting

To host your own copy, follow [the deployment guide](DEPLOYMENT.md) using your own cloud project and domain. Publishing source to GitHub and deploying an application are separate actions.

The web deployment builds the sample workspace without production credentials. Review the preview before sending live traffic to a new version. Keep account details, environment configuration and operational notes outside the public repository.
