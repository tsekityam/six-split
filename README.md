# Mark Six Bet Slip Generator

Web app that takes a **total bet amount** and randomly generates Hong Kong Mark Six slips — **單式 / 複式 / 膽拖**, **一注 ($10) / 半注 ($5)** — whose stakes sum to that amount.

UI uses Google’s official **Material Web** components (`@material/web` — Material 3 web components), Roboto, and MD3 system color tokens.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default port **3847**).

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or run the workflow manually under **Actions**)

Site URL (after the first successful deploy):

`https://tsekityam.github.io/six-split/`

## How it works

| Type | Meaning |
|------|---------|
| 單式 | Exactly 6 numbers → 1 combination |
| 複式 | 7–14 numbers → C(n, 6) combinations |
| 膽拖 | Bankers + drags → C(拖, 6−膽) combinations |
| 一注 / 半注 | $10 or $5 per combination |

Remaining dollars that are not a multiple of $5 are left unspent.

Entertainment only — not affiliated with HKJC.
