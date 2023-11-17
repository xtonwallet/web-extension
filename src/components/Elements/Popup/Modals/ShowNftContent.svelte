<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  //Components
  import { Button } from "svelte-chota";

  //Stores
  import {
    currentNetwork,
  } from "../../../../common/stores.js";

  import {
    shortAddress,
    unbounceble,
  } from "../../../../common/utils.js";

  import "../../../../common/fileSaver.js";

  export let modalData = {};
  export let closeModal;

  let name = `${$_("Loading")}...`;
  let description = `${$_("Loading")}...`;
  let image = "";
  let owner = "";
  let attributes = [];
  onMount(() => {
    browser.runtime
      .sendMessage({
        type: "getNftContent",
        data: { server: $currentNetwork.server, address: modalData.data.address },
      })
      .then((result) => {
        if (result) {
          name = result.name;
          description = result.description;
          image = result.image;
          owner = result.owner;
          attributes = result.attributes;
        }
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  });

  const viewAddressOnExplorer = (explorer, address) => {
    browser.tabs.create({
      url: `${explorer}/address/${unbounceble(address, $currentNetwork.server != "mainnet")}`,
    });
  };

  const cancelModal = () => {
    closeModal();
  };

</script>

<style lang="scss">
  .nft-content-wrapper {
    max-height: 35rem;
    overflow: hidden;
    .nft-content-wrapper-scroll {
      max-height: 35rem;
      overflow-y: auto;
      width: calc(100% + 20px);
    }
  }

  .nft-placeholder {
    margin: 0 auto;
    width: 293px;
    height: 293px;
    background-color: #0088CC;
  }

  @keyframes nft-placeHolderShimmer{
    0%{
      background-position: -468px 0
    }
    100%{
      background-position: 468px 0
    }
  }

  .nft-animated-background {
    animation-duration: 1.25s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: nft-placeHolderShimmer;
    animation-timing-function: linear;
    background: #0088CC;
    background: linear-gradient(to right, #0088CC 10%, #07A0EC 18%, #0088CC 33%);
    background-size: 800px 104px;
    height: 293px;
    position: relative;
  }

  .attributes {
    display: flex;
    flex-wrap: wrap;
  }

  .attributes-trait {
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid var(--color-primary);
    width: 45%;
    box-sizing: border-box;
    margin: 1%;
    font-size: 1.2rem;
  }

  .attributes-trait-type {
    font-weight: 700;
  }
  
  .attributes-trait-value {
    font-style: normal;
  }
</style>

<div class="flex-column">
  <div class="nft-content-wrapper">
    <div class="nft-content-wrapper-scroll">
      <div class="nft-content-wrapper-internal">
        <p class="header">
          {name}
        </p>
        <div class="flex-row flex-center-center">
          <div class="nft-placeholder">
            {#if image != ""}
              <img src={image} title="{$_("NFT content")}" alt="{$_("NFT content")}"/>
            {:else}
              <div class="nft-animated-background"></div>
            {/if}
          </div>
        </div>
        <p class="description">
          {description}
        </p>
        <p class="owner">
          {$_("Owner")}
          <a on:click={() => {viewAddressOnExplorer($currentNetwork.explorer, unbounceble(owner, $currentNetwork.server != "mainnet"));}} href={"#"}>
            <span title={unbounceble(owner, $currentNetwork.server != "mainnet")}>
              {shortAddress(unbounceble(owner, $currentNetwork.server != "mainnet"))}
            </span>
          </a>
        </p>
        <div class="flex-row attributes">
          {#each attributes as item}
            <div class="attributes-trait">
              <div class="attributes-trait-type">{item.trait_type}</div>
              <div class="attributes-trait-value">{item.value}</div>
            </div>
          {/each}
        </div>
        <div class="flex-row flow-buttons">
          <Button
            id="cancel-btn"
            class="button__solid button__secondary"
            on:click={() => cancelModal()}>
            {$_('Close')}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
