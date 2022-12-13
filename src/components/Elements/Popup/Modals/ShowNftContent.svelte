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
  } from "../../../../common/utils.js";

  import "../../../../common/fileSaver.js";

  export let modalData = {};

  let name = `${$_("Loading")}...`;
  let description = `${$_("Loading")}...`;
  let image = "";
  let owner = "";
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
        }
      })
      .catch((e) => {
        console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
      });
  });

  const viewAddressOnExplorer = (explorer, address) => {
    browser.tabs.create({
      url: `${explorer}/address/${address}`,
    });
  };

  //Context
  const { closeModal } = getContext("app_functions");

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
          <a on:click={() => {viewAddressOnExplorer($currentNetwork.explorer, owner)}} href={"#"}>
            <span title={owner}>
              {shortAddress(owner)}
            </span>
          </a>
        </p>
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
