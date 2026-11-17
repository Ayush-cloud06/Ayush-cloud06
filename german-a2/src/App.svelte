<script lang="ts">
  import { untrack } from 'svelte';
  import { app } from './lib/app.svelte';
  import { content } from './lib/content';
  import { router, go } from './lib/router.svelte';
  import { handleUmlautKey } from './lib/umlaut';
  import Today from './views/Today.svelte';
  import Units from './views/Units.svelte';
  import UnitPage from './views/UnitPage.svelte';
  import Drill from './views/Drill.svelte';
  import Review from './views/Review.svelte';
  import Vocab from './views/Vocab.svelte';
  import Stats from './views/Stats.svelte';
  import Settings from './views/Settings.svelte';

  const route = $derived(router.route);
  const section = $derived(route.path[0] ?? 'today');

  // Refresh the shared clock on every navigation so due counts are current.
  $effect(() => {
    void route;
    untrack(() => (app.now = Date.now()));
  });

  // Theme
  $effect(() => {
    const t = app.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  });

  const nav = [
    { id: 'today', label: 'Today', key: 't' },
    { id: 'units', label: 'Units', key: 'u' },
    { id: 'vocab', label: 'Vocab', key: 'v' },
    { id: 'stats', label: 'Stats', key: 's' },
    { id: 'settings', label: 'Settings', key: ',' },
  ];

  function isTyping(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function onKeydownCapture(e: KeyboardEvent) {
    if (isTyping(e)) handleUmlautKey(e);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (section === 'drill' || section === 'review') return; // sessions handle Esc themselves
      if (isTyping(e)) (e.target as HTMLElement).blur();
      if (section === 'unit') go('/units');
      else if (section !== 'today') go('/today');
      return;
    }
    if (isTyping(e)) return;
    // Global section shortcuts, only outside study sessions.
    if (section === 'drill' || section === 'review') return;
    const n = nav.find((x) => x.key === e.key);
    if (n) {
      e.preventDefault();
      go(`/${n.id}`);
    }
  }
</script>

<svelte:window onkeydowncapture={onKeydownCapture} onkeydown={onKeydown} />

{#if app.error}
  <main class="boot"><h1>Could not open storage</h1><p>{app.error}</p></main>
{:else if !app.ready}
  <main class="boot muted">Loading…</main>
{:else}
  <div class="shell">
    <nav class="side" aria-label="Main">
      <a class="brand" href="#/today" aria-label="Stufe home"><span class="logo" aria-hidden="true">St</span><span>Stufe</span></a>
      {#each nav as n (n.id)}
        <a href={`#/${n.id}`} class:active={section === n.id || (n.id === 'units' && (section === 'unit' || section === 'drill'))} aria-current={section === n.id ? 'page' : undefined}>
          {n.label}<kbd class="navkey">{n.key}</kbd>
        </a>
      {/each}
      <div class="foot muted small">
        {content.units.length} units · {app.storageKind === 'sqlite' ? 'SQLite' : 'browser storage'}
      </div>
    </nav>
    <main class="main">
      {#key route}
        {#if section === 'today'}
          <Today />
        {:else if section === 'units'}
          <Units />
        {:else if section === 'unit'}
          <UnitPage unitId={route.path[1]} />
        {:else if section === 'drill'}
          <Drill target={route.path[1]} query={route.query} />
        {:else if section === 'review'}
          <Review mode={route.query.get('mode') === 'new' ? 'new' : 'due'} />
        {:else if section === 'vocab'}
          <Vocab />
        {:else if section === 'stats'}
          <Stats />
        {:else if section === 'settings'}
          <Settings />
        {:else}
          <p>Not found. <a href="#/today">Go to Today</a></p>
        {/if}
      {/key}
    </main>
  </div>
{/if}

<style>
  .boot { padding: 3rem; }
  .shell { display: grid; grid-template-columns: 180px 1fr; min-height: 100vh; }
  .side {
    position: sticky; top: 0; height: 100vh;
    display: flex; flex-direction: column; gap: 0.1rem;
    padding: 1rem 0.6rem; border-right: 1px solid var(--border); background: var(--surface);
  }
  .side a { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.6rem; border-radius: var(--radius); color: var(--text-2); }
  .side a:hover { background: var(--surface-2); text-decoration: none; }
  .side a.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
  .side .brand { font-weight: 700; color: var(--text); font-size: 1.05rem; margin-bottom: 0.8rem; justify-content: flex-start; gap: 0.5rem; }
  .logo { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 6px; background: var(--text); color: var(--bg); font-size: 0.8rem; font-weight: 800; letter-spacing: -0.04em; }
  .navkey { opacity: 0.6; }
  .foot { margin-top: auto; padding: 0 0.6rem; }
  .main { padding: 1.6rem 2rem 3rem; max-width: 1040px; width: 100%; min-width: 0; }

  @media (max-width: 760px) {
    .shell { grid-template-columns: 1fr; }
    .side { position: static; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; border-right: 0; border-bottom: 1px solid var(--border); padding: 0.5rem; }
    .side .brand { margin: 0 0.5rem 0 0; }
    .navkey, .foot { display: none; }
    .main { padding: 1rem; }
  }
</style>
