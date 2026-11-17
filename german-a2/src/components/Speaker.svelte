<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { speak, tts } from '../lib/tts.svelte';
  let { text, label = 'Listen' }: { text: string; label?: string } = $props();
</script>

{#if app.settings.tts && tts.supported && tts.voices.length > 0}
  <button class="ghost speaker" type="button" title={label} aria-label={`${label}: ${text}`} tabindex="-1" onclick={() => speak(text, app.settings.voice)}>
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 7.5h3l4-3.5v12l-4-3.5H3z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M13 7a4 4 0 0 1 0 6M15.2 5a7 7 0 0 1 0 10"/></svg>
  </button>
{/if}

<style>
  .speaker { padding: 0.15rem 0.3rem; color: var(--muted); vertical-align: middle; }
  .speaker:hover { color: var(--accent); }
</style>
