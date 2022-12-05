<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from 'svelte-i18n';

  //Stores
  import { steps, CURRENT_KS_PASSWORD } from "../../../common/stores.js";
  import { decrypt } from "../../../common/utils.js";
  import { Field, Input, Button } from "svelte-chota";

  //Context
  const { setKeys, changeStep, nextPage } = getContext("functions");

  //DOM nodes
  let formObj, pwd, pwdHint;

  //Props
  export let file;
  export let keystoreFile;

  new Promise((resolve) => {
    CURRENT_KS_PASSWORD.subscribe((value) => {
      resolve(value);
    });
  }).then((ks_password) => {
    return keystoreFile.hint === "" ? "" : decrypt(ks_password, keystoreFile.hint);
  }).then((hint) => {
    pwdHint = hint;
  });

  onMount(() => {
    steps.update((current) => {
      current.currentStep = 2;
      return current;
    });
    pwd = document.getElementById("pwd-input");
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        const decrypted = await decrypt(pwd.value, keystoreFile.data);
        setKeys(decrypted);
        nextPage();
      }
    } catch(e) {
      pwd.setCustomValidity("Incorrect keyStore password");
      pwd.reportValidity();
    }
  };

  const refreshValidity = (e) => {
    e.detail.target.setCustomValidity("");
  };

  const refreshValidityKeyup = (e) => {
    if (e.detail.keyCode !== 13) {
      pwd.setCustomValidity("");
    }
  };
</script>

<style>
  .caption-box {
    margin-bottom: 16px;
  }

  .hide {
    display: none;
  }

  .caption-box.text-caption {
    text-align: left;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Keystore file confirmed")}</h6>

    <div class="flow-text-box text-body1 text-primary">
      {$_("Enter your keystore file password.")}
    </div>

    <div class="caption-box text-caption text-secondary">
      <strong>{$_("last modified date")}:</strong>
      <div id="last-modified" class="text-secondary">
        {file.lastModifiedDate}
      </div>
    </div>

    <div
      class="caption-box text-caption text-secondary"
      class:hide={pwdHint === ''}>
      <div><strong>{$_("Password hint")}</strong></div>
      <div id="pwd-hint" class="text-secondary">{pwdHint}</div>
    </div>

    <form
      id="password-form"
      on:submit|preventDefault={() => handleSubmit()}
      target="_self"
      bind:this={formObj}>
      <div class="input-box">
        <Field label="{$_("Keystore password")}">
          <Input
            password
            id="pwd-input"
            on:changed={refreshValidity}
            on:keyup={refreshValidityKeyup}
            required={true}
            autofocus={true} />
        </Field>
      </div>
    </form>
    <div class="flex-column flow-buttons">
      <Button
        id="pwd-btn"
        form="password-form"
        class="button__solid button__primary submit-button submit-button-text submit"
        submit=true>
        {$_("Confirm password")}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right" />
</div>
