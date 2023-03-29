<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";
  import { Field, Icon, Button } from "svelte-chota";

  /* Icons https://materialdesignicons.com/ */
  import { mdiCheck, mdiContentCopy } from "@mdi/js";

  //Stores
  import {
    steps,
    networksStore,
    currentNetwork,
    currentAccount
  } from "../../../common/stores.js";

  import { shortAddress, fromNano, copyToClipboard } from "../../../common/utils.js";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { changeStep } = getContext("functions");

  export let newAccount = false;

  let message         = "Deployment process";
  let error           = "";
  let deploying       = false;
  let deployed        = false;
  let giver           = false;
  let takingFromGiver = false;
  let balance         = 0;
  let server          = "localhost:7777";
  let allNetworks     = [];

  onMount(() => {
    steps.update((current) => {
      current.currentStep = (newAccount ? 1: 4);
      return current;
    });

    browser.runtime.sendMessage({ type: "getAllNetworks", data: {} })
    .then((result) => {
      allNetworks = result;
      const network = allNetworks.filter((item) => item.server == $currentNetwork.server)[0];
      giver = (network.giver != "");
      checkBalance();
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  });

  const changeNetwork = (networkValue)  => {
    const network = allNetworks.filter((item) => item.server == networkValue)[0];
    networksStore.changeNetwork(network);
    giver = (network.giver != "");
    checkBalance();
    browser.runtime
      .sendMessage({
        type: "changeNetwork",
        data: network,
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  const deployWallet = () => {
    message   = "Deployment process";
    deploying = true;
    browser.runtime.sendMessage({ type: "deployNewWallet", data: {"accountAddress": $currentAccount.address, "server": $currentNetwork.server} })
    .then((result) => {
      deploying = false;
      if (!result.success) {
        error = result.reason;
      } else {
        error = "";
        changeStep(newAccount ? 2: 5);
      }
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  };

  const skipThisStep = () => {
    changeStep(newAccount ? 2: 5);
  };

  const checkBalance = () => {
    browser.runtime.sendMessage({ type: "getCurrentBalance", data: {"accountAddress": $currentAccount.address, "server": $currentNetwork.server} })
    .then((result) => {
      balance = result;
    })
    .catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  };

  const takeFromGiver = () => {
    message = "Awaiting the transaction from the giver";
    takingFromGiver = true;
    browser.runtime.sendMessage({ type: "takeFromGiver", data: {"accountAddress": $currentAccount.address, "server": $currentNetwork.server} })
    .then((result) => {
      if (!result.added) {
        error = result.reason;
      } else {
        error = "";
        checkBalance();
        takingFromGiver = false;
      }
    })
    .catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  };

  const copyAddress = (event) => {
    copyToClipboard($currentAccount.address);
    const element = event.currentTarget;
    element.classList.toggle("fade-half");
    setTimeout(() => {
      element.classList.toggle("fade-half");
    }, 1000);
  };
</script>

<style>

</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    {#if deployed}
      <div class="check-wrapper">
        <Icon src={mdiCheck} size="10" color="lime" />
      </div>
    {/if}
    {#if takingFromGiver}
      <Loading message={message} />
    {/if}
  </div>
  <div class="flex-column flow-content-right">
    {#if deploying}
      <Loading message={message} />
    {:else}
      <Field label="{$_("Network")}" gapless style="width: 100%">
        <!-- svelte-ignore a11y-no-onchange -->
        <select on:change={(event) => changeNetwork(event.target.value)}>
          {#each allNetworks as network}
            <option selected={network.server == $currentNetwork.server} value={network.server}>{network.name}</option>
          {/each}
        </select>
        <Button disabled={balance == 0} primary on:click={() => deployWallet()}>{$_("Deploy")}</Button>
      </Field>
      <p>{$_("Deploy wallet instructions")}</p>
      <p>
        <Icon src={mdiContentCopy} class="copy-text" size="1.5" color="grey" on:click={(e) => copyAddress(e)}/>
        <span title="{$currentAccount.address}"> {shortAddress($currentAccount.address)} </span>
        <span> {$_("Balance")}: <b>{fromNano(balance)} {$currentNetwork.coinName}</b> </span>
      </p>
      {#if giver && balance == 0}
        <Button style="margin: 0 0 1rem;" class="button__solid" on:click={() => takeFromGiver()}>{$_("Take from giver")}</Button>
      {/if}
      {#if !giver}
        <Button style="margin: 0 0 1rem;" class="button__solid" on:click={() => checkBalance()}>{$_("Check balance")}</Button>
      {/if}
        <Button style="margin: 0 0 1rem;" class="button__solid" on:click={() => skipThisStep()}>{$_("Skip this step")}</Button>
      {#if error}
        <p class="text-warning">{error}</p>
      {/if}
    {/if}
  </div>
</div>
