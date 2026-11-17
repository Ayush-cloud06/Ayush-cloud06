<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { content } from '../lib/content';
  import { cardStats, retention, reviewsPerDay } from '../lib/srs';
  import { dayKey, DAY_MS } from '../lib/time';

  const cs = $derived(cardStats([...app.cards.values()].filter((c) => app.position(c.vocab_id) !== undefined)));
  const ret = $derived(retention(app.logs, app.now, 30));
  const perDay = $derived(reviewsPerDay(app.logs, app.now, 30));
  const maxDay = $derived(Math.max(1, ...perDay.map((d) => d.count)));
  const total30 = $derived(perDay.reduce((s, d) => s + d.count, 0));

  function minutesSince(days: number) {
    const from = dayKey(app.now - (days - 1) * DAY_MS);
    let s = 0;
    for (const [d, sec] of app.studyTime) if (d >= from) s += sec;
    return Math.round(s / 60);
  }
  const totalMin = $derived(Math.round([...app.studyTime.values()].reduce((a, b) => a + b, 0) / 60));

  const levels = $derived(
    (['A1', 'A2'] as const).map((l) => {
      const us = content.byLevel[l];
      const done = us.filter((u) => ['done', 'known'].includes(app.unitProgress(u.id).status)).length;
      const prog = us.filter((u) => app.unitProgress(u.id).status === 'in_progress').length;
      return { level: l, total: us.length, done, prog };
    }),
  );

  // Chart geometry
  const W = 600, H = 120, PAD_L = 28, PAD_B = 18;
  const bw = $derived((W - PAD_L) / perDay.length);
  let hover = $state<number | null>(null);
</script>

<h1>Stats</h1>

<div class="tiles">
  <div class="tile"><div class="v">{cs.inReview}</div><div class="l">words in review</div></div>
  <div class="tile"><div class="v">{cs.mature}</div><div class="l">mature cards <span class="muted">(interval ≥ 21 d)</span></div></div>
  <div class="tile">
    <div class="v">{ret.rate == null ? '—' : `${Math.round(ret.rate * 100)}%`}</div>
    <div class="l">retention, 30 d <span class="muted">({ret.n} reviews of learned cards)</span></div>
  </div>
  <div class="tile"><div class="v">{cs.learning}</div><div class="l">cards in learning</div></div>
  <div class="tile"><div class="v">{cs.newCount}</div><div class="l">cards added, not yet studied</div></div>
</div>

<h2>Reviews per day <span class="muted small">last 30 days · {total30} total</span></h2>
<div class="chart">
  <svg viewBox={`0 0 ${W} ${H + PAD_B}`} role="img" aria-label={`Reviews per day for the last 30 days, ${total30} in total, maximum ${maxDay} in a day`}>
    <line x1={PAD_L} x2={W} y1={H} y2={H} class="axis" />
    <line x1={PAD_L} x2={W} y1={0.5} y2={0.5} class="grid" />
    <text x={PAD_L - 6} y={8} class="tick" text-anchor="end">{maxDay}</text>
    <text x={PAD_L - 6} y={H} class="tick" text-anchor="end">0</text>
    {#each perDay as d, i (d.day)}
      {@const h = (d.count / maxDay) * (H - 4)}
      <g role="presentation" onmouseenter={() => (hover = i)} onmouseleave={() => (hover = null)}>
        <rect x={PAD_L + i * bw} y={0} width={bw} height={H} class="hit" />
        {#if d.count > 0}
          <path class="bar" class:dim={hover !== null && hover !== i}
            d={`M${PAD_L + i * bw + 1},${H} v${-(h - Math.min(3, h))} q0,${-Math.min(3, h)} ${Math.min(3, h)},${-Math.min(3, h)} h${bw - 2 - 2 * Math.min(3, h)} q${Math.min(3, h)},0 ${Math.min(3, h)},${Math.min(3, h)} v${h - Math.min(3, h)} z`} />
        {/if}
        <title>{d.day}: {d.count} reviews</title>
      </g>
      {#if i === 0 || i === perDay.length - 1 || i === 14}
        <text x={PAD_L + i * bw + bw / 2} y={H + 13} class="tick" text-anchor="middle">{d.day.slice(5)}</text>
      {/if}
    {/each}
  </svg>
  <p class="small muted readout">{hover !== null ? `${perDay[hover].day}: ${perDay[hover].count} reviews` : ' '}</p>
</div>

<h2>Study time</h2>
<table class="narrow">
  <tbody>
    <tr><td>Today</td><td class="num">{app.minutesToday()} min</td></tr>
    <tr><td>Last 7 days</td><td class="num">{minutesSince(7)} min</td></tr>
    <tr><td>Last 30 days</td><td class="num">{minutesSince(30)} min</td></tr>
    <tr><td>All time</td><td class="num">{totalMin} min</td></tr>
  </tbody>
</table>
<p class="small muted">Counts active time in drills and reviews; pauses after 60 s without input.</p>

<h2>Units</h2>
<table class="narrow">
  <thead><tr><th>Level</th><th class="num">Done / known</th><th class="num">In progress</th><th class="num">Units</th></tr></thead>
  <tbody>
    {#each levels as l (l.level)}
      <tr><td>{l.level}</td><td class="num">{l.done}</td><td class="num">{l.prog}</td><td class="num">{l.total}</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.7rem; margin: 0.5rem 0 1rem; }
  .tile { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.7rem 0.9rem; }
  .v { font-size: 1.6rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .l { color: var(--text-2); font-size: 0.88rem; }
  .chart { max-width: 680px; }
  svg { width: 100%; height: auto; display: block; overflow: visible; }
  .axis { stroke: var(--border); stroke-width: 1; }
  .grid { stroke: var(--border); stroke-dasharray: 2 3; stroke-width: 1; }
  .tick { fill: var(--muted); font-size: 9px; font-family: var(--font); }
  .bar { fill: var(--chart); }
  .bar.dim { opacity: 0.45; }
  .hit { fill: transparent; }
  .readout { min-height: 1.2em; margin: 0.2rem 0 0; }
  .narrow { width: auto; min-width: 320px; }
</style>
