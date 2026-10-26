# V1 release checklist

## Product

- [ ] A new user understands Capture → This Week → Today → Work Now → Review without explanation.
- [ ] Five external testers use real tasks for seven days.
- [ ] Add, edit, schedule, progress, complete and restore work on desktop and mobile.
- [ ] Paper is safe to scroll and zoom while locked.
- [ ] OCR corrections take less effort than manual re-entry for a typical page.
- [ ] Empty states and task-signal meanings are clear.

## Trust and data

- [ ] Every person has an isolated account and workspace.
- [ ] Any owner or support access is clearly disclosed.
- [ ] Keep-me-signed-in, logout, recovery codes and session revocation are verified.
- [ ] Export, backup and restore are tested with real workspace data.
- [ ] Two-device edits either merge safely or produce a clear recovery path.
- [ ] No credentials, user data or private links are present in Git history.

## Engineering

- [ ] `npm run check` passes from a clean checkout.
- [ ] GitHub Actions passes on `main` and on a teammate pull request.
- [ ] Vercel produces a preview for the pull request.
- [ ] Merging into `main` deploys production automatically.
- [ ] The installed PWA receives the new cache generation after deployment.
- [ ] Production login, sync, scan and core task flows pass a final smoke test.

## Release

- [x] Publish the source under GNU AGPL v3 before opening the repository.
- [ ] Update `package.json` from `0.9.0` to `1.0.0`.
- [ ] Move the Unreleased changelog items into a `1.0.0` section.
- [ ] Create and push the signed tag `v1.0.0`.
- [ ] Publish release notes with the live URL and known limitations.
- [ ] Keep a rollback-ready Vercel deployment from the previous stable commit.

