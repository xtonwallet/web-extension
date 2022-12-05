<script>
  import { getContext } from "svelte";
  import { Icon, Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  /* Icons https://materialdesignicons.com/ */
  import { mdiArrowLeft } from "@mdi/js";

  //Context
  const { changeStep } = getContext('functions');
  const { appHome }    = getContext('app_functions');
</script>

<style>
  .restore {
    display: flex;
    flex-direction: column;
  }

  .buttons {
    width: 35rem;
    margin-top: 4rem;
  }

  .subtext {
    max-width: 601px;
    line-height: 1.4;
  }

</style>

<div class="restore">
  <div>
    <h2 class="heading">{$_("Restoring accounts to your wallet is quick and easy")}</h2>
    <div class="subtext text-body1 text-opacity-1">
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
        class="flex-row flex-center-centr button__solid button__primary button"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(7)}>
        {$_("Restore from seed phrase")}
      </Button>
      <Button
        id="restore-keys-btn"
        class="flex-row flex-center-centr button__solid button__primary button"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(8)}>
        {$_("Restore from keys")}
      </Button>
      <Button
        id="restore-keys-btn"
        class="flex-row flex-center-centr button__solid button"
        style="margin: 0 0 1rem;"
        on:click={() => appHome()}>
        {$_("Back to home")}
      </Button>
    </div>
  </div>
</div>
