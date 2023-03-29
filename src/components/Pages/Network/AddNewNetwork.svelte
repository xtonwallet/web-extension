<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";

  //Stores
  import { Checkbox, Field, Input, Button } from "svelte-chota";

  //Components
  import ErrorBox from "../../Elements/ErrorBox.svelte";

  //Context
  const { switchPage } = getContext("app_functions");

  //DOM nodes
  let error, formObj, name, server, coinName, giver, test, explorer;
  let testStatus = true;

  //Props
  onMount(() => {
    name = document.getElementById("name-input");
    server = document.getElementById("server-input");
    coinName = document.getElementById("coin-name-input");
    giver = document.getElementById("giver-input");
    test = document.getElementById("test-input");
    explorer = document.getElementById("explorer-input");
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        browser.runtime
        .sendMessage({
          type: "addNewNetwork",
          data: {
            name: name.value,
            server: server.value,
            endpoints: [server.value],
            explorer: explorer.value,
            test: test.value == "on",
            giver: giver.value,
            coinName: coinName.value,
          },
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
</script>

<style>
</style>

<h6>{$_('Add new network')}</h6>

<form
  id="add-new-network-form"
  on:submit|preventDefault={() => handleSubmit()}
  target="_self"
  bind:this={formObj}
  autocomplete="off">
  <Field grouped>
    <div class="input-box-50">
      <Field label={$_('Name')}>
        <Input id="name-input" required={true} autofocus={true} />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Server')}>
        <Input id="server-input" required={true} autofocus={true} />
      </Field>
    </div>
  </Field>
  <Field grouped>
    <div class="input-box-50">
      <Field label={$_('Explorer')}>
        <Input id="explorer-input" required={true} autofocus={true} />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Coin name')}>
        <Input id="coin-name-input" required={true} autofocus={true} />
      </Field>
    </div>
  </Field>
  <Field grouped>
    <div class="input-box-50">
      <Field label={$_('Test network')}>
        <Checkbox id="test-input" bind:checked={testStatus} autofocus={true} />
      </Field>
    </div>
    <div class="input-box-50">
      <Field label={$_('Giver on test network')}>
        <Input id="giver-input" disabled={!testStatus} autofocus={true} />
      </Field>
    </div>
  </Field>
  <div class="flex-column flow-buttons">
    <Button
      form="add-new-network-form"
      class="button__solid button__primary submit-button submit-button-text submit"
      style="margin: 0 0 1rem;"
      submit=true>
      {$_('Add new network')}
    </Button>
    <Button
      id="back"
      class="flex-row flex-center-centr button__solid button"
      style="margin: 0 0 1rem;"
      on:click={() => goBack()}>
      {$_('Back')}
    </Button>
  </div>
</form>
