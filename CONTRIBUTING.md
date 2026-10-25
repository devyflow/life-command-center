# Contributing

## Working agreement

1. Create a branch from the latest `main`, using a clear name such as `feature/weekly-review` or `fix/mobile-paper-zoom`.
2. Make one focused change per branch.
3. Run `npm run check` before pushing.
4. Open a pull request into `main` and explain the user problem, resulting behavior, and validation performed.
5. Review the Vercel preview on desktop and mobile.
6. Merge only after the checks pass and the owner approves the change.

## Pull request expectations

- Preserve existing user data and provide safe defaults for new fields.
- Keep capture fast and advanced settings optional.
- Test important state transitions rather than duplicating implementation details.
- Never commit passwords, tokens, `.env.local`, user data, recovery codes, or private links.
- Avoid direct pushes to `main` after branch protection is enabled.

## Definition of done

- The behavior works on desktop and an installed mobile web app.
- Keyboard and touch controls remain usable.
- Existing saved work migrates safely.
- `npm run check` passes.
- The pull request preview has been reviewed.
- User-facing changes are reflected in the changelog when appropriate.

