<script>
  import { onMount, getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

//Stores
  import { accountStore, currentAccount, currentNetwork } from "../../../../common/stores.js";

  //Components
  import { Field, Button, Input } from "svelte-chota";

  //Context
  const { closeModal } = getContext('app_functions');

  //DOM Nodes
  let nickname;

  onMount(() => {
    nickname = document.getElementById("modify-edit-nickname");
    nickname.value = $currentAccount.nickname;
  });

  const saveNickname = () => {
    browser.runtime.sendMessage({type: 'changeAccountNickname',
      data: {"accountAddress": $currentAccount.address, "nickname": nickname.value}
    })
    .then((result) => {
      if (result) {
        const account = $currentAccount;
        account.nickname = nickname.value;
        accountStore.changeAccount(account);
      }
      closeModal();
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
  };

</script>

<style>
</style>

<div class="edit-nickname">
  <h6> {$_("Edit account nickname")} </h6>
  <Field label="{$_("Nickname")}">
    <Input id="modify-edit-nickname" />
  </Field>
  <div class="flex-column flow-buttons">
    <Button
        id="save-btn"
        class="flex-row flex-center-centr button__solid button__primary"
        on:click={() => saveNickname()}>
        {$_("Save")}
    </Button>
  </div>
</div>
