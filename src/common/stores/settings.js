import { writable, derived } from 'svelte/store';
import { setStorageItem, getStorageItem, enableProxy } from '../utils.js';
import { init, getLocaleFromNavigator } from 'svelte-i18n';

const localeFromNavigator = getLocaleFromNavigator();
const defaultSettingsStore = {
  "currentPage" : {
    "name": "AccountMain",
    "data" : {}
  },
  "dismissWarning": false,
  "themeName": "dark",
  "lang": localeFromNavigator != null ? localeFromNavigator.split('-')[0]: "en",
  "autologout": 5,
  "enabledPinPad": false,
  "retrievingTransactionsPeriod": 1,
  "retrievingTransactionsLastTime": 0,
  "enabledProxy": false,
  "currency": "USD",
  "rate": "*"
};

const createSettingsStore = () => {
  const startValue = defaultSettingsStore;
  //Create Intial Store
  const settingsStore = writable(startValue);
  let initialized = false;

  const getStore = async() => {
    let settings = await getStorageItem("settings");
    settings = Object.assign({}, defaultSettingsStore, settings); // if we add new property, need to fill it from default
    if (typeof settings != "undefined") {
      settingsStore.set(settings);
      init({
        fallbackLocale: 'en',
        initialLocale: settings.lang
      });
    } else {
      settingsStore.set(startValue);
      init({
        fallbackLocale: 'en',
        initialLocale: startValue.lang
      });
    }
    initialized = true;
  };

  //This is called everytime when settingsStore is updated
  settingsStore.subscribe(async (current) => {
    if (!initialized) {
      return current;
    }
    await setStorageItem("settings", current);
  });

  getStore();

  let subscribe = settingsStore.subscribe;
  let update = settingsStore.update;
  let set = settingsStore.set;

  return {
    subscribe,
    set,
    update,
    initialized: () => initialized,
    changePage: (pageInfoObj) => {
      if (!pageInfoObj.data) {
        pageInfoObj.data = {};
      }
      settingsStore.update((store) => {
        store.currentPage = pageInfoObj;
        return store;
      });
    },
    setLang: (lang) => {
      settingsStore.update((store) => {
        store.lang = lang;
        return store;
      });
    },
    setAutologout: (period) => {
      settingsStore.update((store) => {
        store.autologout = period;
        return store;
      });
    },
    setRetrievingTransactionsPeriod: (period) => {
      settingsStore.update((store) => {
        store.retrievingTransactionsPeriod = period;
        return store;
      });
    },
    setRetrievingTransactionsLastTime: (time) => {
      settingsStore.update((store) => {
        store.retrievingTransactionsLastTime = time;
        return store;
      });
    },
    setThemeName: (themeName) => {
      settingsStore.update((store) => {
        store.themeName = themeName;
        return store;
      });
    },
    setEnabledPinPad: (enabled) => {
      settingsStore.update((store) => {
        store.enabledPinPad = enabled;
        return store;
      });
    },
    setEnabledProxy: (enabled) => {
      settingsStore.update((store) => {
        store.enabledProxy = enabled;
        return store;
      });
      enableProxy(enabled);
    },
    setCurrency: (currency) => {
      settingsStore.update((store) => {
        store.currency = currency;
        return store;
      });
    },
    setRate: (rate) => {
      settingsStore.update((store) => {
        store.rate = rate;
        return store;
      });
    },
    setLastBackupDate: () => {
      settingsStore.update((store) => {
        store.lastBackupDate = new Date().getTime();
        store.dismissWarning = false;
        return store;
      });
    },
    setLastChangeDate: () => {
      settingsStore.update((store) => {
        store.lastChangeDate = new Date().getTime();
        store.dismissWarning = false;
        return store;
      });
    },
    dismissWarning: () => {
      settingsStore.update((store) => {
        store.dismissWarning = true;
        return store;
      });
    }
  };
};

//Settings Stores
export const settingsStore = createSettingsStore();

//Derived Store to return the current page object
export const currentPage = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.currentPage; }
);

//Derived Store to return the current lang
export const currentLang = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.lang; }
);

//Derived Store to return the current autologout setting
export const currentAutologout = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.autologout; }
);

//Derived Store to return the current retrieving transactions period setting
export const currentRetrievingTransactionsPeriod = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.retrievingTransactionsPeriod; }
);

//Derived Store to return the current retrieving transactions last time setting
export const currentRetrievingTransactionsLastTime = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.retrievingTransactionsLastTime; }
);

//Derived Store to return the current theme
export const currentThemeName = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.themeName; }
);

//Derived Store to return state for pin pad - enabled or not
export const currentEnabledPinPad = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.enabledPinPad; }
);

//Derived Store to return state for proxy - enabled or not
export const currentEnabledProxy = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.enabledProxy; }
);

//Derived Store to return currency
export const currentCurrency = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.currency; }
);

//Derived Store to return rate
export const currentRate = derived(
  settingsStore,
  ($settingsStore) => { return $settingsStore.rate; }
);

//Derived Store to return if the user needs to make another backup
export const needsBackup = derived(
  settingsStore,
  ($settingsStore) => {
    if ($settingsStore.dismissWarning) return false;
    if ($settingsStore.lastBackupDate && $settingsStore.lastChangeDate){
      return new Date($settingsStore.lastChangeDate) > new Date($settingsStore.lastBackupDate);
    }
    if (typeof $settingsStore.lastBackupDate === 'undefined' && $settingsStore.lastChangeDate) {
      return true;
    }
    return false;
  }
);
