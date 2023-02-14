<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Stores
  import { settingsStore, steps } from "../../../common/stores.js";

  //Context
  const { changeStep } = getContext("functions");
  const { appHome } = getContext("app_functions");

  //Props
  export let keystoreFile;

  let consent = false;

  onMount(() => {
    steps.update((current) => {
      current.currentStep = 3;
      return current;
    });
  });

  const download = () => {
    steps.update((current) => {
      current.currentStep = 4;
      return current;
    });

    let currDateTime = new Date().toLocaleString();
    let filename = "XTon_Wallet_" + currDateTime + ".txt";
    let element = document.createElement("a");

    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(keystoreFile)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    settingsStore.setLastBackupDate();

    setTimeout(() => {
      appHome();
    }, 1000);
  };
</script>

<style>
  .text-box2 {
    margin-bottom: 3rem;
  }
  .checked {
    color: var(--color-success);
  }
  .unchecked {
    color: var(--color-warning);
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_('Remember')}</h6>

    <div class="flow-text-box text-body1">{$_('Backup content')}</div>

    <div class="text-box2 text-body2">
      {$_('Safe storage of your keystore and password are important to keeping your cryptocurrency safe.')}
      {$_('To store backup safely we recommend to use')}
      <a
        class="text-link"
        href="https://keepass.info/"
        rel="noopener noreferrer"
        target="_blank">
        Keepass</a>
    </div>
    <div class="consent flex-row">
      <label
        class="chk-container text-body2"
        class:checked={consent}
        class:unchecked={!consent}>
        {$_('I understand')}
        <input type="checkbox" bind:checked={consent} />
        <span class="chk-checkmark" />
      </label>
    </div>

    <div class="flex-column flow-buttons">
      <Button
        id="download-btn"
        class={`flex-row flex-center-centr button__solid ${consent ? 'button__primary' : ''}`}
        style="margin: 0 0 1rem;"
        disabled={!consent}
        on:click={() => download()}>
        {$_('Download file')}
      </Button>
      <Button
        class="flex-row flex-center-centr button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => appHome()}>
        {$_('Back to home')}
      </Button>
    </div>
  </div>
  <div class="flow-content-right" in:fade={{ delay: 0, duration: 200 }} />
</div>
