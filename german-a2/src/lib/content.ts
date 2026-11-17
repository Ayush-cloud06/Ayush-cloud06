import type { Unit, VocabItem, Level } from '../content/types';

type UnitModule = { default?: Unit };

/** Collect default-exported units and sort by `order`. Tolerates 0..n modules and modules without a default. */
export function collectUnits(mods: Record<string, UnitModule>): Unit[] {
  return Object.values(mods)
    .map((m) => m.default)
    .filter((u): u is Unit => !!u && typeof u === 'object' && typeof u.id === 'string')
    .sort((a, b) => a.order - b.order);
}

export interface VocabEntry {
  item: VocabItem;
  unit: Unit;
  /** Global position (unit order, then index in unit) – used to order new cards. */
  pos: number;
  /**
   * Id of the canonical item this one is a duplicate of (itself if canonical). Cards and
   * reviews always use the canonical id, so a word repeated across units is learned once.
   */
  canonicalId: string;
}

export interface ContentIndex {
  units: Unit[];
  unitById: Map<string, Unit>;
  /** Every vocab item of every unit (including aliases), in unit order. */
  vocab: VocabEntry[];
  /** Canonical items only: one per distinct word/sense. */
  allVocab: VocabEntry[];
  /** Any vocab id (canonical or alias) → its entry. */
  vocabById: Map<string, VocabEntry>;
  /** Canonical id → all entries (canonical first) sharing it. */
  occurrences: Map<string, VocabEntry[]>;
  byLevel: Record<Level, Unit[]>;
}

const STOP_WORDS = new Set([
  'to', 'the', 'a', 'an', 'of', 'be', 'is', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'by', 'from', 'up', 'out',
  'sb', 'sth', 'someone', 'something', 'one', 'it', 'as', 'do', 'not', 'get', 'have', 'go', 'very', 'etc', 'e', 'g', 'i',
]);

/** Meaningful lower-case words of an English gloss; "(…)" asides are ignored. */
export function glossWords(en: string): Set<string> {
  return new Set(
    en
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-z]+/)
      .filter((w) => w.length > 0 && !STOP_WORDS.has(w)),
  );
}

export function headwordKey(v: VocabItem): string {
  return `${v.gender ?? ''}${v.de.toLowerCase().trim()}|${v.pos}`;
}

function sharesMeaning(a: string, b: string): boolean {
  const wa = glossWords(a);
  for (const w of glossWords(b)) if (wa.has(w)) return true;
  return false;
}

export function buildIndex(units: Unit[]): ContentIndex {
  const unitById = new Map(units.map((u) => [u.id, u]));
  const vocab: VocabEntry[] = [];
  const allVocab: VocabEntry[] = [];
  const occurrences = new Map<string, VocabEntry[]>();
  // headword key → canonical entries with that key (several if senses differ)
  const byKey = new Map<string, VocabEntry[]>();
  units.forEach((unit, ui) =>
    unit.vocab.forEach((item, vi) => {
      const key = headwordKey(item);
      const candidates = byKey.get(key) ?? [];
      const canon = candidates.find((c) => c.unit.id !== unit.id && sharesMeaning(c.item.en, item.en));
      const entry: VocabEntry = { item, unit, pos: canon ? canon.pos : ui * 10000 + vi, canonicalId: canon ? canon.item.id : item.id };
      vocab.push(entry);
      if (canon) occurrences.get(canon.item.id)!.push(entry);
      else {
        allVocab.push(entry);
        occurrences.set(item.id, [entry]);
        byKey.set(key, [...candidates, entry]);
      }
    }),
  );
  return {
    units,
    unitById,
    vocab,
    allVocab,
    vocabById: new Map(vocab.map((v) => [v.item.id, v])),
    occurrences,
    byLevel: { A1: units.filter((u) => u.level === 'A1'), A2: units.filter((u) => u.level === 'A2') },
  };
}

/** Canonical vocab id for any vocab id (unknown ids are returned unchanged). */
export function canonicalVocabId(id: string): string {
  return content.vocabById.get(id)?.canonicalId ?? id;
}

/** Other units in which the same word (canonical sense) appears. */
export function otherUnitsFor(id: string): Unit[] {
  const e = content.vocabById.get(id);
  if (!e) return [];
  return (content.occurrences.get(e.canonicalId) ?? []).map((o) => o.unit).filter((u, i, a) => u.id !== e.unit.id && a.findIndex((x) => x.id === u.id) === i);
}

const unitModules = import.meta.glob<UnitModule>('../content/units/*.ts', { eager: true });

/** The live content index. Replaced (not mutated) by `initContent`. */
export let content: ContentIndex = buildIndex(collectUnits(unitModules));

/**
 * Dev/test flag: `?fixtures` in the URL loads the bundled fixture unit when there is no
 * real content yet (lets the UI and smoke test run before curriculum lands).
 */
export async function initContent(): Promise<ContentIndex> {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('fixtures') && content.units.length === 0) {
    const fx = import.meta.glob<UnitModule>('./__fixtures__/*.ts');
    const loaded: Record<string, UnitModule> = {};
    for (const [k, load] of Object.entries(fx)) loaded[k] = await load();
    content = buildIndex(collectUnits(loaded));
  }
  return content;
}

/** German headword as shown/answered: nouns get their article. */
export function deWithArticle(v: VocabItem): string {
  return v.pos === 'noun' && v.gender ? `${v.gender} ${v.de}` : v.de;
}

/** Accepted German answers for a production card. "a / b" headwords accept either. */
export function productionAnswers(v: VocabItem): string[] {
  const alts = v.de.split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
  return alts.map((a) => (v.pos === 'noun' && v.gender && !/^(der|die|das)\s/i.test(a) ? `${v.gender} ${a}` : a));
}

/** Replace the content index (tests). */
export function setContent(units: Unit[]): ContentIndex {
  content = buildIndex(units);
  return content;
}
