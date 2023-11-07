<script>
  import { onMount, onDestroy, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Tabs, Tab, Icon, Button } from "svelte-chota";
  import BigNumber from "bignumber.js";
  import { _ } from "svelte-i18n";

  let active_tab = "tx";

  /* Icons https://materialdesignicons.com/ */
  import {
    mdiCog,
    mdiEye,
    mdiBriefcaseUpload,
    mdiArrowTopRight,
    mdiCartArrowDown,
    mdiArrowBottomLeft,
    mdiAlertCircle,
    mdiChevronRight,
    mdiChevronLeft,
    mdiLoading,
    mdiGift,
    mdiUpdate,
    mdiDelete,
    mdiPencil,
    mdiPaperRoll,
    mdiQrcode,
    mdiSend
  } from "@mdi/js";

  import {
    accountStore,
    currentAccount,
    currentNetwork,
    currentResolution,
    currentRate,
    currentCurrency,
    waitingTransaction,
    ASSET_TYPES,
    APPROXIMATE_FEE
  } from "../../../common/stores.js";

  import {
    copyToClipboard,
    fromNano,
    shortAddress,
    unbounceble,
  } from "../../../common/utils.js";

  //Context
  const { openModal } = getContext("app_functions");

  let balance = 0;
  let showDeploy = false;
  let showBuy = false;
  let showGiver = false;
  let giverLoading = false;
  let deployLoading = false;
  let transactions = [];
  let assets = [];
  let transactionPage = 1;

  const walletUIUpdateListener = (message) => {
    if (message.type === "page-updateWalletUI") {
      checkDeployed($currentAccount.address, $currentNetwork.server);
      checkBalance($currentAccount.address, $currentNetwork.server);
      getTransactions($currentAccount.address, $currentNetwork.server, 10, 1);
      getTokenList($currentAccount.address, $currentNetwork.server);
    }
  };

  onMount(() => {
    browser.runtime.onMessage.addListener(walletUIUpdateListener);

    balance = $currentAccount.balance[$currentNetwork.server]
      ? fromNano($currentAccount.balance[$currentNetwork.server])
      : 0;
    checkBalance($currentAccount.address, $currentNetwork.server);
    getTransactions($currentAccount.address, $currentNetwork.server, 10, 1);
    getTokenList($currentAccount.address, $currentNetwork.server);
  });

  onDestroy(() => {
    browser.runtime.onMessage.removeListener(walletUIUpdateListener);
  });

  $: showDeploy = $currentAccount.deployed
    ? !$currentAccount.deployed.includes($currentNetwork.server)
    : false;
  $: showBuy = !$currentNetwork.test;
  $: showGiver = $currentNetwork.test && $currentNetwork.giver != "";

  const copyAddress = (event) => {
    copyToClipboard(unbounceble($currentAccount.address));
    const element = event.currentTarget;
    element.classList.toggle("fade-half");
    setTimeout(() => {
      element.classList.toggle("fade-half");
    }, 1000);
  };

  const showQRCode = (event) => {
    openModal("ModalQRCode", { data: "ton://transfer/" + unbounceble($currentAccount.address) });
  };

  const sendLink = (event) => {
    openModal("ModalSendLink", { data: "ton://transfer/" + unbounceble($currentAccount.address) });
  };

  const showNftContent = (event, asset) => {
    event.stopPropagation();
    openModal("ModalShowNftContent", { data: asset });
  };

  const checkDeployed = (accountAddress, server) => {
    browser.runtime
      .sendMessage({
        type: "getDeployedState",
        data: { accountAddress: accountAddress, server: server },
      })
      .then((result) => {
        showDeploy = !result;
      })
      .catch((e) => {
        showDeploy = true;
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };
  
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

  const getTransactions = (accountAddress, server, count, page) => {
    browser.runtime
      .sendMessage({
        type: "getTransactions",
        data: {
          accountAddress: accountAddress,
          server: server,
          count: count,
          page: page,
        },
      })
      .then((result) => {
        transactions = result;
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };

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
        }
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };

  let waitingTransactionChecking = false;
  waitingTransaction.subscribe((value) => {
    if (value.includes($currentNetwork.server + "-" + $currentAccount.address) && !waitingTransactionChecking) {
      waitingTransactionChecking = true;
      setTimeout(() => {
          browser.runtime
            .sendMessage({
              type: "checkNewTransactions",
              data: {
                accountAddress: $currentAccount.address,
                server: $currentNetwork.server
              }
            }).then(() => {
              if (result) {
                accountStore.removeWaitingTransaction($currentNetwork.server + "-" + $currentAccount.address);
                waitingTransactionChecking = false;
              }
            }).catch((e) => {
              if (devMode) {
                console.log(e);
              }
            });
        }, 10000);
    }
  });

  currentAccount.subscribe((value) => {
    balance = value.balance[$currentNetwork.server]
      ? fromNano(value.balance[$currentNetwork.server])
      : 0;
    checkBalance(value.address, $currentNetwork.server);
    getTransactions(value.address, $currentNetwork.server, 10, 1);
    getTokenList(value.address, $currentNetwork.server);
  });

  currentNetwork.subscribe((value) => {
    balance = $currentAccount.balance[$currentNetwork.server]
      ? fromNano($currentAccount.balance[$currentNetwork.server])
      : 0;
    checkBalance($currentAccount.address, value.server);
    getTransactions($currentAccount.address, value.server, 10, 1);
    getTokenList($currentAccount.address, value.server);
  });

  const editNickname = () => {
    openModal("ModalEditNickname");
  };

  const viewOnExplorer = () => {
    browser.tabs.create({
      url: `${$currentNetwork.explorer}/address/${unbounceble($currentAccount.address)}`,
    });
  };

  const viewTransactionOnExplorer = (txId) => {
    browser.tabs.create({
      url: `${$currentNetwork.explorer}/tx/${txId}`,
    });
  };

  const deleteAccount = () => {
    openModal("ModalDeleteAccount");
  };

  const updateTransactions = () => {
    browser.runtime
      .sendMessage({
        type: "updateTransactions",
        data: {
          accountAddress: $currentAccount.address,
          server: $currentNetwork.server,
        },
      })
      .then(() => {
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  };

  const buy = () => {
    browser.tabs.create({ url: "https://exchange.mercuryo.io/?currency=TONCOIN&utm_source=xtonwallet" });
  };

  const giver = () => {
    giverLoading = true;
    browser.runtime.sendMessage({ type: "takeFromGiver", data: {"accountAddress": $currentAccount.address, "server": $currentNetwork.server} }).then(
      (result) => {
        giverLoading = false;
        if (result.error) {
          openModal("ModalError", {"message" : result.error});
        } else {
          if (!result.added) {
            openModal("ModalError", {"message" : result.reason});
          } else {
            checkBalance($currentAccount.address, $currentNetwork.server);
            openModal("ModalSuccess", {"message" : "Amount is received"});
          }
        }
      }
    ).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  };

  /*
  const swap = () => {
    //show enrolling form
    browser.tabs.create({ url: "https://form.google.com/werewr" });
  };
  */

  const sendTransactionTon = () => {
    openModal("ModalSendingTransaction");
  };

  const sendTransactionToken = (tokenObject) => {
    if (tokenObject.type != "74") {
      // we don't allow sending NFT now
      return;
    }
    if (tokenObject.icon == "") {
      tokenObject.icon = "/assets/img/icon-token-128.png";
    }
    openModal("ModalSendingTransaction", { token: tokenObject });
  };

  const deploy = () => {
    if (new BigNumber(balance).lt(APPROXIMATE_FEE)) {
      openModal("ModalError", {
        message: "Account has insufficient balance for the requested operation. Send some value to account balance",
      });
    } else {
      deployLoading = true;
      browser.runtime
        .sendMessage({
          type: "deployNewWallet",
          data: {
            accountAddress: $currentAccount.address,
            server: $currentNetwork.server,
          },
        })
        .then((result) => {
          deployLoading = false;
          if (!result.success) {
            openModal("ModalError", { message: result.reason });
            if (result.alreadyDeployed) {
              const newCurrentAccount = $currentAccount;
              newCurrentAccount.deployed.push($currentNetwork.server);
              accountStore.changeAccount(newCurrentAccount);
            }
          } else {
            openModal("ModalSuccess", {
              message: "The wallet has been deployed",
            });
            const newCurrentAccount = $currentAccount;
            newCurrentAccount.deployed.push($currentNetwork.server);
            accountStore.changeAccount(newCurrentAccount);
          }
        }).catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error.message));
        });
    }
  };

  const importToken = () => {
    openModal("ModalImportToken");
  };

  const transactionPageBack = () => {
    if (transactionPage-1 >= 1) {
      transactionPage--;
      getTransactions($currentAccount.address, $currentNetwork.server, 10, transactionPage);
    }
  }

  const transactionPageForward = () => {
    transactionPage++;
    getTransactions($currentAccount.address, $currentNetwork.server, 10, transactionPage);
  }
</script>

<style lang="scss">
  .nickname,
  .address {
    font-size: 1.5rem;
    text-align: center;
  }
  .nickname {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .address {
    font-weight: bold;
  }
  .token-logo {
    width: 48px;
    height: 48px;
    border: var(--color-black) dashed 1px;
    margin: 0.5rem;
    border-radius: 50%;
  }
  .account-header {
    border-bottom: #d0d0d0 dashed 1px;
    padding-bottom: 0.5rem;
  }
  .account-balance {
    padding-top: 1rem;
  }
  :global(.account-settings .card) {
    left: -14rem !important;
    font-size: 1.5rem;
    opacity: 0.9;
    width: 12.5rem;
  }
  :global(.account-settings .button.outline.icon .lefticon) {
    margin: 0px;
    margin-top: 0.5rem;
  }
  :global(.account-settings summary:focus, .account-settings
      .button.outline.icon
      .lefticon:focus) {
    outline: none;
  }
  :global(.account-settings .button.outline.icon) {
    border: none;
    padding: 0.5rem 0px;
  }
  :global(.account-settings .account-settings-item) {
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(.account-receipt .card) {
    left: 0rem !important;
    font-size: 1.5rem;
    opacity: 0.9;
    width: 12.5rem;
  }
  :global(.account-receipt .button.outline.icon .lefticon) {
    margin: 0px;
    margin-top: 0.5rem;
  }
  :global(.account-receipt summary:focus, .account-receipt
      .button.outline.icon
      .lefticon:focus) {
    outline: none;
  }
  :global(.account-receipt .button.outline.icon) {
    border: none;
    padding: 0.5rem 0px;
  }
  :global(.account-receipt .account-receipt-item) {
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :global(.action-button) {
    background-color: var(--color-primary);
    color: var(--color-white);
  }
  :global(.account-tabs span) {
    width: 50%;
  }
  :global(.account-balance-amount) {
    font-weight: bold;
    margin-top: 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  .account-assets,
  .account-tx {
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px dashed var(--color-black);
    cursor: pointer;
  }
  .asset-logo {
    width: 32px;
    height: 32px;
    margin: 0.5rem;
    border-radius: 50%;
  }
  .account-tx {
    justify-content: left;
    .tx-data {
      flex-direction: column;
      display: flex;
      width: 75%;
      .tx-date {
        font-size: 1rem;
      }
    }
    .tx-type {
      align-items: center;
      display: flex;
      width: 40px;
      padding-right: 10px;
      cursor: pointer;
    }
  }
  .account-tx-wrapper {
    max-height: 24rem;
    overflow: hidden;
    .account-tx-wrapper-scroll {
      max-height: 24rem;
      overflow-y: auto;
      width: calc(100% + 20px);
    }
  }
  .flow-content-left-account {
    box-sizing: border-box;
    padding: 0px 24px 0 60px;
    justify-content: flex-start;
  }
  .flow-content-right-account {
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    flex-grow: 1;
    padding: 0px;
    width: auto;
  }
  .flow-content-left-account {
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
    flex-grow: 1;
    padding: 0px;
    width: auto;
  }
  .flow-content-center-account {
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    flex-grow: 1;
    padding: 0px;
    width: auto;
  }
  .token-list-wrapper {
    max-height: 24rem;
    overflow: hidden;
    width: 100%;
    .token-list-wrapper-scroll {
      max-height: 24rem;
      overflow-y: auto;
      padding: 0px;
      width: calc(100% + 20px);
    }
  }
  :global {
    summary, button {
      white-space: normal !important;
    }
  }
  @media (min-width: 480px) {
    .token-list-wrapper,
    .account-tx-wrapper {
      padding: 0px;
    }
    :global {
      summary, button {
        white-space: nowrap !important;
      }
    }
  }
  .import-asset {
    padding: 1rem;
  }
  .token-image {
    width: 3rem;
    height: 3rem;
  }
  .chevron-left {
    cursor: pointer;
  }
  .chevron-right {
    cursor: pointer;
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
    width: 40px;
    text-align: center;
  }
  .asset-balance {
    margin-right: 20px;
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
  .tx-confirmation {
    flex-direction: column;
    display: flex;
    width: 250px;
    color: var(--color-warning);
  }
</style>

<div class="flex-row account-header" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left-account">
    <div class="account-receipt">
      <Button dropdown="" autoclose outline icon={mdiPaperRoll}>
        <div class="account-receipt-item" on:click={() => showQRCode()} on:keyup={() => showQRCode()}>
          <Icon src={mdiQrcode} size="1" color="var(--color-black)" />
          {$_('QR code')}
        </div>
        <div class="account-receipt-item" on:click={() => sendLink()} on:keyup={() => sendLink()}>
          <Icon src={mdiSend} size="1" color="var(--color-black)" />
          {$_('Send the link')}
        </div>
      </Button>
    </div>
  </div>
  <div
    class="flex-column flow-content-center-account copy-text"
    on:click={(e) => copyAddress(e)} on:keyup={(e) => copyAddress(e)}>
    <div class="nickname" title={$currentAccount.nickname}>
      {$currentAccount.nickname}
    </div>
    <div class="address">
      {#if ($currentResolution.innerWidth < 768)}
        <span title={unbounceble($currentAccount.address)}> {shortAddress(unbounceble($currentAccount.address))} </span>
      {:else}
        <span title={unbounceble($currentAccount.address)}> {unbounceble($currentAccount.address)} </span>
      {/if}
    </div>
  </div>
  <div class="flex-column flow-content-right-account">
    <div class="account-settings">
      <Button dropdown="" autoclose outline icon={mdiCog}>
        <div class="account-settings-item" on:click={() => editNickname()} on:keyup={() => editNickname()}>
          <Icon src={mdiPencil} size="1" color="var(--color-black)" />
          {$_('Edit nickname')}
        </div>
        <div class="account-settings-item" on:click={() => viewOnExplorer()} on:keyup={() => viewOnExplorer()}>
          <Icon src={mdiEye} size="1" color="var(--color-black)" />
          {$_('View on explorer')}
        </div>
        <div class="account-settings-item" on:click={() => deleteAccount()} on:keyup={() => deleteAccount()}>
          <Icon src={mdiDelete} size="1" color="var(--color-black)" />
          {$_('Delete account')}
        </div>
        <div class="account-settings-item" on:click={() => updateTransactions()} on:keyup={() => updateTransactions()}>
          <Icon src={mdiUpdate} size="1" color="var(--color-black)" />
          {$_('Update transactions list')}
        </div>
      </Button>
    </div>
  </div>
</div>
<div
  class="flex-row is-horizontal-align account-balance"
  in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column">
    <div class="flex-row is-horizontal-align">
      <img
        src="/assets/img/icon-crystal-128.png"
        class="token-logo"
        alt="logo" />
    </div>
    <div class="flex-row is-horizontal-align account-balance-amount">
      {balance}
      {$currentNetwork.coinName}
      <br/>
      {#if $currentRate != "*"}
        (~{new BigNumber(balance).times($currentRate).toFixed(2)} {$currentCurrency})
      {/if}
    </div>
    <div class="flex-row is-horizontal-align account-actions">
      {#if showBuy}
        <Button
          disable
          title={$_('Buy')}
          class="action-button is-rounded"
          on:click={() => {
            buy();
          }}
          icon={mdiCartArrowDown} />
      {/if}
      {#if showGiver}
        <Button
          title={$_('Giver')}
          class="action-button is-rounded"
          loading={giverLoading}
          on:click={() => {
            giver();
          }}
          icon={mdiGift} />
      {/if}
      <!--
      <Button
        disabled
        title={$_('Swap')}
        class="action-button is-rounded"
        on:click={() => {swap();}}
        icon={mdiSwapVertical} />
      -->
      {#if showDeploy}
        <Button
          title={$_('Deploy')}
          class="action-button is-rounded"
          loading={deployLoading}
          on:click={() => {
            deploy();
          }}
          icon={mdiBriefcaseUpload} />
      {:else}
        <Button
          title={$_('Send transaction')}
          class="action-button is-rounded"
          on:click={() => {
            sendTransactionTon();
          }}
          icon={mdiArrowTopRight} />
      {/if}
    </div>
  </div>
</div>

<Tabs class="account-tabs" bind:active={active_tab}>
  <Tab tabid="assets">{$_('Assets')}</Tab>
  <Tab tabid="tx">{$_('Transactions')}</Tab>
</Tabs>
{#if active_tab == 'assets'}
  <div class="token-list-wrapper">
    <div class="token-list-wrapper-scroll">
      <div
        class="flex-row is-horizontal-align account-assets"
        on:click={() => {
          sendTransactionTon();
        }}
        on:keyup={() => {
          sendTransactionTon();
        }}
        >
        <img
          src="/assets/img/icon-crystal-128.png"
          class="asset-logo"
          alt="logo" />
        <span class="asset-balance is-center" title="{balance} {$currentNetwork.coinName}">
          <span class="asset-balance-amount">{balance}</span>
          <span class="asset-balance-symbol">{$currentNetwork.coinName}</span>
        </span>
      </div>
      {#each assets as asset}
        <div
          class="flex-row is-horizontal-align account-assets"
          on:click={() => {
            sendTransactionToken(asset);
          }}
          on:keyup={() => {
            sendTransactionToken(asset);
          }}>
          <img
            src={asset.icon != '' ? asset.icon : '/assets/img/icon-token-128.png'}
            class="asset-logo"
            title={asset.address}
            alt="logo" />
          <span class="asset-type">{ASSET_TYPES[asset.type]}</span>
          {#if asset.type == "74"} 
            <span class="asset-balance is-center" title="{fromNano(asset.balance, asset.decimals)} {asset.name}">
              <span class="asset-balance-amount">{fromNano(asset.balance)}</span>
              <span class="asset-balance-symbol">{asset.symbol}</span>
            </span>
          {/if}
          {#if asset.type == "64"} 
            <span class="asset-balance is-center">
              <Button
                disable
                title={$_('NFT content')}
                class="action-button is-rounded"
                on:click={(event) => {
                  showNftContent(event, asset);
                }}
                icon={mdiEye} />
            </span>
          {/if}
        </div>
      {/each}
      <div class="flex-row is-horizontal-align import-asset">
        <a href={'#'} on:click={() => importToken()}>{$_('Import token')}</a>
      </div>
    </div>
  </div>
{/if}
{#if active_tab == 'tx'}
  <div class="account-tx-wrapper">
    <div class="account-tx-wrapper-scroll">
      {#if $waitingTransaction && $waitingTransaction.includes($currentNetwork.server + "-" + $currentAccount.address)}
        <div class="flex-row is-horizontal-align account-tx">
          <span class="tx-type">
            <Icon
              class="action-button"
              src={mdiLoading}
              size="2"
              spin="1"
            />
          </span>
          <span class="tx-confirmation">
            {$_('Waiting for the transaction confirmation on the blockchain')}
          </span>
        </div>
      {/if}
      {#each transactions as tx}
        <div
          class="flex-row is-horizontal-align account-tx"
          data-hash={tx.new_hash}
          on:click={() => viewTransactionOnExplorer(tx.id)}
          on:keyup={() => viewTransactionOnExplorer(tx.id)}
          >
          <span class="tx-type">
            {#if tx.type == 'deploy'}
              <Icon
                class="action-button"
                src={mdiBriefcaseUpload}
                size="2"
                />
            {/if}
            {#if tx.type == 'tokenTransfer'}
              <img
                alt="{typeof tx.tokenName != 'undefined' && tx.tokenName != '' ? tx.tokenName : ""}"
                title="{typeof tx.tokenName != 'undefined' && tx.tokenName != '' ? tx.tokenName : ""}"
                class="token-image"
                src={typeof tx.tokenIcon != 'undefined' && tx.tokenIcon != '' ? tx.tokenIcon : '/assets/img/icon-token-128.png'}
                />
            {/if}
            {#if tx.type == 'tokenIncoming'}
              <img
                alt="{typeof tx.tokenName != 'undefined' && tx.tokenName != '' ? tx.tokenName : ""}"
                title="{typeof tx.tokenName != 'undefined' && tx.tokenName != '' ? tx.tokenName : ""}"
                class="token-image"
                src={typeof tx.tokenIcon != 'undefined' && tx.tokenIcon != '' ? tx.tokenIcon : '/assets/img/icon-token-128.png'}
                />
            {/if}
            {#if tx.type == 'transfer'}
              <Icon
                class="action-button"
                src={mdiArrowTopRight}
                size="2"
                />
            {/if}
            {#if tx.type == 'incoming'}
              <Icon
                class="action-button"
                src={mdiArrowBottomLeft}
                size="2"
                />
            {/if}
            {#if tx.type == 'error'}
              <Icon
                class="action-button"
                src={mdiAlertCircle}
                size="2"
                />
            {/if}
          </span>
          <span class="tx-data" title="{tx.comment}">
            <span class="tx-name">{$_(tx.type)}</span>
            <span
              class="tx-date">{new Date(tx.now * 1000).toLocaleString()}</span>
          </span>
          <span class="tx-balance is-left" title={tx.amount}>
            {fromNano(tx.amount)}
            {typeof tx.tokenSymbol != 'undefined' && tx.tokenSymbol != '' ? tx.tokenSymbol : tx.coinName}
          </span>
        </div>
      {/each}
      {#if transactions.length == 0}
        <div class="flex-row is-horizontal-align account-tx">
          {$_('Empty list')}
        </div>
      {/if}
      <div class="flex-row is-horizontal-align">
        <div class="flex-column chevron-left">
          {#if transactionPage > 1 || (transactionPage > 1 && transactions.length == 0)}
            <Icon on:click={(e) => transactionPageBack()} src={mdiChevronLeft} size="2" color="var(--color-black)"/>
          {/if}
        </div>
        <div class="flex-column chevron-center">
          &nbsp;
        </div>
        <div class="flex-column chevron-right">
          {#if transactions.length != 0}
            <Icon on:click={(e) => transactionPageForward()} src={mdiChevronRight} size="2" color="var(--color-black)"/>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
