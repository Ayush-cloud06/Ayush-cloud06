# Stufe — German A1 → A2

A desktop app for getting from beginner German to CEFR A2 without the hand-holding.
Tauri 2 + Svelte 5, data stored locally in SQLite, spaced repetition with FSRS.

- **24 units** (12 × A1, 12 × A2), 853 vocabulary items (749 unique), 612 exercises.
  Cheat-sheet-style grammar notes with tables; nothing is locked.
- **"I already know this unit"** pushes a unit's words straight into spaced review, so you can skip ahead.
- **Production first**: most exercises are typed English → German. Nouns need the right article.
  The checker is lenient on typos, capitalisation and missing umlauts (marked "almost"), but strict on grammar (den/dem, endings).
- **Reviews**: two cards per word (recognise, then produce). The production card arrives 2 days after you first see the word.
- **No hearts, no streak guilt, no confetti.** Today / Units / Vocab / Stats / Settings, all keyboard driven
  (`t u v s ,` · Enter · Space · 1–4 · Alt+a/o/u/s for ä ö ü ß).
- Export and import all your data as JSON.

## Run it

```bash
cd german-a2
npm install
npm run dev          # in the browser at http://localhost:1420 (localStorage, quick to try)
npm run tauri dev    # real desktop app (SQLite) — needs Rust + OS prerequisites below
npm run tauri build  # installer in src-tauri/target/release/bundle/
```

**Prerequisites for the desktop build:** Node 22.18+, Rust (rustup), and:
- Windows: "Desktop development with C++" build tools (WebView2 is already on Windows 10/11)
- macOS: `xcode-select --install`
- Ubuntu/Debian: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

**No local Rust?** Run the **Build Stufe** workflow from the repo's Actions tab (manual trigger).
It builds Windows, macOS and Linux installers and attaches them as artifacts.

## Checks

```bash
npm test                  # 90 vitest tests (answer checker, SRS, storage, real-content answers)
npm run check             # svelte-check
npm run validate:content  # content schema + id uniqueness
```

## Layout

| Path | What |
|---|---|
| `src/content/units/*.ts` | Curriculum, one file per unit (contract in `src/content/types.ts`) |
| `src/lib/` | Answer checker, FSRS scheduling, storage (SQLite / localStorage), content index |
| `src/views/`, `src/components/` | Screens |
| `src-tauri/` | Desktop shell (Rust, plugin-sql, capabilities) |
| `docs/DESIGN.md` | Design decisions and what is still unverified |

## Status

Built and tested in a browser (unit tests, type check, production build, Playwright smoke test).
The Rust/desktop shell has **not yet been compiled**: the dev container lacks the GTK/WebKit libraries.
The first `npm run tauri dev` on your machine, or the CI workflow, is its first real run.
Content was AI-written and checked against an automated schema, not by a native speaker. Report anything that sounds off.
