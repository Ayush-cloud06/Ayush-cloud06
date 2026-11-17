import { describe, expect, it } from 'vitest';
import {
  cardId, cardStats, dueCards, FAR_FUTURE, formatInterval, gradeCard, markKnown, newCards, newCardsAvailable,
  previewIntervals, PROD_DELAY_DAYS, Rating, releaseProduction, requeue, retention, reviewsPerDay, State, suggestGrade, todayCounts,
} from './srs';
import type { CardRow, ReviewLogRow } from './db';
import { DAY_MS, dayKey, startOfDay } from './time';

const NOW = new Date(2026, 10, 17, 10, 0, 0).getTime();
const pos = (v: string) => ({ a: 1, b: 2, c: 3 } as Record<string, number>)[v];

describe('newCards', () => {
  it('creates a recognition card due now and a parked production card', () => {
    const [rec, prod] = newCards('a', NOW);
    expect(rec.id).toBe('a:rec');
    expect(prod.id).toBe('a:prod');
    expect(rec.due).toBe(NOW);
    expect(prod.due).toBe(FAR_FUTURE);
    expect(rec.state.state).toBe(State.New);
  });
});

describe('gradeCard', () => {
  it('moves a new card into learning on Good and logs prev state', () => {
    const [rec] = newCards('a', NOW);
    const { card, log } = gradeCard(rec, Rating.Good, NOW, 1234);
    expect(card.state.state).toBe(State.Learning);
    expect(card.due).toBeGreaterThan(NOW);
    expect(card.due).toBe(card.state.due);
    expect(log).toMatchObject({ card_id: 'a:rec', rating: Rating.Good, prev_state: State.New, elapsed_ms: 1234, ts: NOW });
  });
  it('Easy on a new card goes straight to review with days interval', () => {
    const [rec] = newCards('a', NOW);
    const { card } = gradeCard(rec, Rating.Easy, NOW);
    expect(card.state.state).toBe(State.Review);
    expect(card.due - NOW).toBeGreaterThan(DAY_MS);
  });
  it('round-trips state through JSON', () => {
    const [rec] = newCards('a', NOW);
    const g1 = gradeCard(JSON.parse(JSON.stringify(rec)), Rating.Good, NOW).card;
    const g2 = gradeCard(JSON.parse(JSON.stringify(g1)), Rating.Good, NOW + 15 * 60_000).card;
    expect(g2.state.reps).toBe(2);
  });
  it('can grade a parked production card early without breaking', () => {
    const [, prod] = newCards('a', NOW);
    const { card } = gradeCard(prod, Rating.Good, NOW);
    expect(card.due).toBeLessThan(NOW + DAY_MS);
  });
});

describe('releaseProduction', () => {
  it('releases a parked production card PROD_DELAY_DAYS later', () => {
    const [, prod] = newCards('a', NOW);
    const r = releaseProduction(prod, NOW)!;
    expect(r.due).toBe(startOfDay(NOW) + PROD_DELAY_DAYS * DAY_MS);
    expect(r.state.due).toBe(r.due);
  });
  it('does nothing for already-released or studied cards', () => {
    const [, prod] = newCards('a', NOW);
    const r = releaseProduction(prod, NOW)!;
    expect(releaseProduction(r, NOW)).toBeUndefined();
    expect(releaseProduction(undefined, NOW)).toBeUndefined();
  });
});

describe('markKnown', () => {
  it('schedules new cards days out with spread', () => {
    const [rec, prod] = newCards('a', NOW);
    const a = markKnown(rec, NOW, () => 0);
    const b = markKnown(prod, NOW, () => 0.99);
    expect(a.state.state).toBe(State.Review);
    expect(a.due - NOW).toBeGreaterThan(DAY_MS);
    expect(b.due).toBeGreaterThan(a.due);
  });
  it('leaves studied cards alone', () => {
    const [rec] = newCards('a', NOW);
    const g = gradeCard(rec, Rating.Good, NOW).card;
    expect(markKnown(g, NOW)).toBe(g);
  });
});

describe('queues and counts', () => {
  function setup() {
    const cards: CardRow[] = [...newCards('a', NOW - 3), ...newCards('b', NOW - 2), ...newCards('c', NOW - 1)];
    return cards;
  }

  it('orders new cards by created then position, only due & known vocab', () => {
    const cards = setup();
    cards.push(...newCards('zzz-orphan', NOW - 10));
    const n = newCardsAvailable(cards, NOW, pos);
    expect(n.map((c) => c.id)).toEqual(['a:rec', 'b:rec', 'c:rec']);
  });

  it('due cards exclude new cards and are sorted by due', () => {
    const cards = setup();
    const ga = gradeCard(cards[0], Rating.Again, NOW - 10 * 60_000).card; // learning, due soon
    const gb = gradeCard(cards[2], Rating.Again, NOW - 20 * 60_000).card;
    const d = dueCards([ga, gb, cards[4]], NOW);
    expect(d.map((c) => c.id)).toEqual([gb.id, ga.id]);
  });

  it('todayCounts applies daily new limit and review cap', () => {
    const cards = setup();
    const logs: ReviewLogRow[] = [
      { card_id: 'x:rec', rating: 3, ts: NOW - 2 * DAY_MS, elapsed_ms: 0, prev_state: State.New },
      { card_id: 'y:rec', rating: 3, ts: NOW - 3600_000, elapsed_ms: 0, prev_state: State.New },
      { card_id: 'y:rec', rating: 3, ts: NOW - 3000_000, elapsed_ms: 0, prev_state: State.New },
      { card_id: 'z:rec', rating: 3, ts: NOW - 1000, elapsed_ms: 0, prev_state: State.Review },
    ];
    const c = todayCounts(cards, logs, { newPerDay: 2, reviewCap: 1 }, NOW, pos);
    expect(c.newDoneToday).toBe(1);
    expect(c.reviewsDoneToday).toBe(1);
    expect(c.newTotal).toBe(3);
    expect(c.newAvailable).toBe(1);
    expect(c.dueCount).toBe(0);
  });
});

describe('requeue', () => {
  it('puts learning cards back a few places in', () => {
    const cards = newCards('a', NOW).concat(newCards('b', NOW), newCards('c', NOW));
    const g = gradeCard(cards[0], Rating.Again, NOW).card;
    const q = requeue([cards[2], cards[4]], g, NOW, 3);
    expect(q.map((c) => c.id)).toEqual(['b:rec', 'c:rec', 'a:rec']);
  });
  it('drops cards that graduated to review', () => {
    const [rec] = newCards('a', NOW);
    const g = gradeCard(rec, Rating.Easy, NOW).card;
    expect(requeue([], g, NOW)).toEqual([]);
  });
});

describe('stats', () => {
  it('counts review / mature / new', () => {
    const [rec, prod] = newCards('a', NOW);
    const r = { ...rec, state: { ...rec.state, state: State.Review, last_review: NOW - 30 * DAY_MS, due: NOW + 1 } };
    const s = cardStats([r, prod]);
    expect(s).toEqual({ inReview: 1, mature: 1, learning: 0, newCount: 1 });
  });
  it('retention only counts reviews of review-state cards', () => {
    const logs: ReviewLogRow[] = [
      { card_id: 'a', rating: 1, ts: NOW - DAY_MS, elapsed_ms: 0, prev_state: State.Review },
      { card_id: 'a', rating: 3, ts: NOW - DAY_MS, elapsed_ms: 0, prev_state: State.Review },
      { card_id: 'b', rating: 1, ts: NOW - DAY_MS, elapsed_ms: 0, prev_state: State.New },
      { card_id: 'c', rating: 3, ts: NOW - 40 * DAY_MS, elapsed_ms: 0, prev_state: State.Review },
    ];
    expect(retention(logs, NOW)).toEqual({ rate: 0.5, n: 2 });
    expect(retention([], NOW)).toEqual({ rate: null, n: 0 });
  });
  it('reviewsPerDay returns one bucket per day, oldest first', () => {
    const logs: ReviewLogRow[] = [
      { card_id: 'a', rating: 3, ts: NOW, elapsed_ms: 0, prev_state: 2 },
      { card_id: 'a', rating: 3, ts: NOW - DAY_MS, elapsed_ms: 0, prev_state: 2 },
      { card_id: 'a', rating: 3, ts: NOW - DAY_MS, elapsed_ms: 0, prev_state: 2 },
    ];
    const r = reviewsPerDay(logs, NOW, 30);
    expect(r).toHaveLength(30);
    expect(r[29]).toEqual({ day: dayKey(NOW), count: 1 });
    expect(r[28].count).toBe(2);
  });
});

describe('helpers', () => {
  it('formats intervals', () => {
    expect(formatInterval(60_000)).toBe('1m');
    expect(formatInterval(10 * 60_000)).toBe('10m');
    expect(formatInterval(3 * 3600_000)).toBe('3h');
    expect(formatInterval(4 * DAY_MS)).toBe('4d');
    expect(formatInterval(90 * DAY_MS)).toBe('3mo');
  });
  it('suggests grades from check results', () => {
    expect(suggestGrade('correct')).toBe(Rating.Good);
    expect(suggestGrade('almost')).toBe(Rating.Hard);
    expect(suggestGrade('wrong')).toBe(Rating.Again);
  });
  it('previews increasing intervals', () => {
    const [rec] = newCards('a', NOW);
    const p = previewIntervals(rec, NOW);
    expect(p[Rating.Again]).toBeLessThanOrEqual(p[Rating.Good]);
    expect(p[Rating.Good]).toBeLessThan(p[Rating.Easy]);
    expect(cardId('x', 'prod')).toBe('x:prod');
  });
});
