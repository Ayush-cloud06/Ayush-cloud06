// Test / dev fixture. NOT real curriculum content. Used by unit tests and by the
// browser dev flag `?fixtures` when src/content/units/ is empty.
import type { Unit } from '../../content/types';

const unit: Unit = {
  id: 'a1-90',
  level: 'A1',
  order: 90,
  title: 'Fixture: In the room',
  titleDe: 'Im Zimmer',
  goal: 'Name a few things in a room.',
  grammar: [
    {
      heading: 'Gender of nouns',
      body: 'Every noun has a **gender**: der, die or das.\n\nLearn the article together with the noun.',
      table: { head: ['Gender', 'Article', 'Example'], rows: [['masc.', 'der', 'der Tisch'], ['fem.', 'die', 'die Lampe'], ['neut.', 'das', 'das Bett']] },
      examples: [{ de: 'Der Tisch ist groß.', en: 'The table is big.' }],
    },
  ],
  vocab: [
    { id: 'a1-90-tisch', de: 'Tisch', en: 'table / desk', pos: 'noun', gender: 'der', plural: 'Tische', example: { de: 'Der Tisch ist neu.', en: 'The table is new.' } },
    { id: 'a1-90-lampe', de: 'Lampe', en: 'lamp', pos: 'noun', gender: 'die', plural: 'Lampen' },
    { id: 'a1-90-bett', de: 'Bett', en: 'bed', pos: 'noun', gender: 'das', plural: 'Betten' },
    { id: 'a1-90-schlafen', de: 'schlafen', en: 'to sleep', pos: 'verb', forms: 'schläft · schlief · hat geschlafen' },
    { id: 'a1-90-gross', de: 'groß', en: 'big / tall', pos: 'adj' },
  ],
  drills: [
    { id: 'a1-90-d01', type: 'translate', prompt: 'The table is big.', answers: ['Der Tisch ist groß.'], hint: 'Tisch is masculine.' },
    { id: 'a1-90-d02', type: 'cloze', text: '___ Lampe ist neu.', answers: [['Die']], en: 'The lamp is new.', explain: 'Lampe is feminine: die.' },
    { id: 'a1-90-d03', type: 'choice', prompt: 'Article of "Bett"?', options: ['der', 'die', 'das'], correct: 2 },
    { id: 'a1-90-d04', type: 'order', en: 'I sleep in bed.', words: ['Ich', 'schlafe', 'im', 'Bett'] },
  ],
};
export default unit;
