import { beforeEach, describe, expect, it } from 'vitest';
import { AppState } from './app.svelte';
import { setContent } from './content';
import { LocalStorageBackend, memoryKV } from './db';
import { Rating, State } from './srs';
import fixture from './__fixtures__/fixture-unit';

describe('AppState with localStorage backend', () => {
  let kv: ReturnType<typeof memoryKV>;
  beforeEach(() => {
    setContent([fixture]);
    kv = memoryKV();
  });

  async function fresh() {
    const a = new AppState();
    await a.load(new LocalStorageBackend(kv));
    return a;
  }

  it('adds unit vocab as new cards, respects the daily limit, persists grades', async () => {
    const a = await fresh();
    expect(a.ready).toBe(true);
    expect(await a.addUnitToReviews(fixture.id)).toBe(fixture.vocab.length);
    expect(a.cards.size).toBe(fixture.vocab.length * 2);
    expect(a.unitProgress(fixture.id).status).toBe('in_progress');
    await a.setSetting('newPerDay', 3);
    let c = a.counts(Date.now());
    expect(c.newTotal).toBe(fixture.vocab.length); // only recognition cards are available
    expect(c.newAvailable).toBe(3);

    await a.grade('a1-90-tisch:rec', Rating.Good, 1000);
    c = a.counts(Date.now());
    expect(c.newAvailable).toBe(2);
    // production sibling released in a few days, not now
    const prod = a.cards.get('a1-90-tisch:prod')!;
    expect(prod.due).toBeGreaterThan(Date.now());
    expect(prod.due).toBeLessThan(Date.now() + 4 * 86400_000);

    const b = await fresh();
    expect(b.cards.get('a1-90-tisch:rec')!.state.state).toBe(State.Learning);
    expect(b.logs).toHaveLength(1);
    expect(b.settings.newPerDay).toBe(3);
  });

  it('marks a unit known with spaced Easy cards', async () => {
    const a = await fresh();
    await a.markUnitKnown(fixture.id);
    expect(a.unitProgress(fixture.id).status).toBe('known');
    const dues = [...a.cards.values()].map((c) => c.due);
    expect(dues.every((d) => d > Date.now() + 86400_000)).toBe(true);
    expect(a.counts().newTotal).toBe(0);
    expect(a.logs).toHaveLength(0);
  });

  it('records best drill score and done status', async () => {
    const a = await fresh();
    await a.recordDrillScore(fixture.id, 60);
    expect(a.unitProgress(fixture.id)).toMatchObject({ status: 'in_progress', best_score: 60 });
    await a.recordDrillScore(fixture.id, 85);
    await a.recordDrillScore(fixture.id, 70);
    expect(a.unitProgress(fixture.id)).toMatchObject({ status: 'done', best_score: 85 });
  });

  it('tracks study minutes and resets progress', async () => {
    const a = await fresh();
    await a.addStudySeconds('2000-01-01', 120);
    await a.addUnitToReviews(fixture.id);
    await a.resetProgress();
    expect(a.cards.size).toBe(0);
    expect(a.studyTime.size).toBe(0);
  });

  it('exports and imports JSON', async () => {
    const a = await fresh();
    await a.addUnitToReviews(fixture.id);
    const json = JSON.stringify(await a.exportData());
    await a.resetProgress();
    await a.importJson(json);
    expect(a.cards.size).toBe(fixture.vocab.length * 2);
    await expect(a.importJson('{"x":1}')).rejects.toThrow();
  });
});
