// Umlaut input helpers: Alt+a/o/u/s inserts ä/ö/ü/ß, Alt+Shift for capitals.
const MAP: Record<string, [string, string]> = {
  KeyA: ['ä', 'Ä'],
  KeyO: ['ö', 'Ö'],
  KeyU: ['ü', 'Ü'],
  KeyS: ['ß', 'ß'],
};

export const UMLAUT_BUTTONS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];

/** Insert text at the caret of an input and notify bindings. */
export function insertAtCaret(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.setRangeText(text, start, end, 'end');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** keydown handler: returns true if it consumed the event. */
export function handleUmlautKey(e: KeyboardEvent): boolean {
  if (!e.altKey || e.ctrlKey || e.metaKey) return false;
  const m = MAP[e.code];
  if (!m) return false;
  const el = e.target as HTMLInputElement;
  if (!el || typeof el.setRangeText !== 'function') return false;
  e.preventDefault();
  insertAtCaret(el, e.shiftKey ? m[1] : m[0]);
  return true;
}
