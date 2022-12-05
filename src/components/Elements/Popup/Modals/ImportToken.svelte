<script>
  import { onMount, getContext, afterUpdate } from "svelte";
  import { _ } from "svelte-i18n";
  import Select from "../../Select";

  //Components
  import { Button, Field, Input, Icon, Row, Col } from "svelte-chota";

  export let modalData = {};

  /* Icons https://materialdesignicons.com/ */
  import { mdiAlert } from "@mdi/js";

  //Stores
  import { currentNetwork, ASSET_TYPES } from "../../../../common/stores.js";

  import {
    sendRequestReject,
    sendRequestResolve,
  } from "../../../../common/utils.js";

  let disabled,
    loading = false;

  let tokenAddress, tokenSymbol, tokenDecimals, tokenType, tokenName, tokenIcon;

  //Context
  const { closeModal, openModal } = getContext("app_functions");

  const cancelModal = () => {
    closeModal();
  };

  let complexItems = [];
  let famousTokens = [];
  let typeName = {"74": "Jetton"};
  const loadFamousTokenList = () => {
    browser.runtime
      .sendMessage({
        type: "getFamousTokens",
        data: $currentNetwork.server,
      })
      .then((result) => {
        complexItems = [];
        famousTokens = result;
        for (let i in result) {
          complexItems.push({
            value: result[i].address,
            label: `<span title="${result[i].name}"><img src="${
              result[i].icon
            }" /> ${result[i].symbol} ${typeName[result[i].type]}</span>`,
            group: result[i].type,
          });
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  onMount(() => {
    tokenAddress = document.getElementById("token-address");
    tokenSymbol = document.getElementById("token-symbol");
    tokenDecimals = document.getElementById("token-decimals");
    tokenName = document.getElementById("token-name");
    tokenIcon = document.getElementById("token-icon");
    tokenType = document.getElementById("token-type");
    if (modalData.id) {
      const params = modalData.params;
      if (params.address) {
        tokenAddress.dataset.value = params.address;
        tokenAddress.value = params.address;
      }
      if (params.symbol) {
        tokenSymbol.value = params.symbol;
      }
      if (params.decimals) {
        tokenDecimals.value = params.decimals;
      }
      if (params.name) {
        tokenName.value = params.name;
      }
      if (params.icon) {
        tokenIcon.value = params.icon;
      }
      if (params.type) {
        tokenType.value = params.type;
      }
    }
    loadFamousTokenList();
  });

  const cancelImportToken = () => {
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const importToken = () => {
    loading = true;
    disabled = true;
    browser.runtime
      .sendMessage({
        type: "importToken",
        data: {
          server: $currentNetwork.server,
          name: tokenName.value,
          address: tokenAddress.dataset.value,
          symbol: tokenSymbol.value,
          decimals: tokenDecimals.value,
          icon: tokenIcon.value,
          type: tokenType.value,
        },
      })
      .then((result) => {
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        if (modalData.id) {
          sendRequestResolve(modalData.id, {
            code: 4000,
            data: "The asset was added",
          });
        }
      })
      .catch((e) => {
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        if (modalData.id) {
          sendRequestResolve(modalData.id, {
            code: 4300,
            message: "Some problem has happened. The asset was not added.",
          });
        }
      });
  };

  const validateTokenAddressSelect = (event) => {
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
      tokenAddress.dataset.value = event.detail.value;
      famousTokens.map((item) => {
        if (item.address == event.detail.value) {
          tokenSymbol.value = item.symbol;
          tokenDecimals.value = item.decimals;
          tokenName.value = item.name;
          tokenIcon.value = item.icon;
          tokenType.value = item.type;
        }
      });
    } else {
      disabled = true;
    }
  };

  const validateTokenAddress = (event) => {
    const rawAddress = new RegExp(/-?[0-9]{0,10}:[a-fA-F0-9]{64}/);
    const base64Address = new RegExp(/[_\-\/\+a-zA-Z0-9]{48}/);
    if (
      new String(tokenAddress.value).match(rawAddress) ||
      new String(tokenAddress.value).match(base64Address)
    ) {
      disabled = false;
      tokenAddress.dataset.value = tokenAddress.value;
      browser.runtime
        .sendMessage({
          type: "getTokenInfo",
          data: {
            server: $currentNetwork.server,
            tokenAddress: tokenAddress.dataset.value,
          },
        })
        .then((result) => {
          if (typeof result.symbol != "undefined") {
            tokenSymbol.value = result.symbol;
            tokenDecimals.value = result.decimals;
            tokenName.value = result.name;
            tokenIcon.value = result.icon;
            tokenType.value = result.type;
            //result.totalSupply
          }
        })
        .catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error));
        });
    } else {
      disabled = true;
    }
  };

</script>

<style lang="scss">
  :global(.token-address-wapper .item img),
  :global(.token-address-wapper .selectedItem img) {
    height: 24px;
    vertical-align: text-bottom;
  }
  :global(.token-address-wapper .selectedItem) {
    max-width: 25rem;
  }
  .import-token-header {
    margin-left: 2rem;
  }
  .import-token-wrapper {
    max-height: 35rem;
    overflow: hidden;
    .import-token-wrapper-scroll {
      max-height: 35rem;
      overflow-y: auto;
      width: calc(100% + 20px);
      .import-token-wrapper-internal {
        width: fit-content;
        margin-left: 2rem;
      }
    }
  }

</style>

<div class="flex-column">
  <h6 class="import-token-header">{$_('Import token')}</h6>
  <div class="import-token-wrapper">
    <div class="import-token-wrapper-scroll">
      <div class="import-token-wrapper-internal">
        <Field label={$_('Address')}>
          <div class="token-address-wapper">
            <Select
              id="token-address"
              items={complexItems}
              required
              placeholder={$_('Select or enter a new one') + '...'}
              noOptionsMessage={$_('No matches')}
              on:select={validateTokenAddressSelect}
              on:clear={validateTokenAddressSelect}
              on:keyup={validateTokenAddress} />
          </div>
        </Field>
        <Field label={$_('Symbol')}>
          <Input required id="token-symbol" />
        </Field>
        <Field label={$_('Name')}>
          <Input required id="token-name" />
        </Field>
        <Field label={$_('Type')}>
          <select id="token-type">
            {#each Object.keys(ASSET_TYPES) as index}
              <option value={index}>{ASSET_TYPES[index]}</option>
            {/each}
          </select>
        </Field>
        <Field label={$_('Decimals of precision')}>
          <Input required number min="0" step="1" id="token-decimals" />
        </Field>
        <Field label={$_('Icon')}>
          <Input required id="token-icon" />
        </Field>
        <div class="flex-row flow-buttons">
          <Button
            id="cancel-btn"
            class="button__solid button__secondary"
            {disabled}
            on:click={() => cancelImportToken()}>
            {$_('Cancel')}
          </Button>
          <Button
            id="grant-btn"
            class="button__solid button__primary"
            {loading}
            on:click={() => importToken()}>
            {$_('Import')}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
