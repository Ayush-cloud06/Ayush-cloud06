<script lang="ts">
  import { diffChars } from '../lib/check';
  let { from, to }: { from: string; to: string } = $props();
  const segs = $derived(diffChars(from, to));
</script>

<span class="diff" lang="de" aria-label={`You wrote ${from}; expected ${to}`}>{#each segs as s, i (i)}{#if s.t === 'same'}{s.s}{:else if s.t === 'del'}<span class="diff-del">{s.s}</span>{:else}<span class="diff-add">{s.s}</span>{/if}{/each}</span>
