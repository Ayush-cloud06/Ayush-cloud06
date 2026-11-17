export const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar day, YYYY-MM-DD. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Monday-based start of the local week. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export const IDLE_MS = 60_000;

/**
 * Counts active seconds while a session is running. Activity = key/mouse events
 * (call `ping()`); counting pauses once nothing happened for IDLE_MS.
 * `flush(day, seconds)` is called periodically and on stop.
 */
export class StudyTimer {
  private lastActivity = 0;
  private pending = 0;
  private lastTick = 0;
  private handle: ReturnType<typeof setInterval> | null = null;
  private sinceFlush = 0;

  constructor(
    private flush: (day: string, seconds: number) => void,
    private now: () => number = () => Date.now(),
  ) {}

  get running() {
    return this.handle !== null;
  }

  start() {
    if (this.handle) return;
    this.lastActivity = this.now();
    this.lastTick = this.now();
    this.handle = setInterval(() => this.tick(), 1000);
  }

  ping() {
    this.lastActivity = this.now();
  }

  /** Exposed for tests. Adds elapsed time since last tick if the user was active. */
  tick() {
    const t = this.now();
    const dt = t - this.lastTick;
    this.lastTick = t;
    if (t - this.lastActivity <= IDLE_MS && dt > 0 && dt < 5 * 60_000) {
      this.pending += dt / 1000;
      this.sinceFlush += dt;
    }
    if (this.sinceFlush >= 15_000) this.doFlush(t);
  }

  private doFlush(t: number) {
    const s = Math.floor(this.pending);
    if (s > 0) {
      this.flush(dayKey(t), s);
      this.pending -= s;
    }
    this.sinceFlush = 0;
  }

  stop() {
    if (!this.handle) return;
    this.tick();
    clearInterval(this.handle);
    this.handle = null;
    this.doFlush(this.now());
  }
}
