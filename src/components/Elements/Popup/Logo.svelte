<script>
  import { getContext } from "svelte";

  //Stores
  import { currentRate, currentCurrency } from "../../../common/stores.js";

  //Context
  const { switchPage, firstRun } = getContext("app_functions");

  $: clickable = !firstRun();
/*
  const goHome = () => {
    if (clickable) switchPage("StatisticMain");
  };
*/
</script>

<style lang="scss">
  .box {
    width: 50px;
    height: 100%;
    justify-content: center;
  }

  .brand {
    align-items: center;
  }

  .logo {
    position: relative;
    margin-left: 1rem;
    width: 48px;
    height: 48px;
    img {
      width: 100%;
      height: 100%;
    }
  }

  .rate {
    position: absolute;
    bottom: 10px;
    background: var(--color-primary);
    border-radius: 10px;
    font-size: 1.1rem;
    padding: 4px;
    font-weight: 400;
    color: var(--color-white);
    border-color: #000;
    border-style: solid;
    border-width: 1px;
    line-height: 0.5rem;
    white-space: nowrap;
  }
</style>

<div class="box flex-column">
  <div class="brand" > <!-- class:clickable  on:click={() => goHome()} > -->
    <div class="logo">
      <img src="/assets/img/icon-128.png" alt="logo" />
      <span class="rate">{$currentRate} {$currentCurrency}</span>
    </div>
  </div>
</div>
