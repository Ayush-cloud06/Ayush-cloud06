<script lang="ts">
  import { insertAtCaret, UMLAUT_BUTTONS } from '../lib/umlaut';

  /** Inserts into the most recently focused text input. */
  let { disabled = false }: { disabled?: boolean } = $props();

  function target(): HTMLInputElement | null {
    const a = document.activeElement;
    if (a instanceof HTMLInputElement && a.type === 'text' && !a.readOnly) return a;
    return lastInput && document.contains(lastInput) && !lastInput.readOnly ? lastInput : null;
  }

  function insert(ch: string) {
    const el = target();
    if (!el) return;
    el.focus();
    insertAtCaret(el, ch);
  }
</script>

<script lang="ts" module>
  let lastInput: HTMLInputElement | null = null;
  if (typeof window !== 'undefined') {
    window.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') lastInput = e.target;
    });
  }
</script>

<div class="umlauts" aria-label="Insert special characters">
  {#each UMLAUT_BUTTONS as ch (ch)}
    <button type="button" tabindex="-1" {disabled} onmousedown={(e) => e.preventDefault()} onclick={() => insert(ch)}>{ch}</button>
  {/each}
  <span class="muted small hint"><kbd>Alt</kbd>+<kbd>a</kbd> <kbd>o</kbd> <kbd>u</kbd> <kbd>s</kbd> · <kbd>Shift</kbd> for capitals</span>
</div>

<style>
  .umlauts { display: flex; gap: 0.3rem; align-items: center; flex-wrap: wrap; margin-top: 0.4rem; }
  .umlauts button { padding: 0.1rem 0.5rem; min-width: 2rem; justify-content: center; font-size: 0.95rem; }
  .hint { margin-left: 0.5rem; }
</style>
