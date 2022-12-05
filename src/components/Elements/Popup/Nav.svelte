<script>
  //Components
  import Logo from "./Logo.svelte";
  import Controls from "./Controls.svelte";
  import AccountsList from "./AccountsList.svelte";
</script>

<style>
  .navigation {
    display: flex;
    flex-direction: row;
    position: fixed;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
    right: 0;
    height: 5rem;
    background-color: var(--bg-primary);
    z-index: 25;
    border-bottom: 1px solid var(--divider-light);
  }
  .spacer {
    flex-grow: 1;
  }
</style>

<div class="navigation">
  <Logo />
  <div class="spacer" />
  <Controls />
  <AccountsList />
</div>
