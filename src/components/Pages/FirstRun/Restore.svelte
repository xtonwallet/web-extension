<script>
  import { setContext, getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  //Components
  import CreatePassword  from './CreatePassword.svelte';
  import Finishing  from './Finishing.svelte';

  import Upload  from '../Restore/Upload.svelte';
  import Check  from '../Restore/Check.svelte';
  import Password  from '../Restore/Password.svelte';
  import AddWallets  from '../Restore/AddWallets.svelte';
  import SaveWallets  from '../Restore/SaveWallets.svelte';
  import Complete  from '../Restore/Complete.svelte';

  import Steps from '../../Elements/Steps.svelte';
  import Step from '../../Elements/Step.svelte';

  import Logo from '../../Elements/Logo.svelte';

  //Context
  const { switchPage, checkFirstRun } = getContext('app_functions');

  setContext('functions', {
    nextPage: () => {currentStep = currentStep + 1;},
    setFile: (value) => {file = value;},
    setKeyStore: (value) => {keystoreFile = value;},
    setKeys: (value) => {keys = value;},
    changeStep: (step) => {
      if (step === 0 && currentStep === 0) {
        switchPage('Onboarding');
      } else if (step === 0) {
        currentStep = back;
      }
      currentStep = step;
    },
    done: () => checkFirstRun()
  });

  let file;
  let keystoreFile;
  let keys;
  let restore = true;
  let currentStep = 0;

  let steps = [
    {page: CreatePassword, hideSteps: false, back: 0},
    {page: Upload, hideSteps: false, back: 0},
    {page: Check, hideSteps: true, back: 0},
    {page: Password, hideSteps: false, back: 1},
    {page: AddWallets, hideSteps: false, back: 1},
    {page: SaveWallets, hideSteps: true, back: 0, hideBack: true},
    {page: Complete, hideSteps: false, back: 0},
    {page: Finishing, hideSteps: false, back: 0},
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
        <svelte:component this={currentPage} {file} {keystoreFile} {keys} {restore}/>
    </div>
    <div class="flow-steps" class:hide-steps={hideSteps}>
        <Steps {back} {hideBack}/>
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
