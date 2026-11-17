// Usage: node scripts/validate-content.ts   (Node 22.18+ strips TS types natively)
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'units');
const files = readdirSync(dir).filter((f) => f.endsWith('.ts')).sort();
const errors: string[] = [];
const ids = new Set<string>();
const orders = new Set<number>();
const err = (f: string, m: string) => errors.push(`${f}: ${m}`);
const dup = (f: string, id: string) => { if (ids.has(id)) err(f, `duplicate id ${id}`); ids.add(id); };
const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
let vocabTotal = 0, drillTotal = 0;

for (const f of files) {
  const u = (await import(pathToFileURL(join(dir, f)).href)).default;
  if (!u) { err(f, 'no default export'); continue; }
  if (f !== `${u.id}.ts`) err(f, `file name must be ${u.id}.ts`);
  if (!/^a[12]-\d\d$/.test(u.id)) err(f, `bad unit id ${u.id}`);
  if (orders.has(u.order)) err(f, `duplicate order ${u.order}`); orders.add(u.order);
  for (const k of ['title', 'titleDe', 'goal']) if (!nonEmpty(u[k])) err(f, `missing ${k}`);
  if (!Array.isArray(u.grammar) || u.grammar.length === 0) err(f, 'no grammar notes');
  for (const g of u.grammar ?? []) {
    if (!nonEmpty(g.heading) || !nonEmpty(g.body)) err(f, 'grammar note missing heading/body');
    if (g.table) for (const r of g.table.rows) if (r.length !== g.table.head.length) err(f, `table row width mismatch in "${g.heading}"`);
  }
  for (const v of u.vocab ?? []) {
    vocabTotal++;
    dup(f, v.id);
    if (!v.id.startsWith(`${u.id}-`) || !/^[a-z0-9-]+$/.test(v.id)) err(f, `bad vocab id ${v.id}`);
    if (!nonEmpty(v.de) || !nonEmpty(v.en)) err(f, `vocab ${v.id} missing de/en`);
    if (v.pos === 'noun') {
      if (!['der', 'die', 'das'].includes(v.gender)) err(f, `noun ${v.id} missing gender`);
      if (!nonEmpty(v.plural)) err(f, `noun ${v.id} missing plural`);
      if (/^(der|die|das) /.test(v.de)) err(f, `noun ${v.id} must not include article in de`);
    }
  }
  for (const d of u.drills ?? []) {
    drillTotal++;
    dup(f, d.id);
    if (!d.id.startsWith(`${u.id}-d`)) err(f, `bad drill id ${d.id}`);
    switch (d.type) {
      case 'translate':
        if (!nonEmpty(d.prompt) || !Array.isArray(d.answers) || !d.answers.length || !d.answers.every(nonEmpty)) err(f, `translate ${d.id} bad`);
        break;
      case 'cloze': {
        const gaps = (d.text.match(/___/g) ?? []).length;
        if (gaps === 0 || gaps !== d.answers?.length) err(f, `cloze ${d.id}: ${gaps} gaps vs ${d.answers?.length} answer sets`);
        if (!d.answers?.every((a: unknown) => Array.isArray(a) && a.length && a.every(nonEmpty))) err(f, `cloze ${d.id} answers must be string[][]`);
        break;
      }
      case 'choice':
        if (!Array.isArray(d.options) || d.options.length < 2 || !(d.correct >= 0 && d.correct < d.options.length)) err(f, `choice ${d.id} bad`);
        if (new Set(d.options).size !== d.options.length) err(f, `choice ${d.id} duplicate options`);
        break;
      case 'order':
        if (!Array.isArray(d.words) || d.words.length < 3 || !nonEmpty(d.en)) err(f, `order ${d.id} bad`);
        break;
      default:
        err(f, `unknown drill type ${(d as any).type}`);
    }
  }
}
console.log(`${files.length} units, ${vocabTotal} vocab, ${drillTotal} drills`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('OK');
