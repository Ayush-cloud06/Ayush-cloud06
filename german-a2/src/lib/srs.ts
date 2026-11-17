// Spaced-repetition logic on top of ts-fsrs. Pure functions over plain data so it can be unit-tested.
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { CardRow, Dir, ReviewLogRow, StoredCardState } from './db';
import { dayKey, startOfDay, DAY_MS } from './time';

export { Rating, State };
export type { Grade };

/** Production (en → de) cards become available this many days after the first recognition review. */
export const PROD_DELAY_DAYS = 2;
/** "Not yet available" due date for production cards waiting on their recognition card. */
export const FAR_FUTURE = 8.64e15;
/** Learning cards due within this window are kept in the current session (like Anki's learn-ahead). */
export const LEARN_AHEAD_MS = 20 * 60 * 1000;
export const MATURE_DAYS = 21;

export const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }));

export function cardId(vocabId: string, dir: Dir): string {
  return `${vocabId}:${dir}`;
}

export function toStored(c: Card): StoredCardState {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    learning_steps: c.learning_steps,
    state: c.state,
    last_review: c.last_review ? c.last_review.getTime() : null,
  };
}

export function fromStored(s: StoredCardState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    scheduled_days: s.scheduled_days,
    reps: s.reps,
    lapses: s.lapses,
    learning_steps: s.learning_steps ?? 0,
    state: s.state as State,
    last_review: s.last_review != null ? new Date(s.last_review) : undefined,
  } as Card;
}

/** Create new (unstudied) cards for a vocab item. Production waits for the recognition card. */
export function newCards(vocabId: string, now: number): CardRow[] {
  const rec = toStored(createEmptyCard(new Date(now)));
  const prod = { ...toStored(createEmptyCard(new Date(now))), due: FAR_FUTURE };
  return [
    { id: cardId(vocabId, 'rec'), vocab_id: vocabId, dir: 'rec', state: rec, due: rec.due, created: now },
    { id: cardId(vocabId, 'prod'), vocab_id: vocabId, dir: 'prod', state: prod, due: prod.due, created: now },
  ];
}

export interface GradeOutcome {
  card: CardRow;
  log: ReviewLogRow;
}

/** Apply a rating to a card. */
export function gradeCard(row: CardRow, rating: Grade, now: number, elapsedMs = 0): GradeOutcome {
  const prev = fromStored(row.state);
  // A production card may be studied early (e.g. its placeholder due is in the future); schedule from now.
  if (prev.state === State.New) prev.due = new Date(now);
  const { card } = scheduler.next(prev, new Date(now), rating);
  const state = toStored(card);
  return {
    card: { ...row, state, due: state.due },
    log: { card_id: row.id, rating, ts: now, elapsed_ms: Math.round(elapsedMs), prev_state: prev.state },
  };
}

/**
 * After a recognition card's first review, release its production sibling
 * PROD_DELAY_DAYS later (start of that local day).
 */
export function releaseProduction(prod: CardRow | undefined, now: number): CardRow | undefined {
  if (!prod || prod.state.state !== State.New || prod.due < FAR_FUTURE) return undefined;
  const due = startOfDay(now) + PROD_DELAY_DAYS * DAY_MS;
  return { ...prod, due, state: { ...prod.state, due } };
}

/**
 * "I already know this": rate Easy, then stretch the due date by a random factor in [1, 2)
 * so a whole unit doesn't come back on the same day.
 */
export function markKnown(row: CardRow, now: number, rand: () => number = Math.random): CardRow {
  const prev = fromStored(row.state);
  if (prev.state !== State.New) return row;
  prev.due = new Date(now);
  const { card } = scheduler.next(prev, new Date(now), Rating.Easy);
  const interval = card.due.getTime() - now;
  card.due = new Date(now + interval * (1 + rand()));
  const state = toStored(card);
  return { ...row, state, due: state.due };
}

/** Preview the next interval for each grade (for button labels). */
export function previewIntervals(row: CardRow, now: number): Record<Grade, number> {
  const c = fromStored(row.state);
  if (c.state === State.New) c.due = new Date(now);
  const p = scheduler.repeat(c, new Date(now));
  return {
    [Rating.Again]: p[Rating.Again].card.due.getTime() - now,
    [Rating.Hard]: p[Rating.Hard].card.due.getTime() - now,
    [Rating.Good]: p[Rating.Good].card.due.getTime() - now,
    [Rating.Easy]: p[Rating.Easy].card.due.getTime() - now,
  } as Record<Grade, number>;
}

export function formatInterval(ms: number): string {
  const min = ms / 60000;
  if (min < 60) return `${Math.max(1, Math.round(min))}m`;
  const h = min / 60;
  if (h < 24) return `${Math.round(h)}h`;
  const d = h / 24;
  if (d < 31) return `${Math.round(d)}d`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

export interface Limits {
  newPerDay: number;
  reviewCap: number;
}

export interface TodayCounts {
  newDoneToday: number;
  reviewsDoneToday: number;
  dueCount: number; // due reviews available now, after cap
  dueTotal: number; // due reviews regardless of cap
  newAvailable: number; // new cards available now, after the daily limit
  newTotal: number; // eligible new cards regardless of limit
}

/** Cards eligible for the "due" queue: studied before and due now. Sorted by due. */
export function dueCards(cards: Iterable<CardRow>, now: number, known?: (vocabId: string) => boolean): CardRow[] {
  const out: CardRow[] = [];
  for (const c of cards) if (c.state.state !== State.New && c.due <= now && (!known || known(c.vocab_id))) out.push(c);
  return out.sort((a, b) => a.due - b.due);
}

/** New cards that may be introduced now, ordered by when added, then content position. Recognition first. */
export function newCardsAvailable(
  cards: Iterable<CardRow>,
  now: number,
  position: (vocabId: string) => number | undefined,
): CardRow[] {
  const out: CardRow[] = [];
  for (const c of cards) if (c.state.state === State.New && c.due <= now && position(c.vocab_id) !== undefined) out.push(c);
  return out.sort(
    (a, b) =>
      a.created - b.created ||
      (a.dir === b.dir ? 0 : a.dir === 'rec' ? -1 : 1) ||
      position(a.vocab_id)! - position(b.vocab_id)!,
  );
}

export function todayCounts(
  cards: Iterable<CardRow>,
  logs: ReviewLogRow[],
  limits: Limits,
  now: number,
  position: (vocabId: string) => number | undefined,
): TodayCounts {
  const today = dayKey(now);
  let newDoneToday = 0;
  let reviewsDoneToday = 0;
  const seenNew = new Set<string>();
  for (let i = logs.length - 1; i >= 0; i--) {
    const l = logs[i];
    if (dayKey(l.ts) !== today) {
      if (l.ts < startOfDay(now)) break; // logs are chronological
      continue;
    }
    if (l.prev_state === State.New) {
      if (!seenNew.has(l.card_id)) newDoneToday++;
      seenNew.add(l.card_id);
    } else reviewsDoneToday++;
  }
  const arr = [...cards];
  const due = dueCards(arr, now, (v) => position(v) !== undefined);
  const fresh = newCardsAvailable(arr, now, position);
  return {
    newDoneToday,
    reviewsDoneToday,
    dueTotal: due.length,
    dueCount: Math.max(0, Math.min(due.length, limits.reviewCap - reviewsDoneToday)),
    newTotal: fresh.length,
    newAvailable: Math.max(0, Math.min(fresh.length, limits.newPerDay - newDoneToday)),
  };
}

/** Suggested self-grade after an auto-checked production answer. */
export function suggestGrade(result: 'correct' | 'almost' | 'wrong'): Grade {
  return result === 'correct' ? Rating.Good : result === 'almost' ? Rating.Hard : Rating.Again;
}

/** Simple in-session queue: learning cards due soon go back in, after at least `gap` other cards. */
export function requeue(queue: CardRow[], card: CardRow, now: number, gap = 3): CardRow[] {
  if (card.state.state === State.Review || card.due - now > LEARN_AHEAD_MS) return queue;
  const at = Math.min(queue.length, gap);
  return [...queue.slice(0, at), card, ...queue.slice(at)];
}

export interface CardStats {
  inReview: number; // vocab whose recognition card is in Review/Relearning
  mature: number; // cards with interval >= 21d
  learning: number;
  newCount: number;
}

export function intervalDays(s: StoredCardState): number {
  return s.last_review ? (s.due - s.last_review) / DAY_MS : 0;
}

export function cardStats(cards: Iterable<CardRow>): CardStats {
  let inReview = 0, mature = 0, learning = 0, newCount = 0;
  for (const c of cards) {
    const st = c.state.state;
    if (st === State.New) newCount++;
    else if (st === State.Learning || st === State.Relearning) learning++;
    if (c.dir === 'rec' && (st === State.Review || st === State.Relearning)) inReview++;
    if (st === State.Review && intervalDays(c.state) >= MATURE_DAYS) mature++;
  }
  return { inReview, mature, learning, newCount };
}

/** Share of reviews of already-learned cards (prev state Review) answered with Hard/Good/Easy. */
export function retention(logs: ReviewLogRow[], now: number, days = 30): { rate: number | null; n: number } {
  const since = now - days * DAY_MS;
  let n = 0, ok = 0;
  for (const l of logs) {
    if (l.ts < since || l.prev_state !== State.Review) continue;
    n++;
    if (l.rating > Rating.Again) ok++;
  }
  return { rate: n ? ok / n : null, n };
}

/** Reviews per local day for the last `days` days (oldest first). */
export function reviewsPerDay(logs: ReviewLogRow[], now: number, days = 30): Array<{ day: string; count: number }> {
  const counts = new Map<string, number>();
  for (const l of logs) counts.set(dayKey(l.ts), (counts.get(dayKey(l.ts)) ?? 0) + 1);
  const out = [];
  const start = startOfDay(now);
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(start - i * DAY_MS + 12 * 3600 * 1000);
    out.push({ day: d, count: counts.get(d) ?? 0 });
  }
  return out;
}
