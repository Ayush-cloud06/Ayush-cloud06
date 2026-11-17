// Sanity checks on whatever real curriculum is present (passes trivially with 0 units).
import { describe, expect, it } from 'vitest';
import { content, headwordKey, productionAnswers } from './content';
import { checkDrill } from './drills';
import { checkAnswer } from './check';

describe('real content index', () => {
  it('aliases only same-key items across units, and canonical ids are unique', () => {
    const idx = content;
    let aliases = 0;
    for (const e of idx.vocab) {
      if (e.canonicalId === e.item.id) continue;
      aliases++;
      const c = idx.vocabById.get(e.canonicalId)!;
      expect(c.canonicalId).toBe(c.item.id);
      expect(headwordKey(c.item)).toBe(headwordKey(e.item));
      expect(c.unit.id).not.toBe(e.unit.id);
    }
    expect(new Set(idx.allVocab.map((e) => e.item.id)).size).toBe(idx.allVocab.length);
    expect(idx.allVocab.length + aliases).toBe(idx.vocab.length);
    // Duplicate headword keys among canonical entries = deliberately distinct senses.
    const keys = new Map<string, number>();
    for (const e of idx.allVocab) keys.set(headwordKey(e.item), (keys.get(headwordKey(e.item)) ?? 0) + 1);
    const senses = [...keys.values()].filter((n) => n > 1).length;
    console.log(`content: ${idx.units.length} units, ${idx.vocab.length} vocab items, ${idx.allVocab.length} canonical, ${aliases} aliases, ${senses} headwords kept as distinct senses`);
  });
});


describe('real content works with the checker', () => {
  it('every accepted drill answer checks as correct', () => {
    const bad: string[] = [];
    for (const u of content.units)
      for (const d of u.drills) {
        if (d.type === 'translate') for (const a of d.answers) { if (checkDrill(d, a).result !== 'correct') bad.push(`${d.id}: ${a}`); }
        else if (d.type === 'cloze') { if (checkDrill(d, d.answers.map((a) => a[0])).result !== 'correct') bad.push(d.id); }
        else if (d.type === 'order') { if (checkDrill(d, d.words.join(' ')).result !== 'correct') bad.push(d.id); }
        else if (checkDrill(d, d.correct).result !== 'correct') bad.push(d.id);
      }
    expect(bad).toEqual([]);
  });
  it('every production answer checks as correct', () => {
    const bad = content.allVocab.filter((e) => checkAnswer(productionAnswers(e.item)[0], productionAnswers(e.item), { requireArticle: e.item.pos === 'noun' }).result !== 'correct');
    expect(bad.map((e) => e.item.id)).toEqual([]);
  });
});
