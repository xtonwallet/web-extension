<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";
  //Stores
  import { steps } from "../../../common/stores.js";

  //Context
  const { changeStep } = getContext("functions");
  const { switchPage } = getContext("app_functions");

  onMount(() => {
    steps.set({ current: 0, stepList: [] });
  });
</script>

<style>
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_('Welcome!')}</h6>
    <div class="flow-text-box text-body1 text-black">
      {$_('Creating a wallet is easy and secure. All accounts are encrypted locally in your browser, not on remote servers.')}
    </div>
    <div class="flex-column flow-buttons">
      <Button
        id="create-wallet"
        class="flex-row flex-center-centr button__solid button__primary"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(1)}>
        {$_('Create a wallet')}
      </Button>
      <Button
        id="restore-wallet"
        class="flex-row flex-center-centr button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => switchPage('Restore')}>
        {$_('Restore a wallet')}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right">
    <h6 class="text-warning">{$_('Warning')}</h6>
    <p>{$_('Warning text about restoring')}</p>
  </div>
</div>
