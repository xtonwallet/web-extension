<script>
    import { getContext, onMount } from "svelte";
    import { fade } from "svelte/transition";

    //Context
    const { closeModal } = getContext("app_functions");

    let previousScrollSpot = { x: 0, y: 0 };

    onMount(() => {
      previousScrollSpot.x = window.pageXOffset;
      previousScrollSpot.y = window.pageYOffset;
      window.scrollTo(0, 0);
      return () => {
        window.scrollTo(previousScrollSpot.x, previousScrollSpot.y);
      };
    });
</script>

<style lang="scss">
    .modal-background {
        position: fixed;
        background-size: cover;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.8;
        z-index: 30;
        background-color: var(--color-black);
    }

    .modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        overflow: visible;
        left: 50%;
        transform: translate(-50%, 0px);
        padding: 2rem;
        margin: 1rem 0;
        background: var(--bg-color);
        box-shadow: var(--box-shadow-4);
        -webkit-box-shadow: var(--box-shadow-4);
        -moz-box-shadow: var(--box-shadow-4);
        border-radius: 2rem;
        z-index: 60;
        width: calc(100% - 2rem);
    }

    :global(.page .modal) {
        max-width: 33rem;
    }
</style>

<div
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
    class="modal-background"
    on:click={() => closeModal()}
    on:keyup={() => closeModal()}
    />
<div in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="modal">
    <slot />
</div>
