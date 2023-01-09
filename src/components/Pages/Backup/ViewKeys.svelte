<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button, Icon } from "svelte-chota";
  import { _ } from "svelte-i18n";
  /* Icons https://materialdesignicons.com/ */
  import { mdiCheck, mdiContentCopy } from "@mdi/js";

  //Stores
  import { steps } from "../../../common/stores.js";

  import {
    shortAddress,
    copyToClipboard,
    serializeBufferForStorage,
  } from "../../../common/utils.js";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { appHome } = getContext("app_functions");
  const { changeStep } = getContext("functions");

  //DOM Nodes
  let formObj;

  $: accounts = undefined;
  $: errorMsg = "";

  onMount(() => {
    browser.runtime
      .sendMessage({ type: "decryptKeys", data: {} })
      .then((accountKeys) => {
        if (typeof accountKeys === "undefined" || browser.runtime.lastError) {
          throw new Error("Unable to decrypt keys");
        } else {
          if (accountKeys === false) {
            errorMsg = "Incorrect password";
          } else {
            accounts = [...accountKeys];
            steps.update((current) => {
              current.currentStep = 2;
              return current;
            });
          }
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  });

  const copyText = (text) => {
    copyToClipboard(text);
    const element = event.currentTarget;
    element.classList.toggle("fade-half");
    setTimeout(() => {
      element.classList.toggle("fade-half");
    }, 1000);
  };

</script>

<style>
  .key-box {
    max-width: 820px;
    margin: 0 auto;
    max-height: calc(100vh - 15rem);
    overflow-y: auto;
  }

  .header {
    border-bottom: 2px solid var(--divider-light);
  }

  .header-name {
    width: 11rem;
  }

  .header-address {
    flex-grow: 1;
  }

  .key-row {
    align-items: center;
    border-bottom: 1px dashed var(--divider-dark);
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .key-info {
    display: flex;
    width: 10rem;
    height: 88px;
    margin-right: 16px;
    align-items: center;
    word-break: break-all;
    justify-content: center;
    align-items: flex-start;
    min-width: 10rem;
  }

  p.text-red {
    margin-left: 40px;
    padding: 10px 0;
  }

  p {
    margin: 0;
  }

  .key-text {
    line-break: anywhere;
    display: inline;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_('Decrypted account addresses')}</h6>

    <div class="flow-text-box text-body1">
      {$_('These are all the secret keys stored in your wallet')}
    </div>
    <div class="flex-column flow-buttons">
      <Button
        class="button__solid button__primary"
        style="margin: 0 0 1rem;"
        disabled={typeof accounts === 'undefined'}
        on:click={() => changeStep(2)}>
        {$_('Backup keys')}
      </Button>

      <Button
        class="button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => appHome()}>
        {$_('Back to home')}
      </Button>
    </div>
  </div>
  <div class="flow-content-right key-box" in:fade={{ delay: 0, duration: 200 }}>
    <div class="flex-row header text-subtitle2 text-primary">
      <p class="header-name">{$_('Nickname')}</p>
      <p class="header-address">{$_('Address/Keys')}</p>
    </div>
    {#if accounts}
      {#each accounts as account}
        <div class="flex-row key-row">
          <div class="flex-column key-info text-body3 ">
            <p class="nickname text-secondary">{`${account.nickname}`}</p>
          </div>
          <div class="flex-column result-box text-body3 text-secondary">
            <div>
              {$_('Wallet address')}:
              <div>
                <Icon
                  src={mdiContentCopy}
                  class="copy-text"
                  size="1.5"
                  color="grey"
                  on:click={() => copyText(account.address)}
                  on:keyup={() => copyText(account.address)}
                  />
                <div class="key-text">{account.address}</div>
              </div>
            </div>
            <div>
              {$_('Public key')}:
              <div>
                <Icon
                  src={mdiContentCopy}
                  class="copy-text"
                  size="1.5"
                  color="grey"
                  on:click={() => copyText(account.keyPair.public)}
                  on:keyup={() => copyText(account.keyPair.public)}
                  />
                <div class="key-text">{account.keyPair.public}</div>
              </div>
            </div>
            <div>
              {$_('Secret key')}:
              <div>
                <Icon
                  src={mdiContentCopy}
                  class="copy-text"
                  size="1.5"
                  color="grey"
                  on:click={() => copyText(account.keyPair.secret)}
                  on:keyup={() => copyText(account.keyPair.secret)}
                  />
                <div class="key-text">{account.keyPair.secret}</div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
    {#if errorMsg !== ''}
      <div class="flex-row key-row">
        <p class="text-body2 text-red">{errorMsg}</p>
      </div>
    {/if}
  </div>
</div>
