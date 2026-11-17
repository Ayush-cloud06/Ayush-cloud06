// Storage abstraction: SQLite (inside Tauri) or localStorage (plain browser, dev/testing).
// Both backends implement the same `Storage` interface and the same logical schema.

export type Dir = 'rec' | 'prod';
export type UnitStatus = 'not_started' | 'in_progress' | 'done' | 'known';

/** A ts-fsrs Card, serialised with dates as epoch ms. */
export interface StoredCardState {
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review: number | null;
}

export interface CardRow {
  id: string; // `${vocabId}:rec|prod`
  vocab_id: string;
  dir: Dir;
  state: StoredCardState;
  due: number; // ms; mirrors state.due (indexed column)
  created: number; // ms; when the card was added to reviews
}

export interface ReviewLogRow {
  id?: number;
  card_id: string;
  rating: number; // 1..4
  ts: number; // ms
  elapsed_ms: number;
  /** ts-fsrs State of the card *before* this review (0 New, 1 Learning, 2 Review, 3 Relearning). */
  prev_state: number;
}

export interface UnitProgressRow {
  unit_id: string;
  status: UnitStatus;
  best_score: number | null; // 0..100
  last_opened: number | null; // ms
}

export interface StudyTimeRow {
  day: string; // YYYY-MM-DD (local)
  seconds: number;
}

export interface ExportData {
  app: 'stufe';
  version: number;
  exported_at: string;
  cards: CardRow[];
  review_log: ReviewLogRow[];
  unit_progress: UnitProgressRow[];
  study_time: StudyTimeRow[];
  settings: Record<string, string>;
}

export interface Storage {
  readonly kind: 'sqlite' | 'local';
  init(): Promise<void>;
  getCards(): Promise<CardRow[]>;
  putCards(rows: CardRow[]): Promise<void>;
  addReviewLog(row: ReviewLogRow): Promise<void>;
  getReviewLogs(): Promise<ReviewLogRow[]>;
  getUnitProgress(): Promise<UnitProgressRow[]>;
  putUnitProgress(row: UnitProgressRow): Promise<void>;
  getStudyTime(): Promise<StudyTimeRow[]>;
  addStudySeconds(day: string, seconds: number): Promise<void>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string): Promise<void>;
  exportAll(): Promise<ExportData>;
  importAll(data: ExportData): Promise<void>;
  resetAll(): Promise<void>;
}

export const SCHEMA_VERSION = 1;

/** Validate an imported JSON blob just enough to not corrupt storage. */
export function parseExport(json: string): ExportData {
  const d = JSON.parse(json);
  if (!d || d.app !== 'stufe') throw new Error('Not a Stufe export file');
  for (const k of ['cards', 'review_log', 'unit_progress', 'study_time'] as const) {
    if (!Array.isArray(d[k])) throw new Error(`Export is missing "${k}"`);
  }
  if (!d.settings || typeof d.settings !== 'object') throw new Error('Export is missing "settings"');
  return d as ExportData;
}

// ---------------------------------------------------------------------------
// localStorage backend
// ---------------------------------------------------------------------------

/** Minimal subset of the Web Storage API (lets tests inject an in-memory map). */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryKV(): KV & { dump(): Record<string, string> } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

const P = 'stufe:';

/** localStorage migrations: index i migrates from schema i to i+1. */
const LOCAL_MIGRATIONS: Array<(kv: KV) => void> = [
  // 0 -> 1: initial tables.
  (kv) => {
    for (const [k, empty] of [['cards', '{}'], ['review_log', '[]'], ['unit_progress', '{}'], ['study_time', '{}'], ['settings', '{}']]) {
      if (kv.getItem(P + k) === null) kv.setItem(P + k, empty);
    }
  },
];

export class LocalStorageBackend implements Storage {
  readonly kind = 'local' as const;
  constructor(private kv: KV) {}

  private read<T>(k: string, fallback: T): T {
    const raw = this.kv.getItem(P + k);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  private write(k: string, v: unknown) {
    this.kv.setItem(P + k, JSON.stringify(v));
  }

  async init() {
    let v = Number(this.kv.getItem(P + 'schema') ?? '0') || 0;
    while (v < LOCAL_MIGRATIONS.length) {
      LOCAL_MIGRATIONS[v](this.kv);
      v++;
      this.kv.setItem(P + 'schema', String(v));
    }
  }
  async getCards() {
    return Object.values(this.read<Record<string, CardRow>>('cards', {}));
  }
  async putCards(rows: CardRow[]) {
    if (!rows.length) return;
    const all = this.read<Record<string, CardRow>>('cards', {});
    for (const r of rows) all[r.id] = r;
    this.write('cards', all);
  }
  async addReviewLog(row: ReviewLogRow) {
    const all = this.read<ReviewLogRow[]>('review_log', []);
    const id = (all.length ? Math.max(...all.slice(-1).map((r) => r.id ?? 0)) : 0) + 1;
    all.push({ ...row, id });
    this.write('review_log', all);
  }
  async getReviewLogs() {
    return this.read<ReviewLogRow[]>('review_log', []);
  }
  async getUnitProgress() {
    return Object.values(this.read<Record<string, UnitProgressRow>>('unit_progress', {}));
  }
  async putUnitProgress(row: UnitProgressRow) {
    const all = this.read<Record<string, UnitProgressRow>>('unit_progress', {});
    all[row.unit_id] = row;
    this.write('unit_progress', all);
  }
  async getStudyTime() {
    return Object.entries(this.read<Record<string, number>>('study_time', {})).map(([day, seconds]) => ({ day, seconds }));
  }
  async addStudySeconds(day: string, seconds: number) {
    const all = this.read<Record<string, number>>('study_time', {});
    all[day] = (all[day] ?? 0) + seconds;
    this.write('study_time', all);
  }
  async getSettings() {
    return this.read<Record<string, string>>('settings', {});
  }
  async setSetting(key: string, value: string) {
    const all = this.read<Record<string, string>>('settings', {});
    all[key] = value;
    this.write('settings', all);
  }
  async exportAll(): Promise<ExportData> {
    return {
      app: 'stufe',
      version: SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      cards: await this.getCards(),
      review_log: await this.getReviewLogs(),
      unit_progress: await this.getUnitProgress(),
      study_time: await this.getStudyTime(),
      settings: await this.getSettings(),
    };
  }
  async importAll(d: ExportData) {
    this.write('cards', Object.fromEntries(d.cards.map((c) => [c.id, c])));
    this.write('review_log', d.review_log.map((r, i) => ({ ...r, id: i + 1 })));
    this.write('unit_progress', Object.fromEntries(d.unit_progress.map((u) => [u.unit_id, u])));
    this.write('study_time', Object.fromEntries(d.study_time.map((s) => [s.day, s.seconds])));
    this.write('settings', d.settings);
  }
  async resetAll() {
    for (const k of ['cards', 'review_log', 'unit_progress', 'study_time']) this.kv.removeItem(P + k);
    this.kv.setItem(P + 'schema', '0');
    await this.init();
  }
}

// ---------------------------------------------------------------------------
// SQLite backend (tauri-plugin-sql)
// ---------------------------------------------------------------------------

/** The subset of @tauri-apps/plugin-sql's Database we use (lets the class be type-checked without Tauri). */
export interface SqlDb {
  execute(query: string, bindValues?: unknown[]): Promise<{ rowsAffected: number; lastInsertId?: number }>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

/**
 * SQL migrations: index i migrates from `PRAGMA user_version` i to i+1.
 * Each entry is a list of single statements (the plugin runs one statement per call).
 * Append new entries to evolve the schema; never edit old ones.
 */
export const SQL_MIGRATIONS: string[][] = [
  [
    `CREATE TABLE IF NOT EXISTS cards (
       id TEXT PRIMARY KEY,
       vocab_id TEXT NOT NULL,
       dir TEXT NOT NULL CHECK (dir IN ('rec','prod')),
       state TEXT NOT NULL,
       due INTEGER NOT NULL,
       created INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE INDEX IF NOT EXISTS cards_due ON cards(due)`,
    `CREATE TABLE IF NOT EXISTS review_log (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       card_id TEXT NOT NULL,
       rating INTEGER NOT NULL,
       ts INTEGER NOT NULL,
       elapsed_ms INTEGER NOT NULL DEFAULT 0,
       prev_state INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE INDEX IF NOT EXISTS review_log_ts ON review_log(ts)`,
    `CREATE TABLE IF NOT EXISTS unit_progress (
       unit_id TEXT PRIMARY KEY,
       status TEXT NOT NULL,
       best_score REAL,
       last_opened INTEGER
     )`,
    `CREATE TABLE IF NOT EXISTS study_time (day TEXT PRIMARY KEY, seconds INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  ],
];

interface SqlCard { id: string; vocab_id: string; dir: Dir; state: string; due: number; created: number }

export class SqliteBackend implements Storage {
  readonly kind = 'sqlite' as const;
  constructor(private db: SqlDb) {}

  async init() {
    const rows = await this.db.select<Array<{ user_version: number }>>('PRAGMA user_version');
    let v = rows[0]?.user_version ?? 0;
    while (v < SQL_MIGRATIONS.length) {
      for (const stmt of SQL_MIGRATIONS[v]) await this.db.execute(stmt);
      v++;
      await this.db.execute(`PRAGMA user_version = ${v}`);
    }
  }
  async getCards() {
    const rows = await this.db.select<SqlCard[]>('SELECT id, vocab_id, dir, state, due, created FROM cards');
    return rows.map((r) => ({ ...r, state: JSON.parse(r.state) as StoredCardState }));
  }
  async putCards(rows: CardRow[]) {
    // Multi-row upserts in chunks (no explicit transactions: the plugin uses a connection pool).
    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const part = rows.slice(i, i + CHUNK);
      const params: unknown[] = [];
      const values = part
        .map((r, j) => {
          params.push(r.id, r.vocab_id, r.dir, JSON.stringify(r.state), r.due, r.created);
          const b = j * 6;
          return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6})`;
        })
        .join(',');
      await this.db.execute(
        `INSERT INTO cards (id, vocab_id, dir, state, due, created) VALUES ${values}
         ON CONFLICT(id) DO UPDATE SET state = excluded.state, due = excluded.due`,
        params,
      );
    }
  }
  async addReviewLog(r: ReviewLogRow) {
    await this.db.execute('INSERT INTO review_log (card_id, rating, ts, elapsed_ms, prev_state) VALUES ($1,$2,$3,$4,$5)', [
      r.card_id, r.rating, r.ts, r.elapsed_ms, r.prev_state,
    ]);
  }
  async getReviewLogs() {
    return this.db.select<ReviewLogRow[]>('SELECT id, card_id, rating, ts, elapsed_ms, prev_state FROM review_log ORDER BY id');
  }
  async getUnitProgress() {
    return this.db.select<UnitProgressRow[]>('SELECT unit_id, status, best_score, last_opened FROM unit_progress');
  }
  async putUnitProgress(r: UnitProgressRow) {
    await this.db.execute(
      `INSERT INTO unit_progress (unit_id, status, best_score, last_opened) VALUES ($1,$2,$3,$4)
       ON CONFLICT(unit_id) DO UPDATE SET status = excluded.status, best_score = excluded.best_score, last_opened = excluded.last_opened`,
      [r.unit_id, r.status, r.best_score, r.last_opened],
    );
  }
  async getStudyTime() {
    return this.db.select<StudyTimeRow[]>('SELECT day, seconds FROM study_time ORDER BY day');
  }
  async addStudySeconds(day: string, seconds: number) {
    await this.db.execute(
      'INSERT INTO study_time (day, seconds) VALUES ($1,$2) ON CONFLICT(day) DO UPDATE SET seconds = seconds + excluded.seconds',
      [day, seconds],
    );
  }
  async getSettings() {
    const rows = await this.db.select<Array<{ key: string; value: string }>>('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  async setSetting(key: string, value: string) {
    await this.db.execute('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
  }
  async exportAll(): Promise<ExportData> {
    return {
      app: 'stufe',
      version: SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      cards: await this.getCards(),
      review_log: await this.getReviewLogs(),
      unit_progress: await this.getUnitProgress(),
      study_time: await this.getStudyTime(),
      settings: await this.getSettings(),
    };
  }
  async importAll(d: ExportData) {
    await this.clearTables(true);
    await this.putCards(d.cards);
    for (const r of d.review_log) await this.addReviewLog(r);
    for (const u of d.unit_progress) await this.putUnitProgress(u);
    for (const s of d.study_time) await this.addStudySeconds(s.day, s.seconds);
    for (const [k, v] of Object.entries(d.settings)) await this.setSetting(k, v);
  }
  private async clearTables(includeSettings: boolean) {
    for (const t of ['cards', 'review_log', 'unit_progress', 'study_time', ...(includeSettings ? ['settings'] : [])]) {
      await this.db.execute(`DELETE FROM ${t}`);
    }
  }
  async resetAll() {
    await this.clearTables(false);
  }
}

// ---------------------------------------------------------------------------

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function openStorage(): Promise<Storage> {
  let s: Storage;
  if (isTauri()) {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    const db = await Database.load('sqlite:stufe.db');
    s = new SqliteBackend(db as unknown as SqlDb);
  } else {
    s = new LocalStorageBackend(window.localStorage);
  }
  await s.init();
  return s;
}
