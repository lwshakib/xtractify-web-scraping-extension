# Contributing to Xtractify

Thanks for your interest in contributing to **Xtractify**. This repo is a monorepo with a Chrome extension and a web landing page.

## Quick links

- **Project overview**: `README.md`
- **Code of conduct**: `CODE_OF_CONDUCT.md`

## Repo layout

- **Chrome extension**: `apps/chrome-extension`
- **Landing page (Next.js)**: `apps/web`
- **Shared UI package**: `packages/ui`

## Prerequisites

- **Node.js**: 20+
- **pnpm**: 9.15.9 (recommended; see root `package.json`)

## Development setup

1. Fork the repository (GitHub UI)
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/xtractify-web-scraping-extension.git
cd xtractify-web-scraping-extension
```

3. Install dependencies:

```bash
pnpm install
```

4. Run dev mode:

```bash
pnpm dev
```

## How to run the extension locally

### Build → load unpacked

1. Build the extension:

```bash
pnpm --filter xtractify-web-scraping-extension build
```

2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select: `apps/chrome-extension/dist`

### Dev mode (Vite) notes

The extension app uses Vite + CRX tooling. In development you may need to reload the extension after rebuilds depending on your Chrome version.

## Useful commands

These are the same checks run in CI.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

## Working on a change

## Contribution types

- **Bug fixes**: include a reproduction and expected vs actual behavior.
- **UI changes**: include screenshots in both light and dark mode.
- **Docs**: update `README.md` and/or add sections to `CONTRIBUTING.md`.

### Create a feature branch

Create a new branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/<short-topic>
```

Examples:
- `feat/theme-sync`
- `fix/sidepanel-crash`
- `docs/install-guide`

### Keep your branch in sync

```bash
git fetch origin
git rebase origin/main
```

### Make changes

Keep changes focused and small. If your work is large, split into multiple PRs.

### Verify locally before opening a PR

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

### Project conventions

- **Theme**: UI should follow system theme (light/dark) without hardcoding colors.
- **Docs**: keep installation steps accurate for Windows users too.
- **Monorepo scripts**: CI expects `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`.

## Commit messages

Use clear, conventional-style messages when possible:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`

## Open a Pull Request

1. Push your branch:

```bash
git push -u origin HEAD
```

2. Open a PR into `main` via GitHub.
3. In the PR description include:
   - What changed and why
   - Screenshots for UI changes (if applicable)
   - How to test

### PR checklist

- [ ] `pnpm format:check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] Screenshots included for UI changes
- [ ] No build outputs committed (e.g. `dist/`, `.next/`)

## Syncing your fork

If you need to pull changes from upstream:

```bash
git remote add upstream https://github.com/lwshakib/xtractify-web-scraping-extension.git
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main
```

