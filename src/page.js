import Page from './components/Page.svelte';
import { writable } from 'svelte/store';

const loaded = writable(false);

window.addEventListener('load', (event) => {
  try{
    loaded.set(true);
  } catch (e) {
    console.log(e);
  }
});

new Page({
  target: document.body,
  props: {loaded}
});
