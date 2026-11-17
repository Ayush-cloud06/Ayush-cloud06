import type { Drill, Unit } from '../content/types';
import { checkAnswer, type Check, type CheckResult } from './check';

export interface DrillItem {
  drill: Drill;
  unitId: string;
  /** choice: display order of option indices. order: shuffled word list. */
  choiceOrder?: number[];
  shuffled?: string[];
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle, retrying a few times so the result differs from the input when possible. */
function scramble<T>(arr: readonly T[], rand: () => number): T[] {
  let s = shuffle(arr, rand);
  for (let i = 0; i < 5 && arr.length > 1 && s.every((x, k) => x === arr[k]); i++) s = shuffle(arr, rand);
  return s;
}

export function prepare(drill: Drill, unitId: string, rand: () => number = Math.random): DrillItem {
  const item: DrillItem = { drill, unitId };
  if (drill.type === 'choice') item.choiceOrder = shuffle(drill.options.map((_, i) => i), rand);
  if (drill.type === 'order') item.shuffled = scramble(drill.words, rand);
  return item;
}

export interface SessionOptions {
  shuffle?: boolean;
  limit?: number;
  only?: Set<string>;
  rand?: () => number;
}

export function buildSession(units: Unit[], o: SessionOptions = {}): DrillItem[] {
  const rand = o.rand ?? Math.random;
  let items = units.flatMap((u) => u.drills.filter((d) => !o.only || o.only.has(d.id)).map((d) => prepare(d, u.id, rand)));
  if (o.shuffle) items = shuffle(items, rand);
  if (o.limit) items = items.slice(0, o.limit);
  return items;
}

/** Join order-drill words into a sentence ("Ich", "komme", "." → "Ich komme."). */
export function joinWords(words: string[]): string {
  return words.join(' ').replace(/\s+([,.!?;:])/g, '$1');
}

export function fillCloze(text: string, fills: string[]): string {
  let i = 0;
  return text.replace(/___/g, () => fills[i++] ?? '___');
}

export function canonical(d: Drill): string {
  switch (d.type) {
    case 'translate': return d.answers[0];
    case 'cloze': return fillCloze(d.text, d.answers.map((a) => a[0]));
    case 'choice': return d.options[d.correct];
    case 'order': return joinWords(d.words);
  }
}

export interface DrillCheck extends Check {
  /** What the learner answered, rendered as one string. */
  given: string;
  /** Per-gap results for cloze drills. */
  gaps?: Check[];
}

const worst = (rs: CheckResult[]): CheckResult => (rs.includes('wrong') ? 'wrong' : rs.includes('almost') ? 'almost' : 'correct');

/** Answer: translate/order → string; cloze → string[] (one per gap); choice → original option index. */
export function checkDrill(d: Drill, answer: string | string[] | number): DrillCheck {
  switch (d.type) {
    case 'translate': {
      const a = String(answer);
      return { ...checkAnswer(a, d.answers), given: a };
    }
    case 'order': {
      const a = String(answer);
      return { ...checkAnswer(a, [joinWords(d.words)]), given: a };
    }
    case 'cloze': {
      const fills = Array.isArray(answer) ? answer : [String(answer)];
      const gaps = d.answers.map((acc, i) => checkAnswer(fills[i] ?? '', acc));
      const notes = [...new Set(gaps.flatMap((g) => g.notes))];
      return {
        result: worst(gaps.map((g) => g.result)),
        matched: fillCloze(d.text, gaps.map((g) => g.matched)),
        notes,
        given: fillCloze(d.text, fills.map((f) => f.trim() || '…')),
        gaps,
      };
    }
    case 'choice': {
      const i = Number(answer);
      const ok = i === d.correct;
      return { result: ok ? 'correct' : 'wrong', matched: d.options[d.correct], notes: [], given: d.options[i] ?? '' };
    }
  }
}
