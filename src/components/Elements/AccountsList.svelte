<script>
  import { getContext, onMount } from "svelte";
  import { Icon } from "svelte-chota";
  import { _ } from "svelte-i18n";

  /* Icons https://materialdesignicons.com/ */
  import {
    mdiPlus,
    mdiLock,
  } from "@mdi/js";

  import Dropdown from "../../components/Elements/Dropdown.svelte";

  //Stores
  import {
    currentAccount,
    currentNetwork,
    accountStore,
  } from "../../common/stores.js";
  import { Blockies } from "../../common/blockies.js";
  import {
    fromNano,
    shortAddress,
  } from "../../common/utils.js";

  const { switchPage } = getContext("app_functions");

  let allAccounts = [];

  const getAllAccounts = () => {
    browser.runtime
      .sendMessage({
        type: "getAllAccounts",
        data: ["nickname", "address", "balance", "deployed"],
      })
      .then((result) => {
        allAccounts = result;
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  const changeAccount = (accountAddress) => {
    const newCurrentAccount = allAccounts.filter(
      (item) => item.address == accountAddress
    );
    if (newCurrentAccount.length) {
      accountStore.changeAccount(newCurrentAccount[0]);
      browser.runtime
      .sendMessage({
        type: "changeAccount",
        data: newCurrentAccount[0],
      })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
    }
  };

  const blockies = new Blockies();
  $: currentIdenticon = blockies.createIcon({
    seed: $currentAccount.address,
    color: "#2479b9",
    bgcolor: "#151515",
    spotcolor: "#33ff00",
  });

  const indenticon = (address) => {
    return blockies.createIcon({
      seed: address,
      color: "#2479b9",
      bgcolor: "#151515",
      spotcolor: "#33ff00",
    });
  };

  const lock = () => {
    browser.runtime.sendMessage({ type: "lockWallet" })
    .catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
    return;
  };

  onMount(() => {
    getAllAccounts();
  });

  currentAccount.subscribe((value) => {
    getAllAccounts();
  });

  const addNewAccount = () => {
    switchPage("AddNewAccount");
  };
</script>

<style lang="scss">
  :global(.account-dropdown summary) {
    font-size: 0rem;
    width: 3.25rem;
    padding: 0.2rem;
    margin-right: 1rem;
    margin-top: 1rem;
    color: var(--color-black);
    display: initial;
    border-radius: 50%;
    font-size: 0rem;
  }
  :global(.account-dropdown summary:focus, .account-dropdown
      .button.outline.icon
      .lefticon:focus) {
    outline: none;
  }
  :global(.account-dropdown .card) {
    left: -16.5rem !important;
    opacity: 0.9;
    font-size: 1.25rem;
    padding: 0 !important;
    top: 4.5rem;
    width: 20rem;
  }
  :global(.account-dropdown .card .selected) {
    background-color: var(--color-primary) !important;
  }
  :global(.account-dropdown .card div) {
    padding: 0.5rem 2rem;
  }
  :global(.account-dropdown .card .account-item) {
    display: flex;
    flex-direction: row;
    cursor: pointer;
  }
  :global(.account-dropdown .card .menu-item) {
    cursor: pointer;
  }
  :global(.account-dropdown .button.outline) {
    border: var(--color-black) 1px solid;
  }
  :global(.account-dropdown .card .account-item .identicon) {
    border: var(--color-black) 1px solid;
    display: inline-grid;
    width: fit-content;
    height: fit-content;
    border-radius: 50%;
    padding: 0.2rem;
    margin-right: 1rem;
  }
  :global(.account-dropdown .card .account-item .nickname) {
    max-width: 85px;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 85px;
  }
  :global(.account-dropdown .card .account-item .balance) {
    font-weight: bold;
  }
  .lock-wallet {
    .flex-row {
      justify-content: space-between;
    }
    div {
      padding: 0.5rem 0;
    }
    .lock-wallet-button {
      cursor: pointer;
    }
  }
  .account-list-wrapper {
    max-height: 20rem;
    overflow: hidden;
    padding: 0px;
    width: 100%;
    .account-list-wrapper-scroll {
      max-height: 20rem;
      overflow-y: auto;
      padding: 0px;
      width: calc(100% + 20px);
    }
  }
  :global(.account-dropdown .spacer) {
    border-top: dashed 1px var(--color-black);
    margin-top: 0.5rem;
  }
</style>

<div class="flex-row account-dropdown">
  <Dropdown dropdown="" svg={currentIdenticon} autoclose outline>
    <div class="lock-wallet">
      <div class="flex-row">
        <div>{$_('Accounts')}</div>
        <div class="lock-wallet-button" on:click={() => lock()} on:keyup={() => lock()}>
          <Icon src={mdiLock} size="1" color="var(--color-black)" />
          {$_('Sign out')}
        </div>
      </div>
    </div>
    <div class="spacer" />
    <div class="account-list-wrapper">
      <div class="account-list-wrapper-scroll">
        {#each allAccounts as account}
          <div
            on:click={() => changeAccount(account.address)}
            on:keyup={() => changeAccount(account.address)}
            class:selected={account.address == $currentAccount.address}
            class="account-item is-vertical-align">
            <span class="identicon">{@html indenticon(account.address)}</span>
            <span
              class="nickname"
              title={shortAddress(account.address)}>{account.nickname}</span>
            <span class="balance is-center">
              {account.balance[$currentNetwork.server] ? fromNano(account.balance[$currentNetwork.server], 2) : 0}
            </span>
          </div>
        {/each}
      </div>
    </div>
    <div class="spacer" />
    <div class="menu-item" on:click={() => addNewAccount()} on:keyup={() => addNewAccount()}>
      <Icon src={mdiPlus} size="1.5" color="var(--color-black)" />
      {$_('Add')}
    </div>
  </Dropdown>
</div>
