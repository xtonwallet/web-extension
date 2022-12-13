import { writable, derived, get } from 'svelte/store';
import { setStorageItem, getStorageItem, removeStorageItem } from '../utils.js';

const defaultNetworksStore = {
  "currentNetwork" : {
    "name": "Main",
    "server": "mainnet",
    "explorer": "https://tonscan.org",
    "endpoint": "https://mainnet.xtonwallet.com/api/v2/jsonRPC",
    "coinName": "TONCOIN"
  }
};

const createNetworksStore = () => {
  const startValue = defaultNetworksStore;
  //Create Intial Store
  const networksStore = writable(startValue);
  let initialized = false;

  const getStore = async() => {
    let networks = await getStorageItem("networks");
    if (typeof networks != "undefined") {
      networksStore.set(networks);
    } else {
      networksStore.set(startValue);
    }
    initialized = true;
  };

  //This is called everytime when networksStore is updated
  networksStore.subscribe(async (current) => {
    if (!initialized) {
      return current;
    }
    await setStorageItem("networks", current);
  });

  getStore();

  let subscribe = networksStore.subscribe;
  let update = networksStore.update;
  let set = networksStore.set;

  return {
    subscribe,
    set,
    update,
    initialized: () => initialized,
    changeNetwork: (networkInfoObj) => {
      networksStore.update((store) => {
        //Set network in Networks store
        store.currentNetwork = networkInfoObj;
        return store;
      });
    }
  };
};

//Networks Stores
export const networksStore = createNetworksStore();

//Derived Store to return the current network object
export const currentNetwork = derived(
  networksStore,
  ($networksStore) => { return $networksStore.currentNetwork; }
);
