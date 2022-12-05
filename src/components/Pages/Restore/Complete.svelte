<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Icon, Button } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  /* Icons https://materialdesignicons.com/ */
  import { mdiThumbUp, mdiAlert } from "@mdi/js";

  //Stores
  import { steps } from "../../../common/stores.js";

  //Context
  const { switchPage } = getContext("app_functions");
  const { setKeys, changeStep } = getContext("functions");

  //Props
  export let keys;
  export let restore = false;

  onMount(() => {
    steps.update((current) => {
      current.currentStep = 7;
      return current;
    });
  });

  const done = () => {
    if (restore) {
      changeStep(7);
    } else {
      switchPage("AccountMain");
    }
  };
</script>

<style>
  .key-box {
    max-width: 700px;
    margin: 0 auto;
  }

  .header {
    margin-left: 53px;
    border-bottom: 2px solid var(--divider-light);
    width: calc(100% - 53px);
  }

  .header-name {
    width: 157px;
  }

  .header-address {
    flex-grow: 1;
  }

  .address {
    display: flex;
    height: 88px;
    border-bottom: 1px dashed var(--divider-dark);
    align-items: center;
    flex-grow: 1;
    overflow: hidden;
  }

  .key-row {
    align-items: center;
  }

  .key-info {
    display: flex;
    width: 141px;
    height: 88px;
    margin-right: 16px;
    border-bottom: 1px dashed var(--divider-dark);
    align-items: center;
    word-break: break-all;
    justify-content: center;
    align-items: flex-start;
    min-width: 143px;
  }

  p {
    margin: 0;
  }

  .address > p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .message, .error {
    margin-right: 25px;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Accounts restored")}</h6>
    <div class="flow-text-box text-body1">
      {$_("You've added the following wallets succesfully! You may now perform transactions using these addresses.")}
    </div>
    <div class="flex-column flow-buttons">
      <Button
        id="home-btn"
        class="button__solid button__primary"
        on:click={() => done()}>
        {$_(restore ? "Finish" : "Back to home")}
      </Button>
    </div>
  </div>
  <div class="flow-content-right key-box" in:fade={{ delay: 0, duration: 200 }}>
    <div class="flex-row header text-subtitle2 text-primary">
      <p class="header-name">{$_("Nickname")}</p>
      <p class="header-address">{$_("Address")}</p>
    </div>
    {#if keys.error}
      <div class="flex-row key-row">
        <Icon src={mdiAlert} size="2" color="var(--color-warning)" />
        <p class="text-red text-body2">{keys.error}</p>
      </div>
    {:else}
      {#each keys.encrypted as key, i}
        <div class="flex-row key-row">
          {#if key.result}
            <div class="message" title={$_("Added")}><Icon src={mdiThumbUp} size="2" color="var(--color-success)" /></div>
          {:else}
            <div class="error" title={$_("Existed")}><Icon src={mdiAlert} size="2" color="var(--color-warning)" /></div>
          {/if}
          <div class="flex-column key-info text-body3 ">
            <p class="nickname text-secondary">{`${key.nickname}`}</p>
          </div>
          <div id={`div-address-${i}`} class="address">
            <p>{key.address}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
