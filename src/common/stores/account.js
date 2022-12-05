import { writable, derived } from 'svelte/store';
import { setStorageItem, getStorageItem } from '../utils.js';

const defaultAccountStore = {
  "currentAccount" : {},
  "waitingTransaction": [],
  "messageSubscriptions": {}
};

const createAccountStore = () => {
  const startValue = defaultAccountStore;
  //Create Intial Store
  const accountStore = writable(startValue);
  let initialized = false;

  const getStore = async() => {
    let account = await getStorageItem("account");
    if (typeof account != "undefined") {
      accountStore.set(account);
    } else {
      accountStore.set(startValue);
    }
    initialized = true;
  };

  //This is called everytime when accountStore is updated
  accountStore.subscribe(async (current) => {
    if (!initialized) {
      return current;
    }
    await setStorageItem("account", current);
  });

  getStore();

  let subscribe = accountStore.subscribe;
  let update = accountStore.update;
  let set = accountStore.set;

  return {
    subscribe,
    set,
    update,
    initialized: () => initialized,
    changeAccount: (accountInfoObj) => {
      accountStore.update((store) => {
        //Set account in Account store
        store.currentAccount = accountInfoObj;
        return store;
      });
    },
    addWaitingTransaction: (state) => {
      accountStore.update((store) => {
        if (store.waitingTransaction) {
          store.waitingTransaction.push(state);
        } else {
          store.waitingTransaction = [state];
        }
        return store;
      });
    },
    removeWaitingTransaction: (state) => {
      accountStore.update((store) => {
        store.waitingTransaction = store.waitingTransaction.filter((item) => {return item != state});
        return store;
      });
    },
    addSubscription: (id, subscription) => {
      accountStore.update((store) => {
        if (store.messageSubscriptions) {
          store.messageSubscriptions[id] = subscription;
        } else {
          store.messageSubscriptions = {};
          store.messageSubscriptions[id] = subscription;
        }
        return store;
      });
    },
    removeSubscription: (id) => {
      accountStore.update((store) => {
        if (store.messageSubscriptions && store.messageSubscriptions[id]) {
          delete store.messageSubscriptions[id];
        }
        return store;
      });
    },
  };
};

//Account Stores
export const accountStore = createAccountStore();

//Derived Store to return the current account object
export const currentAccount = derived(
  accountStore,
  ($accountStore) => { return $accountStore.currentAccount; }
);

//Derived Store to return the waiting transaction state
export const waitingTransaction = derived(
  accountStore,
  ($accountStore) => { return $accountStore.waitingTransaction; }
);

//Derived Store to return the messageSubscriptions
export const messageSubscriptions = derived(
  accountStore,
  ($accountStore) => { return $accountStore.messageSubscriptions; }
);