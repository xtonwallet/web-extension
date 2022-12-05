<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from 'svelte-i18n';
  import { Field, Input, Button } from "svelte-chota";

  //Stores
  import { steps } from "../../../common/stores.js";

  //Components
  import StrongPassword from "../../Elements/StrongPassword.svelte";

  //Context
  const { changeStep } = getContext("functions");

  //DOM NODES
  let formField, pwdInput1, pwdInput2;

  //PROPS
  export let restore = false;

  let pattern = `(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\|,.<>\\/? ]).{10,}`;
  let pwd = "";

  onMount(() => {
    if (restore) {
      steps.set({
        currentStep: 1,
        stepList: [
          { number: 1, name: "Wallet password", desc: "Make it good" },
          { number: 2, name: "Upload", desc: "Keystore file" },
          { number: 3, name: "Unlock", desc: "Keystore password" },
          { number: 4, name: "Restore", desc: "Make your choice" },
          { number: 5, name: "Complete", desc: "Process end" },
        ],
      });
    } else {
      steps.set({
        currentStep: 1,
        stepList: [
          { number: 1, name: "Password", desc: "Make it good" },
          { number: 2, name: "Consent", desc: "Agree to terms" },
          { number: 3, name: "Creating keys", desc: "Ensure to save" },
          { number: 4, name: "Deployment", desc: "On blockchain" },
          { number: 5, name: "Complete", desc: "Process end" },
        ],
      });
    }
    pwdInput1 = document.getElementById("pwd1");
    pwdInput2 = document.getElementById("pwd2");
  });

  const formValidation = () => {
    pwdInput2.setCustomValidity("");
    if (formField.checkValidity()) {
      if (pwdInput1.value === pwdInput2.value) {
        savePassword();
      } else {
        pwdInput2.setCustomValidity("Passwords do not match");
        pwdInput2.reportValidity();
      }
    }
  };

  const pwd1Validity = () => {
    pwdInput1.checkValidity();
    pwdInput1.reportValidity();
  };

  const pwd2Validity = () => {
    pwdInput2.checkValidity();
    pwdInput2.reportValidity();
  };

  const savePassword = () => {
    browser.runtime.sendMessage(
      { type: "createPassword", data: pwdInput1.value }
    ).then((response) => {
      if (response) {
        if (restore) {
          changeStep(1);
        } else {
          changeStep(2);
        }
      } else {
        throw new Error("Could not create password in browser storage");
      }
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
  };
</script>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Create a password")}</h6>
    <div class="flow-text-box text-body1">
      {$_("This password never changes so use a strong one that you'll remember. We recommend to use for storing")}
      <a
        class="text-link"
        href="https://keepass.info/"
        rel="noopener noreferrer"
        target="_blank">
        Keepass</a>.
    </div>

    <StrongPassword password={pwd} charLength={10} />

    <form
      id="password_form"
      class="flow-buttons"
      on:submit|preventDefault={() => {}}
      bind:this={formField}
      target="_self">
      <Field label="{$_("Password")}">
        <Input
          password
          id="pwd1"
          on:input={(event) => {pwd = event.target.value; pwd1Validity();}}
          placeholder={$_("At least 10 symbols")}
          {pattern}
          required={true} />
      </Field>
      <Field label="{$_("Confirm password")}">
        <Input
          password
          id="pwd2"
          on:input={() => pwd2Validity()}
          placeholder={$_("At least 10 symbols")}
          required={true} />
      </Field>
    </form>
    <div class="buttons flex-column">
      <Button
        id="save-pwd"
        form="password_form"
        on:click={() => formValidation()}
        class="button__solid button__primary submit submit-button submit-button-text"
        >
        {$_("Save password")}
      </Button>
    </div>
  </div>
  <div class="flex-column flow-content-right" />
</div>
