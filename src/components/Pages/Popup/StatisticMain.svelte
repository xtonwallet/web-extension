<script>
  /*
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Tabs, Tab, Icon, Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  / * Icons https://materialdesignicons.com/ * /
  import {
    mdiCog,
    mdiContentCopy,
    mdiPencil,
    mdiEye,
    mdiDelete,
    mdiCartArrowDown,
    mdiGift,
    //mdiSwapVertical,
    mdiBriefcaseUpload,
    mdiArrowTopRight,
    mdiArrowBottomLeft,
    mdiAlertCircle,
  } from "@mdi/js";

  import {
    accountStore,
    currentAccount,
    currentNetwork,
    ASSET_TYPES
  } from "../../../common/stores.js";

  import {
    shortAddress,
    copyToClipboard,
    fromNano,
    fromDecimal,
    unbounceble,
  } from "../../../common/utils.js";

  //Context
  const { openModal } = getContext("app_functions");

  let balance = 0;
  let error = "";

  onMount(() => {
    balance = $currentAccount.balance[$currentNetwork.server]
      ? fromNano($currentAccount.balance[$currentNetwork.server])
      : 0;
    checkBalance($currentAccount.address, $currentNetwork.server);

  });

  const checkBalance = (accountAddress, server) => {
    browser.runtime
      .sendMessage({
        type: "getCurrentBalance",
        data: { accountAddress: accountAddress, server: server },
      })
      .then((result) => {
        balance = fromNano(result);
      })
      .catch((e) => {
        balance = 0;
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };

  currentAccount.subscribe((value) => {
    balance = value.balance[$currentNetwork.server]
      ? fromNano(value.balance[$currentNetwork.server])
      : 0;
    checkBalance(value.address, $currentNetwork.server);
  });

  currentNetwork.subscribe((value) => {
    balance = $currentAccount.balance[$currentNetwork.server]
      ? fromNano($currentAccount.balance[$currentNetwork.server])
      : 0;
    checkBalance($currentAccount.address, value.server);
  });
  */
</script>

<style lang="scss">
  /*
  .flow-content-left {
    width: 300px;
  }
  .flow-content-right {
    padding: 0px;
    width: auto;
  }
  */
</style>

<!--
<div class="flex-row account-header" in:fade={{ delay: 0, duration: 200 }}>
  <div
    class="flex-column flow-content-left copy-text"
    on:click={(e) => copyAddress(e)}>
    <div class="nickname" title={$currentAccount.nickname}>
      {$currentAccount.nickname}
    </div>
    <div class="address">
      <span title={$currentAccount.address}>
        {shortAddress(unbounceble($currentAccount.address, $currentNetwork.server != "mainnet"))}
      </span>
    </div>
  </div>
</div>
<div
  class="flex-row is-horizontal-align account-balance"
  in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column">
    <div class="flex-row is-horizontal-align">
      <img src="/assets/img/icon-crystal-128.png" class="token-logo" alt="logo" />
    </div>
    <div class="flex-row is-horizontal-align account-balance-amount">
      {balance}
      {$currentNetwork.coinName}
    </div>
  </div>
</div>
-->