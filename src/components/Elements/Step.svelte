<script>
  //Stores
  import { steps } from "../../common/stores.js";
  import { Icon } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  /* Icons https://materialdesignicons.com/ */
  import { mdiCheck } from "@mdi/js";

  //Props
  export let stepInfo;
  export let first;
  export let last;

  $: complete = $steps.currentStep > stepInfo.number;
  $: current = $steps.currentStep === stepInfo.number;
</script>

<style>
  .step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20rem;
  }

  .first:after {
    content: "";
    width: 20rem;
    border-bottom: 1px solid var(--outline);
    position: absolute;
    top: 16px;
    left: 1rem;
    z-index: -1;
  }

  .middle:before {
    content: "";
    width: 20rem;
    border-bottom: 1px solid var(--outline);
    position: absolute;
    top: 16px;
    left: 0px;
    z-index: -1;
  }
/*
  .middle:after {
    content: "";
    width: 20rem;
    border-bottom: 1px solid var(--outline);
    position: absolute;
    top: 16px;
    left: 80px;
    z-index: -1;
  }
*/
  .last:before {
    content: "";
    width: 20rem;
    border-bottom: 1px solid var(--outline);
    position: absolute;
    top: 16px;
    left: 0px;
    z-index: -1;
  }

  .number-box {
    display: flex;
    text-align: center;
    height: 24px;
    width: 24px;
    border: 2px solid var(--color-black);
    background: var(--bg-secondary);
    border-radius: 20px;
    margin-bottom: 4px;
  }

  .number {
    color: var(--font-secondary);
    margin: auto;
  }

  .current {
    filter: brightness(175%);
  }

  .done {
    background: var(--color-success);
  }

  div.text-body1,
  div.text-body2 {
    text-align: center;
    width: 100%;
  }
</style>

<div class="step" class:middle={!first && !last} class:first class:last>
  <div
    class="number-box"
    class:current={current || complete}
    class:done={complete}>
    <div class="number text-subtitle2 text-black">
      {#if complete}
        <span><Icon src={mdiCheck} size="1.5" color="black" /></span>
      {:else}
        <span>{stepInfo.number}</span>
      {/if}
    </div>
  </div>
  <div
    class="text-body1"
    class:text-secondary={!complete && !current}
    class:text-primary={complete || current}>
    {$_(stepInfo.name)}
  </div>
  <div class="text-body2 text-secondary">{$_(stepInfo.desc)}</div>
</div>
