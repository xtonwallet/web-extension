<script>
  import { onMount, getContext, afterUpdate } from "svelte";
  import { _ } from "svelte-i18n";
  import { sendRequestReject, sendRequestResolve } from '../../../../common/utils.js';

  import methodsList from "../../../../common/methodsList.js";

  //Components
  import { Button, Input, Icon } from "svelte-chota";

  /* Icons https://materialdesignicons.com/ */
  import { mdiAlert } from "@mdi/js";

  let disabled, loading = false;
  let permissions = [];
  let grantedPermissions = [];
  let error = "";

  export let modalData = {};

  onMount(() => {
    if (modalData.params) {
      if (Array.isArray(modalData.params.permissions)) {
        for (let i in modalData.params.permissions) {
          const methodName = modalData.params.permissions[i];
          if (methodsList[methodName]) {
            permissions.push({
              MethodName: methodName,
              MethodDescription: methodsList[methodName].Description,
              UsePrivateKeys: methodsList[methodName].UsePrivateKeys
            });
          }
        }
        if (permissions.length != 0) {
          permissions = permissions; // for reactivity
        } else {
          error = "Web page requests invalid permissions";
        }
      } else {
        error = "Web page requests invalid permissions";
      }
    } else {
      error = "Web page requests invalid permissions";
    }
  });

  //Context
  const { closeModal, openModal } = getContext("app_functions");

  const cancelModal = () => {
    //here need to set by default for the next same window
    loading = false;
    disabled = false;
    closeModal();
    // send a message that the request is rejected for InPage script
    if (modalData.id) {
      sendRequestReject(modalData.id);
    }
  };

  const grantSelectedPermission = () => {
    loading = true;
    disabled = true;

    browser.runtime
      .sendMessage({
        type: "saveGrantedPermissions",
        data: { grantedPermissions, origin: modalData.origin }
      })
      .then((result) => {
        //here need to set by default for the next same window
        loading = false;
        disabled = false;
        closeModal();
        if (modalData.id) {
          sendRequestResolve(modalData.id, {code: 4000, data: result});
        }
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
  };

  const collectGrantedPermissions = () => {
    const items = document.getElementsByClassName("check-permission");
    grantedPermissions = Array.prototype.filter.call(items, (item) => {return item.checked == true;})
                          .map(function(item){
                              return item.value;
                          });
  };
</script>

<style lang="scss">
  .header {
    font-weight: bold;
    text-align: center;
  }
  .permissions-list {
    overflow-y: auto;
    max-height: 200px;
    padding-left: 10px;
    padding-right: 0px;
    width: 100%;
    li {
      list-style: none;
      border-bottom: 1px dashed var(--color-lightGrey);
      margin-bottom: 0.5em;
      label {
        vertical-align: baseline;
        font-weight: 500;
      }
    }
  }
  .method-description {
    font-size: 0.7em;
    color: var( --color-darkGrey);
  }
  .origin {
    font-weigth: bold;
  }
  .origin-text {
    margin-bottom: 0px;
  }
</style>

<div class="select-permissions flex-column">
  <p class="header">
    {$_('Select permissions that you will grant to this web domain')}
  </p>
  <div class="flex-row flex-center-center">
    <div class="text-center">
      <div class="origin">{$_('Origin')}</div>
      <p class="origin-text">{modalData.origin}</p>
    </div>
  </div>
  <div class="flex-row">
    {#if error == ""}
      <ul class="permissions-list">
        {#each permissions as permission}
          <li>
            <Input class="check-permission" on:click={collectGrantedPermissions} type="checkbox" value="{permission.MethodName}" id="{permission.MethodName}" />
            <label for="{permission.MethodName}">
              {permission.MethodName}
              {#if permission.UsePrivateKeys}
                <span title={$_("Method uses private keys")}>
                  <Icon
                    src={mdiAlert}
                    color="red"
                    size="1" />
                </span>
              {/if}
            </label>
            <p class="method-description">{$_(permission.MethodDescription)}</p>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="error text-center">{$_(error)}</p>
    {/if}
  </div>
  <div class="flex-row flow-buttons">
    <Button
      id="cancel-btn"
      class="button__solid button__secondary"
      {disabled}
      on:click={() => cancelModal()}>
      {$_('Cancel')}
    </Button>
    {#if error == ""}
      <Button
        id="grant-btn"
        class="button__solid button__primary"
        {loading}
        on:click={() => grantSelectedPermission()}>
        {$_('Grant')}
      </Button>
    {/if}
  </div>
</div>
