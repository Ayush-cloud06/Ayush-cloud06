<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import type { Drill, Unit } from '../content/types';
  import { app } from '../lib/app.svelte';
  import { points } from '../lib/check';
  import { content } from '../lib/content';
  import { buildSession, canonical, checkDrill, prepare, type DrillCheck, type DrillItem } from '../lib/drills';
  import { go } from '../lib/router.svelte';
  import Diff from '../components/Diff.svelte';
  import Speaker from '../components/Speaker.svelte';
  import UmlautBar from '../components/UmlautBar.svelte';

  let { target, query }: { target: string; query: URLSearchParams } = $props();

  // Props are fixed for this component instance (App re-keys on route change).
  const init = (() => {
    const mixed = target === 'mixed';
    const ids = mixed ? (query.get('units') ?? '').split(',') : [target];
    const units = ids.map((id) => content.unitById.get(id)).filter((u): u is Unit => !!u);
    return { mixed, units };
  })();
  const { mixed, units } = init;
  const backTo = mixed || units.length !== 1 ? '/units' : `/unit/${units[0].id}`;

  let items = $state<DrillItem[]>(buildSession(units, { shuffle: mixed, limit: mixed ? 30 : undefined }));
  let isRedo = $state(false);
  let idx = $state(0);
  let phase = $state<'answer' | 'feedback' | 'done'>('answer');
  let text = $state('');
  let gaps = $state<string[]>([]);
  let showHint = $state(false);
  let check = $state<DrillCheck | null>(null);
  let results = $state<Array<{ item: DrillItem; check: DrillCheck }>>([]);
  let savedBest = $state<number | null>(null);

  const item = $derived(items[idx]);
  const drill = $derived(item?.drill as Drill | undefined);
  const score = $derived(results.length ? Math.round((results.reduce((s, r) => s + points(r.check.result), 0) / results.length) * 100) : 0);
  const misses = $derived(results.filter((r) => r.check.result !== 'correct'));

  function reset() {
    text = '';
    showHint = false;
    check = null;
    gaps = drill?.type === 'cloze' ? drill.answers.map(() => '') : [];
    phase = items.length ? 'answer' : 'done';
    void focusInput();
  }

  async function focusInput() {
    await tick();
    document.querySelector<HTMLInputElement>('.drill input[type=text]:not([readonly])')?.focus();
  }

  onMount(() => {
    reset();
    if (!mixed && units[0]) void app.touchUnit(units[0].id, { promote: true });
    app.timer.start();
  });
  onDestroy(() => app.timer.stop());

  function submit(choice?: number) {
    if (!drill || phase !== 'answer') return;
    let answer: string | string[] | number;
    if (drill.type === 'choice') {
      if (choice === undefined) return;
      answer = choice;
    } else if (drill.type === 'cloze') answer = gaps;
    else answer = text;
    check = checkDrill(drill, answer);
    results = [...results, { item, check }];
    phase = 'feedback';
    (document.activeElement as HTMLElement | null)?.blur();
  }

  async function next() {
    if (idx + 1 >= items.length) {
      phase = 'done';
      if (!mixed && !isRedo && units[0]) {
        await app.recordDrillScore(units[0].id, score);
        savedBest = app.unitProgress(units[0].id).best_score;
      }
      return;
    }
    idx++;
    reset();
  }

  function restart(only?: DrillItem[]) {
    isRedo = !!only;
    items = only ? only.map((r) => prepare(r.drill, r.unitId)) : buildSession(units, { shuffle: mixed, limit: mixed ? 30 : undefined });
    results = [];
    idx = 0;
    savedBest = null;
    reset();
  }

  // ---- order drills ------------------------------------------------------
  const chipDigits = $derived(drill?.type === 'order' && !drill.words.some((w) => /\d/.test(w)) && (item?.shuffled?.length ?? 0) <= 9);
  const usedChips = $derived.by(() => {
    const words = item?.shuffled ?? [];
    const used = words.map(() => false);
    for (const t of text.trim().split(/\s+/).filter(Boolean)) {
      const k = words.findIndex((w, i) => !used[i] && w.toLowerCase() === t.toLowerCase());
      if (k >= 0) used[k] = true;
    }
    return used;
  });
  function addChip(i: number) {
    const w = item?.shuffled?.[i];
    if (!w || usedChips[i] || phase !== 'answer') return;
    const punct = /^[,.!?;:]$/.test(w);
    text = text.trim() ? `${text.trimEnd()}${punct ? '' : ' '}${w}` : w;
    void focusInput();
  }

  // ---- hints ---------------------------------------------------------------
  function hintFor(d: Drill): string {
    if (d.hint) return d.hint;
    switch (d.type) {
      case 'translate': return `Starts with “${d.answers[0].split(' ')[0]}…”`;
      case 'order': return `Starts with “${d.words[0]}”`;
      case 'cloze': return d.answers.map((a) => `${a[0][0]}…`).join(' / ');
      case 'choice': return 'No hint for this one.';
    }
  }

  function onKeydown(e: KeyboardEvent) {
    app.timer.ping();
    if (e.isComposing || e.ctrlKey || e.metaKey) return;
    const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
    if (e.key === 'Escape') {
      e.preventDefault();
      go(backTo);
      return;
    }
    if (e.altKey) {
      if (e.code === 'KeyH' && phase === 'answer') { e.preventDefault(); showHint = true; }
      return;
    }
    if (phase === 'answer') {
      if (e.key === 'Enter' && drill?.type !== 'choice') { e.preventDefault(); submit(); return; }
      if (drill?.type === 'choice' && /^[1-9]$/.test(e.key)) {
        const n = Number(e.key) - 1;
        if (item.choiceOrder && n < item.choiceOrder.length) { e.preventDefault(); submit(item.choiceOrder[n]); }
        return;
      }
      if (chipDigits && /^[1-9]$/.test(e.key)) { e.preventDefault(); addChip(Number(e.key) - 1); return; }
      if (!typing && (e.key === 'h' || e.key === 'H')) { e.preventDefault(); showHint = true; }
    } else if (phase === 'feedback') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void next(); }
    } else if (phase === 'done') {
      if (e.key === 'r' && misses.length) { e.preventDefault(); restart(misses.map((m) => m.item)); }
      else if (e.key === 'a') { e.preventDefault(); restart(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(backTo); }
    }
  }

  const resultLabel = { correct: 'Correct', almost: 'Almost', wrong: 'Not quite' } as const;
  const clozeParts = $derived(drill?.type === 'cloze' ? drill.text.split('___') : []);
</script>

<svelte:window onkeydown={onKeydown} onmousedown={() => app.timer.ping()} />

<div class="drill">
  <div class="spread top">
    <p class="small muted crumbs">
      <a href={`#${backTo}`}>← {mixed ? 'Units' : units[0]?.title ?? 'Units'}</a>
      {#if mixed} · mixed drill ({units.length} units){/if}{#if isRedo} · redoing misses{/if}
    </p>
    {#if phase !== 'done' && items.length}
      <p class="small muted">{idx + 1} / {items.length} · score {score}%</p>
    {/if}
  </div>
  {#if phase !== 'done' && items.length}
    <div class="progress" aria-hidden="true"><span style={`width:${(idx / items.length) * 100}%`}></span></div>
  {/if}

  {#if units.length === 0 || items.length === 0}
    <p class="empty">No drills here. <a href="#/units">Back to units</a></p>
  {:else if phase === 'done'}
    <section class="card end">
      <h1>{score}%</h1>
      <p class="sub">
        {results.filter((r) => r.check.result === 'correct').length} correct ·
        {results.filter((r) => r.check.result === 'almost').length} almost ·
        {results.filter((r) => r.check.result === 'wrong').length} wrong
        {#if savedBest != null} · best for this unit {Math.round(savedBest)}%{/if}
      </p>
      {#if misses.length}
        <h3>Misses</h3>
        <table class="misses">
          <thead><tr><th>Prompt</th><th>You</th><th>Answer</th></tr></thead>
          <tbody>
            {#each misses as m, i (i)}
              {@const d = m.item.drill}
              <tr>
                <td>{d.type === 'translate' || d.type === 'choice' ? d.prompt : d.type === 'order' ? d.en : d.text}</td>
                <td lang="de" class={`result-${m.check.result}`}>{m.check.given || '—'}</td>
                <td lang="de">{canonical(d)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
      <div class="row actions">
        {#if misses.length}<button class="primary" onclick={() => restart(misses.map((m) => m.item))}>Redo misses <kbd>r</kbd></button>{/if}
        <button onclick={() => restart()}>Run all again <kbd>a</kbd></button>
        <button onclick={() => go(backTo)}>Done <kbd>Enter</kbd></button>
      </div>
    </section>
  {:else if drill}
    <section class="card q" data-type={drill.type}>
      <div class="kind small muted">
        {{ translate: 'Translate into German', cloze: 'Fill the gap', choice: 'Choose', order: 'Put the words in order' }[drill.type]}
      </div>

      {#if drill.type === 'translate'}
        <p class="prompt">{drill.prompt}</p>
        <input class="answer" type="text" lang="de" autocomplete="off" spellcheck="false" aria-label="Your German translation" bind:value={text} readonly={phase !== 'answer'} />
        <UmlautBar disabled={phase !== 'answer'} />
      {:else if drill.type === 'cloze'}
        <p class="prompt cloze" lang="de">
          {#each clozeParts as part, i (i)}{part}{#if i < clozeParts.length - 1}<input type="text" class="gap" lang="de" autocomplete="off" spellcheck="false" aria-label={`Gap ${i + 1}`} bind:value={gaps[i]} readonly={phase !== 'answer'} size={Math.max(4, ...(drill.answers[i] ?? ['']).map((a) => a.length)) + 1} />{/if}{/each}
        </p>
        {#if drill.en}<p class="muted small">{drill.en}</p>{/if}
        <UmlautBar disabled={phase !== 'answer'} />
      {:else if drill.type === 'choice'}
        <p class="prompt">{drill.prompt}</p>
        <ol class="options">
          {#each item.choiceOrder ?? [] as oi, n (oi)}
            <li>
              <button
                class="option"
                class:correct={phase === 'feedback' && oi === drill.correct}
                class:picked-wrong={phase === 'feedback' && check?.given === drill.options[oi] && oi !== drill.correct}
                disabled={phase !== 'answer'}
                onclick={() => submit(oi)}
              ><kbd>{n + 1}</kbd> <span lang="de">{drill.options[oi]}</span></button>
            </li>
          {/each}
        </ol>
      {:else if drill.type === 'order'}
        <p class="prompt">{drill.en}</p>
        <div class="chips">
          {#each item.shuffled ?? [] as w, i (i)}
            <button class="chip" lang="de" class:used={usedChips[i]} disabled={phase !== 'answer' || usedChips[i]} onclick={() => addChip(i)}>
              {#if chipDigits}<span class="cn">{i + 1}</span>{/if}{w}
            </button>
          {/each}
        </div>
        <input class="answer" type="text" lang="de" autocomplete="off" spellcheck="false" aria-label="Sentence" placeholder="Click words, press their numbers, or type" bind:value={text} readonly={phase !== 'answer'} />
        <UmlautBar disabled={phase !== 'answer'} />
      {/if}

      {#if showHint && phase === 'answer'}
        <p class="hintbox small">Hint: {hintFor(drill)}</p>
      {/if}

      {#if phase === 'feedback' && check}
        <div class={`feedback ${check.result}`} role="status">
          <div class="verdict">
            <strong class={`result-${check.result}`}>{resultLabel[check.result]}</strong>
            {#if check.notes.length}<span class="small notes">{check.notes.join(' · ')}</span>{/if}
          </div>
          {#if check.result === 'almost'}
            <p lang="de">Yours: <Diff from={check.given} to={check.matched} /></p>
            <p lang="de">Answer: <strong>{check.matched}</strong><Speaker text={check.matched} /></p>
          {:else if check.result === 'wrong'}
            {#if drill.type !== 'choice'}<p class="small muted" lang="de">Yours: {check.given || '—'}</p>{/if}
            <p lang="de">Answer: <strong>{canonical(drill)}</strong><Speaker text={canonical(drill)} /></p>
          {:else if canonical(drill) !== check.matched && drill.type !== 'cloze'}
            <p class="small muted" lang="de">Also: {canonical(drill)}</p>
          {:else if drill.type !== 'choice'}
            <p lang="de"><strong>{check.matched}</strong><Speaker text={check.matched} /></p>
          {/if}
          {#if drill.explain}<p class="small explain">{drill.explain}</p>{/if}
        </div>
      {/if}
    </section>

    <p class="keys">
      {#if phase === 'answer'}
        {#if drill.type === 'choice'}<span><kbd>1</kbd>–<kbd>{drill.options.length}</kbd> choose</span>{:else}<span><kbd>Enter</kbd> check</span>{/if}
        {#if chipDigits}<span><kbd>1</kbd>–<kbd>9</kbd> add word</span>{/if}
        <span><kbd>Alt</kbd>+<kbd>H</kbd> hint</span>
        {#if !showHint}<button class="ghost small linkish" onclick={() => (showHint = true)}>show hint</button>{/if}
      {:else}
        <span><kbd>Enter</kbd> next</span>
      {/if}
      <span><kbd>Esc</kbd> leave</span>
    </p>
  {/if}
</div>

<style>
  .drill { max-width: 720px; }
  .top { align-items: baseline; }
  .crumbs { margin: 0; }
  .progress { height: 3px; background: var(--surface-2); border-radius: 2px; margin: 0.3rem 0 1rem; overflow: hidden; }
  .progress span { display: block; height: 100%; background: var(--accent); transition: width 0.2s; }
  .q { padding: 1.3rem 1.4rem; }
  .kind { text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.72rem; margin-bottom: 0.3rem; }
  .prompt { font-size: 1.25rem; margin-bottom: 0.9rem; line-height: 1.45; }
  .cloze { line-height: 2.1; }
  .gap { font: inherit; font-size: 1.1rem; padding: 0.1rem 0.4rem; margin: 0 0.2rem; }
  .options { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
  .option { width: 100%; justify-content: flex-start; font-size: 1.05rem; padding: 0.5rem 0.8rem; }
  .option:disabled { opacity: 1; }
  .option.correct { border-color: var(--good); background: var(--good-soft); }
  .option.picked-wrong { border-color: var(--bad); background: var(--bad-soft); }
  .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.7rem; }
  .chip { font-size: 1.02rem; padding: 0.3rem 0.65rem; }
  .chip.used { opacity: 0.35; }
  .cn { font: 0.7rem var(--mono); color: var(--muted); margin-right: 0.15rem; }
  .hintbox { background: var(--accent-soft); color: var(--text); padding: 0.4rem 0.6rem; border-radius: var(--radius); margin: 0.8rem 0 0; }
  .feedback { margin-top: 1rem; padding: 0.7rem 0.9rem; border-radius: var(--radius); border-left: 3px solid var(--border); background: var(--surface-2); }
  .feedback.correct { border-left-color: var(--good); }
  .feedback.almost { border-left-color: var(--warn); }
  .feedback.wrong { border-left-color: var(--bad); }
  .feedback p { margin: 0.3rem 0 0; }
  .verdict { display: flex; gap: 0.7rem; align-items: baseline; }
  .notes { color: var(--text-2); }
  .explain { color: var(--text-2); }
  .keys { margin-top: 0.8rem; align-items: center; }
  .linkish { padding: 0 0.3rem; color: var(--muted); font-size: 0.8rem; }
  .end h1 { font-size: 2.4rem; margin: 0; }
  .misses { margin: 0.4rem 0 1rem; }
  .actions { margin-top: 0.8rem; }
</style>
