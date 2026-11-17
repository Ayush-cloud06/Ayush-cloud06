// Global app state: an in-memory cache of everything in storage, written through on change.
import { canonicalVocabId, content } from './content';
import {
  openStorage, parseExport,
  type CardRow, type ExportData, type ReviewLogRow, type Storage, type UnitProgressRow, type UnitStatus,
} from './db';
import { cardId, gradeCard, markKnown, newCards, releaseProduction, todayCounts, State, type Grade } from './srs';
import { dayKey, startOfWeek, StudyTimer } from './time';

export interface Settings {
  newPerDay: number;
  reviewCap: number;
  tts: boolean;
  voice: string;
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = { newPerDay: 15, reviewCap: 200, tts: true, voice: '', theme: 'system' };

function parseSettings(raw: Record<string, string>): Settings {
  const num = (v: string | undefined, d: number) => (v !== undefined && Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : d);
  const theme = raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system';
  return {
    newPerDay: num(raw.newPerDay, DEFAULT_SETTINGS.newPerDay),
    reviewCap: num(raw.reviewCap, DEFAULT_SETTINGS.reviewCap),
    tts: raw.tts === undefined ? DEFAULT_SETTINGS.tts : raw.tts === 'true',
    voice: raw.voice ?? '',
    theme,
  };
}

export class AppState {
  ready = $state(false);
  error = $state<string | null>(null);
  storageKind = $state<'sqlite' | 'local' | null>(null);
  cards = $state.raw<Map<string, CardRow>>(new Map());
  logs = $state.raw<ReviewLogRow[]>([]);
  progress = $state.raw<Map<string, UnitProgressRow>>(new Map());
  studyTime = $state.raw<Map<string, number>>(new Map());
  settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  /** Bumped every minute so "now"-dependent views refresh. */
  now = $state(Date.now());

  private db!: Storage;
  readonly timer = new StudyTimer((day, s) => void this.addStudySeconds(day, s));

  async load(storage?: Storage) {
    try {
      this.db = storage ?? (await openStorage());
      this.storageKind = this.db.kind;
      await this.reloadAll();
      this.ready = true;
      setInterval(() => (this.now = Date.now()), 60_000);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
      console.error(e);
    }
  }

  private async reloadAll() {
    const [cards, logs, prog, st, settings] = await Promise.all([
      this.db.getCards(), this.db.getReviewLogs(), this.db.getUnitProgress(), this.db.getStudyTime(), this.db.getSettings(),
    ]);
    this.cards = new Map(cards.map((c) => [c.id, c]));
    this.logs = logs.sort((a, b) => a.ts - b.ts);
    this.progress = new Map(prog.map((p) => [p.unit_id, p]));
    this.studyTime = new Map(st.map((s) => [s.day, s.seconds]));
    this.settings = parseSettings(settings);
  }

  // ---- settings -----------------------------------------------------------
  async setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.settings[key] = value;
    await this.db.setSetting(key, String(value));
  }

  // ---- cards --------------------------------------------------------------
  /** Content position of a canonical vocab id; undefined for unknown (orphaned) or alias ids. */
  position = (vocabId: string) => {
    const e = content.vocabById.get(vocabId);
    return e && e.canonicalId === vocabId ? e.pos : undefined;
  };

  counts(now = this.now) {
    return todayCounts(this.cards.values(), this.logs, this.settings, now, this.position);
  }

  private async saveCards(rows: CardRow[]) {
    if (!rows.length) return;
    const m = new Map(this.cards);
    for (const r of rows) m.set(r.id, r);
    this.cards = m;
    this.now = Date.now(); // keep "now"-derived counts consistent with the cards just written
    await this.db.putCards(rows);
  }

  /** Add every vocab item of a unit as new cards (skips items already present). Returns number of items added. */
  async addUnitToReviews(unitId: string, now = Date.now()) {
    const unit = content.unitById.get(unitId);
    if (!unit) return 0;
    const rows: CardRow[] = [];
    let added = 0;
    unit.vocab.forEach((v, i) => {
      // created = now + i keeps authored order within the unit
      const fresh = newCards(canonicalVocabId(v.id), now).map((c) => ({ ...c, created: now + i }));
      const missing = fresh.filter((c) => !this.cards.has(c.id));
      if (missing.length) added++;
      rows.push(...missing);
    });
    await this.saveCards(rows);
    await this.touchUnit(unitId, { promote: true });
    return added;
  }

  /** "I already know this unit": every unstudied card gets an initial Easy rating, spread out; unit marked known. */
  async markUnitKnown(unitId: string, now = Date.now()) {
    const unit = content.unitById.get(unitId);
    if (!unit) return;
    const rows: CardRow[] = [];
    for (const v of unit.vocab) {
      for (const c of newCards(canonicalVocabId(v.id), now)) {
        const existing = this.cards.get(c.id) ?? c;
        const k = markKnown(existing, now);
        if (k !== existing || !this.cards.has(c.id)) rows.push(k);
      }
    }
    await this.saveCards(rows);
    const p = this.unitProgress(unitId);
    await this.putProgress({ ...p, status: 'known', last_opened: now });
  }

  async grade(id: string, rating: Grade, elapsedMs: number, now = Date.now()): Promise<CardRow | undefined> {
    const row = this.cards.get(id);
    if (!row) return;
    const { card, log } = gradeCard(row, rating, now, elapsedMs);
    const updates = [card];
    if (row.dir === 'rec' && row.state.state === State.New) {
      const released = releaseProduction(this.cards.get(cardId(row.vocab_id, 'prod')), now);
      if (released) updates.push(released);
    }
    await this.saveCards(updates);
    this.logs = [...this.logs, log];
    await this.db.addReviewLog(log);
    return card;
  }

  // ---- units --------------------------------------------------------------
  unitProgress(unitId: string): UnitProgressRow {
    return this.progress.get(unitId) ?? { unit_id: unitId, status: 'not_started', best_score: null, last_opened: null };
  }

  private async putProgress(p: UnitProgressRow) {
    const m = new Map(this.progress);
    m.set(p.unit_id, p);
    this.progress = m;
    await this.db.putUnitProgress(p);
  }

  /** Record that a unit was opened/worked on. `promote` moves not_started → in_progress. */
  async touchUnit(unitId: string, opts: { promote?: boolean } = {}) {
    const p = this.unitProgress(unitId);
    const status: UnitStatus = opts.promote && p.status === 'not_started' ? 'in_progress' : p.status;
    await this.putProgress({ ...p, status, last_opened: Date.now() });
  }

  /** Save a finished full-unit drill session. ≥ 80 % marks the unit done (unless marked known). */
  async recordDrillScore(unitId: string, score: number) {
    const p = this.unitProgress(unitId);
    const best = p.best_score == null ? score : Math.max(p.best_score, score);
    let status: UnitStatus = p.status;
    if (status !== 'known') status = score >= 80 || status === 'done' ? 'done' : 'in_progress';
    await this.putProgress({ ...p, status, best_score: best, last_opened: Date.now() });
  }

  async setUnitStatus(unitId: string, status: UnitStatus) {
    await this.putProgress({ ...this.unitProgress(unitId), status });
  }

  /** Share of a unit's vocab whose recognition card has been studied at least once. */
  unitStudiedShare(unitId: string): number {
    const unit = content.unitById.get(unitId);
    if (!unit || !unit.vocab.length) return 0;
    let n = 0;
    for (const v of unit.vocab) {
      const c = this.cards.get(cardId(canonicalVocabId(v.id), 'rec'));
      if (c && c.state.state !== State.New) n++;
    }
    return n / unit.vocab.length;
  }

  unitAdded(unitId: string): boolean {
    const unit = content.unitById.get(unitId);
    return !!unit && unit.vocab.length > 0 && unit.vocab.every((v) => this.cards.has(cardId(canonicalVocabId(v.id), 'rec')));
  }

  /** Most recently opened unit that isn't finished, else the first not-started unit. */
  continueUnit() {
    const open = [...this.progress.values()]
      .filter((p) => p.last_opened && (p.status === 'in_progress' || p.status === 'not_started') && content.unitById.has(p.unit_id))
      .sort((a, b) => (b.last_opened ?? 0) - (a.last_opened ?? 0));
    if (open[0]) return content.unitById.get(open[0].unit_id);
    return content.units.find((u) => this.unitProgress(u.id).status === 'not_started');
  }

  // ---- study time ---------------------------------------------------------
  async addStudySeconds(day: string, seconds: number) {
    const m = new Map(this.studyTime);
    m.set(day, (m.get(day) ?? 0) + seconds);
    this.studyTime = m;
    await this.db.addStudySeconds(day, seconds);
  }

  minutesToday(now = this.now) {
    return Math.round((this.studyTime.get(dayKey(now)) ?? 0) / 60);
  }

  minutesThisWeek(now = this.now) {
    const from = dayKey(startOfWeek(now));
    let s = 0;
    for (const [d, sec] of this.studyTime) if (d >= from && d <= dayKey(now)) s += sec;
    return Math.round(s / 60);
  }

  // ---- data ---------------------------------------------------------------
  exportData(): Promise<ExportData> {
    return this.db.exportAll();
  }

  async importJson(json: string) {
    const data = parseExport(json);
    await this.db.importAll(data);
    await this.reloadAll();
  }

  async resetProgress() {
    await this.db.resetAll();
    await this.reloadAll();
  }
}

export const app = new AppState();
