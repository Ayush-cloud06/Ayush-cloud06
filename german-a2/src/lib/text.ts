// Tiny renderer for grammar-note bodies: blank line = paragraph, **bold**. Returns tokens, not HTML.
export type Span = { bold: boolean; text: string };

export function paragraphs(body: string): Span[][] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => spans(p.replace(/\s*\n\s*/g, ' ')));
}

export function spans(s: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ bold: false, text: s.slice(last, m.index) });
    out.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ bold: false, text: s.slice(last) });
  return out;
}
