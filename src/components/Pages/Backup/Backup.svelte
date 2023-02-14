<script>
  import { setContext, getContext, onDestroy } from "svelte";

  //Stores
  import { currentResolution, } from "../../../common/stores.js";

  //Components
  import Steps from "../../Elements/Steps.svelte";
  import Logo from "../../Elements/Logo.svelte";

  import IntroBackup from "./IntroBackup.svelte";
  import ViewKeys from "./ViewKeys.svelte";
  import KeystorePassword from "./KeystorePassword.svelte";
  import KeystoreCreate from "./KeystoreCreate.svelte";
  import KeystoreComplete from "./KeystoreComplete.svelte";

  let currentStep = 0;
  let keystorePasswordInfo;
  let keystoreFile;
  let password;

  //Context
  const { switchPage } = getContext("app_functions");

  setContext("functions", {
    changeStep: (step) => {
      if (step === 0 && currentStep === 0) {
        switchPage("Backup");
      } else if (step === 0) {
        currentStep = back;
      } else {
        currentStep = step;
      }
    },
    setKeystorePassword: (info) => (keystorePasswordInfo = info),
    //getKeystorePW: () => {return keystorePasswordInfo},
    setKeystoreFile: (file) => (keystoreFile = file),
  });

  onDestroy(() => (password = ""));

  let steps = [
    { page: IntroBackup, hideSteps: true, back: 0 },
    { page: ViewKeys, hideSteps: true, back: 0 },
    { page: KeystorePassword, hideSteps: false, back: 0 },
    { page: KeystoreCreate, hideSteps: false, back: 3 },
    { page: KeystoreComplete, hideSteps: false, back: 0 },
  ];

  $: currentPage = steps[currentStep].page;
  $: hideSteps = steps[currentStep].hideSteps;
  $: back = steps[currentStep].back;
  $: hideBack = steps[currentStep].hideBack ? false : true;

</script>

<style>
  .hide-steps {
    display: none;
  }
  @media (max-width: 480px) {
    .flow-content {
      margin-top: -6rem;
    }
  }
</style>

<div class="flow-layout">
  {#if $currentResolution.innerWidth > 768 && !$currentResolution.condition}
    <div class="flow-header">
      <Logo />
    </div>
  {/if}
  <div class="flow-content">
    <svelte:component
      this={currentPage}
      {keystoreFile}
      {keystorePasswordInfo} />
  </div>
  <div class="flow-steps" class:hide-steps={hideSteps}>
    <Steps {back} {hideBack} />
  </div>
</div>
