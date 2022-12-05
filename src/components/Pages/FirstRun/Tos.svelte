<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";
  //Stores
  import { steps } from "../../../common/stores.js";

  //Context
  const { changeStep } = getContext("functions");

  onMount(() => {
    steps.update((current) => {
      current.currentStep = 2;
      return current;
    });
  });

  const accept = () => {
    changeStep(3);
  };

  const startOver = () => {
    changeStep(1);
  };
</script>

<style>
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_('Remember')}</h6>
    <div class="flow-text-box text-body1">
      {@html $_('TOS')}
    </div>
    <div class="flex-column flow-buttons">
      <Button
        id="i-understand"
        class="flex-row flex-center-centr button__solid button__primary"
        style="margin: 0 0 1rem;"
        on:click={() => accept()}>
        {$_('I understand')}
      </Button>
      <Button
        id="go-back"
        class="flex-row flex-center-centr button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => startOver()}>
        {$_('go back')}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right" />
</div>
