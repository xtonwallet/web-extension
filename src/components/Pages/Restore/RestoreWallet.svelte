<script>
  import { setContext, getContext } from 'svelte';

  //Components
  import Steps from "../../Elements/Steps.svelte";
  import Step from "../../Elements/Step.svelte";
  import Logo from '../../Elements/Logo.svelte';

  import IntroRestore from './IntroRestore.svelte';
  import Upload from './Upload.svelte';
  import Check from './Check.svelte';
  import Password from './Password.svelte';
  import AddWallets from './AddWallets.svelte';
  import SaveWallets from './SaveWallets.svelte';
  import Complete from './Complete.svelte';

  import Seed from './Seed.svelte';
  import Keys from './Keys.svelte';

  //Context
  const { switchPage } = getContext('app_functions');

  setContext('functions', {
    nextPage: () => currentStep = currentStep + 1,
    setFile: (value) => {file = value;},
    setKeyStore: (value) => {keystoreFile = value;},
    setKeys: (value) => {keys = value;},
    changeStep: (step) => {
      if (step === 0 && currentStep === 0) switchPage('AccountMain');
      else if (step === 0) currentStep = back;
      else currentStep = step;
    },
    cancel: () => switchPage('AccountMain')
  });

  let file;
  let keystoreFile;
  let keys;
  let currentStep = 0;

  let steps = [
    {page: IntroRestore, hideSteps: true, back: 0},
    {page: Upload, hideSteps: false, back: 0},
    {page: Check, hideSteps: true, back: 0},
    {page: Password, hideSteps: false, back: 1},
    {page: AddWallets, hideSteps: false, back: 0},
    {page: SaveWallets, hideSteps: true, back: 0},
    {page: Complete, hideSteps: false, back: 0},
    {page: Seed, hideSteps: true, back: 0},
    {page: Keys, hideSteps: true, back: 0},
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
</style>

<div class="flow-layout">
    <div class="flow-header">
        <Logo />
    </div>
    <div class="flow-content">
        <svelte:component this={currentPage} {file} {keystoreFile} {keys}/>
    </div>
    <div class="flow-steps" class:hide-steps={hideSteps}>
        <Steps {back} {hideBack}/>
    </div>
</div>
