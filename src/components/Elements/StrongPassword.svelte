<script>
  import { Icon } from "svelte-chota";
  /* Icons https://materialdesignicons.com/ */
  import { mdiCheck, mdiCancel } from "@mdi/js";
  import { _ } from 'svelte-i18n';

  export let password;
  export let charLength;

  let capTest = /[A-Z]/;
  let lowerTest = /[a-z]/;
  let symbolTest = /[ ~!@#$%^&?*_<>,.?/+=`(){}[:;"\-\|\\\]\']/;
  let numTest = /[0-9]/;

  $: capital = capTest.test(password);
  $: lower = lowerTest.test(password);
  $: symbol = symbolTest.test(password);
  $: number = numTest.test(password);
  $: length = password.length >= charLength;
</script>

<style lang="scss">
  .strong-password {
    line-height: 1.4;
    display: flex;
    flex-wrap: wrap;
  }
  .item {
    flex: 50%;
  }
  .icon {
    margin-right: 0px;
    display: inline-block;
    background: #fff;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    text-align: center;
    vertical-align: text-top;
  }
  :global(.not-vertical-align) {
    vertical-align: unset !important;
  }
</style>

<div class="flow-text-box strong-password text-body2">
  <div class={`${!length ? 'item text-secondary' : 'item'}`}>
    <div class="icon">
      {#if length}
        <Icon class="not-vertical-align" src={mdiCheck} color="green" size="1" />
      {:else}
        <Icon class="not-vertical-align" src={mdiCancel} color="red" size="1" />
      {/if}
    </div>
    {$_("{charLength} or more characters", { values: { charLength: charLength } })}
  </div>
  <div class={`${!lower ? 'item text-secondary' : 'item'}`}>
    <div class="icon">
      {#if lower}
        <Icon class="not-vertical-align" src={mdiCheck} color="green" size="1" />
      {:else}
        <Icon class="not-vertical-align" src={mdiCancel} color="red" size="1" />
      {/if}
    </div>
    {$_("1 lowercase letter")}
  </div>
  <div class={`${!capital ? 'item text-secondary' : 'item'}`}>
    <div class="icon">
      {#if capital}
        <Icon class="not-vertical-align" src={mdiCheck} color="green" size="1" />
      {:else}
        <Icon class="not-vertical-align" src={mdiCancel} color="red" size="1" />
      {/if}
    </div>
    {$_("1 capital letter")}
  </div>
  <div class={`${!number ? 'item text-secondary' : 'item'}`}>
    <div class="icon">
      {#if number}
        <Icon class="not-vertical-align" src={mdiCheck} color="green" size="1" />
      {:else}
        <Icon class="not-vertical-align" src={mdiCancel} color="red" size="1" />
      {/if}
    </div>
    {$_("1 number")}
  </div>
  <div class={`${!symbol ? 'item text-secondary' : 'item'}`}>
    <div class="icon">
      {#if symbol}
        <Icon class="not-vertical-align" src={mdiCheck} color="green" size="1" />
      {:else}
        <Icon class="not-vertical-align" src={mdiCancel} color="red" size="1" />
      {/if}
    </div>
    {$_("1 special character")}
  </div>
</div>
