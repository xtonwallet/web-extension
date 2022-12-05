<script>
  import { getContext, afterUpdate } from "svelte";
  import { _ } from "svelte-i18n";
  import { sendRequestReject, sendRequestResolve } from '../../../../common/utils.js';

  //Components
  import { Button, Input, Icon } from "svelte-chota";

  /* Icons https://materialdesignicons.com/ */
  import { mdiAlert } from "@mdi/js";

  let disabled, loading = false;

  export let modalData = {};

  //Context
  const { closeModal, openModal } = getContext("app_functions");

  const cancelModal = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const signMessage = () => {
    loading = true;
    disabled = true;

    browser.runtime
      .sendMessage({
        type: "signMessage",
        data: { data: modalData.params.data }
      })
      .then((result) => {
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        sendRequestResolve(modalData.id, {code: 4000, data: result});
      }).catch((e) => {
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        sendRequestResolve(modalData.id, {code: 4300, message: e.message});
      });
  };
</script>

<style lang="scss">
  .header {
    font-weight: bold;
    text-align: center;
  }
  .origin {
    font-weight: bold;
  }
  .origin-text {
    margin-bottom: 0px;
  }
  .signing-box {
    background-color: var(--color-lightGrey);
    color: var(--color-black);
    padding: 0.5em;
    width: 100%;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    max-height: 15em;
    overflow-wrap: anywhere;
    overflow-y: auto;
  }
</style>

<div class="flex-column">
  <p class="header">
    {$_('Please, confirm this signing only if you trust this web-page')}
    <span title={$_("Method uses private keys")}>
      <Icon
        src={mdiAlert}
        color="red"
        size="1" />
    </span>
  </p>
  <div class="flex-row flex-center-center">
    <div class="text-center">
      <div class="origin">{$_('Origin')}</div>
      <p class="origin-text">{modalData.origin}</p>
    </div>
  </div>
  <div class="flex-row">
    <div class="signing-box">{modalData.params.data}</div>
  </div>
  <div class="flex-row flow-buttons">
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      {disabled}
      on:click={() => cancelModal()}>
      {$_('Cancel')}
    </Button>
    <Button
      id="grant-btn"
      class="button__solid button__primary"
      {loading}
      on:click={() => signMessage()}>
      {$_('Confirm')}
    </Button>
  </div>
</div>
