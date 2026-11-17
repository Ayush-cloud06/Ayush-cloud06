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
}

export interface ContentIndex {
  units: Unit[];
  unitById: Map<string, Unit>;
  vocab: VocabEntry[];
  vocabById: Map<string, VocabEntry>;
  byLevel: Record<Level, Unit[]>;
}

export function buildIndex(units: Unit[]): ContentIndex {
  const unitById = new Map(units.map((u) => [u.id, u]));
  const vocab: VocabEntry[] = [];
  units.forEach((unit, ui) => unit.vocab.forEach((item, vi) => vocab.push({ item, unit, pos: ui * 10000 + vi })));
  return {
    units,
    unitById,
    vocab,
    vocabById: new Map(vocab.map((v) => [v.item.id, v])),
    byLevel: { A1: units.filter((u) => u.level === 'A1'), A2: units.filter((u) => u.level === 'A2') },
  };
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
