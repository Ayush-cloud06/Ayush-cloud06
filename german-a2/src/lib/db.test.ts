import { describe, expect, it } from 'vitest';
import { LocalStorageBackend, memoryKV, parseExport, SqliteBackend, SQL_MIGRATIONS, type SqlDb } from './db';
import { newCards } from './srs';

describe('LocalStorageBackend', () => {
  it('migrates an empty store and round-trips every table', async () => {
    const kv = memoryKV();
    const s = new LocalStorageBackend(kv);
    await s.init();
    expect(kv.getItem('stufe:schema')).toBe('1');
    const cards = newCards('v1', 1000);
    await s.putCards(cards);
    await s.putCards([{ ...cards[0], due: 5 }]);
    expect((await s.getCards()).find((c) => c.id === 'v1:rec')!.due).toBe(5);
    await s.addReviewLog({ card_id: 'v1:rec', rating: 3, ts: 1, elapsed_ms: 10, prev_state: 0 });
    await s.addReviewLog({ card_id: 'v1:rec', rating: 1, ts: 2, elapsed_ms: 10, prev_state: 1 });
    expect((await s.getReviewLogs()).map((l) => l.id)).toEqual([1, 2]);
    await s.putUnitProgress({ unit_id: 'a1-01', status: 'done', best_score: 90, last_opened: 3 });
    await s.addStudySeconds('2026-11-17', 30);
    await s.addStudySeconds('2026-11-17', 15);
    expect(await s.getStudyTime()).toEqual([{ day: '2026-11-17', seconds: 45 }]);
    await s.setSetting('newPerDay', '20');
    expect(await s.getSettings()).toEqual({ newPerDay: '20' });

    // Persisted: a fresh backend on the same KV sees the same data, and init() is idempotent.
    const s2 = new LocalStorageBackend(kv);
    await s2.init();
    expect(await s2.getCards()).toHaveLength(2);
    expect(await s2.getUnitProgress()).toEqual([{ unit_id: 'a1-01', status: 'done', best_score: 90, last_opened: 3 }]);
  });

  it('exports, resets (keeping settings) and imports', async () => {
    const s = new LocalStorageBackend(memoryKV());
    await s.init();
    await s.putCards(newCards('v1', 1));
    await s.addReviewLog({ card_id: 'v1:rec', rating: 3, ts: 1, elapsed_ms: 0, prev_state: 0 });
    await s.setSetting('theme', 'dark');
    const dump = await s.exportAll();
    expect(dump.app).toBe('stufe');
    await s.resetAll();
    expect(await s.getCards()).toEqual([]);
    expect(await s.getReviewLogs()).toEqual([]);
    expect(await s.getSettings()).toEqual({ theme: 'dark' });
    await s.importAll(parseExport(JSON.stringify(dump)));
    expect(await s.getCards()).toHaveLength(2);
    expect(await s.getReviewLogs()).toHaveLength(1);
  });

  it('survives corrupt JSON in a table', async () => {
    const kv = memoryKV();
    const s = new LocalStorageBackend(kv);
    await s.init();
    kv.setItem('stufe:cards', '{not json');
    expect(await s.getCards()).toEqual([]);
  });
});

describe('parseExport', () => {
  it('rejects foreign files', () => {
    expect(() => parseExport('{"foo":1}')).toThrow(/Not a Stufe/);
    expect(() => parseExport('{"app":"stufe","cards":[]}')).toThrow(/missing/);
  });
});

describe('SqliteBackend (with a fake driver)', () => {
  it('runs migrations once and sets user_version', async () => {
    const executed: string[] = [];
    let version = 0;
    const db: SqlDb = {
      async execute(q) {
        executed.push(q);
        const m = /PRAGMA user_version = (\d+)/.exec(q);
        if (m) version = Number(m[1]);
        return { rowsAffected: 0 };
      },
      async select<T>(q: string) {
        if (q.startsWith('PRAGMA user_version')) return [{ user_version: version }] as T;
        return [] as T;
      },
    };
    const s = new SqliteBackend(db);
    await s.init();
    expect(version).toBe(SQL_MIGRATIONS.length);
    const n = executed.length;
    await s.init();
    expect(executed.length).toBe(n);
    // chunked multi-row upsert uses numbered params
    executed.length = 0;
    await s.putCards(Array.from({ length: 150 }, (_, i) => newCards(`v${i}`, 1)[0]));
    expect(executed).toHaveLength(2);
    expect(executed[0]).toContain('$600');
    expect(executed[0]).toContain('ON CONFLICT(id)');
  });
});
