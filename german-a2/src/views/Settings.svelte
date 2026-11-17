<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { isTauri } from '../lib/db';
  import { speak, tts } from '../lib/tts.svelte';

  let status = $state('');
  let confirmReset = $state(false);
  let exportText = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  function setNum(key: 'newPerDay' | 'reviewCap', v: string) {
    const n = Math.max(0, Math.min(9999, Math.round(Number(v))));
    if (Number.isFinite(n)) void app.setSetting(key, n);
  }

  async function doExport() {
    const data = await app.exportData();
    const json = JSON.stringify(data, null, 1);
    const name = `stufe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      status = `Exported ${data.cards.length} cards and ${data.review_log.length} reviews to ${name}.`;
    } catch {
      status = 'Download failed; copy the JSON below instead.';
    }
    // In the desktop webview a blob download may be ignored; always offer the text as a fallback.
    if (isTauri()) exportText = json;
  }

  async function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      await app.importJson(await f.text());
      status = `Imported ${f.name}.`;
    } catch (err) {
      status = `Import failed: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  async function doReset() {
    await app.resetProgress();
    confirmReset = false;
    status = 'Progress reset. Settings were kept.';
  }
</script>

<h1>Settings</h1>

<section class="group">
  <h2>Reviews</h2>
  <label class="field">
    <span>New cards per day</span>
    <input type="number" min="0" max="999" value={app.settings.newPerDay} onchange={(e) => setNum('newPerDay', e.currentTarget.value)} />
    <small class="muted">Each word has two cards (recognition, then production a couple of days later).</small>
  </label>
  <label class="field">
    <span>Review cap per day</span>
    <input type="number" min="0" max="9999" value={app.settings.reviewCap} onchange={(e) => setNum('reviewCap', e.currentTarget.value)} />
  </label>
</section>

<section class="group">
  <h2>Speech</h2>
  <label class="check"><input type="checkbox" checked={app.settings.tts} onchange={(e) => app.setSetting('tts', e.currentTarget.checked)} /> Speaker buttons (text-to-speech)</label>
  {#if !tts.supported}
    <p class="small muted">Speech synthesis isn't available in this webview.</p>
  {:else if tts.voices.length === 0}
    <p class="small muted">No German voice installed, so speaker buttons are hidden. Install a German voice in your OS speech settings.</p>
  {:else}
    <label class="field">
      <span>Voice</span>
      <select value={app.settings.voice} onchange={(e) => app.setSetting('voice', e.currentTarget.value)}>
        <option value="">Default German voice</option>
        {#each tts.voices as v (v.name)}<option value={v.name}>{v.name} ({v.lang})</option>{/each}
      </select>
      <button onclick={() => speak('Guten Tag! Wie geht es Ihnen?', app.settings.voice)}>Test</button>
    </label>
  {/if}
</section>

<section class="group">
  <h2>Appearance</h2>
  <label class="field">
    <span>Theme</span>
    <select value={app.settings.theme} onchange={(e) => app.setSetting('theme', e.currentTarget.value as 'system' | 'light' | 'dark')}>
      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
    </select>
  </label>
</section>

<section class="group">
  <h2>Data</h2>
  <p class="small muted">Stored in {app.storageKind === 'sqlite' ? 'a local SQLite database (stufe.db in the app data folder)' : 'this browser’s localStorage'}.</p>
  <div class="row">
    <button onclick={doExport}>Export JSON</button>
    <button onclick={() => fileInput?.click()}>Import JSON…</button>
    <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={onFile} />
    {#if confirmReset}
      <span class="confirm row">
        <span class="small">Delete all cards, reviews, unit progress and study time?</span>
        <button class="danger" onclick={doReset}>Yes, reset</button>
        <button class="ghost" onclick={() => (confirmReset = false)}>Cancel</button>
      </span>
    {:else}
      <button class="danger" onclick={() => (confirmReset = true)}>Reset progress…</button>
    {/if}
  </div>
  <p class="small muted">Import replaces all current data.</p>
  {#if status}<p class="small" role="status">{status}</p>{/if}
  {#if exportText}
    <textarea readonly rows="6" onfocus={(e) => e.currentTarget.select()}>{exportText}</textarea>
  {/if}
</section>

<style>
  .group { border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
  .field { display: flex; gap: 0.7rem; align-items: center; flex-wrap: wrap; margin: 0.5rem 0; }
  .field > span { min-width: 170px; }
  .field input[type='number'] { width: 90px; }
  .check { display: flex; gap: 0.5rem; align-items: center; }
  .confirm { background: var(--bad-soft); padding: 0.25rem 0.5rem; border-radius: var(--radius); }
  textarea { width: 100%; font: 0.8rem var(--mono); margin-top: 0.5rem; }
</style>
