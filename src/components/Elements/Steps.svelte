<script>
  import { getContext } from "svelte";
  import { Icon } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  /* Icons https://materialdesignicons.com/ */
  import { mdiArrowLeft } from "@mdi/js";

  //Components
  import Step from "./Step.svelte";

  //Stores
  import { steps } from "../../common/stores.js";

  //Context
  const { changeStep } = getContext("functions");

  //Props
  export let back;
  export let hideBack;

  $: noSteps = $steps.stepList.length === 0;

  const goBack = () => {
    changeStep(back);
  };
</script>

<style>
  .steps {
    margin: 2rem 60px 0;
  }

  .back-box {
    padding-top: 8px;
  }

  .back-button {
    width: 56px;
    height: 16px;
    text-align: center;
  }

  :global(.back-box:hover .menu-icon) {
    fill: var(--font-accent);
  }

  .back-box:hover {
    color: var(--font-accent);
  }

  .back-box-wrapper {
    cursor: pointer;
    display: inherit;
    height: 2rem;
  }

  .hide {
    display: none;
  }
</style>

<div class="flex-row steps" class:hide={noSteps}>
  {#if hideBack}
    <div
      class="flex-row back-box"
      class:hide={$steps.currentStep >= $steps.stepList.length}
      on:click={() => goBack()}>
      <div class="back-box-wrapper">
        <Icon src={mdiArrowLeft} size="1.5" />
        <div class="back-button text-button">{$_("Back")}</div>
      </div>
    </div>
  {/if}
  {#each $steps.stepList as stepInfo, index}
    <Step
      {stepInfo}
      first={index === 0}
      last={index + 1 === $steps.stepList.length} />
  {/each}
</div>
