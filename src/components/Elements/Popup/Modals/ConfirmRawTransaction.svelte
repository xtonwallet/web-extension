<script>
  import { onMount, getContext, afterUpdate } from "svelte";
  import { _ } from "svelte-i18n";

  import {
    shortAddress,
    unbounceble,
    sendRequestReject,
    sendRequestResolve,
  } from "../../../../common/utils.js";

  let allNetworks = [];
  let icon = "/assets/img/icon-crystal-128.png";
  let symbol = $currentNetwork.coinName;
  let title = $_("Native");

  export let modalData = {};
  export let closeModal;
  let loading = false;
  let disabled = false;

  onMount(() => {
    browser.runtime
      .sendMessage({ type: "getAllNetworks", data: {} })
      .then((result) => {
        allNetworks = result;
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  });

  //Stores
  import {
    accountStore,
    currentAccount,
    currentNetwork,
  } from "../../../../common/stores.js";

  import { fromNano } from "../../../../common/utils.js";

  //Components
  import { Button } from "svelte-chota";

  //Context
  const { openModal } = getContext("app_functions");

  const cancelTransaction = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const confirmTransaction = () => {
    loading = true;
    disabled = true;

    if (
      modalData.txData.params.valid_until &&
      new Date().getTime()/1000 > parseInt(modalData.txData.params.valid_until, 10)
    ) {
      openModal("ModalError", { message: "This transaction is expired" });
      if (modalData.id) {
        // let's show 5 seconds popup with the error, then close it and send it
        setTimeout(() => {
          sendRequestResolve(modalData.id, {
            code: 4300,
            message: "This transaction is expired",
          });
        }, 5000);
      }
      return;
    }

    browser.runtime
      .sendMessage({
        type: "runTransaction",
        data: modalData,
      })
      .then((result) => {
        browser.runtime
          .sendMessage({
            type: "addWaitingTransaction",
            data: $currentNetwork.server + "-" + $currentAccount.address,
          }).then(() => {
            accountStore.addWaitingTransaction($currentNetwork.server + "-" + $currentAccount.address);
          });
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        if (result.error) {
          openModal("ModalError", { message: result.error });
          if (modalData.id) {
            sendRequestResolve(modalData.id, {
              code: 4300,
              message: result.error,
            });
          }
        } else {
          // send a message that the request is rejected for InPage script
          if (modalData.id) {
            sendRequestResolve(modalData.id, { code: 4000, data: result });
          }
          browser.runtime
            .sendMessage({
              type: "getCurrentBalance",
              data: {
                accountAddress: $currentAccount.address,
                server: $currentNetwork.server,
              },
            })
            .then((result) => {
              const newCurrentAccount = $currentAccount;
              newCurrentAccount.balance[$currentNetwork.server] = result;
              accountStore.changeAccount(newCurrentAccount);
            })
            .catch((error) => {
              console.error("Error on sendMessage:" + JSON.stringify(error.message));
            });
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

</script>

<style lang="scss">
  .title {
    margin: 0px;
  }
  .token-logo {
    width: 48px;
    height: 48px;
    border: var(--color-black) dashed 1px;
    margin: 0.5rem;
    border-radius: 50%;
  }
  .send-raw-transaction-wrapper {
    max-height: 35rem;
    overflow: hidden;
    padding-right: 2rem;
    .send-raw-transaction-wrapper-scroll {
      max-height: 35rem;
      overflow-y: auto;
      width: calc(100% + 20px);
      .send-raw-transaction-wrapper-internal {
        width: fit-content;
        margin-left: 2rem;
      }
    }
  }
  .text-container {
    word-break: break-all;
    display: block;
    width: 250px;
    overflow-y: auto;
    max-height: 75px;
  }
  .input-box-50 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
</style>

<div class="sending-tx flex-column">
  <h6 class="title text-center">{$_('Send transaction')}</h6>
  <div class="send-raw-transaction-wrapper">
    <div class="send-raw-transaction-wrapper-scroll">
      <div class="send-raw-transaction-wrapper-internal">
        <div class="is-center">
          <img alt="logo" class="token-logo" src={icon} /><br />
          <span {title}>{symbol}</span>
        </div>
        <div class="flex-row flex-center-center">
          {$_('Server')}:
          {#each allNetworks as network}
            {#if network.server == modalData.server}{network.name}{/if}
          {/each}
        </div>
        <div class="flex-row">
          <div class="flex-column input-box-50 flex-center-center">
            <span class="weight-500">{$_('Amount')}</span>
            <span>{fromNano(modalData.txData.params.amount)}</span>
          </div>
          <div class="flex-column input-box-50 flex-center-center">
            <span class="weight-500">{$_('Fee')}</span>
            <span>~ {modalData.fee}</span>
          </div>
        </div>
        <div class="flex-row">
          <div class="flex-column input-box-50 flex-center-center">
            <span class="weight-500">{$_('Address')}</span>
            <span>{shortAddress(unbounceble(modalData.accountAddress, $currentNetwork.server != "mainnet"))}</span>
          </div>
          <div class="flex-column input-box-50 flex-center-center">
            <span class="weight-500">{$_('Destination')}</span>
            <span>{shortAddress(unbounceble(modalData.txData.params.to, $currentNetwork.server != "mainnet"))}</span>
          </div>
        </div>
        <div class="flex-row flex-center-center">
          <div class="flex-column flex-center-center">
            <span class="weight-500">{$_('Message')}</span>
            {#if modalData.txData.params.data}
              <span class="text-container message">{modalData.txData.params.data}</span>
            {:else}
              <span class="message">&nbsp;</span>
            {/if}
          </div>
        </div>
        {#if modalData.txData.params.stateInit != ""}
          <div class="flex-row flex-center-center">
            <div class="flex-column flex-center-center">
              <span class="weight-500">{$_('State init')}</span>
              <span class="text-container message">{modalData.txData.params.stateInit}</span>
            </div>
          </div>
        {/if}
        <div class="flex-row flow-buttons">
          <Button
            id="cancel-btn"
            class="button__solid button__secondary"
            {disabled}
            on:click={() => cancelTransaction()}>
            {$_('Cancel')}
          </Button>
          <Button
            id="save-btn"
            class="button__solid button__primary"
            {loading}
            on:click={() => confirmTransaction()}>
            {$_('Send')}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
