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
  import { Field, Button, Input, Col, Row } from "svelte-chota";

  export let modalData = {};
  export let closeModal;

  let to, amount, data, dataType, stateInit;
  let icon = "/assets/img/icon-crystal-128.png";
  let symbol = $currentNetwork.coinName;
  let title = $_("Native");
  let fee = 0;
  let balance = 0;
  let total = 0;
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
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  onMount(() => {
    to = document.getElementById("sending-tx-to");
    amount = document.getElementById("sending-tx-amount");
    data = document.getElementById("sending-tx-data");
    dataType = document.getElementById("sending-tx-dataType");
    stateInit = document.getElementById("sending-tx-stateInit");
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
            amount.value = fromNano(params.amount);
          }
          if (params.data) {
            data.value = params.data;
          }
          if (params.dataType) {
            dataType.value = params.dataType;
          }
          if (params.stateInit) {
            stateInit.value = params.stateInit;
          }
          if (params.to) {
            to.dataset.value = params.to;
            to.value = params.to;
            validateAddress({});
          }
          loadSelectAddressesList();
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

  const validateAddress = (event) => {
    const rawAddress = new RegExp(/-?[0-9]{0,10}:[a-fA-F0-9]{64}/);
    const base64Address = new RegExp(/[_\-\/\+a-zA-Z0-9]{48}/);
    if (
      new String(to.value).match(rawAddress) ||
      new String(to.value).match(base64Address)
    ) {
      disabled = false;
      to.dataset.value = to.value;
      calculateFee();
    } else {
      disabled = true;
    }
  };

  const calculateFee = () => {
    if (amount.value == "") {
      disabled = true;
      return;
    }
    let txData, maxBalance;
    maxBalance = balance;
    if (new BigNumber(amount.value).gt(maxBalance)) {
      amount.value = fromNano(maxBalance);
    }
    txData = {
      type: "sendRaw",
      params: {
        amount: amount.value,
        data: data.value,
        dataType: dataType.value,
        to: to.dataset.value,
        stateInit: stateInit.value,
      },
    };
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
        const maxBalance = balance;
        if (new BigNumber(toNano(amount.value) + toNano(fee)).gt(maxBalance)) {
          amount.value = fromNano(maxBalance - toNano(fee));
          total = fromNano(maxBalance);
        } else {
          total = fromNano(toNano(amount.value) + toNano(fee));
        }
        if (fee == 0) {
          disabled = true;
          errorAmount = "Amount can't be less than 0,001";
        } else {
          disabled = false;
          errorAmount = false;
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  const cancelRawTransaction = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const confirmRawTransaction = () => {
    let txData;
    txData = {
      type: "sendRaw",
      params: {
        to: to.dataset.value,
        amount: toNano(amount.value),
        data: data.value,
        dataType: dataType.value,
        stateInit: stateInit.value,
      },
    };
    if (modalData.id && modalData.params.valid_until) {
      txData.params.valid_until = modalData.params.valid_until;
    }
    openModal("ModalConfirmRawTransaction", {
      id: modalData.id,
      accountAddress: $currentAccount.address,
      server: $currentNetwork.server,
      fee: fee,
      txData: txData,
    });
  };

</script>

<style lang="scss">
  .token-logo {
    width: 2rem;
    height: 2rem;
    border: var(--color-black) dashed 1px;
    margin: 0rem;
    border-radius: 50%;
  }
  .token-symbol {
    font-size: 1rem;
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
    font-size: 1.25rem;
    font-weight: 700;
  }
  #sending-tx-total {
    font-size: 1.25rem;
    margin-left: 1rem;
  }
  .title {
    margin: 0px;
    font-weight: 700;
    font-size: 1.75rem;
  }
  .container {
    line-height: 1.3;
  }
  .send-raw-transaction-wrapper {
    max-height: 40rem;
    overflow: hidden;
    .send-raw-transaction-wrapper-scroll {
      max-height: 40rem;
      overflow-y: auto;
      width: calc(100% + 20px);
      .send-raw-transaction-wrapper-internal {
        width: fit-content;
        margin-left: 0rem;
        margin-right: 2rem;
      }
    }
  }
</style>

<div class="flex-column container">
  <h6 class="title text-center">{$_('Send raw transaction')}</h6>
  <div class="send-raw-transaction-wrapper">
    <div class="send-raw-transaction-wrapper-scroll">
      <div class="send-raw-transaction-wrapper-internal">
        <Field label={$_('Address')}>
          <Input
            id="sending-tx-to"
            required
            />
        </Field>
        <Field
          label={$_('Amount')}
          gapless
          error={typeof errorAmount === 'string' ? $_(errorAmount) : false}>
          <Row class="standard-order">
            <Col size="4" class="text-center is-marginless">
              <img alt="logo" class="token-logo" src={icon} />
              <div title="{title}" class="token-symbol">{symbol}</div>
            </Col>
            <Col class="is-marginless">
              <Input
                required
                number
                readonly
                min="0"
                step="any"
                on:input={() => {
                  calculateFee();
                }}
                id="sending-tx-amount" />
            </Col>
          </Row>
        </Field>
        <div class="sending-tx-total-wrapper">
          <div id="sending-tx-fee">{$_('Fee')} ~ {fee}</div>
          <div id="sending-tx-total">{$_('Total')} {total}</div>
        </div>
        <Field label={$_('Data')}>
          <Input id="sending-tx-data" readonly />
        </Field>
        <Field label={$_('Data type')} class="hidden">
          <Input id="sending-tx-dataType" readonly />
        </Field>
        <Field label={$_('State init')}>
          <Input id="sending-tx-stateInit" readonly />
        </Field>
        <div class="flex-row flow-buttons">
          <Button
            id="cancel-btn"
            class="button__solid button__secondary"
            on:click={() => cancelRawTransaction()}>
            {$_('Cancel')}
          </Button>
          <Button
            id="save-btn"
            class="button__solid button__primary"
            {disabled}
            on:click={() => confirmRawTransaction()}>
            {$_('Confirm')}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
