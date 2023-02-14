<script>
  import BigNumber from "bignumber.js";
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";
  import Select from "../../Select";

  //Stores
  import {
    currentAccount,
    currentNetwork,
  } from "../../../../common/stores.js";

  import {
    fromNano,
    toNano,
    sendRequestReject,
  } from "../../../../common/utils.js";

  //Components
  import { Field, Button, Input } from "svelte-chota";

  export let modalData = {};
  export let closeModal;

  let destination, amount, message;
  let icon = "/assets/img/icon-crystal-128.png";
  let symbol = $currentNetwork.coinName;
  let isNative = true;
  let title = $_("Native");
  let fee = 0;
  let total = 0;
  let balance = 0;
  let allBalance = false;
  let disabled = true;
  let errorAmount = false;

  //Context
  const { openModal } = getContext("app_functions");

  let complexItems = [];

  const loadSelectAddressesList = () => {
    browser.runtime
      .sendMessage({
        type: "getAllAccounts",
        data: ["nickname", "address"],
      })
      .then((result) => {
        complexItems = [];
        for (let i in result) {
          if (result[i].address == $currentAccount.address) {
            continue;
          }
          complexItems.push({
            value: result[i].address,
            label: result[i].nickname,
            group: $_("Own addresses"),
          });
        }
        //'Favorite address'
        //'Favorite smart contract'
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  onMount(() => {
    destination = document.getElementById("sending-tx-destination");
    amount = document.getElementById("sending-tx-amount");
    message = document.getElementById("sending-tx-message");
    browser.runtime
      .sendMessage({
        type: "getCurrentBalance",
        data: { accountAddress: $currentAccount.address, server: $currentNetwork.server },
      })
      .then((result) => {
        balance = result;
        if (modalData.id) {
          const params = modalData.params;
          if (params.amount) {
            amount.value = params.amount;
          }
          if (params.message) {
            message.value = params.message;
          }
          if (params.destination) {
            destination.dataset.value = params.destination;
            destination.value = params.destination;
            validateAddress({});
          }
          loadSelectAddressesList();
        }
        if (modalData.token) {
          isNative = false;
          icon = modalData.token.icon;
          symbol = modalData.token.symbol;
          title = modalData.token.name;
        }
      })
      .catch((e) => {
        balance = 0;
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  });

  currentAccount.subscribe((value) => {
    loadSelectAddressesList();
  });

  const setMax = () => {
    if (isNative) {
      amount.value = fromNano(balance);
    } else {
      amount.value = fromNano(modalData.token.balance, modalData.token.decimals);
    }
    allBalance = true;
    calculateFee();
  };

  const validateAddressSelect = (event) => {
    if (event.detail == null) {
      disabled = true;
      return;
    }
    const rawAddress = new RegExp(/-?[0-9]{0,10}:[a-fA-F0-9]{64}/);
    const base64Address = new RegExp(/[_\-\/\+a-zA-Z0-9]{48}/);
    if (
      new String(event.detail.value).match(rawAddress) ||
      new String(event.detail.value).match(base64Address)
    ) {
      disabled = false;
      destination.dataset.value = event.detail.value;
      calculateFee();
    } else {
      disabled = true;
    }
  };

  const validateAddress = (event) => {
    const rawAddress = new RegExp(/-?[0-9]{0,10}:[a-fA-F0-9]{64}/);
    const base64Address = new RegExp(/[_\-\/\+a-zA-Z0-9]{48}/);
    if (
      new String(destination.value).match(rawAddress) ||
      new String(destination.value).match(base64Address)
    ) {
      disabled = false;
      destination.dataset.value = destination.value;
      calculateFee();
    } else {
      disabled = true;
    }
  };

  const calculateFee = () => {
    if (amount.value == "" || typeof(destination.dataset.value) == "undefined") {
      disabled = true;
      return;
    }
    let txData, maxBalance;
    if (isNative) {
      maxBalance = balance;
      if (!allBalance && new BigNumber(toNano(amount.value)).gt(maxBalance)) {
        allBalance = true;
        amount.value = fromNano(maxBalance);
      }
      txData = {
        type: "send",
        params: {
          amount: toNano(amount.value),
          message: message.value,
          destination: destination.dataset.value,
          allBalance: allBalance,
        },
      };
    } else {
      maxBalance = modalData.token.balance;
      if (!allBalance && new BigNumber(toNano(amount.value)).gt(maxBalance)) {
        allBalance = true;
        amount.value = maxBalance;
      }
      txData = {
        type: "sendToken",
        params: {
          amount: toNano(amount.value),
          message: message.value,
          destination: destination.dataset.value,
          token: modalData.token,
        }
      };
    }
    browser.runtime
      .sendMessage({
        type: "calculateFee",
        data: {
          accountAddress: $currentAccount.address,
          server: $currentNetwork.server,
          txData: txData,
        },
      })
      .then((result) => {
        fee = result.error ? 0 : fromNano(result.fee);
        if (fee == 0) {
          disabled = true;
          errorAmount = "Amount can't be less than 0,001";
          return;
        } else {
          disabled = false;
          errorAmount = false;
        }
        const maxBalance = balance;
        if (isNative) {
          if (allBalance) {
            amount.value = fromNano(maxBalance - toNano(fee));
            total = fromNano(maxBalance);
          } else {
            if (new BigNumber(toNano(amount.value) + toNano(fee)).gt(maxBalance)) {
              amount.value = fromNano(maxBalance - toNano(fee));
              total = fromNano(maxBalance);
            } else {
              total = fromNano(toNano(amount.value) + toNano(fee));
            }
          }
        } else {
          total = fromNano(result.fee);
          if (new BigNumber(result.fee).gt(maxBalance)) {
            disabled = true;
            errorAmount = "Account has insufficient balance for the requested operation. Send some value to account balance";
          }
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  const cancelTransaction = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const confirmTransaction = () => {
    let txData;
    if (isNative) {
      txData = {
        type: "send",
        params: {
          amount: toNano(amount.value),
          message: message.value,
          destination: destination.dataset.value,
          allBalance: allBalance,
        },
      };
    } else {
      txData = {
        type: "sendToken",
        params: {
          amount: toNano(amount.value),
          message: message.value,
          destination: destination.dataset.value,
          token: modalData.token
        },
      };
    }
    openModal("ModalConfirmTransaction", {
      id: modalData.id,
      accountAddress: $currentAccount.address,
      server: $currentNetwork.server,
      fee: fee,
      txData: txData,
    });
  };

  const groupBy = (item) => item.group;
</script>

<style>
  .token-logo {
    width: 48px;
    height: 48px;
    border: var(--color-black) dashed 1px;
    margin: 0.5rem;
    border-radius: 50%;
  }
  .sending-tx-total-wrapper {
    align-content: center;
    display: flex;
    justify-content: center;
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 1em;
  }
  #sending-tx-fee,
  #sending-tx-total {
    flex-direction: row;
  }
  #sending-tx-fee {
    margin-right: 1rem;
    font-weight: 700;
  }
  #sending-tx-total {
    margin-left: 1rem;
  }
  .title {
    margin: 0px;
  }
  .container {
    line-height: 1.3;
  }
</style>

<div class="flex-column container">
  <h6 class="title">{$_('Send transaction')}</h6>
  <div class="is-center">
    <img alt="logo" class="token-logo" src="{icon}"/><br/>
    <span title="{title}">{symbol}</span>
  </div>
  <Field label={$_('Address')}>
    <Select
      id="sending-tx-destination"
      items={complexItems}
      {groupBy}
      required
      placeholder={$_('Select or enter a new one') + '...'}
      noOptionsMessage={$_('No matches')}
      on:select={validateAddressSelect}
      on:clear={validateAddressSelect}
      on:keyup={validateAddress} />
  </Field>
  <Field
    label={$_('Amount')}
    gapless
    error={typeof errorAmount === 'string' ? $_(errorAmount) : false}>
    <Button on:click={() => setMax()} outline>{$_('Max')}</Button>
    <Input
      required
      number
      min="0"
      step="any"
      on:input={() => {
        allBalance = false;
        calculateFee();
      }}
      id="sending-tx-amount" />
  </Field>
  <div class="sending-tx-total-wrapper">
    <div id="sending-tx-fee">{$_('Fee')} ~ {fee}</div>
    <div id="sending-tx-total">{$_('Total')} {total}</div>
  </div>
  <Field label={$_('Message')}>
    <Input id="sending-tx-message" />
  </Field>
  <div class="flex-row flow-buttons">
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      on:click={() => cancelTransaction()}>
      {$_('Cancel')}
    </Button>
    <Button
      id="save-btn"
      class="button__solid button__primary"
      {disabled}
      on:click={() => confirmTransaction()}>
      {$_('Confirm')}
    </Button>
  </div>
</div>
