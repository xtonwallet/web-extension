<script>
  import "../common/i18n.js";
  import "./Styles.svelte";
  import { onMount, setContext, beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";
  import { isLoading, _, locale } from "svelte-i18n";

  //Stores
  import {
    settingsStore,
    accountStore,
    networksStore,
    currentAccount,
    currentNetwork,
    currentPage,
    currentThemeName,
  } from "../common/stores.js";

  import Onboarding from "./Pages/FirstRun/Onboarding.svelte";
  import Restore from "./Pages/FirstRun/Restore.svelte";
  import Backup from "./Pages/Backup/Backup.svelte";
  import IntroRestore from "./Pages/Restore/IntroRestore.svelte";
  import RestoreWallet from "./Pages/Restore/RestoreWallet.svelte";
  import AccountMain from "./Pages/Account/AccountMain.svelte";
  import AddNewAccount from "./Pages/Account/AddNewAccount.svelte";
  import AddNewNetwork from "./Pages/Network/AddNewNetwork.svelte";
  import NetworksList from "./Pages/Network/NetworksList.svelte";
  import TokensList from "./Pages/Tokens/TokensList.svelte";
  import LockScreen from "./Pages/Common/LockScreen.svelte";
  import Settings from "./Pages/Common/Settings.svelte";
  import About from "./Pages/Common/About.svelte";

  import Menu from "./Elements/Menu.svelte";

  const Pages = {
    LockScreen,

    // Integrated pages
    Onboarding,
    Restore, // for first run
    IntroRestore,
    AccountMain,
    About,
    AddNewNetwork,
    NetworksList,
    TokensList,
    Settings,

    //full pages
    AddNewAccount,
    Backup,
    RestoreWallet,
  };

  const fullPage = ["AddNewAccount", "Backup", "RestoreWallet"];

  //Elements
  import Nav from "./Elements/Nav.svelte";
  import Modal from "./Elements/Modal.svelte";
  import Loading from "./Elements/Loading.svelte";
  import LightDarkToggle from "./Elements/LightDarkToggle.svelte";

  //Modals
  import ModalEditNickname from "./Elements/Popup/Modals/EditNickname.svelte";
  import ModalDeleteAccount from "./Elements/Popup/Modals/DeleteAccount.svelte";
  import ModalError from "./Elements/Popup/Modals/Error.svelte";
  import ModalSuccess from "./Elements/Popup/Modals/Success.svelte";
  import ModalSendingTransaction from "./Elements/Popup/Modals/SendingTransaction.svelte";
  import ModalConfirmTransaction from "./Elements/Popup/Modals/ConfirmTransaction.svelte";
  import ModalSendingRawTransaction from "./Elements/Popup/Modals/SendingRawTransaction.svelte";
  import ModalConfirmRawTransaction from "./Elements/Popup/Modals/ConfirmRawTransaction.svelte";
  import ModalRequestPermission from "./Elements/Popup/Modals/RequestPermission.svelte";
  import ModalSignMessage from "./Elements/Popup/Modals/SignMessage.svelte";
  import ModalEncryptMessage from "./Elements/Popup/Modals/EncryptMessage.svelte";
  import ModalDecryptMessage from "./Elements/Popup/Modals/DecryptMessage.svelte";
  import ModalGetSignature from "./Elements/Popup/Modals/GetSignature.svelte";
  import ModalGetAccount from "./Elements/Popup/Modals/GetAccount.svelte";
  import ModalGetEndpoint from "./Elements/Popup/Modals/GetEndpoint.svelte";
  import ModalGetNaclBoxPublicKey from "./Elements/Popup/Modals/GetNaclBoxPublicKey.svelte";
  import ModalImportToken from "./Elements/Popup/Modals/ImportToken.svelte";
  import ModalQRCode from "./Elements/Popup/Modals/QRCode.svelte";
  import ModalSendLink from "./Elements/Popup/Modals/SendLink.svelte";
  import ModalShowNftContent from "./Elements/Popup/Modals/ShowNftContent.svelte";

  export let loaded;

  let showModal = false;
  let currentModal;
  let modalData;

  $: walletIsLocked = true;
  $: enabledPinPad = false;
  $: firstRun = undefined;

  const walletIsLockedListener = (message, origin) => {
    if (message.type === "page-walletIsLocked") {
      walletIsLocked = message.data.locked;
      enabledPinPad = message.data.enabledPinPad;
    }
  };

  const changedThemeListener = (message, origin) => {
    if (message.type === "page-themeChanged") {
      if ($currentThemeName != message.data) {
        settingsStore.setThemeName(message.data);
        const body = document.getElementById("theme-toggle");
        const theme = message.data;
        if (theme == "light") {
          body.classList.add("light");
        } else {
          body.classList.remove("light");
        }
      }
    }
  };

  const changedEventsListener = (message) => {
    if (message.type === "page-accountChanged") {
      if (message.data.address != $currentAccount.address) {
        accountStore.changeAccount(message.data);
      }
    }
    if (message.type === "page-endpointChanged") {
      if (message.data.server != $currentNetwork.server) {
        networksStore.changeNetwork(message.data);
      }
    }
  };

  //we can't use onMount/onDestroy because it must be initialized at first
  browser.runtime.onMessage.addListener(walletIsLockedListener);
  browser.runtime.onMessage.addListener(changedThemeListener);
  browser.runtime.onMessage.addListener(changedEventsListener);

  onMount(() => {
    browser.runtime.sendMessage({ type: "walletIsLocked" }).then((data) => {
      walletIsLocked = data.locked;
      enabledPinPad = data.enabledPinPad;
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
    checkFirstRun();
  });

  beforeUpdate(() => {
    if (settingsStore.initialized()) {
      const body = document.getElementById("theme-toggle");
      const theme = $currentThemeName;
      if (theme == "light") {
        body.classList.add("light");
      } else {
        body.classList.remove("light");
      }
      if (window.location.hash && window.location.hash.substring(1) != $currentPage.name) {
        switchPage(window.location.hash.substring(1));
        window.location = window.location.href.split("#")[0];
      }
      if (typeof Pages[$currentPage.name] == "undefined") {
        settingsStore.changePage({ name: "AccountMain" });
      }
    }
  });

  setContext("app_functions", {
    switchPage: (name, data) => switchPage(name, data),
    openModal: (modal, data) => openModal(modal, data),
    getModalData: () => {
      return modalData;
    },
    closeModal: () => (showModal = false),
    firstRun: () => (firstRun ? true : false),
    appHome: () => switchPage("AccountMain"),
    checkFirstRun: () => checkFirstRun(),
    themeToggle: themeToggle,
  });

  const checkFirstRun = () => {
    browser.runtime.sendMessage({ type: "isFirstRun" }).then((isFirstRun) => {
      firstRun = typeof isFirstRun == "boolean" ? isFirstRun : false;
      if (!firstRun && $currentPage.name === "Onboarding") {
        settingsStore.changePage({ name: "Backup" });
      }
      firstRun ? settingsStore.changePage({ name: "Onboarding" }) : null;
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    });
  };

  const switchPage = (name, data) => {
    showModal = false;
    settingsStore.changePage({ name, data });
  };

  const openModal = (modal, data) => {
    currentModal = modal;
    modalData = data;
    showModal = true;
  };

  const closeModal = () => {
    showModal = false;
  };

  function themeToggle() {
    const body = document.getElementById("theme-toggle");
    const theme = $currentThemeName;
    if (theme == "dark") {
      body.classList.add("light");
      settingsStore.setThemeName("light");
      // need to change storage on background
      browser.runtime
      .sendMessage({ type: "setSettings", data: {
        "setThemeName": "light",
      }})
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
    } else {
      body.classList.remove("light");
      settingsStore.setThemeName("dark");
      // need to change storage on background
      browser.runtime
      .sendMessage({ type: "setSettings", data: {
        "setThemeName": "dark",
      }})
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
    }
  }

  const Modals = {
    ModalEditNickname,
    ModalDeleteAccount,
    ModalError,
    ModalSuccess,
    ModalSendingTransaction,
    ModalSendingRawTransaction,
    ModalConfirmTransaction,
    ModalConfirmRawTransaction,
    ModalRequestPermission,
    ModalSignMessage,
    ModalEncryptMessage,
    ModalDecryptMessage,
    ModalGetSignature,
    ModalGetAccount,
    ModalGetEndpoint,
    ModalGetNaclBoxPublicKey,
    ModalImportToken,
    ModalQRCode,
    ModalSendLink,
    ModalShowNftContent,
  };
</script>

<style>
  .container {
    display: flex;
    padding-top: 6rem;
    flex-grow: 1;
  }

  .main-layout {
    display: flex;
    flex-direction: row;
    justify-content: left;
    flex-grow: 1;
  }

  .content-pane {
    flex-grow: 1;
    box-sizing: border-box;
  }

  .components {
    flex-grow: 1;
  }

  .menu-pane {
    display: none;  
  }

  @media (min-width: 480px) {
    .menu-pane {
      width: 83px;
      min-width: 83px;
      z-index: 29;
      display: block;
    }
    .content-pane {
      padding: 1rem 2rem 0 0;
    }
  }

  @media (min-width: 900px) {
    .menu-pane {
      width: 280px;
      min-width: 280px;
    }
  }
</style>

<div class="container page">
  {#if !$isLoading && $locale && $loaded && typeof firstRun !== 'undefined'}
    {#if firstRun}
      <svelte:component this={Pages[$currentPage.name]} />
    {:else}
      {#if !walletIsLocked}
        {#if fullPage.includes($currentPage.name)}
          <svelte:component this={Pages[$currentPage.name]} />
        {:else}
          <Nav />
          <div class="main-layout">
            <div class="menu-pane">
              <Menu />
            </div>
            <div class="content-pane flex-column">
              <div class="components" in:fade={{ delay: 0, duration: 500 }}>
                <svelte:component this={Pages[$currentPage.name]} />
              </div>
            </div>

            {#if showModal}
              <Modal>
                <svelte:component
                  this={Modals[currentModal]}
                  {modalData}
                  {closeModal} />
              </Modal>
            {/if}
          </div>
        {/if}
      {/if}
      {#if walletIsLocked}
        <svelte:component this={Pages['LockScreen']} {enabledPinPad} {loaded} />
      {/if}
    {/if}
  {:else}
    <Loading message="Loading" />
  {/if}
  <LightDarkToggle orientation="bottom" />
</div>
