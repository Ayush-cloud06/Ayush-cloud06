<script lang="ts">
  import type { VocabItem } from '../content/types';
  let { item }: { item: VocabItem } = $props();
</script>

{#if item.pos === 'noun' && item.gender}<span class={`art-${item.gender}`} title={{ der: 'masculine', die: 'feminine', das: 'neuter' }[item.gender]}>{item.gender}</span>{' '}{/if}<span class="de" lang="de">{item.de}</span>
