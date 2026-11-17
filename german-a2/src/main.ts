import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { initContent } from './lib/content';
import { app } from './lib/app.svelte';
import { initTts } from './lib/tts.svelte';

async function start() {
  await initContent();
  initTts();
  await app.load();
  mount(App, { target: document.getElementById('app')! });
}

start();
