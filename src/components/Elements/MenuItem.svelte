<script>
  import { getContext } from "svelte";
  import { Icon } from "svelte-chota";
  import { _ } from "svelte-i18n";

  //Stores
  import { currentPage, needsBackup } from "../../common/stores.js";

  //Context
  const { switchPage } = getContext("app_functions");

  //Props
  export let menuItem;

  let feedbackURL = "https://docs.google.com/forms/d/e/1FAIpQLSeDZwc8cvMKhjQc2PzTiqNCJ31oAqvhzbO6IEWBv1CBu2b3LA/viewform";

  $: isSelected = $currentPage.name === menuItem.page.name;
  $: backupPage = menuItem.name === "Backup wallet";

  const menuAction = () => {
    if (menuItem.page.name === "LockScreen") {
      browser.runtime.sendMessage({ type: "lockWallet" })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
      return;
    }
    if (menuItem.page.name === "Feedback") {
      window.open(feedbackURL, "_blank");
      return;
    }
    switchPage(menuItem.page.name);
  };
</script>

<style>
  .item {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    cursor: pointer;
    margin: 2px 0;
    height: 32px;
    padding: 6px 0;
    border-radius: 3px;
  }

  .floating-label {
    display: none;
  }

  .item:hover > .floating-label {
    display: block;
    position: absolute;
    top: inherit;
    left: 50px;
    z-index: 100;
    width: 110px;
    background-color: var(--color-grey-2);
    color: var(--font-primary);
    border-radius: 0 4px 4px 0;
    padding: 13px;
    font-weight: 300;
    box-shadow: var(--box-shadow-2);
    -webkit-box-shadow: var(--box-shadow-2);
    -moz-box-shadow: var(--box-shadow-2);
  }

  .item.selected:hover > .floating-label {
    background-color: var(--color-grey-2);
    color: var(--font-primary-inverted);
    border: 1px solid transparent;
  }

  .item:hover {
    background-color: var(--color-grey-2);
  }

  .notselected:hover {
    background-color: var(--color-grey-2);
  }

  .name {
    display: none;
  }

  .selected {
    background-color: var(--primary-color);
    color: var(--font-primary-inverse);
  }

  .warning {
    color: var(--color-warning);
  }

  @media (min-width: 900px) {
    .logo {
      margin-right: 0.5rem;
    }
    .floating-label {
      display: none;
    }
    .item:hover > .floating-label {
      display: none;
      background-color: unset;
    }
    .name {
      display: block;
      font-size: 14px;
      width: 180px;
      line-height: 20px;
    }
  }
</style>

<div
  id={menuItem.id}
  class="item"
  class:selected={isSelected}
  class:notselected={!isSelected}
  on:click={() => menuAction()}
  on:keyup={() => menuAction()}
  >
  <div class="logo">
    <Icon
      src={menuItem.logo}
      size="2"
      color="var(--color-white)" />
  </div>
  <span class="name" class:warning={backupPage && $needsBackup}>
    {$_(menuItem.name)}
  </span>
  <div class="floating-label text-subtitle2 ">{$_(menuItem.name)}</div>
</div>
