<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { content } from '../lib/content';
  import { go } from '../lib/router.svelte';
  import { formatInterval } from '../lib/srs';

  const counts = $derived(app.counts());
  const cont = $derived(app.continueUnit());
  const nextDue = $derived.by(() => {
    let min = Infinity;
    for (const c of app.cards.values()) if (c.state.state !== 0 && c.due > app.now && c.due < min) min = c.due;
    return Number.isFinite(min) ? min : null;
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t?.tagName === 'INPUT') return;
    if (e.key === 'r' && counts.dueCount > 0) go('/review?mode=due');
    else if (e.key === 'n' && counts.newAvailable > 0) go('/review?mode=new');
    else if (e.key === 'c' && cont) go(`/unit/${cont.id}`);
  }
</script>

<svelte:window onkeydown={onKeydown} />

<h1>Today</h1>

{#if content.units.length === 0}
  <p class="empty">No curriculum units found in <code>src/content/units/</code>. (Developers: add <code>?fixtures</code> to the URL to load a sample unit.)</p>
{/if}

<div class="grid">
  <section class="card">
    <div class="big">{counts.dueCount}</div>
    <div class="label">reviews due</div>
    {#if counts.dueTotal > counts.dueCount}
      <div class="muted small">{counts.dueTotal - counts.dueCount} more held back by the daily cap</div>
    {:else if counts.dueCount === 0 && nextDue}
      <div class="muted small">next in {formatInterval(nextDue - app.now)}</div>
    {/if}
    <button class="primary" disabled={counts.dueCount === 0} onclick={() => go('/review?mode=due')}>Review now <kbd>r</kbd></button>
  </section>

  <section class="card">
    <div class="big">{counts.newAvailable}</div>
    <div class="label">new cards available</div>
    <div class="muted small">
      {counts.newDoneToday}/{app.settings.newPerDay} introduced today{#if counts.newTotal > counts.newAvailable} · {counts.newTotal} waiting{/if}
    </div>
    <button disabled={counts.newAvailable === 0} onclick={() => go('/review?mode=new')}>Learn new <kbd>n</kbd></button>
  </section>

  <section class="card">
    <div class="label">Continue</div>
    {#if cont}
      <div class="unit-title">{cont.order}. {cont.title}</div>
      <div class="muted small" lang="de">{cont.titleDe}</div>
      <button onclick={() => go(`/unit/${cont.id}`)}>Open unit <kbd>c</kbd></button>
    {:else}
      <p class="muted small">Nothing in progress. Pick any unit — none are locked.</p>
      <button onclick={() => go('/units')}>Browse units</button>
    {/if}
  </section>

  <section class="card">
    <div class="label">Study time</div>
    <div class="row time">
      <div><span class="mid">{app.minutesToday()}</span> <span class="muted">min today</span></div>
      <div><span class="mid">{app.minutesThisWeek()}</span> <span class="muted">min this week</span></div>
    </div>
    <div class="muted small">{counts.reviewsDoneToday + counts.newDoneToday} cards studied today</div>
  </section>
</div>

<p class="keys">
  <span><kbd>t</kbd> Today</span><span><kbd>u</kbd> Units</span><span><kbd>v</kbd> Vocab</span><span><kbd>s</kbd> Stats</span><span><kbd>,</kbd> Settings</span>
</p>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.8rem; margin: 0.6rem 0 1.4rem; }
  .card { display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-start; }
  .card button { margin-top: auto; }
  .big { font-size: 2.2rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .mid { font-size: 1.4rem; font-weight: 650; font-variant-numeric: tabular-nums; }
  .label { color: var(--text-2); font-weight: 550; }
  .unit-title { font-weight: 600; }
  .time { gap: 1.2rem; }
  .empty { margin-bottom: 1rem; }
</style>
