<script>
  import { onMount, getContext } from 'svelte';

  //Stores
  import { settingsStore, accountStore } from '../../../common/stores.js';

  //Components
  import Loading from "../../Elements/Loading.svelte";
  import ErrorBox from "../../Elements/ErrorBox.svelte";

  //Context
  const { setKeys, setKeyStore, changeStep, nextPage } = getContext('functions');

  //Props
  export let keys;
  let error = "";

  onMount(() => {
    let checkedKeys = keys.encrypted.filter((key) => key.checked);
    keys.encrypted = checkedKeys;
    browser.runtime.sendMessage({type: "addAccounts", data: keys})
    .then((result) => {
      if (!result.error) {
        keys.encrypted = result;
        settingsStore.setLastChangeDate();
        accountStore.changeAccount(keys.encrypted[0]);
        setKeys(keys);
        nextPage();
      } else {
        error = result.error;
      }
    })
    .catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });
  });

  const goBack = () => {
    setKeyStore(undefined);
    setKeys(undefined);
    changeStep(0);
  };
</script>

<style>
  .restore-savewallets {
    display: flex;
    flex-grow: 1;
    justify-content: center;
  }
</style>

<div class="restore-savewallets">
  {#if error === ""}
    <Loading message={"Saving accounts to wallet"} />
  {:else}
    <ErrorBox {error} header="Oops" buttonText="Back" buttonAction={() => goBack()}/>
  {/if}
</div>
