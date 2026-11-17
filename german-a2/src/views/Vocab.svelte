<script lang="ts">
  import type { PartOfSpeech } from '../content/types';
  import { app } from '../lib/app.svelte';
  import { content, type VocabEntry } from '../lib/content';
  import type { CardRow } from '../lib/db';
  import { cardId, formatInterval, State } from '../lib/srs';
  import Article from '../components/Article.svelte';
  import Speaker from '../components/Speaker.svelte';

  let q = $state('');
  let unitF = $state('');
  let levelF = $state('');
  let posF = $state('');
  let stateF = $state('');
  let limit = $state(200);

  const POS: PartOfSpeech[] = ['noun', 'verb', 'adj', 'adv', 'prep', 'pron', 'conj', 'num', 'phrase', 'other'];

  const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

  function stateOf(c: CardRow | undefined): 'none' | 'new' | 'learning' | 'review' {
    if (!c) return 'none';
    const s = c.state.state;
    return s === State.New ? 'new' : s === State.Review ? 'review' : 'learning';
  }

  /** Units a canonical word appears in. */
  function unitsOf(e: VocabEntry) {
    return (content.occurrences.get(e.item.id) ?? [e]).map((o) => o.unit);
  }

  const rows = $derived.by(() => {
    const needle = fold(q.trim());
    return content.allVocab.filter((e) => {
      const us = unitsOf(e);
      if (unitF && !us.some((u) => u.id === unitF)) return false;
      if (levelF && e.unit.level !== levelF) return false;
      if (posF && e.item.pos !== posF) return false;
      if (stateF && stateOf(app.cards.get(cardId(e.item.id, 'rec'))) !== stateF) return false;
      if (needle) {
        const hay = fold(`${e.item.gender ?? ''} ${e.item.de} ${e.item.en} ${e.item.plural ?? ''} ${e.item.forms ?? ''}`);
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  });

  function dueLabel(c: CardRow | undefined) {
    if (!c) return '';
    if (c.state.state === State.New) {
      if (c.due > app.now + 365 * 864e5) return 'after recognition';
      return c.due > app.now ? `from ${new Date(c.due).toLocaleDateString()}` : '';
    }
    const d = c.due - app.now;
    return d <= 0 ? 'due now' : `in ${formatInterval(d)}`;
  }
</script>

<h1>Vocabulary</h1>
<div class="filters row">
  <input type="search" placeholder="Search German or English…" aria-label="Search" bind:value={q} />
  <select bind:value={levelF} aria-label="Level"><option value="">All levels</option><option>A1</option><option>A2</option></select>
  <select bind:value={unitF} aria-label="Unit">
    <option value="">All units</option>
    {#each content.units as u (u.id)}<option value={u.id}>{u.order}. {u.title}</option>{/each}
  </select>
  <select bind:value={posF} aria-label="Part of speech"><option value="">Any type</option>{#each POS as p (p)}<option>{p}</option>{/each}</select>
  <select bind:value={stateF} aria-label="Card state">
    <option value="">Any state</option><option value="none">not added</option><option value="new">new</option><option value="learning">learning</option><option value="review">review</option>
  </select>
</div>
<p class="small muted">{rows.length} of {content.allVocab.length} words{content.vocab.length > content.allVocab.length ? ` (${content.vocab.length - content.allVocab.length} repeats across units are merged)` : ''}</p>

<div class="tablewrap">
  <table>
    <thead><tr><th>German</th><th>English</th><th>Type</th><th>Unit</th><th>de → en</th><th>en → de</th></tr></thead>
    <tbody>
      {#each rows.slice(0, limit) as e (e.item.id)}
        {@const rec = app.cards.get(cardId(e.item.id, 'rec'))}
        {@const prod = app.cards.get(cardId(e.item.id, 'prod'))}
        <tr>
          <td class="nowrap"><Article item={e.item} /><Speaker text={e.item.gender ? `${e.item.gender} ${e.item.de}` : e.item.de} />
            {#if e.item.pos === 'noun' && e.item.plural && e.item.plural !== '-'}<div class="small muted" lang="de">pl. {e.item.plural}</div>{/if}
          </td>
          <td>{e.item.en}</td>
          <td class="small muted">{e.item.pos}</td>
          <td class="small">{#each unitsOf(e) as u, i (u.id + i)}{i ? ', ' : ''}<a href={`#/unit/${u.id}`} title={u.title}>{u.order}</a>{/each}</td>
          <td class="small"><span class={`st st-${stateOf(rec)}`}>{stateOf(rec) === 'none' ? '—' : stateOf(rec)}</span> <span class="muted">{dueLabel(rec)}</span></td>
          <td class="small"><span class={`st st-${stateOf(prod)}`}>{stateOf(prod) === 'none' ? '—' : stateOf(prod)}</span> <span class="muted">{dueLabel(prod)}</span></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
{#if rows.length > limit}
  <p><button onclick={() => (limit = Infinity)}>Show all {rows.length}</button></p>
{/if}

<style>
  .filters { margin: 0.4rem 0; }
  .filters input { flex: 1 1 220px; }
  .filters select { max-width: 220px; }
  .tablewrap { overflow-x: auto; }
  .nowrap { white-space: nowrap; }
  .st-review { color: var(--good); }
  .st-learning { color: var(--warn); }
  .st-new { color: var(--accent); }
</style>
