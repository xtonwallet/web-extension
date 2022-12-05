<script>
  import { onMount, getContext } from 'svelte';

  //Components
  import Loading from "../../Elements/Loading.svelte";
  import ErrorBox from "../../Elements/ErrorBox.svelte";

  //Context
  const { setKeyStore, changeStep, nextPage } = getContext('functions');

  //Props
  export let file;

  let error = '';

  onMount(() => {
    new Promise(function(resolve, reject) {
      setTimeout(() => {
        validateKeyStore(file, resolve, reject);
      }, 1000);
    })
      .then((res) => {
        nextPage();
      })
      .catch((err) => error = err);
  });

  const validateKeyStore = async (fileObj, resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      let output = e.target.result;
      let keystoreObj = {};

      try {
        keystoreObj = JSON.parse(JSON.parse(output).data);
      } catch (e) {
        reject("This is not a valid keystore file.");
      }
      if (!keystoreObj.data || !keystoreObj.iv || !keystoreObj.salt) {
        reject("This is not a valid keystore file.");
      }

      setKeyStore(JSON.parse(output));
      resolve();
    };
    await reader.readAsText(fileObj);
  };

  const goBack = () => {
    setKeyStore(undefined);
    changeStep(0);
  };
</script>

<style>
  .page {
    display: flex;
    flex-grow: 1;
    justify-content: center;
  }

  .error-padding {
    padding-top: 20px;
  }
</style>

<div class="page" class:error-padding={error !== ''}>
  {#if error === ''}
    <Loading message={'Checking keystore'} />
  {:else}
    <ErrorBox {error} header="Oops" buttonText="Back" buttonAction={() => goBack()}/>
  {/if}
</div>
