<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from 'svelte-i18n';

  //Stores
  import { steps, settingsStore, accountStore } from "../../../common/stores.js";
  import { Field, Input, Button } from "svelte-chota";

  //Components
  import ErrorBox from "../../Elements/ErrorBox.svelte";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { setKeys, changeStep } = getContext("functions");

  //DOM nodes
  let error, formObj, seed, nickname;
  let loading;

  //Props
  onMount(() => {
    steps.update((current) => {
      current.currentStep = 7;
      return current;
    });
    seed     = document.getElementById("seed-input");
    nickname = document.getElementById("nickname-input");
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        loading = true;
        browser.runtime.sendMessage({type: "addAccountBySeed", data: {"nickname": nickname.value, "seed": seed.value}})
        .then((result) => {
          loading = false;
          if (!result.error) {
            settingsStore.setLastChangeDate();
            accountStore.changeAccount(result);
            setKeys({"encrypted": [result]});
            changeStep(6);
          } else {
            error = result.error;
          }
        })
        .catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error));
        });
      }
    } catch(e) {
      seed.setCustomValidity("Specify right seed");
      seed.reportValidity();
    }
  };

  const goBack = () => {
    setKeyStore(undefined);
    changeStep(0);
  };
</script>

<style>
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Restore wallet by seed phrase")}</h6>

    <div class="flow-text-box text-body1">
      {$_("Specify your seed phrase.")}
    </div>

    <form
      id="seed-form"
      on:submit|preventDefault={() => handleSubmit()}
      target="_self"
      bind:this={formObj}>
      <div class="input-box">
        <Field label="{$_("Your seed phrase")}">
          <Input
            id="seed-input"
            required={true}
            autofocus={true} />
        </Field>
      </div>
      <div class="input-box">
        <Field label="{$_("Nickname")}">
          <Input
            id="nickname-input"
            required={true}
            autofocus={true} />
        </Field>
      </div>
      <div class="flex-column flow-buttons">
        <Button
          {loading}
          form="seed-form"
          class="button__solid button__primary submit-button submit-button-text submit"
          style="margin: 0 0 1rem;"
          submit=true>
          {$_("Add wallet")}
        </Button>
        <Button
          {loading}
          id="back"
          class="flex-row flex-center-centr button__solid button"
          style="margin: 0 0 1rem;"
          on:click={() => changeStep(0)}>
          {$_("Back")}
        </Button>
      </div>
    </form>
  </div>
  <div class="flex-column flow-content-right">
    {#if loading}
      <Loading message={"Loading"} />
    {/if}
    {#if error}
      <ErrorBox {error} header="Oops" buttonText="Back" buttonAction={() => goBack()}/>
    {/if}
  </div>
</div>
