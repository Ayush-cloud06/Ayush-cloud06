import { describe, expect, it } from 'vitest';
import { buildSession, canonical, checkDrill, fillCloze, joinWords, prepare, shuffle } from './drills';
import fixture from './__fixtures__/fixture-unit';
import type { Drill } from '../content/types';

const d = (id: string) => fixture.drills.find((x) => x.id === id)! as Drill;

describe('drills', () => {
  it('joins words with punctuation', () => {
    expect(joinWords(['Ich', 'komme', 'aus', 'Wien', '.'])).toBe('Ich komme aus Wien.');
    expect(joinWords(['Ja', ',', 'gern'])).toBe('Ja, gern');
  });
  it('fills cloze gaps', () => {
    expect(fillCloze('___ ist ___.', ['Das', 'gut'])).toBe('Das ist gut.');
  });
  it('builds canonical answers', () => {
    expect(canonical(d('a1-90-d02'))).toBe('Die Lampe ist neu.');
    expect(canonical(d('a1-90-d03'))).toBe('das');
    expect(canonical(d('a1-90-d04'))).toBe('Ich schlafe im Bett');
  });
  it('checks each drill type', () => {
    expect(checkDrill(d('a1-90-d01'), 'Der Tisch ist gross').result).toBe('almost');
    expect(checkDrill(d('a1-90-d01'), 'Der Tisch ist groß.').result).toBe('correct');
    expect(checkDrill(d('a1-90-d02'), ['Die']).result).toBe('correct');
    expect(checkDrill(d('a1-90-d02'), ['Der']).result).toBe('wrong');
    expect(checkDrill(d('a1-90-d02'), ['die'])).toMatchObject({ result: 'almost', notes: ['Capitalisation'] });
    expect(checkDrill(d('a1-90-d03'), 2).result).toBe('correct');
    expect(checkDrill(d('a1-90-d03'), 0)).toMatchObject({ result: 'wrong', matched: 'das', given: 'der' });
    expect(checkDrill(d('a1-90-d04'), 'Ich schlafe im Bett.').result).toBe('correct');
    expect(checkDrill(d('a1-90-d04'), 'Ich im Bett schlafe').result).toBe('wrong');
  });
  it('multi-gap cloze takes the worst gap', () => {
    const c: Drill = { id: 'x-d1', type: 'cloze', text: '___ heiße ___.', answers: [['Ich'], ['Anna']] };
    expect(checkDrill(c, ['Ich', 'Anna']).result).toBe('correct');
    expect(checkDrill(c, ['Ich', 'anna']).result).toBe('almost');
    expect(checkDrill(c, ['Du', 'Anna']).result).toBe('wrong');
  });
  it('prepares shuffled choice / order items', () => {
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const o = prepare(d('a1-90-d04'), 'a1-90', rand);
    expect([...o.shuffled!].sort()).toEqual([...(d('a1-90-d04') as any).words].sort());
    expect(o.shuffled).not.toEqual((d('a1-90-d04') as any).words);
    const c = prepare(d('a1-90-d03'), 'a1-90', rand);
    expect([...c.choiceOrder!].sort()).toEqual([0, 1, 2]);
  });
  it('builds sessions with filter and limit', () => {
    expect(buildSession([fixture])).toHaveLength(4);
    expect(buildSession([fixture], { only: new Set(['a1-90-d01']) })).toHaveLength(1);
    expect(buildSession([fixture], { shuffle: true, limit: 2 })).toHaveLength(2);
    expect(shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
  });
});

describe('order drill punctuation', () => {
  it('ignores commas in order drills', () => {
    const o: Drill = { id: 'x-d2', type: 'order', en: 'x', words: ['Das', 'sind', 'keine', 'Bücher', 'das', 'sind', 'Hefte'] };
    expect(checkDrill(o, 'Das sind keine Bücher, das sind Hefte.').result).toBe('correct');
    const p: Drill = { id: 'x-d3', type: 'order', en: 'x', words: ['Ja', ',', 'gern', '.'] };
    expect(checkDrill(p, 'Ja gern').result).toBe('correct');
  });
});
