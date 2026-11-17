import { describe, expect, it } from 'vitest';
import { paragraphs, spans } from './text';

describe('text', () => {
  it('splits paragraphs on blank lines and joins soft breaks', () => {
    const p = paragraphs('One\nline.\n\n  Two **bold** end.\n');
    expect(p).toHaveLength(2);
    expect(p[0]).toEqual([{ bold: false, text: 'One line.' }]);
    expect(p[1]).toEqual([
      { bold: false, text: 'Two ' },
      { bold: true, text: 'bold' },
      { bold: false, text: ' end.' },
    ]);
  });
  it('handles unmatched markers as text', () => {
    expect(spans('a ** b')).toEqual([{ bold: false, text: 'a ** b' }]);
  });
});
