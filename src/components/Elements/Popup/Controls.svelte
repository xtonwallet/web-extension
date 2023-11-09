<script>
  import { getContext, onMount, afterUpdate } from "svelte";
  import { Icon, Button } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  /* Icons https://materialdesignicons.com/ */
  import { mdiNetwork, mdiPlus } from "@mdi/js";

  //Stores
  import { currentNetwork, networksStore } from "../../../common/stores.js";
  import { openPageWithPath } from "../../../common/utils.js";

  //Context
  const { switchPage } = getContext("app_functions");

  let allNetworks = [];

  onMount(() => {
    browser.runtime.sendMessage({ type: "getAllNetworks", data: {} }).then((result) => {
      allNetworks = result;
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  });

  const changeNetwork = (networkValue)  => {
    const newCurrentNetwork = allNetworks.filter((item) => item.server == networkValue);
    if (newCurrentNetwork.length) {
      networksStore.changeNetwork(newCurrentNetwork[0]);
      browser.runtime
        .sendMessage({
          type: "changeNetwork",
          data: newCurrentNetwork[0],
        }).catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error.message));
        });
    }
  };

  const addNewNetwork = ()  => {
    openPageWithPath("AddNewNetwork");
  };
</script>

<style>
  :global(.network-dropdown summary) {
    font-size: 1.5rem;
    width: 10rem;
    text-overflow: ellipsis;
    overflow: hidden;
    padding: 0.6rem;
    margin-top: 1rem;
    margin-right: 1rem;
    color: var(--color-black);
    display: initial;
  }
  :global(.network-dropdown .lefticon) {
    margin: -10px 0px -10px 0px !important;
  }
  :global(.network-dropdown .card) {
    left: -2.5rem !important;
    opacity: 0.9;
    font-size: 1.25rem;
    padding: 0 !important;
    top: 4rem;
    width: 14rem;
  }
  :global(.network-dropdown .card .selected) {
    background-color: var(--color-primary) !important;
  }
  :global(.network-dropdown .card div) {
    padding: 0.5rem 2rem;
    cursor: pointer;
  }
</style>

<div class="flex-row network-dropdown">
  <Button dropdown={$currentNetwork.name} autoclose outline icon={mdiNetwork}>
    {#each allNetworks as network}
      <div on:click={(event) => changeNetwork(event.target.dataset.value)}
           on:keyup={(event) => changeNetwork(event.target.dataset.value)}
            class:selected={network.server == $currentNetwork.server}
            data-value={network.server}>
            {network.name}
      </div>
    {/each}
    <div on:click={() => addNewNetwork()} on:keyup={() => addNewNetwork()}>
      <Icon src={mdiPlus} size="1.5" color="var(--color-black)" /> {$_("Add")}
    </div>
  </Button>
</div>
