# Stufe — design notes

## Running

| What | Command | Storage backend |
|---|---|---|
| Browser dev (fast UI work, no Rust needed) | `npm install && npm run dev` → http://localhost:1420 | localStorage |
| Desktop dev | `npm run tauri dev` | SQLite (`stufe.db` in the app data dir) |
| Desktop release build | `npm run tauri build` → installers in `src-tauri/target/release/bundle/` | SQLite |
| Unit tests (vitest) | `npm test` | in-memory KV / fake SQL driver |
| Type check | `npm run check` (svelte-check) | – |
| Content validator | `npm run validate:content` (needs Node ≥ 22.18 for native TS) | – |
| Smoke test | `npm run build && npx vite preview --port 4173 &` then `node tests/smoke.mjs` (env `BASE_URL`, `SHOTS` for screenshot dir) | localStorage |

Dev flag: `?fixtures` in the URL (e.g. `http://localhost:1420/?fixtures#/today`) loads the
test fixture unit **only if** `src/content/units/` is empty. Real content wins otherwise.

## Prerequisites (desktop build)

All: Node 22 (≥ 22.18 for `validate:content`), Rust stable (≥ 1.77.2) via rustup.

- **Windows**: Microsoft C++ Build Tools ("Desktop development with C++"), WebView2 runtime (preinstalled on Win 10/11).
- **macOS**: Xcode Command Line Tools (`xcode-select --install`).
- **Linux (Debian/Ubuntu)**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
  (other distros: see https://v2.tauri.app/start/prerequisites/).

CI: `.github/workflows/stufe-build.yml` (repo root), manual `workflow_dispatch` only, matrix
windows-latest / ubuntu-22.04 / macos-latest, runs validator + tests, builds with
`tauri-apps/tauri-action@v1`, uploads installers as workflow artifacts (no release).

## Versions

Tauri 2: `tauri` 2.12 (lock: 2.12.6), `tauri-build` 2.7 (2.7.5), `tauri-plugin-sql` 2.6.0 (`sqlite` feature)
↔ `@tauri-apps/plugin-sql` ^2.6.0, `@tauri-apps/api` / `@tauri-apps/cli` ^2.12.5.
Frontend: Svelte 5.57, Vite 8.3, vitest 5.1, svelte-check 4.7, TypeScript 6.0 (TS 7 is out but
svelte-check's peer range stops at 6), ts-fsrs 6.0. Playwright pinned to 1.63.0 to match the
preinstalled browser build in this environment (bump freely elsewhere).

## Design decisions

- **Two cards per word**: recognition (de → en, reveal + self-grade) and production (en → de,
  typed, auto-checked, grade suggested: correct → Good, almost → Hard, wrong → Again; the
  learner can override with 1–4).
- **Production cards are delayed**: a word's production card is parked until its recognition
  card is first reviewed, then becomes available **2 days later** (`PROD_DELAY_DAYS` in
  `src/lib/srs.ts`). Reason: typing a word from English the minute you first saw it is mostly
  short-term echo; a short gap makes the first production attempt a real retrieval and keeps
  each day's new-card load from doubling. "I already know this unit" skips the wait (both
  cards get an initial Easy rating).
- **Daily limits count cards**, not words: default 15 new cards/day, 200 reviews/day. Production
  cards count as new cards when first studied.
- **"I already know this unit"** rates every unstudied card Easy, then stretches each due date
  by a random factor 1–2× so the unit doesn't come back all on one day. These synthetic ratings
  are *not* written to the review log (so they don't inflate retention stats or daily counts).
- **Cross-unit duplicates** (units were written in parallel): `src/lib/content.ts` aliases a
  later vocab item to the first occurrence when gender+headword+pos match, it's in a different
  unit, and the English glosses share a meaningful word (stop words and "(…)" asides ignored).
  Cards always use the canonical id, so a word is reviewed once. With the current content:
  853 items → 749 canonical, 104 aliases; 6 same-headword pairs kept as distinct senses
  (e.g. doch "yes (contradicting…)" vs doch particle; Mann "man" vs "husband"; stehen "stand" vs
  "suit"). Unit pages list all their own vocab with an "also in Unit N" marker.
- **Answer checker** (`src/lib/check.ts`): beyond the spec (case → almost, ae/oe/ue/ss → almost,
  Levenshtein typo tolerance, articles must match for nouns) it refuses to call a difference a
  "typo" when it is a grammar difference — a changed/inserted function word (den/dem, in/im…)
  or a changed ending (spielt/spielst, kleiner/kleinen). Missing umlaut dots (Madchen) → almost.
  Inner punctuation only (missing comma) → almost "Punctuation"; order drills ignore commas.
- **Drill scoring**: correct 1, almost 0.5, wrong 0. Hints are free. A full single-unit run
  ≥ 80 % marks the unit "done"; best score is kept. Mixed drills (tick units on the Units page)
  sample 30 drills and don't affect best scores. "Redo misses" doesn't either.
- **Unit status**: not started → in progress (on starting drills or adding vocab) → done (≥ 80 %)
  / marked known. Nothing is locked.
- **Study time**: counted only inside drill/review sessions, from key/mouse activity, pausing
  after 60 s idle; flushed every 15 s and when leaving the session.
- **Migrations**: run from TypeScript at startup for both backends (`PRAGMA user_version` for
  SQLite, a `stufe:schema` key for localStorage). Append to `SQL_MIGRATIONS` /
  `LOCAL_MIGRATIONS` to evolve the schema. Schema = the requested tables plus `cards.created`
  (ordering of new cards) and `review_log.prev_state` (needed for "new today" and retention).
- **Keyboard**: global `t u v s ,` (Today/Units/Vocab/Stats/Settings); Today `r` review,
  `n` learn new, `c` continue; unit page `d` drills, `a` add vocab; sessions: Enter submit/next,
  Space reveal, 1–4 grade (Enter = suggested/Good), 1–n choice, 1–9 add word in order drills
  (when the words contain no digits), `Alt+H` hint (plain `H` when not typing), Esc leave.
  Umlauts: `Alt+a/o/u/s` → ä ö ü ß, with Shift for Ä Ö Ü, plus buttons under inputs.
- **TTS**: Web Speech API, German voices only; speaker buttons hidden if none (on Linux
  WebKitGTK there usually isn't one).

## Unverified / caveats

- **Rust side not compiled here**: `cargo check` resolves and builds dependencies but stops at
  `gdk-sys` because the GTK/WebKit system libraries are missing (apt not allowed). No error came
  from our crate, but `tauri-build`'s capability/permission validation and the app itself were
  never run. First real check is `npm run tauri dev` on a machine with prerequisites, or the CI workflow.
- **SQLite backend** is exercised only by a fake-driver unit test (migrations + SQL shape). Real
  plugin behaviour ($n placeholders, multi-row upsert, `PRAGMA user_version` via `select`) is unverified.
- **Export in the desktop app**: uses a blob + `<a download>`. WebView2 (Windows) handles this;
  WKWebView (macOS) / WebKitGTK may ignore it, so in Tauri the JSON is also shown in a textarea to
  copy. If that's not good enough, add `tauri-plugin-dialog` + `tauri-plugin-fs`. Import uses a
  plain file input (should work in all webviews; unverified).
- CSP in `tauri.conf.json` is set (self + ipc, inline styles allowed); unverified in a real window.
- CI workflow not run. Action majors pinned: checkout/setup-node/upload-artifact v4,
  tauri-action v1, rust-cache v2, dtolnay/rust-toolchain@stable.
- localStorage backend rewrites the whole review log per review — fine for dev, not meant for
  years of data (the desktop app uses SQLite).
