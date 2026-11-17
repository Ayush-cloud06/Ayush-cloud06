import { describe, expect, it } from 'vitest';
import { buildIndex, collectUnits, deWithArticle, productionAnswers } from './content';
import fixture from './__fixtures__/fixture-unit';

describe('content', () => {
  it('collects and sorts units, tolerating empty / bad modules', () => {
    expect(collectUnits({})).toEqual([]);
    const later = { ...fixture, id: 'a2-99', order: 99 };
    const units = collectUnits({ b: { default: later }, a: { default: fixture }, c: {} });
    expect(units.map((u) => u.id)).toEqual(['a1-90', 'a2-99']);
  });
  it('indexes vocab', () => {
    const idx = buildIndex([fixture]);
    expect(idx.vocabById.get('a1-90-tisch')!.unit.id).toBe('a1-90');
    expect(idx.byLevel.A1).toHaveLength(1);
    expect(idx.byLevel.A2).toHaveLength(0);
  });
  it('builds production answers with articles', () => {
    const tisch = fixture.vocab[0];
    expect(deWithArticle(tisch)).toBe('der Tisch');
    expect(productionAnswers(tisch)).toEqual(['der Tisch']);
    expect(productionAnswers({ id: 'x', de: 'Hallo / Servus', en: 'hi', pos: 'phrase' })).toEqual(['Hallo', 'Servus']);
  });
});
