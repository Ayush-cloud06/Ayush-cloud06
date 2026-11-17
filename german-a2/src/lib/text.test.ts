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

describe('italic', () => {
  it('renders *x* as italic but leaves stray asterisks', () => {
    expect(spans('the *second* letter')).toEqual([
      { bold: false, text: 'the ' },
      { bold: false, italic: true, text: 'second' },
      { bold: false, text: ' letter' },
    ]);
    expect(spans('2 * 3 = 6')).toEqual([{ bold: false, text: '2 * 3 = 6' }]);
    expect(spans('**a** and *b*').map((s) => s.text)).toEqual(['a', ' and ', 'b']);
  });
});
