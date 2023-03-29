<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";
  import Select from "../../Select";

  //Components
  import { Button, Field, Input } from "svelte-chota";

  export let modalData = {};
  export let closeModal;

  //Stores
  import { currentNetwork, ASSET_TYPES } from "../../../../common/stores.js";

  import {
    sendRequestReject,
    sendRequestResolve,
  } from "../../../../common/utils.js";

  let disabled,
    loading = false;

  let currentTokenType = 74;
  let tokenAddress, tokenSymbol, tokenDecimals, tokenType, tokenItemIndex, tokenName, tokenIcon, tokenDescription, tokenExternalLink;

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
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  onMount(() => {
    tokenAddress = document.getElementById("token-address");
    tokenSymbol = document.getElementById("token-symbol");
    tokenDecimals = document.getElementById("token-decimals");
    tokenName = document.getElementById("token-name");
    tokenDescription = document.getElementById("token-description");
    tokenExternalLink = document.getElementById("token-external-link");
    tokenIcon = document.getElementById("token-icon");
    tokenType = document.getElementById("token-type");
    tokenItemIndex = document.getElementById("token-item-index");
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
      if (params.description) {
        tokenDescription.value = params.description;
      }
      if (params.externalLink) {
        tokenExternalLink.value = params.externalLink;
      }
      if (params.icon) {
        tokenIcon.value = params.icon;
      }
      if (params.type) {
        currentTokenType = params.type; 
        tokenType.value = params.type;
      }
      if (params.itemIndex) {
        tokenItemIndex.value = params.itemIndex;
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
          itemIndex: tokenItemIndex.value,
          description: tokenDescription.value,
          externalLink: tokenExternalLink.value,
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
          currentTokenType = 74;
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
          if (result.type == 74 && typeof result.symbol != "undefined") {
            currentTokenType = result.type;
            tokenSymbol.value = result.symbol;
            tokenDecimals.value = result.decimals;
            tokenName.value = result.name;
            tokenIcon.value = result.icon;
            tokenType.value = result.type;
            //result.totalSupply
          }
          if (result.type == 64 && typeof result.name != "undefined") {
            currentTokenType = result.type;
            tokenName.value = result.name;
            tokenDescription.value = result.description;
            tokenExternalLink.value = result.externalLink;
            tokenIcon.value = result.image;
            tokenType.value = result.type;
            tokenItemIndex.value = result.itemIndex;
            //result.itemsCount
          }          
        })
        .catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error.message));
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

  :global(.page .import-token-wrapper) {
    max-height: 35rem;
    overflow: hidden;
    .import-token-wrapper-scroll {
      max-height: 35rem;
      overflow-y: auto;
      width: calc(100% + 20px);
      .import-token-wrapper-internal {
        width: fit-content;
        margin-left: 0rem;
      }
    }
  }

  @media (min-width: 480px) {
    :global(.page .import-token-wrapper) {
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
        <span class:hidden="{currentTokenType == 74}">
          <Field label={$_('Item index')}>
            <Input required id="token-item-index" />
          </Field>
        </span>
        <span class:hidden="{currentTokenType == 64}">
          <Field label={$_('Symbol')}>
            <Input required id="token-symbol" />
          </Field>
        </span>
        <Field label={$_('Name')}>
          <Input required id="token-name" />
        </Field>
        <span class:hidden="{currentTokenType == 74}">
          <Field label={$_('Description')}>
            <Input required id="token-description" />
          </Field>
        </span>
        <span class:hidden="{currentTokenType == 74}">
          <Field label={$_('External link')}>
            <Input required id="token-external-link" />
          </Field>
        </span>
        <Field label={$_('Type')}>
          <select id="token-type" on:change={(event) => {currentTokenType = Number(event.target.value).valueOf();}}>
            {#each Object.keys(ASSET_TYPES) as index}
              {#if currentTokenType == index}
                  <option selected value={index}>{ASSET_TYPES[index]}</option>
                {:else}
                  <option value={index}>{ASSET_TYPES[index]}</option>
              {/if}
            {/each}
          </select>
        </Field>
        <span class:hidden="{currentTokenType == 64}">
          <Field label={$_('Decimals of precision')}>
            <Input required number min="0" step="1" id="token-decimals" />
          </Field>
        </span>
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
