<script lang="ts">
  import type { Unit } from '../content/types';
  import { app } from '../lib/app.svelte';
  import { content } from '../lib/content';
  import { go } from '../lib/router.svelte';

  const TOTAL = 24;
  let selected = $state<string[]>([]);

  const statusLabel = { not_started: 'not started', in_progress: 'in progress', done: 'done', known: 'marked known' } as const;
  const statusClass = { not_started: '', in_progress: 'accent', done: 'good', known: 'good' } as const;

  function startMixed() {
    if (selected.length) go(`/drill/mixed?units=${selected.join(',')}`);
  }

  function toggleLevel(units: Unit[]) {
    const ids = units.map((u) => u.id);
    const all = ids.every((id) => selected.includes(id));
    selected = all ? selected.filter((s) => !ids.includes(s)) : [...new Set([...selected, ...ids])];
  }
</script>

<div class="spread">
  <h1>Units</h1>
  <div class="row">
    <span class="muted small">{selected.length ? `${selected.length} selected` : 'Tick units for a mixed drill'}</span>
    <button class="primary" disabled={!selected.length} onclick={startMixed}>Mixed drill</button>
  </div>
</div>
{#if content.units.length < TOTAL}
  <p class="muted small">{content.units.length} of {TOTAL} units available.</p>
{/if}

{#each ['A1', 'A2'] as const as level (level)}
  {@const units = content.byLevel[level]}
  <h2 class="spread">
    <span>{level}</span>
    {#if units.length}<button class="ghost small" onclick={() => toggleLevel(units)}>select all {level}</button>{/if}
  </h2>
  {#if units.length === 0}
    <p class="muted">No {level} units yet.</p>
  {:else}
    <table class="units">
      <thead>
        <tr><th class="sel"></th><th class="num">#</th><th>Unit</th><th>Status</th><th class="num" title="Share of the unit's words you have studied in reviews">Words studied</th><th class="num">Best drill</th></tr>
      </thead>
      <tbody>
        {#each units as u (u.id)}
          {@const p = app.unitProgress(u.id)}
          {@const share = app.unitStudiedShare(u.id)}
          <tr>
            <td class="sel"><input type="checkbox" aria-label={`Select ${u.title} for mixed drill`} bind:group={selected} value={u.id} /></td>
            <td class="num muted">{u.order}</td>
            <td>
              <a href={`#/unit/${u.id}`} class="title">{u.title}</a>
              <span class="muted" lang="de"> · {u.titleDe}</span>
              <div class="muted small goal">{u.goal}</div>
            </td>
            <td><span class={`pill ${statusClass[p.status]}`}>{statusLabel[p.status]}</span></td>
            <td class="num">
              <span class="bar" aria-hidden="true"><span style={`width:${Math.round(share * 100)}%`}></span></span>
              {Math.round(share * 100)}%
            </td>
            <td class="num">{p.best_score == null ? '—' : `${Math.round(p.best_score)}%`}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/each}

<style>
  h2 { align-items: center; }
  .units td { vertical-align: middle; }
  .sel { width: 1.8rem; }
  .title { font-weight: 600; }
  .goal { margin-top: 0.1rem; }
  .bar { display: inline-block; width: 48px; height: 4px; background: var(--surface-2); border-radius: 2px; vertical-align: middle; margin-right: 0.4rem; overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); }
  @media (max-width: 700px) { .bar { display: none; } }
</style>
