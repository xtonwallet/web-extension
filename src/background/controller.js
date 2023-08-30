import { accounts } from './accounts.js';
import { networks } from './networks.js';
import { sdk } from './sdk.js';
import { broadcastMessage, sendNotificationToInPageScript, openRequestPopup, closeRequestPopup, sendRequestReject, fromNano, toNano, lt, Unibabel, strToHex } from '../common/utils.js';
import { APPROXIMATE_FEE, settingsStore, accountStore, currentAccount, networksStore, currentNetwork, currentEnabledPinPad, waitingTransaction } from "../common/stores.js";
import methodsList from "../common/methodsList.js";

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

  const addWaitingTransaction = async (data) => {
    accountStore.addWaitingTransaction(data);
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
  };

  const checkPermission = async (data, origin) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    return await accountsController.checkPermission(account, origin, data.method);
  };

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
    return await accountsController.updateTransactionsList(accountAddress, server);
  };

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
                  message: "Not enough asset balance",
                }});
          });
        }
      } else {
        return new Promise((resolve, reject) => {
              resolve({"id": data.id, "data": {
                code: 4300,
                message: "No such asset",
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
    if (lt(fromNano(balance), fromNano(data.params.amount) + APPROXIMATE_FEE)) {
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
  };

  const savePermissionsList = async (data) => {
    const origins = Object.keys(data);
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    for (let i in origins) {
      await accountsController.removePermissions(account, origins[i], data[origins[i]]);
    }
    return true;
  };

  const getPermissionsList = async (data) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });
    let permissionsList = await accountsController.getPermissionsList(account);
    return { permissionsList, methodsList };
  };

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

  const tonConnectConnect = async (data, origin) => {
    const getPayloads = async (data) => {
      const walletAddress = await new Promise((resolve) => {
        currentAccount.subscribe(async (value) => {
          resolve(value.address);
        });
      });
      
      const payloads = [];
      try {
        for (let i in data.params.items) {
          const item = data.params.items[i];
          switch(item.name) {
            case 'ton_addr':
              const tonAddrItem = await tonConnectTonAddrItem(walletAddress);
              payloads.push(tonAddrItem);
            break;
            case 'ton_proof':
              const tonProofItem = await tonConnectTonProofItem(walletAddress, new URL(origin).hostname, item.payload)
              payloads.push(tonProofItem);
            break;
            default:
              payloads.push({
                name: item.name,
                error: {
                  code: 400,
                  message: "Method is not supported"
                }
              });
            break;
          }
        }
      } catch(e) {
        if (__DEV_MODE__) {
          console.log(e);
        }
      }

      return payloads;
    };

    let manifest;
    try {
      manifest = await fetch(data.params.manifestUrl);
    } catch(e) {
      return {"id": data.id, "data": { code: 4000, data: {event: "connect_error", payload: {
                  code: 2, //2 App manifest not found
                  message: "App manifest not found"
                }}}};
    }
    data.manifest = await manifest.json();
    if (typeof data.manifest.url == "undefined" || typeof data.manifest.name == "undefined" || typeof data.manifest.iconUrl == "undefined") {
      return {"id": data.id, "data": { code: 4000, data: {event: "connect_error", payload: {
        code: 3, //3 App manifest content error
        message: "App manifest content error"
      }}}};
    }

    data.origin = origin;
    openRequestPopup('ModalTonConnectAccount', data);
    return new Promise((resolve, reject) => {
      const listener = (message) => {
        if (message.type === "popupMessageResponse" && message.id == data.id) {
          browser.runtime.onMessage.removeListener(listener);
          closeRequestPopup();
          if (message.data.code != 4000) {
            resolve({"id": data.id, "data": { "code": 4000, 
                "data": {"event": "connect_error",
                  "payload": {
                    "code": message.data.code == 4001 ? 300: 1,//1 Bad request, 300 User rejected
                    "message": message.data.message
                  }
                }
              }
            });
            return;
          }
          getPayloads(data).then((payloads) => {
            if (payloads.length == 0) {
              resolve({"id": data.id, "data": { "code": 4000, 
                                                "data": { "event": "connect_error",
                                                          "payload": {
                                                            "code": 1,
                                                            "message": "Empty response due to wrong incoming items"
                                                          }
                                                        }
                                              }
                      });
            } else {
              resolve({"id": data.id, "data": { "code": 4000, 
                                                "data": { "event": "connect", 
                                                          "payload": { "items": payloads }
                                                        }
                                              }
                      });
            }
          });
        }
      };
      browser.runtime.onMessage.addListener(listener);
    });
  };

  const tonConnectReconnect = async (data, origin) => {
    const getPayloads = async () => {
      const walletAddress = await new Promise((resolve) => {
        currentAccount.subscribe(async (value) => {
          resolve(value.address);
        });
      });
      // need to check auto-reconnect for the user and pass without confirmation
      const payloads = [];

      const tonAddrItem = await tonConnectTonAddrItem(walletAddress);
      payloads.push(tonAddrItem);

      return payloads;
    };

    data.origin = origin;

    const walletIsLockedObject = await accountsController.walletIsLocked();
    if (await checkPermission({method: "tonConnect_reconnect"}, origin) && !walletIsLockedObject.locked) {
      return new Promise((resolve, reject) => {
        getPayloads().then((payloads) => {
          if (payloads.length == 0) {
            resolve({"id": data.id, "data": { code: 4000, 
                                              data: {event: "connect_error",
                                                      payload: {
                                                        code: 1,
                                                        message: "Empty response due to wrong incoming items"
                                                      }
                                                    }
                                            }
                    });
          } else {
            resolve({"id": data.id, "data": { code: 4000, 
                                            data: { event: 'connect', 
                                                    payload: {items: payloads}
                                                  }
                                          }
                  });
          }
        });
      });
    } else {
      // we must to check that the current account has tonConnect_connect permission, because we can't reconnect from another account
      if (await checkPermission({method: "tonConnect_connect"}, origin)) {
        openRequestPopup('ModalTonReconnectAccount', data);
        return new Promise((resolve, reject) => {
          const listener = (message) => {
            if (message.type === "popupMessageResponse" && message.id == data.id) {
              browser.runtime.onMessage.removeListener(listener);
              closeRequestPopup();
              if (message.data.code != 4000) {
                resolve({"id": data.id, "data": { "code": 4000, 
                    "data": {"event": "connect_error",
                      "payload": {
                        "code": message.data.code == 4001 ? 300: 1,//1	Bad request, 300 User rejected
                        "message": message.data.message
                      }
                    }
                  }
                });
                return;
              }
              getPayloads().then((payloads) => {
                if (payloads.length == 0) {
                  resolve({"id": data.id, "data": { code: 4000, 
                                                    data: {event: "connect_error",
                                                            payload: {
                                                              code: 1,
                                                              message: "Empty response due to wrong incoming items"
                                                            }
                                                          }
                                                  }
                          });
                } else {
                  resolve({"id": data.id, "data": { code: 4000, 
                                                  data: { event: 'connect', 
                                                          payload: {items: payloads}
                                                        }
                                                }
                        });
                }
              });
            }
          };
          browser.runtime.onMessage.addListener(listener);
        });
      } else {
        return {"id": data.id, "data": { code: 4000, 
                                          data: {event: "connect_error",
                                                  payload: {
                                                    code: 1,
                                                    message: "No permission for reconnect, maybe it is another account"
                                                  }
                                                }
                                        }
                };
      }
    }
  };

  const tonConnectDisconnect = async (data, origin) => {
    const account = await new Promise((resolve) => {
      currentAccount.subscribe((value) => {
        resolve(value.address);
      });
    });

    await accountsController.removePermissions(account, origin, ['tonConnect_connect', 'tonConnect_disconnect', 'tonConnect_reconnect']);
    return {"id": data.id, "data": { code: 4000, data: {  event: 'disconnect',
                                                          payload: {},
                                                        }
                                    }
            };
  };

  const tonConnectSendTransaction = async (data, origin) => {
    let result;
    switch(data.params.method) {
      case "sendTransaction":
        const parsedParams = JSON.parse(data.params.params);
        if (parsedParams.network) {
          const endpoint = await new Promise((resolve) => {
            currentNetwork.subscribe((value) => {
              resolve(value.server);
            });
          });
          //network (NETWORK, optional): The network (mainnet or testnet) where DApp intends to send the transaction. If not set, the transaction 
          //is sent to the network currently set in the wallet, but this is not safe and DApp should always strive to set the network. If the network 
          //parameter is set, but the wallet has a different network set, the wallet should show an alert and DO NOT ALLOW TO SEND this transaction.
          if (parsedParams.network != (endpoint === 'mainnet' ? '-239' : '-3')) {
            openRequestPopup("ModalError", { message: "This transaction is for another network" });
            return new Promise((resolve, reject) => {
              // let's show 5 seconds popup with the error, then close it and send it
              setTimeout(() => {
                sendRequestReject(data.id);
                closeRequestPopup();
                resolve({"id": data.id, "data": { code: 4000, data: {  error: { code: 1, message: "Another network" },
                                                                      id: data.params.id
                                                                    }}});
              }, 5000);
            });
          }
        }
        if (parsedParams.from) {
          let parsedAddress = "";
          try {
            parsedAddress = await sdkController.parseAddress(parsedParams.from);
          } catch(e) {
            openRequestPopup("ModalError", { message: "This transaction is for another account" });
            return new Promise((resolve, reject) => {
              // let's show 5 seconds popup with the error, then close it and send it
              setTimeout(() => {
                sendRequestReject(data.id);
                closeRequestPopup();
                resolve({"id": data.id, "data": { code: 4000, data: {  error: { code: 1, message: "Not valid address in `from` parameter" },
                                                                      id: data.params.id
                                                                    }}});
              }, 5000)
            });
          }

          const walletAddress = await new Promise((resolve) => {
            currentAccount.subscribe(async (value) => {
              resolve(value.address);
            });
          });
          //from (string in : format, optional) - The sender address from which DApp intends to send the transaction. If not set, wallet allows user 
          //to select the sender's address at the moment of transaction approval. If from parameter is set, the wallet should DO NOT ALLOW user to select 
          //the sender's address; If sending from the specified address is impossible, the wallet should show an alert and DO NOT ALLOW TO SEND this transaction.
          if (parsedAddress.toString(true, true, true, false) != walletAddress) {
            openRequestPopup("ModalError", { message: "This transaction is for another account" });
            return new Promise((resolve, reject) => {
              // let's show 5 seconds popup with the error, then close it and send it
              setTimeout(() => {
                sendRequestReject(data.id);
                closeRequestPopup();
                resolve({"id": data.id, "data": { code: 4000, data: {  error: { code: 1, message: "Another account" },
                                                                      id: data.params.id
                                                                    }}});
              }, 5000)
            });
          }
        }
        if (!Array.isArray(parsedParams.messages)) {
          return {
            id: data.id,
            data: {
              code: 4000,
              data: {
                error: { code: 1, message: "Bad request" },
                id: data.params.id,
              },
            },
          };
        }
        let remainMessages = parsedParams.messages.length;
        if (remainMessages == 0 || remainMessages > 4) {
          return {"id": data.id, "data": { code: 4000, data: {  error: { code: 1, message: "Bad request" },
                                                                id: data.params.id
                                                              }}};
        }
        const modalDataQueue = [];
        const modalDataQueueResult = [];
        let error = false;
        let totalBalance = 0;
        for (let i in parsedParams.messages) {
          const modalData = { ...data };
          modalData.params = {};
          modalData.params.to = parsedParams.messages[i].address;
          modalData.params.amount = parsedParams.messages[i].amount;
          totalBalance += Number(parsedParams.messages[i].amount).valueOf();
          //(integer, optional): unix timestamp. after this moment transaction will be invalid.
          if (parsedParams.valid_until) {
            modalData.params.valid_until = parsedParams.valid_until;
          }
          if (parsedParams.messages[i].payload) {
            modalData.params.data = parsedParams.messages[i].payload;
            modalData.params.dataType = "boc";
          }
          if (parsedParams.messages[i].stateInit) {
            modalData.params.stateInit = parsedParams.messages[i].stateInit;
          }
          modalData.id = modalData.id + i;
          modalDataQueue.push(modalData);
        }
        const currentEndpoint = await new Promise((resolve) => {
          currentNetwork.subscribe((value) => {
            resolve(value.server);
          });
        });
        const balance = await new Promise((resolve) => {
          currentAccount.subscribe((value) => {
            resolve(value.balance[currentEndpoint]);
          });
        });
        if (lt(balance, totalBalance + toNano(APPROXIMATE_FEE))) {
          return new Promise((resolve, reject) => {
                resolve({"id": data.id, "data": {
                  code: 4300,
                  message: "Not enough balance",
                }});
          });
        } else {
          openRequestPopup('ModalSendingRawTransaction', modalDataQueue.shift());
          result = new Promise((resolve, reject) => {
            const listener = (message) => {
              if (message.type === "popupMessageResponse" && message.id.substr(0, message.id.length-1) == data.id) {
                remainMessages--;
                closeRequestPopup();

                if (message.data.code == 4001) { // User reject
                  modalDataQueueResult.push({"error": {"code": 300, "message": "User declined the transaction"}, "id": parseInt(message.id.substr(-1))});
                  error = true;
                } else if (message.data.code == 4300) { // Another error
                  modalDataQueueResult.push({"error": {"code": 300, "message": message.data.message}, "id": parseInt(message.id.substr(-1))});
                  error = true;
                } else {
                  modalDataQueueResult.push({"result": "", "id": parseInt(message.id.substr(-1))});
                }

                if (remainMessages == 0) {
                  browser.runtime.onMessage.removeListener(listener);
                  // @TODO by specification we should return common result, but what else the user will decline one message?
                  // need to return  status by all messages in array - modalDataQueueResult
                  //console.log(modalDataQueueResult);
                  if (error) {
                    resolve({"id": data.id, "data": { code: 4000, data: {error: {code: 300, message: "User declined the transaction"}, "id": message.id.substr(-1)}}}); 
                  } else {
                    resolve({"id": data.id, "data": { code: 4000, data: {result: "", "id": message.id.substr(-1)}}});
                  }
                  return;
                }

                if (modalDataQueue != 0) {
                  // we need to wait some time before show the next in the queue, because the wallet must to change internal id to accept this new tx
                  let checkWaiting = async () => {
                    const endpoint = await new Promise((resolve) => {
                      currentNetwork.subscribe((value) => {
                        resolve(value.server);
                      });
                    });
                    const walletAddress = await new Promise((resolve) => {
                      currentAccount.subscribe((value) => {
                        resolve(value.address);
                      });
                    });

                    let needCheckAgain = false;
                    try {
                      let checkNewTransactionsResult = await checkNewTransactions(walletAddress, endpoint);
                      if (checkNewTransactionsResult) {
                        accountStore.removeWaitingTransaction(endpoint + "-" + walletAddress);
                      } else {
                        const waiting = await new Promise((resolve) => {
                          waitingTransaction.subscribe((value) => {
                            resolve(value);
                          });
                        });
                        needCheckAgain = waiting.includes(endpoint + "-" + walletAddress);
                      }
                    } catch(e) {
                      needCheckAgain = true;
                    }

                    if (needCheckAgain) {
                      setTimeout(() => {
                        checkWaiting();
                      }, 5000);
                    } else {
                      openRequestPopup('ModalSendingRawTransaction', modalDataQueue.shift());
                    }
                  };
                  checkWaiting();
                }
              }
            };
            browser.runtime.onMessage.addListener(listener);
          });
        }
        break;
      case "signData":
        result = {"id": data.id, "data": { code: 4000, data: {  error: { code: 400, message: "Method is not supported" },
                                                                id: data.params.id
                                                              }}};
        break;
      case "disconnect":
        // we don't need to receive any confirmations from the user side
        result = {"id": data.id, "data": { code: 4000, data: {  result: { }, id: data.params.id }}};
        break;
      default:
        result = {"id": data.id, "data": { code: 4000, data: {  error: { code: 400, message: "Method is not supported" },
                                                                id: data.params.id
                                                              }}};
      }
    return result;
  };

  const tonConnectTonAddrItem = async (accountAddress) => {
    const endpoint = await new Promise((resolve) => {
      currentNetwork.subscribe((value) => {
        resolve(value.server);
      });
    });
    const stateInit = await accountsController.getWalletStateInit(accountAddress, endpoint);
    const parsedAddress = await sdkController.parseAddress(accountAddress);
    return {
      name: 'ton_addr',
      address: parsedAddress.toString(false),
      network: endpoint === 'mainnet' ? '-239' : '-3',
      walletStateInit: stateInit,
    };
  };

  const tonConnectTonProofItem = async (walletAddress, domain, payload) => {
    const timestamp = Math.round(Date.now() / 1000);
    const parsedAddress = await sdkController.parseAddress(walletAddress);
    const _proof = await sdkController.makeTonProof(parsedAddress, domain, timestamp, payload);
    const sha256Buffer = await sdkController.sha256(Unibabel.hexToBuffer(_proof));
    const sha256Hash = Unibabel.bufferToHex(Object.values(new Uint8Array(sha256Buffer)));
    const bufferToSign = 'ffff' + strToHex('ton-connect') + sha256Hash;
    const bufferToSignSha256 = await sdkController.sha256(Unibabel.hexToBuffer(bufferToSign));
    const signature = await accountsController.getSignForData(walletAddress, Unibabel.bufferToHex(Object.values(new Uint8Array(bufferToSignSha256))));
    return {
      name: 'ton_proof',
      proof: {
        timestamp,
        domain: {
          lengthBytes: domain.length,
          value: domain,
        },
        signature: Unibabel.bufferToBase64(Unibabel.hexToBuffer(signature)),
        payload,
      },
    };
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
    savePermissionsList,
    getPermissionsList,
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
    addWaitingTransaction,
    getSubscriptionId,
    removeSubscriptionId,
    tonConnectConnect,
    tonConnectReconnect,
    tonConnectDisconnect,
    tonConnectSendTransaction,
    getFamousTokens,
    importToken,
    getNftContent,
    getTokenListForUser
  };
};
