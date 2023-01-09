<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Field, Input, Button } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Stores
  import { steps, currentResolution, } from "../../../common/stores.js";

  //Components
  import StrongPassword from "../../Elements/StrongPassword.svelte";

  //Context
  const { changeStep, setKeystorePassword } = getContext("functions");

  //DOM Nodes
  let formField, pwdInput1, pwdInput2;
  let hint = "";
  let fullExport = false;

  let pattern = `(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\|,.<>\\/? ]).{10,}`;
  let pwd = "";
  let side = "left";

  onMount(() => {
    steps.set({
      currentStep: 1,
      stepList: [
        { number: 1, name: "Set password", desc: "Make it good" },
        { number: 2, name: "Generate file", desc: "Just a second" },
        { number: 3, name: "Download", desc: "Keep it safe" },
      ],
    });
    pwdInput1 = document.getElementById("pwd1");
    pwdInput2 = document.getElementById("pwd2");
  });

  const formValidation = (changeSide) => {
    if (side == "left") {
      pwdInput2.setCustomValidity("");
      if (formField.checkValidity()) {
        if (pwdInput1.value === pwdInput2.value) {
          if (!changeSide) {
            setKeystorePassword({
              password: pwdInput1.value,
              hint: hint,
              full: fullExport
            });
            changeStep(3);
          } else {
            side = "right";
          }
        } else {
          pwdInput2.setCustomValidity("Passwords do not match");
          pwdInput2.reportValidity();
        }
      }
      return false;
    }
    if (side == "right") {
      setKeystorePassword({
        password: pwd,
        hint: hint,
        full: fullExport
      });
      changeStep(3);
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

</script>

<style>
  .flow-content-right {
    display: flex;
    align-items: flex-start;
  }
  h6.warning {
    color: var(--color-warning);
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  {#if (side == "left")}
    <div class="flex-column flow-content-left">
      <h6>{$_('Keystore password')}</h6>

      <div class="flow-text-box text-body1">
        {$_('Keystore security')}
        <a
          class="text-link"
          href="https://keepass.info/"
          rel="noopener noreferrer"
          target="_blank">
          Keepass</a>.
      </div>

      <StrongPassword password={pwd} charLength={10} />

      <form
        id="password-form"
        class="inputs"
        on:submit|preventDefault={() => {}}
        bind:this={formField}
        target="_self"
        autocomplete="off">
        <Field label={$_('Password')}>
          <Input
            password
            id="pwd1"
            on:input={(event) => {
              pwd = event.target.value;
              pwd1Validity();
            }}
            placeholder={$_('At least 10 symbols')}
            {pattern}
            required={true} />
        </Field>
        <Field label={$_('Confirm password')}>
          <Input
            password
            id="pwd2"
            on:input={(event) => {
              pwd2Validity();
            }}
            placeholder={$_('At least 10 symbols')}
            {pattern}
            required={true} />
        </Field>
      </form>

      {#if ($currentResolution.innerWidth < 768 && side == "left")}
        <Button
          id="create-pw-btn"
          form="password-form"
          on:click={() => formValidation(true)}
          class="button__solid button__primary submit submit-button submit-button-text">
          {$_('Next')}
        </Button>
      {/if}
    </div>
  {/if}
  {#if ($currentResolution.innerWidth > 768 || side == "right")}
    <div class="flow-content-right" in:fade={{ delay: 0, duration: 200 }}>
      <h6 class="warning">
        {$_('Team is not responsible for lost or stolen passwords')}
      </h6>
      <Field label={$_('Password hint (Optional)')}>
        <Input
          bind:value={hint}
          placeholder={$_('Create a password hint')}
          {pattern} />
      </Field>
      <div>
        <label class="chk-container text-body2">
          {$_('Full export')}
          <input type="checkbox" bind:checked={fullExport} />
          <span class="chk-checkmark" />
        </label>
        <div class="flow-text-box text-body1">
          {$_('If you want to save all contracts added on accounts, all transactions related with accounts, then tick the checkbox.')}
        </div>
      </div>
      <div class="flex-column flow-buttons">
        <Button
          id="create-pw-btn"
          form="password-form"
          on:click={() => formValidation()}
          class="button__solid button__primary submit submit-button submit-button-text">
          {$_('Create keystore')}
        </Button>
      </div>
    </div>
  {/if}
</div>
