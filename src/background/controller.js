import { accounts } from './accounts.js';
import { networks } from './networks.js';
import { sdk } from './sdk.js';
import { broadcastMessage, sendNotificationToInPageScript, openRequestPopup, closeRequestPopup, fromNano, gte, lt } from '../common/utils.js';
import { APPROXIMATE_FEE, settingsStore, accountStore, currentAccount, networksStore, currentNetwork, currentEnabledPinPad } from "../common/stores.js";

export const controller = () => {
  const accountsController = Object.freeze(accounts());
  const networksController = Object.freeze(networks());
  const sdkController = Object.freeze(sdk());

  const createPassword = async (string) => {
    let created = accountsController.createPassword(string);
    if (created) {
      broadcastMessage('walletIsLocked', {"locked": false, "enabledPinPad": false});
    }
    return created;
  };

  const addNewNetwork = async (network) => {
    if (await networksController.addNewNetwork(network)) {
      broadcastMessage('updateNetworks', true);
      return {"success": true};
    }
    return {"success": false, "error": "Network is existed"};
  };

  const removeNetworks = async (servers) => {
    for (let i in servers) {
      await networksController.removeNetwork(servers[i]);
    }
    broadcastMessage('updateNetworks', true);
    return true;
  };

  const updateTransactions = async (accountAddress, server) => {
    await accountsController.removeAllTransactions(accountAddress, server);
    await accountsController.updateTransactionsList(accountAddress, server, true);
    broadcastMessage('updateNetworks', true);
    return true;
  };

  const removeTokens = async (tokens) => {
    const accountAddress = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    const server = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });
    for (let i in tokens) {
      await accountsController.removeToken(accountAddress, server, tokens[i]);
    }
    broadcastMessage('updateNetworks', true);
    return true;
  };

  const unlock = async (data) => {
    const unlocked = await accountsController.unlock(data);

    // get setting about enabled/disabled pin pad
    const enabledPinPad = await new Promise((resolve) => {
      currentEnabledPinPad.subscribe((value) => {
        resolve(value);
      });
    });

    broadcastMessage('walletIsLocked', {"locked": !unlocked, "enabledPinPad": enabledPinPad});

    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });

    sendNotificationToInPageScript('xtonwallet-notification', {"method": "unlockStateChanged", "params": {"account": account, "isLocked": !unlocked}});
    return unlocked;
  };

  const changeAccount = async (data) => {
    accountStore.changeAccount(data);
  };

  const changeNetwork = async (data) => {
    networksStore.changeNetwork(data);
  };

  const lock = async () => {
    accountsController.lock();

    // get setting about enabled/disabled pin pad
    const enabledPinPad = await new Promise((resolve) => {
      currentEnabledPinPad.subscribe((value) => {
        resolve(value);
      });
    });
    broadcastMessage('walletIsLocked', {"locked": true, "enabledPinPad": enabledPinPad});

    sendNotificationToInPageScript('xtonwallet-notification', {"method": "unlockStateChanged", "params": {"account": null, "isLocked": true}});
    return true;
  };

  /*
  * Settings is array with key -> functionName to set value. This function must be existed in settingsStore
  */
  const setSettings = async (settings) => {
    for(let i in settings) {
      if (settingsStore[i]) {
        settingsStore[i](settings[i]);
      }
    }
  };

  const deleteAccount = (data) => {
    const { account, string } = data;
    if (accountsController.checkPassword(string)){
      if (accountsController.deleteOne(account)) {
        return true;
      }
    }
    return false;
  };

  const getPermissions = async (data, origin) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    const permissions = await accountsController.getPermissions(account, origin);
    return {"id": data.id, "data": { code: 4000, data: permissions}};
  }

  const checkPermission = async (data, origin) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.checkPermission(account, origin, data.method);
  }

  const requestPermissions = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalRequestPermission', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const watchAsset = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalImportToken', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const calculateFee = async (accountAddress, server, txData) => {
    if (txData.type == 'send') {
      return await accountsController.calculateFeeForWallet(accountAddress, server, txData);
    }
    if (txData.type == 'sendRaw') {
      return await accountsController.calculateFeeForRawTransaction(accountAddress, server, txData);
    }
    if (txData.type == 'sendToken') {
      const keyPair = await accountsController.getKeyPairForAccount(accountAddress);
      return await accountsController.calculateFeeForToken(accountAddress, server, txData, keyPair);
    }
  };

  const runTransaction = async (accountAddress, server, txData) => {
    if (txData.type == 'send') {
      return await accountsController.sendTransaction(accountAddress, server, txData);
    }
    if (txData.type == 'sendRaw') {
      return await accountsController.sendRawTransaction(accountAddress, server, txData);
    }
    if (txData.type == 'sendToken') {
      const keyPair = await accountsController.getKeyPairForAccount(accountAddress);
      return await accountsController.transferToken(accountAddress, server, txData, keyPair);
    }
  };

  const checkNewTransactions = async (accountAddress, server) => {
    await accountsController.updateTransactionsList(accountAddress, server);
    accountStore.removeWaitingTransaction(server + "-" + accountAddress);
  }

  const sendTransaction = async (data, origin) => {
    const endpoint = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });
    const balance = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.balance[endpoint]);
      });
    });
    const accountAddress = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    if (data.params.token == 'native' && lt(fromNano(balance), data.params.amount + APPROXIMATE_FEE)) {
      return new Promise((resolve, reject) => {
            resolve({"id": data.id, "data": {
              code: 4300,
              message: "Not enough balance",
            }});
      });
    } else if(lt(fromNano(balance), APPROXIMATE_FEE)) { // for asset case
      return new Promise((resolve, reject) => {
            resolve({"id": data.id, "data": {
              code: 4300,
              message: "Not enough balance",
            }});
      });
    }
    if (data.params.token != 'native') {
      const tokenData = await accountsController.getTokenData(accountAddress, endpoint, data.params.token);
      if (tokenData.address) {
        data.token = tokenData;
        if (lt(fromNano(data.token.balance, data.token.decimals), data.params.amount)) {
          return new Promise((resolve, reject) => {
                resolve({"id": data.id, "data": {
                  code: 4300,
                  message: "User doesn't have enough asset balance",
                }});
          });
        }
      } else {
        return new Promise((resolve, reject) => {
              resolve({"id": data.id, "data": {
                code: 4300,
                message: "User doesn't have this asset",
              }});
        });
      }
    }
    //here need to load data by address, if token is added
    openRequestPopup('ModalSendingTransaction', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const sendRawTransaction = async (data, origin) => {
    const endpoint = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });
    const balance = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.balance[endpoint]);
      });
    });
    if (lt(fromNano(balance), data.params.amount + APPROXIMATE_FEE)) {
      return new Promise((resolve, reject) => {
            resolve({"id": data.id, "data": {
              code: 4300,
              message: "Not enough balance",
            }});
      });
    } else {
      openRequestPopup('ModalSendingRawTransaction', data);
      return new Promise((resolve, reject) => {
        const listener = (message) => {
          if (message.type === "popupMessageResponse" && message.id == data.id) {
            browser.runtime.onMessage.removeListener(listener);
            closeRequestPopup();
            resolve({"id": data.id, "data": message.data});
          }
        };
        browser.runtime.onMessage.addListener(listener);
      });
    }
  };

  const getProviderState = async (data, origin) => {
    const walletIsLockedObject = await accountsController.walletIsLocked();
    const providerState = { isLocked: walletIsLockedObject.locked };
    if (providerState.isLocked) {
      providerState.account = null;
      providerState.endpoint = null;
    } else {
      providerState.account = await new Promise((resolve) => {
        currentAccount.subscribe((value) => {
          resolve(value.address);
        });
      });
      providerState.endpoint = await new Promise((resolve) => {
        currentNetwork.subscribe((value) => {
          resolve(value.server);
        });
      });
    }
    return {"id": data.id, "data": { code: 4000, data: providerState}};
  };

  const getSdkVersion = async (data, origin) => {
    const version = await sdkController.getSdkVersion();
    return {"id": data.id, "data": { code: 4000, data: version}};
  };

  const getCurrentAccount = async (data, origin) => {
    const walletIsLockedObject = await accountsController.walletIsLocked();
    if (walletIsLockedObject.locked) {
      data.origin = origin;
      openRequestPopup('ModalGetAccount', data);
      return new Promise((resolve, reject) => {
        const listener = (message) => {
          if (message.type === "popupMessageResponse" && message.id == data.id) {
            browser.runtime.onMessage.removeListener(listener);
            closeRequestPopup();
            currentAccount.subscribe(async (value) => {
              const address = value.address;
              const publicKey = await accountsController.getPublicKeyForAccount(value.address);
              const walletVersionForAccount = await accountsController.getWalletVersionForAccount(value.address);
              const server = await new Promise((resolve) => {
                currentNetwork.subscribe((value) => {
                  resolve(value.server);
                });
              });
              const walletVersion = walletVersionForAccount[server] ? walletVersionForAccount[server]: "";
              const balance = value.balance[server];
              resolve({"id": data.id, "data": { code: 4000, data: {address, publicKey, walletVersion, balance}}});
            });
          }
        };
        browser.runtime.onMessage.addListener(listener);
      });
    } else {
      const account = await new Promise((resolve) => {
        currentAccount.subscribe(async (value) => {
          const address = value.address;
          const publicKey = await accountsController.getPublicKeyForAccount(value.address);
          const walletVersionForAccount = await accountsController.getWalletVersionForAccount(value.address);
          const server = await new Promise((resolve) => {
            currentNetwork.subscribe((value) => {
              resolve(value.server);
            });
          });
          const walletVersion = walletVersionForAccount[server] ? walletVersionForAccount[server]: "";
          const balance = value.balance[server];
          resolve({address, publicKey, walletVersion, balance});
        });
      });
      return {"id": data.id, "data": { code: 4000, data: account}};
    }
  };

  const getCurrentEndpoint = async (data, origin) => {
    const walletIsLockedObject = await accountsController.walletIsLocked();
    if (walletIsLockedObject.locked) {
      data.origin = origin;
      openRequestPopup('ModalGetEndpoint', data);
      return new Promise((resolve, reject) => {
        const listener = (message) => {
          if (message.type === "popupMessageResponse" && message.id == data.id) {
            browser.runtime.onMessage.removeListener(listener);
            closeRequestPopup();
            currentNetwork.subscribe((value) => {
              resolve({"id": data.id, "data": { code: 4000, data: value.server}});
            });
          }
        };
        browser.runtime.onMessage.addListener(listener);
      });
    } else {
      const endpoint = await new Promise((resolve) => {
        currentNetwork.subscribe((value) => {
          resolve(value.server);
        });
      });
      return {"id": data.id, "data": { code: 4000, data: endpoint}};
    }
  };

  const signMessage = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalSignMessage', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const encryptMessage = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalEncryptMessage', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const getMessageSignature = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalGetSignature', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const decryptMessage = async (data, origin) => {
    data.origin = origin;
    openRequestPopup('ModalDecryptMessage', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          resolve({"id": data.id, "data": message.data});
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const cryptoGenerateRandomBytes = async (data, origin) => {
    const bytes = await sdkController.cryptoGenerateRandomBytes(data.params);
    return {"id": data.id, "data": { code: 4000, data: bytes }};
  };

  const getNaclBoxPublicKey = async (data, origin) => {
    const walletIsLockedObject = await accountsController.walletIsLocked();
    if (walletIsLockedObject.locked) {
      data.origin = origin;
      openRequestPopup('ModalGetNaclBoxPublicKey', data);
      return new Promise((resolve, reject) => {
        const listener = (message) => {
          if (message.type === "popupMessageResponse" && message.id == data.id) {
            browser.runtime.onMessage.removeListener(listener);
            closeRequestPopup();
            currentAccount.subscribe(async (value) => {
              const publicKey = await accountsController.getNaclBoxPublicKey(value.address);
              resolve({"id": data.id, "data": { code: 4000, data: publicKey}});
            });
          }
        };
        browser.runtime.onMessage.addListener(listener);
      });
    } else {
      const account = await new Promise((resolve) => {
        currentAccount.subscribe(async (value) => {
          resolve(value.address);
        });
      });
      const publicKey = await accountsController.getNaclBoxPublicKey(account);
      return {"id": data.id, "data": { code: 4000, data: publicKey}};
    }
  };

  const saveGrantedPermissions = async (data) => {
    const { origin, grantedPermissions } = data;
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.saveGrantedPermissions(account, origin, grantedPermissions) ? grantedPermissions: [];
  }

  const getSignForData = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.getSignForData(account, data.data);
  };

  const doEncryptionForMessage = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.doEncryptionForMessage(account, data);
  };

  const doDecryptionForMessage = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.doDecryptionForMessage(account, data);
  };

  const getAccountSignature = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.getAccountSignature(account, data);
  };

  const getSignature = async (data, origin) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe(async (value) => {
        resolve(value.address);
      });
    });
    return await accountsController.getSignature(account, data.data);
  };

  const runSdkMethod = async (moduleName, methodName, methodParams) => {
    const endpoint = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });
    return await sdkController.runSdkMethod(endpoint, moduleName, methodName, methodParams);
  };

  const getSubscriptionId = async (data, origin) => {
    const endpoint = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data.params.address+origin));
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const id = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    accountStore.addSubscription(id, {server: endpoint, address: data.params.address});

    return {"id": data.id, "data": { code: 4000, data: id}};
  };

  const removeSubscriptionId = async (data) => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data.params.address+origin));
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const id = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    accountStore.removeSubscription(id);
    return {"id": data.id, "data": { code: 4000, data: true}};
  };

  const getFamousTokens = (server) => {
    return accountsController.getFamousTokens()[server];
  };

  const importToken = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe(async (value) => {
        resolve(value.address);
      });
    });
    
    let tokenObject;
    if (data.type == "74") {
      tokenObject = {
        "name": data.name,
        "symbol": data.symbol,
        "decimals": data.decimals,
        "address": data.address,
        "icon": data.icon,
        "type": data.type
      };
    }
    
    if (data.type == "64") {
      tokenObject = {
        "name": data.name,
        "itemIndex": data.itemIndex,
        "description": data.description,
        "externalLink": data.externalLink,
        "address": data.address,
        "icon": data.icon,
        "type": data.type
      };
    }
    return await accountsController.importToken(account, data.server, tokenObject);
  };

  const getNftContent  = async (data) => {
    return await accountsController.getNftContent(data.server, data.address);
  };

  const getTokenListForUser = async (data) => {
    return await accountsController.getTokenListForUser(data.accountAddress, data.server);
  };

  return {
    "accounts": accountsController,
    "networks": networksController,
    "sdk": sdkController,
    runSdkMethod,
    getProviderState,
    getSdkVersion,
    saveGrantedPermissions,
    checkPermission,
    getPermissions,
    requestPermissions,
    watchAsset,
    changeAccount,
    getCurrentAccount,
    getCurrentEndpoint,
    calculateFee,
    sendTransaction,
    sendRawTransaction,
    runTransaction,
    checkNewTransactions,
    signMessage,
    getSignForData,
    getMessageSignature,
    encryptMessage,
    doEncryptionForMessage,
    getNaclBoxPublicKey,
    decryptMessage,
    doDecryptionForMessage,
    getAccountSignature,
    cryptoGenerateRandomBytes,
    createPassword,
    deleteAccount,
    setSettings,
    unlock,
    lock,
    getSignature,
    addNewNetwork,
    changeNetwork,
    removeNetworks,
    updateTransactions,
    removeTokens,
    getSubscriptionId,
    removeSubscriptionId,
    getFamousTokens,
    importToken,
    getNftContent,
    getTokenListForUser
  };
};
