<script>
    import {bubble, listen,get_current_component} from 'svelte/internal';

    export function getEventsAction() {
      const component = get_current_component();
      return (node) => {
        const events = Object.keys(component.$$.callbacks);
        const listeners = [];

        events.forEach(
          (event) => listeners.push(
            listen(node, event, (e) =>  bubble(component, e))
          )
        );

        return {
          destroy: () => {
            listeners.forEach(
              (listener) => listener()
            );
          }
        };
      };
    }

    import { Card, Icon } from "svelte-chota";

    export let outline = null;
    export let primary = null;
    export let secondary = null;
    export let dark = null;
    export let error = null;
    export let success = null;
    export let clear = null;
    export let loading = null;
    export let icon = null;
    export let svg = null;
    export let iconRight = null;
    export let dropdown = false;
    export let open = false;
    export let autoclose = false;
    const events = getEventsAction();
    const hasSlot = $$props.$$slots && $$props.$$slots !== undefined;
    function dropdownAction(node,param) {
      let autoclose = param;
      let button = node.getElementsByTagName('summary')[0];
      const clickOutside = () => {
        if(!!node.open) node.open=false;
      };
      const clickButton = (e) => {
        e.stopPropagation();
      };
      const clickInDD = (e) => {
        e.stopPropagation();
        if(autoclose) node.open=false;
      };
      node.addEventListener('click',clickInDD);
      button.addEventListener('click',clickButton);
      window.addEventListener('click',clickOutside);
      return {
        update: (param) => autoclose = param,
        destroy: () => {
          window.removeEventListener('click',clickOutside);
          node.removeEventListener('click',clickInDD);
          button.removeEventListener('click',clickButton);
        }
      };
    }
    $: clIcon = ( (icon !== null || iconRight !== null) && hasSlot);
    $: clIcononly = (dropdown) ? (icon !== null && dropdown===true) : (icon !== null && !hasSlot);
</script>

<style>
  @keyframes loading {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .loading {
    color: transparent !important;
    min-height: .8rem;
    pointer-events: none;
    position: relative;
  }
  .loading::after {
    animation: loading 500ms infinite linear;
    border: .2rem solid #FFFFFF;
    border-radius: 50%;
    border-right-color: transparent;
    border-top-color: transparent;
    content: "";
    display: block;
    height: .8rem;
    left: 50%;
    margin-left: -.4rem;
    margin-top: -.4rem;
    position: absolute;
    top: 50%;
    width: .8rem;
    z-index: 1;
  }
  .icon > .lefticon{
    margin: -10px 10px -10px 0px;
  }
  .icon > .righticon{
    margin: -10px 0px -10px 10px;
  }
  .icon-only{
    padding:.5rem .65rem;
  }
  summary{
    white-space: nowrap;
  }
  summary::marker {
    display:none;
  }
</style>

<details class="dropdown" bind:open use:dropdownAction={autoclose}>
  <summary
      class:button={1}
      class:outline
      class:primary
      class:secondary
      class:dark
      class:error
      class:success
      class:clear
      class:loading

      class:icon={clIcon}
      class:icon-only={clIcononly}

      {...$$restProps}
      use:events
  >
  {#if icon} <span class="lefticon"> <Icon src={icon} size="24px"/> </span>{/if}
  {#if svg} <span class="lefticon identicon"> {@html svg} </span>{/if}
    {(dropdown !== true) ? dropdown : ''}
  {#if iconRight} <span class="righticon"> <Icon src={iconRight} size="24px"/> </span>{/if}
  </summary>
  <Card style="z-index:1"><slot></slot></Card>
</details>
