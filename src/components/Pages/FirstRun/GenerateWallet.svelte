<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";
  import { Icon, Button } from "svelte-chota";

  /* Icons https://materialdesignicons.com/ */
  import { mdiCheck } from "@mdi/js";

  import "../../../common/fileSaver.js";

  //Stores
  import { steps, settingsStore, accountStore } from "../../../common/stores.js";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { changeStep } = getContext("functions");

  export let newAccount = false;

  let message = "Creating keys";
  let seed;
  let consent = false;

  let allAccounts = [];

  const getAllAccounts = () => {
    browser.runtime
      .sendMessage({
        type: "getAllAccounts",
        data: ["address"],
      })
      .then((result) => {
        allAccounts = result;
      })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  onMount(() => {
    getAllAccounts();
    steps.update((current) => {
      current.currentStep = newAccount ? 0 : 2;
      return current;
    });

    new Promise(function (resolve, reject) {
      setTimeout(() => {
        createStartingWallet(resolve);
      }, 1500);
    }).then((res) => {
      steps.update((current) => {
        current.currentStep = newAccount ? 1 : 3;
        return current;
      });
    });
  });

  const deploy = () => {
    changeStep(newAccount ? 1 : 4);
  };

  const createStartingWallet = (resolve) => {
    browser.runtime
      .sendMessage({ type: "addNewAccount", data: `Account ${allAccounts.length+1}` })
      .then((result) => {
        if (result.error) {
          message = result.error;
        } else {
          if (result.added) {
            settingsStore.setLastChangeDate();
            seed = result.seed;
            accountStore.changeAccount(result.account);
            resolve();
          }
          message = result.reason;
        }
      })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
  };

  const print = () => {
    const printWindow = window.open(
      "about:blank",
      "Print" + new Date().getTime(),
      "left=50000,top=50000,width=0,height=0"
    );
    printWindow.document.write(seed);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const saveAsFile = () => {
    const file = new window.File([seed], "XTON wallet seed.txt", {
      type: "text/plain;charset=utf-8",
    });
    saveAs(file);
  };
  /*
  const sendOnEmail = () => {
    window.open("mailto:changemeplease@email.com?subject=My seed phrase&body=" + seed);
  };
  */
</script>

<style>
  .check-wrapper {
    display: flex;
    text-align: center;
    border: 2px solid var(--color-black);
    border-radius: 50%;
    width: 15rem;
    height: 15rem;
    margin: auto;
  }

  .seed {
    background-color: var(--color-black);
    color: var(--color-white);
    padding: 2rem;
    font-weight: bold;
    word-spacing: 1.35rem;
    text-align: center;
    line-height: 3rem;
  }

  .buttons-wrapper {
    display: inline-block;
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  :global(.buttons-wrapper .button__solid) {
    display: inline-block;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    {#if !seed}
      <Loading {message} />
    {:else}
      <div class="check-wrapper">
        <Icon src={mdiCheck} size="10" color="lime" />
      </div>
    {/if}
  </div>
  <div class="flex-column flow-content-right">
    {#if seed}
      <h6>{$_('Your seed phrase')}</h6>
      <p class="secondary-text" />
      <p />
      <div class="seed">{seed}</div>
      <div class="buttons-wrapper">
        <Button class="button__solid" on:click={print}>{$_('Print')}</Button>
        <Button class="button__solid" on:click={saveAsFile}>
          {$_('Save as file')}
        </Button>
        <!--
        <Button class="button__solid" on:click={sendOnEmail}>
          {$_('Send on email')}
        </Button>
        -->
      </div>
      <div class="consent flex-row">
        <label
          class="chk-container text-body2"
          class:checked={consent}
          class:unchecked={!consent}>
          {$_('I have saved in strong place')}
          <input type="checkbox" bind:checked={consent} />
          <span class="chk-checkmark" />
        </label>
      </div>
      <div class="flex-column">
        <Button
          class={`button__solid ${consent ? 'button__primary' : ''}`}
          disabled={!consent}
          on:click={() => deploy()}>
          {$_('Deploy wallet on blockchain')}
        </Button>
      </div>
    {/if}
  </div>
</div>
