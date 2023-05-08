<script>
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { currentExtendedMode } from "../../common/stores.js";

  import MenuBox from "./MenuBox.svelte";

  /* Icons https://materialdesignicons.com/ */
  import {
    mdiArchiveArrowDown,
    mdiArchiveArrowUp,
    mdiLock,
    mdiCog,
    mdiAlphaTCircleOutline,
    mdiLan,
    mdiBullhorn,
    mdiHelp,
    mdiCardBulleted,
    mdiQrcode,
    mdiApplicationCog
  } from "@mdi/js";

  let menus = [{
                heading: "Security",
                show: true,
                items: [
                  {
                    id: "backup",
                    show: true,
                    logo: mdiArchiveArrowDown,
                    name: "Backup wallet",
                    page: {
                      name: "Backup",
                    },
                  },
                  {
                    id: "restore",
                    show: true,
                    logo: mdiArchiveArrowUp,
                    name: "Restore wallet",
                    page: {
                      name: "RestoreWallet",
                    },
                  },
                  {
                    id: "lock",
                    show: true,
                    logo: mdiLock,
                    name: "Sign out & lock",
                    page: {
                      name: "LockScreen",
                    },
                  },
                ],
              }];

  const items = [
                {
                  id: "settings",
                  show: true,
                  logo: mdiCog,
                  name: "Settings",
                  page: {
                    name: "Settings",
                  },
                },
                {
                  id: "tokens",
                  show: true,
                  logo: mdiAlphaTCircleOutline,
                  name: "Tokens",
                  page: {
                    name: "TokensList",
                  },
                }];

  if ($currentExtendedMode) {
    items.push({
                id: "networks",
                show: true,
                logo: mdiLan,
                name: "Networks",
                page: {
                  name: "NetworksList",
                },
              });
  }

  items.push({
              id: "permissions",
              show: true,
              logo: mdiApplicationCog,
              name: "Dapp permissions",
              page: {
                name: "PermissionsList",
              },
            });

  menus.push({
              heading: "Wallet",
              show: true,
              items: items
            });

  menus.push({
              heading: "Information",
              show: true,
              items: [
                {
                  id: "about",
                  show: true,
                  logo: mdiCardBulleted,
                  name: "About app",
                  page: {
                    name: "About",
                  },
                },
                {
                  id: "feedback",
                  show: true,
                  logo: mdiBullhorn,
                  name: "Give feedback",
                  page: {
                    name: "Feedback",
                  },
                },
                {
                  id: "help",
                  show: true,
                  logo: mdiHelp,
                  name: "Help",
                  page: {
                    name: "Help",
                  },
                },
              ],
            });
</script>

<style>
  .menus {
    position: fixed;
    padding: 0px;
    width: 46px;
    color: var(--color-white);
  }

  @media (min-width: 900px) {
    .menus {
      padding: 2rem 0px 0px 2rem;
      width: 260px;
    }
  }
</style>

<div class="menus flex-column" in:fly={{ delay: 0, duration: 500, x: -50, y: 0, opacity: 0.0, easing: quintOut }}>
  {#each menus as menu}
    {#if menu.show}
      <MenuBox heading={menu.heading} menuItems={menu.items} />
    {/if}
  {/each}
</div>
