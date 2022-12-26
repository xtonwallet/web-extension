<script>
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { _ } from "svelte-i18n";

  //Components
  import Pinpad from "../../Elements/Pinpad.svelte";
  import Logo from "../../Elements/Logo.svelte";
  import { Field, Input, Button } from "svelte-chota";

  //DOM nodes
  let formObj;

  export let loaded;
  export let enabledPinPad = false;

  const handleSubmit = (event) => {
    if (formObj.checkValidity()) {
      browser.runtime
      .sendMessage({ type: "unlockWallet", data: {"type": "password", "value": document.getElementById("pwd-input").value } })
      .then((unlocked) => {
        if (!unlocked || browser.runtime.lastError) {
          setValidity(document.getElementById("pwd-input"), $_("Incorrect password"));
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
    }
    event.preventDefault();
  };

  const setValidity = (node, message) => {
    node.setCustomValidity(message);
    node.reportValidity();
  };

  const refreshValidityKeyup = (e) => {
    if (e.detail.keyCode !== 13) {
      setValidity(document.getElementById("pwd-input"), "");
    }
  };

  let pinCode;
  let pinCodeError;
  const handlePinPadSubmit = () => {
    browser.runtime
    .sendMessage({ type: "unlockWallet", data: {"type": "pincode", "value": pinCode}})
    .then((unlocked) => {
      if (!unlocked || browser.runtime.lastError) {
        pinCodeError = "Incorrect pin code";
        pinCode = "";
      }
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
  };
</script>

<style>
  .layout {
    display: flex;
    flex-direction: column;
  }

  .layout-width {
    width: 100%;
  }

  .content {
    flex-grow: 1;
  }

  .header {
    display: flex;
    flex-direction: row;
    position: absolute;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
    right: 0;
    height: 6rem;
    border-bottom: 1px solid var(--divider-light);
  }

  .heading {
    margin-bottom: 16px;
  }

  .lockscreen {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 16px 24px 0 24px;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 480px) {
    .lockscreen {
      width: 315px;
    }
  }
</style>

<div class="layout" class:layout-padding={loaded} class:layout-width={!loaded}>
  <div class="header">
    <Logo />
  </div>
  <div class="content">
    {#if enabledPinPad}
      <div class="lockscreen" in:fly={{ delay: 100, duration: 300, x: 0, y: -400, opacity: 0, easing: quintOut }}>
        <Pinpad on:submit={handlePinPadSubmit} pinCodeMaxLength=8 bind:pinCode={pinCode} bind:pinCodeError={pinCodeError}/>
      </div>
    {:else}
      <div class="lockscreen" in:fly={{ delay: 100, duration: 300, x: -200, y: 0, opacity: 0, easing: quintOut }}>
        <h6 class="heading">{$_('Unlock')}</h6>
        <div class="flow-text-box text-body1">{$_('Access your wallet')}</div>

        <form bind:this={formObj} autocomplete="off">
          <Field label={$_('Password')}>
            <Input
              id="pwd-input"
              on:input={() => setValidity(document.getElementById("pwd-input"), '')}
              on:keyup={refreshValidityKeyup}
              password
              autofocus={true}
              required={true} />
          </Field>
          <Button
            id="login-btn"
            on:click={(event) => handleSubmit(event)}
            class="button__solid button__primary submit submit-button submit-button-text">
            {$_('Unlock')}
          </Button>
        </form>
      </div>
    {/if}
  </div>
</div>
