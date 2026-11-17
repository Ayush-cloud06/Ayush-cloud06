import { describe, expect, it } from 'vitest';
import { checkAnswer, checkOne, diffChars, isGrammarDifference, levenshtein, normalize, points } from './check';

describe('normalize', () => {
  it('trims, collapses spaces and strips trailing punctuation', () => {
    expect(normalize('  Ich   bin  müde. ')).toBe('Ich bin müde');
    expect(normalize('Wie geht es dir?!')).toBe('Wie geht es dir');
    expect(normalize('Hallo !')).toBe('Hallo');
  });
  it('removes space before inner punctuation', () => {
    expect(normalize('Ja , gern')).toBe('Ja, gern');
  });
  it('unifies quotes and apostrophes', () => {
    expect(normalize('Wie geht’s')).toBe("Wie geht's");
    expect(normalize('Er sagt „Hallo“')).toBe('Er sagt "Hallo"');
  });
  it('keeps case', () => {
    expect(normalize('der Tisch')).toBe('der Tisch');
  });
  it('NFC-normalises decomposed umlauts', () => {
    expect(normalize('müde')).toBe('müde');
  });
});

describe('levenshtein', () => {
  it('computes distances', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
  it('short-circuits beyond max', () => {
    expect(levenshtein('a', 'abcdef', 2)).toBe(3);
  });
});

describe('checkOne', () => {
  it('accepts exact answers ignoring trailing punctuation and spacing', () => {
    expect(checkOne('Ich heiße Anna', 'Ich heiße Anna.').result).toBe('correct');
    expect(checkOne(' ich  heiße Anna ', 'Ich heiße Anna').result).toBe('almost');
  });

  it('flags capitalisation-only differences as almost', () => {
    const c = checkOne('der tisch', 'der Tisch');
    expect(c.result).toBe('almost');
    expect(c.notes).toEqual(['Capitalisation']);
  });

  it('accepts ae/oe/ue/ss as almost with a note', () => {
    expect(checkOne('muede', 'müde')).toMatchObject({ result: 'almost', notes: ['Use umlauts'] });
    expect(checkOne('Strasse', 'Straße')).toMatchObject({ result: 'almost', notes: ['Use umlauts'] });
    expect(checkOne('Ich hoere Musik', 'Ich höre Musik')).toMatchObject({ result: 'almost', notes: ['Use umlauts'] });
  });

  it('notes capitalisation alongside umlaut substitution', () => {
    const c = checkOne('strasse', 'Straße');
    expect(c.result).toBe('almost');
    expect(c.notes).toContain('Use umlauts');
    expect(c.notes).toContain('Capitalisation');
  });

  it('flags missing umlaut dots as almost', () => {
    expect(checkOne('Madchen', 'Mädchen')).toMatchObject({ result: 'almost', notes: ['Umlaut missing'] });
  });

  it('tolerates one typo for answers of 5+ chars', () => {
    expect(checkOne('Tich', 'Tisch')).toMatchObject({ result: 'almost', notes: ['Typo'] });
    expect(checkOne('Fenstr', 'Fenster')).toMatchObject({ result: 'almost', notes: ['Typo'] });
  });

  it('does not tolerate typos for answers under 5 chars', () => {
    expect(checkOne('Bot', 'Brot').result).toBe('wrong');
    expect(checkOne('ja', 'je').result).toBe('wrong');
  });

  it('tolerates two typos for answers of 12+ chars', () => {
    expect(checkOne('Ich wohne in Berln', 'Ich wohne in Berlin').result).toBe('almost');
    expect(checkOne('Ich whne in Berln', 'Ich wohne in Berlin').result).toBe('almost');
    expect(checkOne('Ich whne n Berln', 'Ich wohne in Berlin').result).toBe('wrong');
  });

  it('allows only one typo between 5 and 11 chars', () => {
    expect(checkOne('Fnstr', 'Fenster').result).toBe('wrong');
  });

  it('treats wrong function words as wrong, not typos', () => {
    expect(checkOne('Ich gebe dem Mann das Buch', 'Ich gebe den Mann das Buch').result).toBe('wrong');
    expect(checkOne('Ich wohne im Berlin', 'Ich wohne in Berlin').result).toBe('wrong');
  });

  it('treats wrong endings as wrong, not typos', () => {
    expect(checkOne('Du spielt Fußball', 'Du spielst Fußball').result).toBe('wrong');
    expect(checkOne('ein kleiner Hund', 'ein kleinen Hund').result).toBe('wrong');
    expect(checkOne('Ich gehe nach Hause', 'Ich gehe nach Haus').result).toBe('wrong');
  });

  it('returns wrong for clearly different answers', () => {
    expect(checkOne('Stuhl', 'Tisch').result).toBe('wrong');
    expect(checkOne('', 'Tisch')).toMatchObject({ result: 'wrong', notes: ['No answer'] });
  });

  describe('requireArticle (nouns)', () => {
    const o = { requireArticle: true };
    it('accepts article + noun', () => {
      expect(checkOne('der Tisch', 'der Tisch', o).result).toBe('correct');
      expect(checkOne('Der Tisch', 'der Tisch', o).result).toBe('correct');
    });
    it('missing article is wrong', () => {
      expect(checkOne('Tisch', 'der Tisch', o)).toMatchObject({ result: 'wrong', notes: ['Missing article: der'] });
    });
    it('wrong article is wrong even if the noun is perfect', () => {
      const c = checkOne('die Tisch', 'der Tisch', o);
      expect(c.result).toBe('wrong');
      expect(c.notes[0]).toMatch(/Wrong article: der/);
      expect(checkOne('das Lampe', 'die Lampe', o).result).toBe('wrong');
    });
    it('still allows typo / umlaut / case leniency on the noun', () => {
      expect(checkOne('der Tich', 'der Tisch', o)).toMatchObject({ result: 'almost', notes: ['Typo'] });
      expect(checkOne('die Tuer', 'die Tür', o)).toMatchObject({ result: 'almost', notes: ['Use umlauts'] });
      expect(checkOne('der tisch', 'der Tisch', o)).toMatchObject({ result: 'almost', notes: ['Capitalisation'] });
    });
    it('plural instead of singular is wrong', () => {
      expect(checkOne('der Tische', 'der Tisch', o).result).toBe('wrong');
    });
  });
});

describe('checkAnswer', () => {
  it('picks the best of several accepted answers', () => {
    const acc = ['Ich komme aus Deutschland', 'Ich bin aus Deutschland'];
    const c = checkAnswer('ich bin aus Deutschland', acc);
    expect(c.result).toBe('almost');
    expect(c.matched).toBe('Ich bin aus Deutschland');
    expect(checkAnswer('Ich bin aus Deutschland.', acc)).toMatchObject({ result: 'correct', matched: 'Ich bin aus Deutschland' });
  });
  it('prefers correct over almost', () => {
    expect(checkAnswer('Tisch', ['tisch', 'Tisch']).result).toBe('correct');
  });
  it('returns canonical answer for plain wrong answers', () => {
    expect(checkAnswer('xyz', ['Guten Morgen', 'Morgen']).matched).toBe('Guten Morgen');
  });
  it('throws with no accepted answers', () => {
    expect(() => checkAnswer('x', [])).toThrow();
  });
});

describe('isGrammarDifference', () => {
  it('detects inserted function words', () => {
    expect(isGrammarDifference('ich gehe schule', 'ich gehe zur schule')).toBe(true);
  });
  it('does not flag spelling typos', () => {
    expect(isGrammarDifference('ich wohne in berln', 'ich wohne in berlin')).toBe(false);
  });
});

describe('diffChars', () => {
  it('produces del/add segments that rebuild both strings', () => {
    const d = diffChars('Tich', 'Tisch');
    expect(d.filter((s) => s.t !== 'add').map((s) => s.s).join('')).toBe('Tich');
    expect(d.filter((s) => s.t !== 'del').map((s) => s.s).join('')).toBe('Tisch');
    expect(d).toContainEqual({ t: 'add', s: 's' });
  });
  it('handles empty input', () => {
    expect(diffChars('', 'ab')).toEqual([{ t: 'add', s: 'ab' }]);
  });
});

describe('points', () => {
  it('scores results', () => {
    expect(points('correct')).toBe(1);
    expect(points('almost')).toBe(0.5);
    expect(points('wrong')).toBe(0);
  });
});

describe('punctuation and notes', () => {
  it('missing inner comma is almost with a Punctuation note', () => {
    expect(checkOne('Ja das ist gut', 'Ja, das ist gut')).toMatchObject({ result: 'almost', notes: ['Punctuation'] });
    expect(checkOne('ja das ist gut', 'Ja, das ist gut')).toMatchObject({ result: 'almost', notes: ['Capitalisation', 'Punctuation'] });
  });
  it('does not add a grammar note to a completely different answer', () => {
    expect(checkOne('Ich bin müde', 'Wer ist das? Das ist Herr Becker').notes).toEqual([]);
    expect(checkOne('Ich wohne im Berlin', 'Ich wohne in Berlin').notes).toEqual(['Check the grammar']);
  });
});
