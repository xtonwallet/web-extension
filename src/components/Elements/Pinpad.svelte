<script>
  import { _ } from "svelte-i18n";
  import { Icon, Button } from "svelte-chota";

  export let pinCode = '';
  export let pinCodeError = '';
  export let pinCodeMinLength = 4;
  export let pinCodeMaxLength = 8;

  /* Icons https://materialdesignicons.com/ */
  import { mdiCloseBox, mdiLogin } from "@mdi/js";

	import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
	const select = num => () => {
    pinCodeError = '';
    if (pinCode.length <= pinCodeMaxLength) {
      pinCode += num
    }
  };
	const clear  = () => pinCode = '';
  const submit = () => dispatch('submit');

  $: pinCodeLimit = pinCode.length >= pinCodeMinLength && pinCode.length <= pinCodeMaxLength;
</script>

<style>
	.keypad {
		display: grid;
		grid-template-columns: repeat(3, 5em);
		grid-template-rows: repeat(4, 3em);
		grid-gap: 0.5em;
    justify-content: center;
    margin-bottom: 0.5em;
	}
  :global(.keypad .button:first-child) {
    margin-left: 1rem;
  }
  .heading {
    margin-top: 2rem;
  }
  .pincode-description {
    font-size: 1.35rem;
    padding: 1em;
  }
</style>

<div class="text-center">
  {#if pinCodeError == ''}
    <h6 class="heading">{pinCode ? pinCode.replace(/\d(?!$)/g, '•') : $_('Enter your pin code')}</h6>
    {:else}
    <h6 class="heading error">{$_(pinCodeError)}</h6>
  {/if}
  <div class="keypad">
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(1)}>1</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(2)}>2</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(3)}>3</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(4)}>4</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(5)}>5</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(6)}>6</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(7)}>7</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(8)}>8</Button>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(9)}>9</Button>

  	<Button icon={mdiCloseBox} error disabled={!pinCodeLimit} title="{$_('Clear')}" on:click={clear}/>
  	<Button disabled={pinCode.length == pinCodeMaxLength} on:click={select(0)}>0</Button>
  	<Button icon={mdiLogin} success disabled={!pinCodeLimit} title="{$_('Submit')}" on:click={submit}/>
  </div>
  <div class="pincode-description">{$_('Pin code contains 4-8 numbers. After 1 failed attempt it will be dropped. Login will be carried out through the password entry form. Pin code can be set up again on the settings page.')}</div>
</div>
