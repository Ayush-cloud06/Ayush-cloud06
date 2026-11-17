// Shared content contract. App code and every unit file depend on this; change with care.

export type Level = 'A1' | 'A2';

export type PartOfSpeech =
  | 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'pron'
  | 'conj' | 'num' | 'phrase' | 'other';

export interface Example {
  de: string;
  en: string;
}

export interface GrammarNote {
  heading: string;
  /** Short explanation. Plain text; **bold** allowed; blank line = new paragraph. Keep it tight. */
  body: string;
  table?: { head: string[]; rows: string[][] };
  examples?: Example[];
}

export interface VocabItem {
  /** Globally unique: `${unitId}-${slug}`, e.g. "a1-04-tisch". Lowercase ASCII, digits, hyphens. */
  id: string;
  /** German headword WITHOUT article for nouns ("Tisch"), infinitive for verbs, full phrase for phrases. */
  de: string;
  /** Short English gloss; use "/" between alternatives ("table / desk"). */
  en: string;
  pos: PartOfSpeech;
  /** Required for nouns. */
  gender?: 'der' | 'die' | 'das';
  /** Nouns: full plural form without article ("Tische"); "-" if no plural / only singular. */
  plural?: string;
  /** Irregular / important forms, e.g. verbs: "fährt · fuhr · ist gefahren". */
  forms?: string;
  example?: Example;
}

interface DrillBase {
  /** Globally unique: `${unitId}-d${n}`, e.g. "a1-04-d07". */
  id: string;
  /** Optional one-line hint shown only on request. */
  hint?: string;
  /** Optional explanation shown after answering. */
  explain?: string;
}

/** English → German, typed. */
export interface TranslateDrill extends DrillBase {
  type: 'translate';
  prompt: string;
  /** All acceptable German answers (punctuation / case are normalised by the checker). First = canonical. */
  answers: string[];
}

/** Fill the gap(s). `text` contains one "___" per gap; answers[i] lists accepted fillers for gap i. */
export interface ClozeDrill extends DrillBase {
  type: 'cloze';
  text: string;
  answers: string[][];
  /** English meaning of the full sentence. */
  en?: string;
}

export interface ChoiceDrill extends DrillBase {
  type: 'choice';
  prompt: string;
  options: string[];
  /** Index into options. */
  correct: number;
}

/** Put words in order. `words` is the correct order; the app shuffles. */
export interface OrderDrill extends DrillBase {
  type: 'order';
  en: string;
  words: string[];
}

export type Drill = TranslateDrill | ClozeDrill | ChoiceDrill | OrderDrill;

export interface Unit {
  /** "a1-01" … "a2-12" */
  id: string;
  level: Level;
  /** 1-based global order (A1 units 1–12, A2 units 13–24). */
  order: number;
  title: string;
  titleDe: string;
  /** One "can-do" line, e.g. "Introduce yourself and ask someone's name." */
  goal: string;
  grammar: GrammarNote[];
  vocab: VocabItem[];
  drills: Drill[];
}
