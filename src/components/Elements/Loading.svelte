<script>
  import { _, isLoading, locale } from "svelte-i18n";

  export let message = "";
  export let subMessage = "";
  export let mainStyle = "";
</script>

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
  }

  .lds-dual-ring {
    display: inline-block;
    width: 80px;
    height: 80px;
  }

  .lds-dual-ring:after {
    content: " ";
    display: block;
    width: 64px;
    height: 64px;
    margin: 8px;
    border-radius: 50%;
    border: 6px solid #2479b9;
    border-color: #2479b9 transparent #2479b9 transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }

  @keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .message {
    margin: 36px 0 0 0;
    max-height: 200px;
    overflow: auto;
  }
</style>

<div class="loading" style={mainStyle}>
  <div class="lds-dual-ring" />
  {#if message !== ''}
    <h3 class="message">{$isLoading || !$locale ? '...' : $_(message)}</h3>
  {/if}
  {#if subMessage !== ''}
    <p>{$isLoading || !$locale ? '...' : $_(subMessage)}</p>
  {/if}
</div>
