import { describe, expect, it } from 'vitest';
import { buildIndex, canonicalVocabId, collectUnits, deWithArticle, glossWords, otherUnitsFor, productionAnswers, setContent } from './content';
import type { Unit } from '../content/types';
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

describe('cross-unit duplicate aliasing', () => {
  const mk = (id: string, order: number, vocab: Unit['vocab']): Unit => ({
    id, level: 'A1', order, title: id, titleDe: id, goal: 'g', grammar: [], drills: [], vocab,
  });
  const u1 = mk('a1-01', 1, [
    { id: 'a1-01-koffer', de: 'Koffer', en: 'suitcase', pos: 'noun', gender: 'der', plural: 'Koffer' },
    { id: 'a1-01-doch', de: 'doch', en: 'yes (contradicting a negative question)', pos: 'other' },
    { id: 'a1-01-termin', de: 'Termin', en: 'appointment', pos: 'noun', gender: 'der', plural: 'Termine' },
    { id: 'a1-01-leiter', de: 'Leiter', en: 'manager / head', pos: 'noun', gender: 'der', plural: 'Leiter' },
  ]);
  const u2 = mk('a1-02', 2, [
    { id: 'a1-02-koffer', de: 'koffer ', en: 'suitcase / case', pos: 'noun', gender: 'der', plural: 'Koffer' },
    { id: 'a1-02-doch', de: 'doch', en: '(particle) urges: "do …, why not"', pos: 'other' },
    { id: 'a1-02-termin', de: 'Termin', en: 'an appointment (at the doctor)', pos: 'noun', gender: 'der', plural: 'Termine' },
    { id: 'a1-02-leiter', de: 'Leiter', en: 'ladder', pos: 'noun', gender: 'die', plural: 'Leitern' },
    { id: 'a1-02-termin-verb', de: 'Termin', en: 'appointment', pos: 'verb' },
  ]);
  const u3 = mk('a2-01', 13, [
    { id: 'a2-01-koffer', de: 'Koffer', en: 'suitcase (for travel)', pos: 'noun', gender: 'der', plural: 'Koffer' },
    { id: 'a2-01-doch', de: 'doch', en: 'do it, why not', pos: 'other' },
  ]);

  it('aliases same headword + gender + pos with overlapping gloss to the first occurrence', () => {
    const idx = buildIndex([u3, u1, u2].sort((a, b) => a.order - b.order));
    const canon = (id: string) => idx.vocabById.get(id)!.canonicalId;
    expect(canon('a1-02-koffer')).toBe('a1-01-koffer');
    expect(canon('a2-01-koffer')).toBe('a1-01-koffer');
    expect(canon('a1-02-termin')).toBe('a1-01-termin'); // stop words + "(…)" ignored
    expect(idx.occurrences.get('a1-01-koffer')!.map((e) => e.unit.id)).toEqual(['a1-01', 'a1-02', 'a2-01']);
  });

  it('keeps distinct senses, genders and parts of speech separate', () => {
    const idx = buildIndex([u1, u2, u3]);
    const canon = (id: string) => idx.vocabById.get(id)!.canonicalId;
    expect(canon('a1-02-doch')).toBe('a1-02-doch'); // no shared meaningful word with "yes"
    expect(canon('a2-01-doch')).toBe('a1-02-doch'); // matches the second sense, not the first
    expect(canon('a1-02-leiter')).toBe('a1-02-leiter'); // different gender
    expect(canon('a1-02-termin-verb')).toBe('a1-02-termin-verb'); // different pos
    expect(idx.allVocab.map((e) => e.item.id)).toEqual([
      'a1-01-koffer', 'a1-01-doch', 'a1-01-termin', 'a1-01-leiter', 'a1-02-doch', 'a1-02-leiter', 'a1-02-termin-verb',
    ]);
    expect(idx.vocab).toHaveLength(11);
  });

  it('never aliases within the same unit', () => {
    const u = mk('a1-05', 5, [
      { id: 'a1-05-x', de: 'Bank', en: 'bank', pos: 'noun', gender: 'die', plural: 'Banken' },
      { id: 'a1-05-y', de: 'Bank', en: 'bank / bench', pos: 'noun', gender: 'die', plural: 'Bänke' },
    ]);
    const idx = buildIndex([u]);
    expect(idx.allVocab).toHaveLength(2);
  });

  it('glossWords drops stop words and parenthetical asides', () => {
    expect([...glossWords('to go (by vehicle) / to drive')]).toEqual(['drive']);
  });

  it('canonicalVocabId / otherUnitsFor use the live index', () => {
    setContent([u1, u2, u3]);
    expect(canonicalVocabId('a2-01-koffer')).toBe('a1-01-koffer');
    expect(canonicalVocabId('nope')).toBe('nope');
    expect(otherUnitsFor('a1-02-koffer').map((u) => u.id)).toEqual(['a1-01', 'a2-01']);
  });
});
