<script>
  import "../common/i18n.js";
  import "./Styles.svelte";
  import { onMount, setContext, beforeUpdate } from "svelte";
  import { fade } from "svelte/transition";
  import { isLoading, _, locale } from "svelte-i18n";

  //Stores
  import {
    settingsStore,
    currentPage,
    currentThemeName,
  } from "../common/stores.js";

  import { requestsStore } from "../common/utils.js";
  import PopupMain from "./Pages/Popup/PopupMain.svelte";
  import StatisticMain from "./Pages/Popup/StatisticMain.svelte";
  import LockScreen from "./Pages/Popup/LockScreen.svelte";

  const Pages = {
    PopupMain,
    StatisticMain,
    LockScreen,
  };

  //Elements
  import Nav from "./Elements/Popup/Nav.svelte";
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
  import ModalTonConnectAccount from "./Elements/Popup/Modals/TonConnectAccount.svelte";
  import ModalTonReconnectAccount from "./Elements/Popup/Modals/TonReconnectAccount.svelte";

  export let loaded;

  let showModal = false;
  let currentModal;
  let modalData;

  $: walletIsLocked = true;
  $: enabledPinPad = false;
  $: firstRun = undefined;

  const walletIsLockedListener = (message) => {
    if (message.type === "popup-walletIsLocked") {
      walletIsLocked = message.data.locked;
      enabledPinPad = message.data.enabledPinPad;
    }
  };

  // We have to track incoming messages to provide bridge between InPage script and popup
  const popupMessageListener = (message) => {
    if (message.type === "popupMessage") {
      requestsStore.update((store) => {
        if (store.length <= 15) {
          store.push({
            modalName: message.data.modalName,
            data: message.data.data,
          });
        }
        return store;
      });
    }
  };

  // We have to track incoming messages to provide information about popup view
  const popupViewListener = (message, sender, sendResponse) => {
    if (message.type === "popupView") {
      const views = browser.extension.getViews({ type: "popup" });
      sendResponse(views.length != 0);
    }
  };

  //we can't use onMount/onDestroy because it must be initialized at first
  browser.runtime.onMessage.addListener(walletIsLockedListener);
  browser.runtime.onMessage.addListener(popupMessageListener);
  browser.runtime.onMessage.addListener(popupViewListener);

  onMount(() => {
    browser.runtime.sendMessage({ type: "walletIsLocked" }).then((data) => {
      walletIsLocked = data.locked;
      enabledPinPad = data.enabledPinPad;
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
    });

    checkFirstRun();

    requestsStore.subscribe((requestsQueue) => {
      if (requestsQueue.length != 0) {
        let label = "";
        if (requestsQueue.length > 9) {
          label += "9+";
        } else {
          label += requestsQueue.length;
        }
        browser.action.setBadgeText({ text: label });

        const value = requestsQueue.slice(0, 1).shift();
        openModal(value.modalName, value.data);
      } else {
        if (__DEV_MODE__) {
          browser.action.setBadgeText({ text: "Dev" }); // to mark that it is not from the webstore
        } else {
          browser.action.setBadgeText({ text: "" });
        }
      }
    });
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
    }
  });

  setContext("app_functions", {
    switchPage: (name, data) => switchPage(name, data),
    openModal: (modal, data) => openModal(modal, data),
    getModalData: () => {
      return modalData;
    },
    closeModal: () => closeModal(),
    firstRun: () => (firstRun ? true : false),
    appHome: () => switchPage("AccountMain"),
    checkFirstRun: () => checkFirstRun(),
    themeToggle: themeToggle,
  });

  const checkFirstRun = () => {
    browser.runtime.sendMessage({ type: "isFirstRun" })
    .then((isFirstRun) => {
      firstRun = isFirstRun;
      if (firstRun) {
        const openApp = () => {
          browser.tabs.create({ url: "/page.html" });
        };
        browser.tabs.query({}).then((tabs) => {
          const foundTab = tabs.find((tab) => {
            if (typeof tab.url !== "undefined") {
              return tab.url.includes(
                `chrome-extension://${browser.runtime.id}/page.html`
              );
            } else {
              return false;
            }
          });

          if (foundTab) {
            browser.tabs.update(foundTab.id, { highlighted: true });
          } else {
            openApp();
          }
        });
      } else {
        settingsStore.changePage({ name: "PopupMain" });
      }
    }).catch((error) => {
      console.error("Error on sendMessage:" + JSON.stringify(error.message));
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
      browser.runtime.sendMessage({
        type: "setSettings",
        data: {
          setThemeName: "light",
        },
      })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
      });
    } else {
      body.classList.remove("light");
      settingsStore.setThemeName("dark");
      // need to change storage on background
      browser.runtime.sendMessage({
        type: "setSettings",
        data: {
          setThemeName: "dark",
        },
      })
      .catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error.message));
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
    ModalTonConnectAccount,
    ModalTonReconnectAccount,
  };

</script>

<style>
  .container {
    display: flex;
    padding-top: 4rem;
    flex-grow: 1;
    width: 350px;
    height: 550px;
  }

  .main-layout {
    display: flex;
    flex-direction: row;
    justify-content: left;
    flex-grow: 1;
  }

  .content-pane {
    padding: 20px 0px 0;
    flex-grow: 1;
    box-sizing: border-box;
  }

  .components {
    flex-grow: 1;
  }

  /*
  .openedModal{
    padding-top: 0px;
  }
  */
</style>

<div class="container {showModal && !walletIsLocked ? "openedModal" : ""}">
  {#if !$isLoading && $loaded && $locale && typeof firstRun !== 'undefined'}
    {#if firstRun}
      <svelte:component this={Pages[$currentPage.name]} />
    {:else}
      {#if !walletIsLocked}
        <Nav />
        <div class="main-layout">
          <div class="content-pane flex-column">
            <div class="components" in:fade={{ delay: 0, duration: 500 }}>
              <svelte:component this={Pages[$currentPage.name]} />
            </div>
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
      {/if}
      {#if walletIsLocked}
        <svelte:component this={Pages['LockScreen']} {enabledPinPad} {loaded} />
      {/if}
    {/if}
  {:else}
    <Loading message="..." />
  {/if}
  <LightDarkToggle size="1" orientation="bottom" />
</div>
