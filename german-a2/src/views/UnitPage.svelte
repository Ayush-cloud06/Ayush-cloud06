<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '../lib/app.svelte';
  import { content } from '../lib/content';
  import { go } from '../lib/router.svelte';
  import { cardId, State } from '../lib/srs';
  import Article from '../components/Article.svelte';
  import Grammar from '../components/Grammar.svelte';
  import Speaker from '../components/Speaker.svelte';

  let { unitId }: { unitId: string } = $props();
  const unit = $derived(content.unitById.get(unitId));
  const progress = $derived(app.unitProgress(unitId));
  const added = $derived(app.unitAdded(unitId));
  let message = $state('');
  let confirmKnown = $state(false);

  onMount(() => {
    if (content.unitById.has(unitId)) void app.touchUnit(unitId);
  });

  async function addVocab() {
    const n = await app.addUnitToReviews(unitId);
    message = n ? `Added ${n} words as new cards. They'll show up under “Learn new”.` : 'All words were already in your reviews.';
  }

  async function markKnown() {
    await app.markUnitKnown(unitId);
    confirmKnown = false;
    message = 'Marked as known. Its words are scheduled for spaced check-ins over the next weeks.';
  }

  function cardLabel(vocabId: string) {
    const c = app.cards.get(cardId(vocabId, 'rec'));
    if (!c) return '';
    return c.state.state === State.New ? 'new' : c.state.state === State.Review ? 'review' : 'learning';
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.key === 'd' && unit?.drills.length) go(`/drill/${unitId}`);
    else if (e.key === 'a' && unit && !added) void addVocab();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if !unit}
  <p>Unit not found. <a href="#/units">All units</a></p>
{:else}
  <p class="crumbs small"><a href="#/units">Units</a> / {unit.level}</p>
  <div class="spread head">
    <div>
      <h1>{unit.order}. {unit.title} <span class="muted de-title" lang="de">· {unit.titleDe}</span></h1>
      <p class="sub">{unit.goal}</p>
    </div>
    <div class="row meta">
      <span class="pill">{{ not_started: 'not started', in_progress: 'in progress', done: 'done', known: 'marked known' }[progress.status]}</span>
      {#if progress.best_score != null}<span class="pill accent">best {Math.round(progress.best_score)}%</span>{/if}
    </div>
  </div>

  <div class="row actions">
    <button class="primary" disabled={!unit.drills.length} onclick={() => go(`/drill/${unit.id}`)}>Start drills ({unit.drills.length}) <kbd>d</kbd></button>
    <button disabled={added} onclick={addVocab}>{added ? 'Vocab in reviews' : `Add vocab to reviews`} {#if !added}<kbd>a</kbd>{/if}</button>
    {#if progress.status !== 'known'}
      {#if confirmKnown}
        <span class="confirm row">
          <span class="small">Schedule all {unit.vocab.length} words as “easy” and mark the unit known?</span>
          <button onclick={markKnown}>Yes, I know it</button>
          <button class="ghost" onclick={() => (confirmKnown = false)}>Cancel</button>
        </span>
      {:else}
        <button class="ghost" onclick={() => (confirmKnown = true)}>I already know this unit</button>
      {/if}
    {:else}
      <button class="ghost" onclick={() => app.setUnitStatus(unit.id, 'in_progress')}>Unmark known</button>
    {/if}
  </div>
  {#if message}<p class="msg small" role="status">{message}</p>{/if}

  <div class="cols">
    <section class="grammar">
      <h2>Grammar</h2>
      {#each unit.grammar as note, i (i)}
        <Grammar {note} />
      {/each}
    </section>

    <section class="vocab">
      <h2>Vocabulary <span class="muted small">({unit.vocab.length})</span></h2>
      <p class="legend small muted"><span class="art-der">der</span> masculine · <span class="art-die">die</span> feminine · <span class="art-das">das</span> neuter</p>
      <div class="tablewrap">
        <table>
          <thead><tr><th>German</th><th>English</th><th>Plural / forms</th><th></th></tr></thead>
          <tbody>
            {#each unit.vocab as v (v.id)}
              <tr>
                <td class="nowrap"><Article item={v} /><Speaker text={v.pos === 'noun' && v.gender ? `${v.gender} ${v.de}` : v.de} /></td>
                <td>{v.en}
                  {#if v.example}
                    <div class="ex small"><span lang="de">{v.example.de}</span><Speaker text={v.example.de} /> <span class="muted">{v.example.en}</span></div>
                  {/if}
                </td>
                <td class="small" lang="de">
                  {#if v.pos === 'noun'}{v.plural === '-' ? 'no plural' : `die ${v.plural}`}{/if}
                  {#if v.forms}<div class="muted">{v.forms}</div>{/if}
                </td>
                <td class="small muted">{cardLabel(v.id)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </div>
{/if}

<style>
  .crumbs { margin-bottom: 0.3rem; color: var(--muted); }
  .head { align-items: flex-start; }
  .de-title { font-weight: 450; }
  .meta { flex-shrink: 0; }
  .actions { margin: 0.4rem 0 0.4rem; }
  .confirm { background: var(--warn-soft); padding: 0.25rem 0.5rem; border-radius: var(--radius); }
  .msg { color: var(--good); }
  .cols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 2rem; }
  @media (min-width: 1250px) { .cols { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); } }
  .tablewrap { overflow-x: auto; }
  .nowrap { white-space: nowrap; }
  .ex { margin-top: 0.15rem; }
  .legend { margin: -0.3rem 0 0.4rem; }
</style>
