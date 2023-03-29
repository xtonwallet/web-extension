<script>
  import { _ } from "svelte-i18n";
  import { sendRequestReject, sendRequestResolve } from '../../../../common/utils.js';

  //Components
  import { Button, Checkbox } from "svelte-chota";

  export let modalData = {};
  export let closeModal;

  let autoReconnection;

  const cancelModal = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const manifest = modalData.manifest;

  const provideInformation = () => {
    let grantedPermissions = ["tonConnect_connect"];
    if (autoReconnection.length != 0) {
      grantedPermissions.push("tonConnect_reconnect");
    }
    browser.runtime
      .sendMessage({
        type: "saveGrantedPermissions",
        data: { grantedPermissions, origin: modalData.origin }
      })
      .then(() => {
        closeModal();
        sendRequestResolve(modalData.id, {code: 4000, data: {}});
      }).catch((error) => {
        closeModal();
        sendRequestResolve(modalData.id, {code: 4000, data: {}});
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };
</script>

<style>
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
  .dapp-icon {
    max-width: 50px;
    max-height: 100%;
    border-radius: 50%;
  }
  :global(.pointer label) {
    cursor: pointer;
  }
</style>

<div class="flex-column">
  <p class="header">
    {$_('Please, provide information about your current account (address and public key) only if you trust this web-page')}
  </p>
  <div class="header">
    <img class="dapp-icon" src="{manifest.iconUrl}" alt="icon" title ="icon"/>
    <div class="origin">{manifest.name}</div>
  </div>
  <div class="flex-row flex-center-center">
    <div class="text-center">
      <div class="origin">{$_('Origin')}</div>
      <p class="origin-text">{modalData.origin}</p>
      {#if manifest.privacyPolicyUrl}
        <p class="origin-text"><a target="_blank" rel="noreferrer" href="{manifest.privacyPolicyUrl}"> {$_("Privacy policy")} </a></p>
      {/if}
      {#if manifest.termsOfUseUrl}
        <p class="origin-text"><a target="_blank" rel="noreferrer" href="{manifest.termsOfUseUrl}"> {$_("Terms of use")} </a></p>
      {/if}
    </div>
  </div>
  <div class="flex-row flex-center-center">
    <p class="text-center pointer">
      <Checkbox value="true" bind:group={autoReconnection}>{$_("Don't ask me when reconnecting")}</Checkbox>
    </p>
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
