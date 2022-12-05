<script>
  import { getContext } from "svelte";
  import { Icon } from "svelte-chota";

  //Stores
  import { currentThemeName } from "../../common/stores.js";

  /* Icons https://materialdesignicons.com/ */
  import { mdiWeatherSunny, mdiWeatherNight } from "@mdi/js";

  const { themeToggle } = getContext("app_functions");
  export let size = 2;
  export let orientation = "top";
</script>

<style lang="scss">
  .toogle-container {
    position: fixed;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 1000;
    .wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;

      width: 40px;
      height: 40px;
      border: 1px solid transparent;
      border-radius: 99px;
      padding: 2px;

      box-shadow: var(--box-shadow-3);
      -webkit-box-shadow: var(--box-shadow-3);
      -moz-box-shadow: var(--box-shadow-3);

      .icons {
        position: absolute;
        cursor: pointer;
        transition: 0.5s opacity;
        opacity: 0;
        &.front {
          opacity: 1;
        }
        &.back {
          opacity: 0;
        }
      }

      &:hover {
        top: 1px;
        background: var(--color-darkGrey);
        border: 1px solid var(--outline);
        box-shadow: var(--box-shadow-2);
        -webkit-box-shadow: var(--box-shadow-2);
        -moz-box-shadow: var(--box-shadow-2);
        & > .back {
          opacity: 1;
        }
        & > .front {
          opacity: 0;
        }
      }

      &:active {
        top: 2px;
        box-shadow: var(--box-shadow-1);
        -webkit-box-shadow: var(--box-shadow-1);
        -moz-box-shadow: var(--box-shadow-1);
      }
    }

    &.bottom {
      bottom: 1rem;
      right: 1rem;
      top: initial;
      .wrapper {
        width: 25px;
        height: 25px;
      }
    }
  }
</style>

<div class="toogle-container" class:bottom={orientation == "bottom"}>
  <div class="wrapper">
    <div
      class="icons"
      class:back={$currentThemeName === 'dark'}
      class:front={$currentThemeName === 'light'}
      on:click={themeToggle}>
      <Icon src={mdiWeatherSunny} color="grey" size={size} />
    </div>

    <div
      class="icons"
      class:back={$currentThemeName === 'light'}
      class:front={$currentThemeName === 'dark'}
      on:click={themeToggle}>
      <Icon src={mdiWeatherNight} color="grey" size={size} />
    </div>
  </div>
</div>
