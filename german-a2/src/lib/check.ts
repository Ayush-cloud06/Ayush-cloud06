// Answer checker. Pure functions, no DOM.

export type CheckResult = 'correct' | 'almost' | 'wrong';

export interface Check {
  result: CheckResult;
  /** The accepted answer that was the best match (as authored). */
  matched: string;
  notes: string[];
}

export interface CheckOptions {
  /**
   * Treat the answer as "article + noun" (production cards). A missing or wrong
   * article is always 'wrong', because gender matters.
   */
  requireArticle?: boolean;
}

export const ARTICLES = ['der', 'die', 'das'] as const;

/** Short grammatical words where a one-letter difference is a grammar error, not a typo. */
const FUNCTION_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
  'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres',
  'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
  'dieser', 'diese', 'diesen', 'diesem', 'dieses',
  'welcher', 'welche', 'welchen', 'welchem', 'welches',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'mich', 'mir', 'dich', 'dir', 'ihn', 'ihm', 'uns', 'euch', 'ihnen',
  'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'beim', 'mit', 'nach', 'von', 'vom', 'zu', 'zum', 'zur', 'für', 'um',
  'ist', 'bin', 'bist', 'sind', 'seid', 'hat', 'hast', 'habe', 'haben', 'habt',
  'wird', 'wirst', 'werde', 'werden', 'war', 'waren', 'warst',
  'kann', 'kannst', 'muss', 'musst', 'will', 'willst',
  'nicht', 'kein', 'wo', 'wie', 'was', 'wer', 'wen', 'wem', 'wann',
]);

/** Verb / adjective / noun endings: a difference only in these is a grammar error. */
const ENDINGS = new Set(['', 'e', 'n', 'r', 'm', 'en', 'em', 'er', 'es', 's', 'st', 't', 'et', 'est', 'te', 'ten', 'test', 'tet', 'nen']);

/** Normalise for comparison: NFC, quotes, whitespace, trailing sentence punctuation. Case preserved. */
export function normalize(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[‘’‚‛´`′]/g, "'")
    .replace(/[“”„‟«»″]/g, '"')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+([,;:.!?])/g, '$1')
    .replace(/[.!?\s]+$/, '')
    .trim();
}

/** ä→ae, ö→oe, ü→ue, ß→ss (expects lower-case input). */
export function foldUmlauts(s: string): string {
  return s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/** ä→a, ö→o, ü→u, ß→ss (expects lower-case input). */
function stripUmlauts(s: string): string {
  return s.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
}

export function levenshtein(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function commonPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * True if the difference between two (lower-case) answers looks like a grammar mistake
 * (wrong article/pronoun/preposition or a wrong ending) rather than a typo.
 */
export function isGrammarDifference(a: string, b: string): boolean {
  const ta = a.split(' ');
  const tb = b.split(' ');
  if (ta.length !== tb.length) {
    // An inserted / dropped function word ("Ich gehe Schule" vs "Ich gehe zur Schule").
    const sa = new Set(ta);
    const sb = new Set(tb);
    const extra = [...ta.filter((t) => !sb.has(t)), ...tb.filter((t) => !sa.has(t))];
    return extra.some((t) => FUNCTION_WORDS.has(t.replace(/[,;:]$/, '')));
  }
  for (let i = 0; i < ta.length; i++) {
    const x = ta[i].replace(/[,;:]$/, '');
    const y = tb[i].replace(/[,;:]$/, '');
    if (x === y) continue;
    if (FUNCTION_WORDS.has(x) || FUNCTION_WORDS.has(y)) return true;
    if (x.length <= 3 || y.length <= 3) return true;
    const p = commonPrefixLen(x, y);
    const rx = x.slice(p);
    const ry = y.slice(p);
    // A dropped "e" before a final consonant ("Fenstr" for "Fenster") is a typo, not an ending.
    const droppedE = (u: string, v: string) => v.length === 1 && u === 'e' + v;
    if (p >= 2 && ENDINGS.has(rx) && ENDINGS.has(ry) && !droppedE(rx, ry) && !droppedE(ry, rx)) return true;
  }
  return false;
}

function splitArticle(s: string): { article: string | null; rest: string } {
  const m = /^(der|die|das)\s+(.*)$/i.exec(s);
  return m ? { article: m[1].toLowerCase(), rest: m[2] } : { article: null, rest: s };
}

/** Compare one input against one accepted answer. */
export function checkOne(input: string, expected: string, opts: CheckOptions = {}): Check {
  let a = normalize(input);
  let b = normalize(expected);
  const notes: string[] = [];
  if (a === b) return { result: 'correct', matched: expected, notes };
  if (!a) return { result: 'wrong', matched: expected, notes: ['No answer'] };

  if (opts.requireArticle) {
    const ea = splitArticle(b);
    if (ea.article) {
      const ia = splitArticle(a);
      if (!ia.article) return { result: 'wrong', matched: expected, notes: [`Missing article: ${ea.article}`] };
      if (ia.article !== ea.article) return { result: 'wrong', matched: expected, notes: [`Wrong article: ${ea.article}, not ${ia.article}`] };
      // Articles agree (any capitalisation); compare the rest.
      a = ia.rest;
      b = ea.rest;
      if (a === b) return { result: 'correct', matched: expected, notes };
    }
  }

  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return { result: 'almost', matched: expected, notes: ['Capitalisation'] };

  const caseNote = (x: string, y: string) => (x !== y ? ['Capitalisation'] : []);

  // ae/oe/ue/ss written instead of ä/ö/ü/ß.
  if (foldUmlauts(la) === foldUmlauts(lb)) {
    notes.push('Use umlauts');
    // Was case also off? Compare case-preserving folds.
    const fa = a.replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
    const fb = b.replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
    notes.push(...caseNote(foldUmlauts(fa), foldUmlauts(fb)));
    return { result: 'almost', matched: expected, notes };
  }
  // Dots dropped (a for ä) – still close, but flag it.
  if (stripUmlauts(la) === stripUmlauts(lb)) {
    return { result: 'almost', matched: expected, notes: ['Umlaut missing'] };
  }

  const len = lb.length;
  const allowed = len >= 12 ? 2 : len >= 5 ? 1 : 0;
  if (allowed > 0) {
    const d = levenshtein(foldUmlauts(la), foldUmlauts(lb), allowed);
    if (d <= allowed && !isGrammarDifference(la, lb)) {
      notes.push('Typo');
      return { result: 'almost', matched: expected, notes };
    }
  }
  return { result: 'wrong', matched: expected, notes: isGrammarDifference(la, lb) ? ['Check the grammar'] : [] };
}

const RANK: Record<CheckResult, number> = { correct: 2, almost: 1, wrong: 0 };

/** Check against all accepted answers; returns the best match. First accepted answer is canonical. */
export function checkAnswer(input: string, accepted: string[], opts: CheckOptions = {}): Check {
  if (accepted.length === 0) throw new Error('checkAnswer: no accepted answers');
  let best: Check | null = null;
  let bestDist = Infinity;
  for (const exp of accepted) {
    const c = checkOne(input, exp, opts);
    const dist = levenshtein(normalize(input).toLowerCase(), normalize(exp).toLowerCase());
    if (
      !best ||
      RANK[c.result] > RANK[best.result] ||
      (RANK[c.result] === RANK[best.result] && (c.notes.length < best.notes.length || (c.notes.length === best.notes.length && dist < bestDist)))
    ) {
      best = c;
      bestDist = dist;
    }
  }
  // For a plain wrong answer, show the canonical answer rather than whatever was closest.
  if (best!.result === 'wrong' && best!.notes.length === 0) return { ...best!, matched: accepted[0] };
  return best!;
}

/** Points for scoring a drill: correct 1, almost 0.5, wrong 0. */
export function points(r: CheckResult): number {
  return r === 'correct' ? 1 : r === 'almost' ? 0.5 : 0;
}

export type DiffSeg = { t: 'same' | 'add' | 'del'; s: string };

/**
 * Character diff from `from` (what the learner typed) to `to` (expected).
 * 'del' = typed but not expected, 'add' = expected but missing.
 */
export function diffChars(from: string, to: string): DiffSeg[] {
  const a = [...from];
  const b = [...to];
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffSeg[] = [];
  const push = (t: DiffSeg['t'], s: string) => {
    const last = out[out.length - 1];
    if (last && last.t === t) last.s += s;
    else out.push({ t, s });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', a[i]); i++; }
    else { push('add', b[j]); j++; }
  }
  while (i < n) push('del', a[i++]);
  while (j < m) push('add', b[j++]);
  return out;
}
