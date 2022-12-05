<script>
  import { setContext, getContext } from "svelte";
  import { _ } from 'svelte-i18n';

  //Components
  import GenerateWallet from "../FirstRun/GenerateWallet.svelte";
  import DeployWallet from "../FirstRun/DeployWallet.svelte";
  import Finishing from "../FirstRun/Finishing.svelte";

  import Steps from "../../Elements/Steps.svelte";
  import Step from "../../Elements/Step.svelte";
  import Logo from "../../Elements/Logo.svelte";

  let currentStep = 0;
  let restore = false;
  let newAccount = true;

  setContext("functions", {
    nextPage: () => (currentStep = currentStep + 1),
    changeStep: (step) => {
      if (step === 0 && currentStep === 0) {
        currentStep = 0;
      } else if (step === 0) {
        currentStep = back;
      } else {
        currentStep = step;
      }
    },
    done: () => {}, //for compatibility
  });

  let steps = [
    { page: GenerateWallet, hideSteps: false, back: 0 },
    { page: DeployWallet, hideSteps: false, back: 0 },
    { page: Finishing, hideSteps: false, back: 0 },
  ];

  $: currentPage = steps[currentStep].page;
  $: hideSteps = steps[currentStep].hideSteps;
  $: back = steps[currentStep].back;
  $: hideBack = steps[currentStep].hideBack ? false : true;
</script>

<div class="flow-layout">
  <div class="flow-header">
    <Logo />
  </div>
  <div class="flow-content">
    <svelte:component this={currentPage} {restore} {newAccount} />
  </div>
  <div class="flow-steps">
    <Steps {back} {hideBack} />
  </div>

  <div class="flow-footer">
    <a
      class="text-link text-caption text-secondary"
      href="https://xtonwallet.com"
      target="_blank"
      rel="noopener noreferrer">
      {$_("Learn more about this wallet app")}
    </a>
  </div>
</div>
