<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  import {
    currentAccount,
    currentNetwork,
    ASSET_TYPES,
  } from "../../../common/stores.js";

  import {
    fromNano,
  } from "../../../common/utils.js";

  //Stores
  import { Checkbox, Button } from "svelte-chota";

  //Context
  const { switchPage } = getContext("app_functions");

  //DOM nodes
  let formObj;

  let assetsLoaded = false;
  let assets = [];
  let selectedList = [];

  const getTokenList = (accountAddress, server) => {
    browser.runtime
      .sendMessage({
        type: "tokenList",
        data: {
          accountAddress: accountAddress,
          server: server,
        },
      })
      .then((result) => {
        if (server == $currentNetwork.server) {
          assets = result;
          assetsLoaded = true;
        }
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };

  onMount(() => {
    getTokenList($currentAccount.address, $currentNetwork.server);
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        browser.runtime
          .sendMessage({
            type: "removeTokens",
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
</script>

<style lang="scss">
  .tokens-wrapper {
    max-height: 40rem;
    overflow: hidden;
    .tokens-wrapper-scroll {
      max-height: 40rem;
      overflow-y: auto;
      width: calc(100% + 20px);
    }
  }
  .asset-logo {
    width: 32px;
    height: 32px;
    margin: 0.5rem;
    border-radius: 50%;
  }
  .account-assets {
    position: relative;
  }
  .asset-type {
    position: absolute;
    bottom: 5px;
    background: var(--color-primary);
    border-radius: 10px;
    font-size: 1.1rem;
    padding: 4px;
    font-weight: 400;
    color: var(--color-white);
    border-color: #000;
    border-style: solid;
    border-width: 1px;
    line-height: 0.5rem;
    white-space: nowrap;
    left: 0px;
    width: 40px;
    text-align: center;
  }
  .asset-balance-amount {
    max-width: 165px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding-right: 1rem;
  }
  .asset-balance-symbol {
    max-width: 75px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>

<h6>{$_('Manage tokens')}</h6>

<form
  id="manage-tokens-form"
  on:submit|preventDefault={() => handleSubmit()}
  target="_self"
  bind:this={formObj}
  autocomplete="off">
  <div class="tokens-wrapper">
    <div class="tokens-wrapper-scroll">
      {#each assets as asset}
        <div class="flex-row is-vertical-align">
          <Checkbox name="selected-asset" value="{asset.address}" bind:group={selectedList}></Checkbox>
          <div class="account-assets">
            <img
              src={asset.icon != '' ? asset.icon : '/assets/img/icon-token-128.png'}
              class="asset-logo"
              title={asset.address}
              alt="logo" />
            <span class="asset-type">{ASSET_TYPES[asset.type]}</span>
          </div>
          {#if asset.type == "74"}
            <span class="asset-balance is-center" title="{fromNano(asset.balance, asset.decimals)} {asset.name}">
              <span class="asset-balance-amount">{fromNano(asset.balance)}</span>
              <span class="asset-balance-symbol">{asset.symbol}</span>
            </span>
          {/if}
          {#if asset.type == "64"}
            <span class="asset-balance is-center" title="{asset.name}">
              <span class="asset-balance-amount"></span>
              <span class="asset-balance-symbol">{asset.name}</span>
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  {#if !assetsLoaded}
    <Loading/>
  {:else}
    {#if assets.length > 0}
      <div class="flex-column flow-buttons">
        <Button
          form="manage-tokens-form"
          class="button__solid button__primary submit-button submit-button-text submit"
          style="margin: 0 0 1rem;"
          submit=true>
          {$_('Delete selected assets')}
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
      {$_('No tokens that you can remove')}
    {/if}
  {/if}
</form>
