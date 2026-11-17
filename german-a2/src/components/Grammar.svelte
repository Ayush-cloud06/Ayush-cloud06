<script lang="ts">
  import type { GrammarNote } from '../content/types';
  import { paragraphs, spans } from '../lib/text';
  import Speaker from './Speaker.svelte';
  let { note }: { note: GrammarNote } = $props();
</script>

<section class="note">
  <h3>{note.heading}</h3>
  {#each paragraphs(note.body) as para, i (i)}
    <p>{#each para as s, j (j)}{#if s.bold}<strong>{s.text}</strong>{:else if s.italic}<em>{s.text}</em>{:else}{s.text}{/if}{/each}</p>
  {/each}
  {#if note.table}
    <div class="tablewrap">
      <table class="gtable">
        <thead><tr>{#each note.table.head as h, i (i)}<th>{h}</th>{/each}</tr></thead>
        <tbody>
          {#each note.table.rows as r, i (i)}
            <tr>{#each r as c, j (j)}<td>{#each spans(c) as s, k (k)}{#if s.bold}<strong>{s.text}</strong>{:else if s.italic}<em>{s.text}</em>{:else}{s.text}{/if}{/each}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  {#if note.examples?.length}
    <ul class="examples">
      {#each note.examples as ex, i (i)}
        <li><span lang="de" class="de">{ex.de}</span><Speaker text={ex.de} /> <span class="muted">— {ex.en}</span></li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .note { padding: 0.25rem 0 0.75rem; border-bottom: 1px solid var(--border); margin-bottom: 0.75rem; }
  .note:last-child { border-bottom: 0; }
  .tablewrap { overflow-x: auto; margin: 0.4rem 0 0.6rem; }
  .gtable { width: auto; min-width: 50%; }
  .gtable th { text-transform: none; letter-spacing: 0; font-size: 0.85rem; }
  .examples { margin: 0.3rem 0 0; padding-left: 1.1rem; }
  .examples li { margin: 0.1rem 0; }
</style>
