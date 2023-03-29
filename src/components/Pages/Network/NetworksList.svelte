<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  import {
    mdiPlus,
  } from "@mdi/js";

  //Stores
  import { Checkbox, Field, Button, Icon } from "svelte-chota";

  //Context
  const { switchPage } = getContext("app_functions");

  //DOM nodes
  let formObj;

  let networksLoaded = false;
  let allNetworks = [];
  let selectedList = [];

  const updateAllNetworks = () => {
    browser.runtime
    .sendMessage({ type: "getAllNetworks", data: {} })
    .then((result) => {
      allNetworks = result.filter((item) => {
        return item.custom;
      });
      networksLoaded = true;
    })
    .catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  };

  onMount(() => {
    updateAllNetworks();
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        browser.runtime
        .sendMessage({
          type: "removeNetworks",
          data: selectedList,
        })
        .then((result) => {
          if (!result.error) {
            switchPage("AccountMain");
          } else {
            error = result.error;
          }
        })
        .catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error.message));
        });
      }
    } catch (e) {
      formObj.reportValidity();
    }
  };

  const goBack = () => {
    switchPage("AccountMain");
  };

  const addNewNetwork = () => {
    switchPage("AddNewNetwork");
  };
</script>

<style lang="scss">
  .networks-wrapper {
    max-height: 30rem;
    overflow: hidden;
    .networks-wrapper-scroll {
      max-height: 30rem;
      overflow-y: auto;
      width: calc(100% + 20px);
    }
  }
  .pointer {
    cursor: pointer;
    float: right;
    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px solid var(--color-lightGrey);
    border-radius: 4px;
  }
  .margin-bottom-0 {
    margin-bottom: 0px;
  }
</style>

<div class="row">
  <div class="col-9"> <h6 class="margin-bottom-0">{$_('Manage networks')}</h6> </div>
  <div class="col-3">
    <div class="pointer" on:click={() => addNewNetwork()} on:keyup={() => addNewNetwork()}>
      <Icon src={mdiPlus} size="1.5" color="var(--color-black)" />
      {$_('Add')}
    </div>
  </div>
</div>

<form
  id="manage-networks-form"
  on:submit|preventDefault={() => handleSubmit()}
  target="_self"
  bind:this={formObj}
  autocomplete="off">
  <div class="networks-wrapper">
    <div class="networks-wrapper-scroll">
      {#each allNetworks as networkItem}
        <Field>
          <Checkbox name="selected-network" value="{networkItem.server}" bind:group={selectedList}>
            {networkItem.server}
          </Checkbox>
        </Field>
      {/each}
    </div>
  </div>
  {#if !networksLoaded}
    <Loading/>
  {:else}
    {#if allNetworks.length > 0}
      <div class="flex-column flow-buttons">
        <Button
          form="manage-networks-form"
          class="button__solid button__primary submit-button submit-button-text submit"
          style="margin: 0 0 1rem;"
          submit=true>
          {$_('Delete selected networks')}
        </Button>
        <Button
          id="back"
          class="flex-row flex-center-centr button__solid button"
          style="margin: 0 0 1rem;"
          on:click={() => goBack()}>
          {$_('Back')}
        </Button>
      </div>
    {:else}
      {$_('No networks that you can remove')}
    {/if}
  {/if}
</form>
