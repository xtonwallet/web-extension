<script>
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Stores
  import { settingsStore, steps, needsBackup } from "../../../common/stores.js";

  //Context
  const { changeStep } = getContext("functions");
  const { appHome } = getContext("app_functions");
</script>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_('Backup wallet')}</h6>

    <div class="flow-text-box text-body1">{$_('Backup description')}</div>

    <div class="text-body1 text-accent">{$_('Backup warning')}</div>

    {#if $needsBackup}
      <Button
        class="flex-row flex-center-centr button__solid button__warning"
        style="margin: 0 0 1rem;"
        on:click={() => settingsStore.dismissWarning()}>
        {$_('Dismiss backup warning')}
      </Button>
    {/if}

    <div class="flex-column flow-buttons">
      <Button
        id="create-btn"
        class="flex-row flex-center-centr button__solid button__primary"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(2)}>
        {$_('Create backup file')}
      </Button>
      <Button
        id="view-keys-btn"
        class="flex-row flex-center-centr button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => changeStep(1)}>
        {$_('View account keys')}
      </Button>
      <Button
        id="restore-keys-btn"
        class="flex-row flex-center-centr button__solid button"
        style="margin: 0 0 1rem;"
        on:click={() => appHome()}>
        {$_('Back to home')}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right" />
</div>
