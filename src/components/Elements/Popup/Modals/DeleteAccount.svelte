<script>
  import { onMount, getContext, afterUpdate } from 'svelte';
  import { _ } from 'svelte-i18n';

//Stores
  import { accountStore, currentAccount } from "../../../../common/stores.js";

  //Components
  import { Field, Button, Input } from "svelte-chota";

  export let closeModal;

  let allAccounts = [];

  const getAllAccounts = () => {
    browser.runtime
      .sendMessage({
        type: "getAllAccounts",
        data: ["nickname", "address", "balance"]
      })
      .then((result) => {
        allAccounts = result;
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  //DOM Nodes
  let password;

  onMount(() => {
    getAllAccounts();
  });

  //need to check here because on start allAccounts is empty and input field is not existed
  afterUpdate(() => {
    if (document.getElementById("password") != null) {
      password = document.getElementById("password");
    }
  });

  const deleteAccount = () => {
    browser.runtime
      .sendMessage({ type: "checkPassword", data: password.value }).then((resultCheck) => {
        if (resultCheck) {
          browser.runtime
            .sendMessage({ type: "deleteAccount", data: $currentAccount.address })
            .then((result) => {
              closeModal();
              accountStore.changeAccount(
                allAccounts.filter((item) => {
                  return item.address != $currentAccount.address;
                })[0]
              );
            })
            .catch((error) => {
              console.error("Error on sendMessage:" + JSON.stringify(error));
            });
        } else {
          password.setCustomValidity("Incorrect password");
          password.reportValidity();
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

</script>

<style>
</style>

<div class="delete-account">
  <h6> {$_("Delete account")} </h6>
  {#if allAccounts.length > 1}
    <p> {$_("This action will remove the account. If you have there any assets, please to do backup before confirmation.")} </p>
    <Field label="{$_("Password")}">
      <Input
        id="password"
        password
        on:input={() => password.setCustomValidity("")}
        />
    </Field>
    <div class="flex-column flow-buttons">
      <Button
          id="save-btn"
          error
          class="flex-row flex-center-centr button__solid"
          on:click={() => deleteAccount()}
          required=true}
          >
          {$_("Delete")}
      </Button>
    </div>
    {:else}
    <p> {$_("You can't delete the only account")} </p>
  {/if}
</div>
