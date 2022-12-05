<script>
  import { onMount, getContext, afterUpdate } from "svelte";
  import { _ } from "svelte-i18n";
  import { sendRequestReject, sendRequestResolve } from '../../../../common/utils.js';

  //Components
  import { Button, Input, Icon } from "svelte-chota";

  /* Icons https://materialdesignicons.com/ */
  import { mdiAlert } from "@mdi/js";

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

  const provideInformation = () => {
    closeModal();
    sendRequestResolve(modalData.id, {code: 4000, data: {}});
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
</style>

<div class="flex-column">
  <p class="header">
    {$_('Please, provide information about your current endpoint only if you trust this web-page')}
  </p>
  <div class="flex-row flex-center-center">
    <div class="text-center">
      <div class="origin">{$_('Origin')}</div>
      <p class="origin-text">{modalData.origin}</p>
    </div>
  </div>
  <div class="flex-row flow-buttons">
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      on:click={() => cancelModal()}>
      {$_('Cancel')}
    </Button>
    <Button
      id="grant-btn"
      class="button__solid button__primary"
      on:click={() => provideInformation()}>
      {$_('Provide')}
    </Button>
  </div>
</div>
