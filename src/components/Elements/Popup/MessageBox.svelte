<script>
  import { getContext } from "svelte";

  //Components
  import { Components } from "../Components.svelte";

  const { Button } = Components;

  //Context
  const { getModalData } = getContext("app_functions");

  //Props
  export let message = getModalData();

  $: text = message.text;
  $: type = message.type;
  $: buttons = message.buttons;
</script>

<style>
  .message-box {
    align-items: center;
    min-width: 500px;
    background: inherit;
  }

  .message {
    align-items: flex-start;
    /*padding-top: 65px;*/
    /*margin: 1rem 0 2rem;*/
    margin: 3rem 0 0.5rem;
    width: 100%;
  }

  .icon {
    margin-right: 14px;
    min-width: 30px;
    margin-top: -4px;
  }

  .checkmark {
    min-width: 30px;
  }

  .buttons {
    padding: 42px 0;
    align-items: center;
  }
  h2 {
    margin: 0;
  }
</style>

<div class="message-box flex-column">
  <div class="message flex-row">
    {#if type === 'error'}
      <div id={'error'} class="icon">
        <img
          src="/assets/img/menu_icons/icon_error-circle.svg"
          alt="error circle" />
      </div>
    {/if}
    {#if type === 'caution'}
      <div id={'caution'} class="icon">
        <img src="/assets/img/menu_icons/icon_caution.svg" alt="caution" />
      </div>
    {/if}
    {#if type === 'success'}
      <div id={'success'} class="icon checkmark">
        <img
          src="/assets/img/menu_icons/icon_success_circle.svg"
          alt="success circle" />
      </div>
    {/if}
    <h2 id={'message-text'}>{text}</h2>
  </div>
  <div class="buttons flex-row">
    {#each buttons as button, index}
      <Button
        id={button.id}
        classes={button.class}
        width={button.width ? button.width : '232px'}
        margin={button.margin ? button.margin : '0 7px'}
        name={button.name}
        click={button.click} />
    {/each}
  </div>
</div>
