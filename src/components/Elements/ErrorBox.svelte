<script>
  export let error, header, buttonText, buttonAction;
  import { Icon, Button } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  /* Icons https://materialdesignicons.com/ */
  import { mdiAlert } from "@mdi/js";
</script>

<style>
  .errorbox {
    display: flex;
    flex-direction: column;
    background: var(--color-black);
    color: var(--color-white);
    box-shadow: var(--box-shadow-2);
    -webkit-box-shadow: var(--box-shadow-2);
    -moz-box-shadow: var(--box-shadow-2);
    width: 40rem;
    min-height: 20rem;
    height: fit-content;
    padding: 2rem;
    border-radius: 2rem;
    margin-top: auto;
    margin-bottom: auto;
  }

  .header-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header {
    margin: 0;
  }

  .message {
    flex-grow: 1;
  }
</style>

<div class="errorbox">
  <div class="header-box">
    <Icon src={mdiAlert} size="2" color="var(--color-warning)" />
    <h6 class="header">{$_(header)}</h6>
  </div>
  <div class="message">
    {$_(error)}
  </div>
  <div class="buttons">
    <Button class="button__solid" on:click={() => buttonAction()}>
      {$_(buttonText)}
    </Button>
  </div>
</div>
