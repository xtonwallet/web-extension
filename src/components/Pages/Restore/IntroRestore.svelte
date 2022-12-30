<script>
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Context
  const { changeStep } = getContext('functions');
  const { appHome }    = getContext('app_functions');
</script>

<style>
  .buttons {
    width: 35rem;
    margin-top: 4rem;
  }
</style>
 
<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Restoring accounts to your wallet is quick and easy")}</h6>
    <div class="flow-text-box text-body1">
      {$_("You have several ways to process this. Please prepare needed file and password.")}
    </div>
    <div class="flex-column flow-buttons buttons">
      <Button
        id="restore-keystore-btn"
        class="flex-row flex-center-centr button__solid button__primary button"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(1)}>
        {$_("Restore from keystore")}
      </Button>
      <Button
        id="restore-seed-btn"
        class="flex-row flex-center-centr button__solid button__primary"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(7)}>
        {$_("Restore from seed phrase")}
      </Button>
      <Button
        id="restore-keys-btn"
        class="flex-row flex-center-centr button__solid button__primary"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(8)}>
        {$_("Restore from keys")}
      </Button>
      <Button
        id="restore-keys-btn"
        class="flex-row flex-center-centr button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => appHome()}>
        {$_("Back to home")}
      </Button>
    </div>
  </div>
</div>
