<script>
  import { onMount, getContext } from "svelte";
  import { _ } from "svelte-i18n";

  //Components
  import Loading from "../../Elements/Loading.svelte";

  /* Icons https://materialdesignicons.com/ */
  import {
    mdiClose,
  } from "@mdi/js";

  //Stores
  import { Button, Checkbox, Details, Field, Input } from "svelte-chota";

  //Context
  const { switchPage } = getContext("app_functions");

  //DOM nodes
  let formObj;

  let permissionsLoaded = false;
  let permissionsList = [];
  let originsList = [];

  let filteredOriginsList = [];

  let selectedList = [];
  let methodsList = {};
  let searchOrigin = "";

  onMount(() => {
    browser.runtime
    .sendMessage({
      type: "getPermissionsList",
      data: {},
    })
    .then((result) => {
      originsList = Object.keys(result.permissionsList);
      permissionsList = result.permissionsList;

      filteredOriginsList = originsList;

      methodsList = result.methodsList;
      permissionsLoaded = true;
    })
    .catch((e) => {
      console.log(e); // here don't need to show any error for user, usually it is the network issue in the development environment
    });
  });

  const handleSubmit = async () => {
    try {
      if (formObj.checkValidity()) {
        let preparedSelectedList = {};
        for(let i in selectedList) {
          let item = selectedList[i].split("_^^_");
          if (typeof preparedSelectedList[item[0]] == "undefined") {
            preparedSelectedList[item[0]] = [];
            preparedSelectedList[item[0]].push(item[1]);
          } else {
            preparedSelectedList[item[0]].push(item[1]);
          }
        }

        browser.runtime
        .sendMessage({
          type: "savePermissionsList",
          data: preparedSelectedList,
        })
        .then((result) => {
          if (!result.error) {
            switchPage("AccountMain");
          } else {
            error = result.error;
          }
        })
        .catch((error) => {
          console.error("Error on sendMessage:" + JSON.stringify(error.message));
        });
      }
    } catch (e) {
      formObj.reportValidity();
    }
  };

  const goBack = () => {
    switchPage("AccountMain");
  };

  const filterOrigin = () => {
    filteredOriginsList = originsList.filter((item) => {
      return item.includes(searchOrigin)
    });
    selectedList = [];
  };
</script>

<style lang="scss">
  .permissions-wrapper {
    max-height: 35rem;
    overflow: hidden;
    .permissions-wrapper-scroll {
      max-height: 35rem;
      overflow-y: auto;
      width: calc(100% + 20px);
      .item {
        padding-top: 1.5rem;
        padding-left: 1.5rem;
      }
    }
  }
  :global(.permissions-wrapper-scroll details) {
    padding-bottom: 2rem;
  }
</style>

<h6>{$_('Manage Dapp permissions')}</h6>

<form
  id="manage-permissions-form"
  on:submit|preventDefault={() => handleSubmit()}
  target="_self"
  bind:this={formObj}
  autocomplete="off">
  <Field gapless>
    <Input placeholder="{$_("Search by domain")}" bind:value={searchOrigin} on:keyup={() => {
      filterOrigin();
    }}/>
    <Button icon={mdiClose} on:click={() => {searchOrigin = ""; filterOrigin();}}/>
  </Field>
  <div class="permissions-wrapper">
    <div class="permissions-wrapper-scroll">
      {#each filteredOriginsList as origin}
        <Details>
          <span slot="summary">{origin}</span>
          {#each permissionsList[origin] as permission}
            <div class="item">
              <Checkbox value="{(origin + "_^^_" + permission)}" bind:group={selectedList}>{$_(methodsList[permission]["Description"])}</Checkbox>
            </div>
          {/each}
        </Details>
      {/each}
    </div>
  </div>
  {#if !permissionsLoaded}
    <Loading/>
  {:else}
    {#if originsList.length > 0}
      <div class="flex-column flow-buttons">
        <Button
          form="manage-permissions-form"
          class="button__solid button__primary submit-button submit-button-text submit"
          style="margin: 0 0 1rem;"
          submit=true>
          {$_('Delete selected permissions')}
        </Button>
        <Button
          id="back"
          class="flex-row flex-center-centr button__solid button"
          style="margin: 0 0 1rem;"
          on:click={() => goBack()}>
          {$_('Back')}
        </Button>
      </div>
    {:else}
      {$_('No permissions that you can remove')}
    {/if}
  {/if}
</form>
