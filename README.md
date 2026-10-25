# Life Command Center

Life Command Center is a personal productivity workspace designed around one promise: **see everything without letting important work disappear**.

The current build combines quick capture, a Today view, hourly planning, weekly priorities, focus timers, a free-form Paper page, a bulletin board, task-aware knowledge storage, page scanning, progress history, and private time-sharing controls.

## Current status

This repository is a **V1 release candidate** (`0.9.0`). The live prototype is available at [lcc-d.vercel.app](https://lcc-d.vercel.app/).

The intended daily flow is:

1. Capture a thought quickly.
2. Decide whether it belongs to This Week.
3. Choose what belongs to Today.
4. Start the next useful action.
5. Review unclear or repeatedly postponed work.

## Run locally

Requirements:

- Node.js 24
- npm
- A local `.env.local` containing the required private deployment variables

Install and verify:

```bash
npm ci
npm run check
npx vercel dev
```

`npm run check` validates the authenticated workspace, Vercel API behavior, core user experience, and production build.

## Collaboration workflow

Changes should be made on a feature branch and opened as a pull request into `main`. Each pull request must pass the repository checks and be reviewed in its Vercel preview before it is merged.

Once GitHub is connected to the existing Vercel project, branch pushes receive preview deployments and a successful merge into `main` updates production automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/V1_RELEASE_CHECKLIST.md](docs/V1_RELEASE_CHECKLIST.md).

## Deployment

The Vercel project uses:

- Build command: `node scripts/build-vercel.mjs`
- Output directory: `public`
- Production branch: `main`
- Production short URL: [lcc-d.vercel.app](https://lcc-d.vercel.app/)

Deployment secrets must remain in Vercel environment variables. Never commit `.env.local`, passwords, recovery codes, database exports, or user workspace data.

## License

No open-source license has been applied while the product and commercial model are being finalized. See the V1 release checklist before making the repository public.

