<script>
  import { onMount, getContext } from "svelte";

  //Stores
  import { CURRENT_KS_VERSION, steps } from "../../../common/stores.js";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { changeStep, setKeystoreFile } = getContext("functions");

  //Props
  export let keystorePasswordInfo;

  onMount(() => {
    steps.update((current) => {
      current.currentStep = 2;
      return current;
    });

    new Promise(function (resolve) {
      setTimeout(() => {
        createKeystore();
        resolve();
      }, 2500);
    }).then((res) => {
      changeStep(4);
    });
  });

  const createKeystore = () => {
    keystorePasswordInfo.version = $CURRENT_KS_VERSION;
    browser.runtime
      .sendMessage({ type: "backupKeystore", data: keystorePasswordInfo })
      .then((file) => {
        if (typeof file === "undefined" || browser.runtime.lastError) {
          throw new Error("unable to create keystore file");
        } else {
          setKeystoreFile(file);
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

</script>

<style>
  .backup-create {
    display: flex;
    flex-grow: 1;
    justify-content: center;
  }

</style>

<div class="backup-create">
  <Loading message={'Creating keystore'} />
</div>
