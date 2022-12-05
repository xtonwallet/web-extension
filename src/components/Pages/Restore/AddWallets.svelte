<script>
  import { onMount, getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "svelte-chota";
  import { _ } from 'svelte-i18n';

  //Stores
  import { steps } from "../../../common/stores.js";

  //Context
  const { setKeys, changeStep, nextPage, cancel } = getContext("functions");

  //DOM nodes
  let formObj;

  //Props
  export let keys;
  let checked = true;
  let selected = 0;
  onMount(() => {
    steps.update((current) => {
      current.currentStep = 3;
      return current;
    });
    handleAllChange();
  });

  const nextStep = () => {
    setKeys(keys);
    nextPage();
  };

  const handleAllChange = () => {
    for (const i in keys.encrypted) {
      keys.encrypted[i].checked = checked;
      if (checked) {
        selected++;
      } else {
        selected--;
      }
    }
  };

  const handleChange = (event) => {
    if (event.target.checked) {
      selected++;
    } else {
      selected--;
    }
    if (selected == 0) {
      checked = false;
    }
    if (keys.encrypted.length == selected) {
      checked = true;
    }
  };
</script>

<style>
  .key-box {
    max-width: 700px;
    margin: 0 auto;
  }

  .header {
    margin-left: 53px;
    border-bottom: 2px solid var(--divider-light);
    width: calc(100% - 53px);
  }

  .header-name {
    width: 157px;
  }

  .header-address {
    flex-grow: 1;
  }

  .name {
    width: 141px;
    height: 88px;
    border-bottom: 1px dashed var(--divider-dark);
    margin-right: 16px;
    display: flex;
    align-items: center;
  }

  .address {
    display: flex;
    height: 88px;
    border-bottom: 1px dashed var(--divider-dark);
    align-items: center;
    flex-grow: 1;
    overflow: hidden;
  }

  .key-row {
    align-items: center;
  }

  .key-info {
    display: flex;
    width: 141px;
    height: 88px;
    margin-right: 16px;
    border-bottom: 1px dashed var(--divider-dark);
    align-items: center;
    word-break: break-all;
    justify-content: center;
    align-items: flex-start;
    min-width: 143px;
  }

  .checkbox-box {
    margin-right: 53px;
  }

  .chk-container {
    padding-left: 0;
    margin-bottom: 0;
  }

  .chk-checkmark {
    top: -13px;
  }

  p {
    margin: 0;
  }
  .address > p {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

<div class="flex-row flow-page" in:fade={{ delay: 0, duration: 200 }}>
  <div class="flex-column flow-content-left">
    <h6>{$_("Password confirmed")}</h6>

    <div class="flow-text-box text-body1">
      {$_("Almost there! Now let's select which accounts you'd like to restore")}
    </div>
    <div class="flex-column flow-buttons">
      <Button
        id="restore-btn"
        class="button__solid button__primary"
        style="margin: 0 0 1rem;"
        disabled={selected == 0}
        on:click={() => nextStep()}>
        {$_("Restore accounts")}
      </Button>

      <Button
        id="cancel-btn"
        class="button__solid"
        style="margin: 0 0 1rem;"
        on:click={() => cancel()}>
        {$_("Cancel")}
      </Button>
    </div>
  </div>
  <div class="flow-content-right key-box" in:fade={{ delay: 0, duration: 200 }}>
    <div class="flex-row header text-subtitle2 text-primary">
      <p class="header-name">{$_("Nickname")}</p>
      <p class="header-address">{$_("Address")}</p>
    </div>
    <div class="flex-row key-row">
      <div class="checkbox-box">
        <label class="chk-container text-body2" id="chk-all">
          <input type="checkbox" bind:checked on:change={handleAllChange} />
          <span class="chk-checkmark" />
        </label>
      </div>
      <p class="name">{$_("All wallets")}</p>
      <p class="address" />
    </div>
    {#each keys.encrypted as key, i}
      <div class="flex-row key-row">
        <div class="checkbox-box">
          <label class="chk-container text-body2" id={`chkbox-${i}`}>
            <input
              id={`chkbox-${i}`}
              type="checkbox"
              checked={keys.encrypted[i].checked}
              on:change={(event) => handleChange(event)} />
            <span class="chk-checkmark" />
          </label>
        </div>
        <div class="flex-column key-info text-body3 ">
          <p class="nickname text-secondary">{`${key.nickname}`}</p>
        </div>
        <div id={`div-address-${i}`} class="address">
          <p>{key.address}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
