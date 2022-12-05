<script>
  import { onMount, getContext } from "svelte";

  //Stores
  import { settingsStore, steps } from "../../../common/stores.js";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  //Context
  const { done } = getContext("functions");

  //Props
  export let restore = false;

  $: message = "Finishing up";

  onMount(() => {
    if (!restore) {
      steps.set({ current: 0, stepList: [] });
    } else {
      steps.update((current) => {
        current.currentStep = 5;
        return current;
      });
    }

    new Promise(function (resolve, reject) {
      setTimeout(() => {
        if (!restore) {
          steps.update((current) => {
            current.currentStep = 5;
            return current;
          });
        }
        message = "Done!";
        resolve();
      }, 1000);
    }).then((res) => {
      setTimeout(() => {
        settingsStore.changePage({ name: "AccountMain" });
        done();
      }, 500);
    });
  });
</script>

<style>
  .firstrun-finishing {
    display: flex;
    flex-grow: 1;
    justify-content: center;
  }
</style>

<div class="firstrun-finishing">
  <Loading {message} />
</div>
