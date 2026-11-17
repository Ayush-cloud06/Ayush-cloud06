<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { app } from '../lib/app.svelte';
  import { checkAnswer, type Check } from '../lib/check';
  import { content, deWithArticle, productionAnswers } from '../lib/content';
  import type { CardRow } from '../lib/db';
  import { go } from '../lib/router.svelte';
  import {
    dueCards, formatInterval, newCardsAvailable, previewIntervals, Rating, requeue, State, suggestGrade, type Grade,
  } from '../lib/srs';
  import Article from '../components/Article.svelte';
  import Diff from '../components/Diff.svelte';
  import Speaker from '../components/Speaker.svelte';
  import UmlautBar from '../components/UmlautBar.svelte';

  let { mode }: { mode: 'due' | 'new' } = $props();

  let queue = $state<CardRow[]>([]);
  let phase = $state<'front' | 'back'>('front');
  let text = $state('');
  let check = $state<Check | null>(null);
  let shownAt = Date.now();
  let done = $state(0);
  let again = $state(0);
  let started = $state(false);
  let busy = false;

  const card = $derived(queue[0]);
  const entry = $derived(card ? content.vocabById.get(card.vocab_id) : undefined);
  const item = $derived(entry?.item);
  const intervals = $derived(card ? previewIntervals(card, Date.now()) : null);
  const suggested = $derived<Grade | null>(card?.dir === 'prod' && check ? suggestGrade(check.result) : null);

  onMount(() => {
    const c = app.counts(Date.now());
    const all = [...app.cards.values()];
    queue =
      mode === 'due'
        ? dueCards(all, Date.now(), (v) => app.position(v) !== undefined).slice(0, c.dueCount)
        : newCardsAvailable(all, Date.now(), app.position).slice(0, c.newAvailable);
    started = true;
    app.timer.start();
    void show();
  });
  onDestroy(() => app.timer.stop());

  async function show() {
    phase = 'front';
    text = '';
    check = null;
    shownAt = Date.now();
    await tick();
    document.querySelector<HTMLInputElement>('.review input.answer')?.focus();
  }

  function reveal() {
    if (phase !== 'front' || !card || !item) return;
    if (card.dir === 'prod') {
      const noun = item.pos === 'noun' && !!item.gender;
      let c = checkAnswer(text, productionAnswers(item), { requireArticle: noun });
      if (c.result === 'wrong' && text.trim()) {
        // Another word with the same English gloss is a fair answer, but not the one this card trains.
        const syn = content.allVocab.filter((e) => e.item.id !== item.id && e.item.en === item.en);
        for (const s of syn) {
          const sc = checkAnswer(text, productionAnswers(s.item), { requireArticle: s.item.pos === 'noun' });
          if (sc.result === 'correct') {
            c = { result: 'almost', matched: deWithArticle(item), notes: [`“${sc.matched}” also fits; this card wants another word`] };
            break;
          }
        }
      }
      check = c;
      (document.activeElement as HTMLElement | null)?.blur();
    }
    phase = 'back';
  }

  async function grade(g: Grade) {
    if (phase !== 'back' || !card || busy) return;
    busy = true;
    try {
      const now = Date.now();
      const updated = await app.grade(card.id, g, now - shownAt, now);
      done++;
      if (g === Rating.Again) again++;
      const rest = queue.slice(1);
      queue = updated ? requeue(rest, updated, now) : rest;
      await show();
    } finally {
      busy = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    app.timer.ping();
    if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { e.preventDefault(); go('/today'); return; }
    if (!card) { if (e.key === 'Enter') { e.preventDefault(); go('/today'); } return; }
    if (phase === 'front') {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'Enter' || (e.key === ' ' && !typing)) { e.preventDefault(); reveal(); }
    } else {
      if (/^[1-4]$/.test(e.key)) { e.preventDefault(); void grade(Number(e.key) as Grade); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void grade(suggested ?? Rating.Good); }
    }
  }

  const gradeNames: Array<[Grade, string]> = [[Rating.Again, 'Again'], [Rating.Hard, 'Hard'], [Rating.Good, 'Good'], [Rating.Easy, 'Easy']];
  const resultLabel = { correct: 'Correct', almost: 'Almost', wrong: 'Not quite' } as const;
</script>

<svelte:window onkeydown={onKeydown} onmousedown={() => app.timer.ping()} />

<div class="review">
  <div class="spread top">
    <p class="small muted crumbs"><a href="#/today">← Today</a> · {mode === 'due' ? 'Reviews' : 'New cards'}</p>
    {#if started}<p class="small muted">{done} done · {queue.length} left</p>{/if}
  </div>

  {#if !started}
    <p class="muted">Loading…</p>
  {:else if !card || !item}
    <section class="card finished">
      {#if done === 0}
        <h2>Nothing to {mode === 'due' ? 'review' : 'learn'} right now.</h2>
        <p class="sub">
          {#if mode === 'new'}Add a unit's vocab to reviews from its unit page, or raise the daily new-card limit in Settings.{:else}Come back later, or learn some new cards.{/if}
        </p>
      {:else}
        <h2>Session done</h2>
        <p class="sub">{done} cards · {again} “again”.</p>
      {/if}
      <button class="primary" onclick={() => go('/today')}>Back to Today <kbd>Enter</kbd></button>
    </section>
  {:else}
    <section class="card face">
      <div class="meta small muted">
        <span>{card.dir === 'rec' ? 'German → English' : 'English → German'}</span>
        <span>· {item.pos}</span>
        {#if card.state.state === State.New}<span class="pill accent">new</span>{/if}
        <span class="unit">{entry?.unit.title}</span>
      </div>

      {#if card.dir === 'rec'}
        <div class="word"><Article {item} /><Speaker text={deWithArticle(item)} /></div>
        {#if phase === 'back'}
          <div class="answer-en">{item.en}</div>
        {/if}
      {:else}
        <div class="word en">{item.en}</div>
        {#if item.pos === 'noun'}<p class="small muted">with article: der / die / das</p>{/if}
        <input class="answer" type="text" lang="de" autocomplete="off" spellcheck="false" aria-label="German" bind:value={text} readonly={phase !== 'front'} placeholder="Type the German…" />
        {#if phase === 'front'}<UmlautBar />{/if}
        {#if phase === 'back' && check}
          <div class={`verdict result-${check.result}`} role="status">
            <strong>{resultLabel[check.result]}</strong>
            {#if check.notes.length}<span class="small notes">{check.notes.join(' · ')}</span>{/if}
          </div>
          {#if check.result === 'almost' && text.trim()}<p lang="de" class="small">Yours: <Diff from={text.trim()} to={check.matched} /></p>{/if}
          <div class="word answer-de"><Article {item} /><Speaker text={deWithArticle(item)} /></div>
        {/if}
      {/if}

      {#if phase === 'back'}
        <div class="details small" lang="de">
          {#if item.pos === 'noun' && item.plural}<div>Plural: {item.plural === '-' ? '—' : `die ${item.plural}`}</div>{/if}
          {#if item.forms}<div>{item.forms}</div>{/if}
          {#if item.example}<div class="ex">{item.example.de}<Speaker text={item.example.de} /> <span class="muted" lang="en">{item.example.en}</span></div>{/if}
        </div>
        <div class="grades">
          {#each gradeNames as [g, name] (g)}
            <button class:primary={suggested === g} onclick={() => grade(g)}>
              <kbd>{g}</kbd> {name} {#if intervals}<span class="iv">{formatInterval(intervals[g])}</span>{/if}
            </button>
          {/each}
        </div>
      {:else if card.dir === 'rec'}
        <button class="reveal" onclick={reveal}>Show answer <kbd>Space</kbd></button>
      {/if}
    </section>

    <p class="keys">
      {#if phase === 'front'}
        {#if card.dir === 'rec'}<span><kbd>Space</kbd> reveal</span>{:else}<span><kbd>Enter</kbd> check</span>{/if}
      {:else}
        <span><kbd>1</kbd>–<kbd>4</kbd> grade</span><span><kbd>Enter</kbd> {suggested ? 'accept suggestion' : 'Good'}</span>
      {/if}
      <span><kbd>Esc</kbd> stop (progress is saved)</span>
    </p>
  {/if}
</div>

<style>
  .review { max-width: 680px; }
  .crumbs { margin: 0; }
  .face { padding: 1.4rem 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
  .meta { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
  .unit { margin-left: auto; }
  .word { font-size: 1.8rem; line-height: 1.3; }
  .word.en { font-size: 1.5rem; }
  .answer-en { font-size: 1.3rem; color: var(--text-2); border-top: 1px solid var(--border); padding-top: 0.6rem; }
  .answer-de { font-size: 1.4rem; }
  .verdict { display: flex; gap: 0.6rem; align-items: baseline; }
  .notes { color: var(--text-2); }
  .details { color: var(--text-2); display: grid; gap: 0.15rem; }
  .ex { margin-top: 0.2rem; }
  .grades { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; margin-top: 0.4rem; }
  .grades button { justify-content: center; }
  .iv { color: inherit; opacity: 0.7; font-size: 0.8rem; }
  .reveal { align-self: flex-start; }
  .finished { display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem; }
  @media (max-width: 520px) { .grades { grid-template-columns: repeat(2, 1fr); } }
</style>
