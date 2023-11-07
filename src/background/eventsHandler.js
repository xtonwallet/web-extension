import {
  lastActionTimestamp,
  currentAutologout
} from "./../common/stores.js";
import methodsList from "./../common/methodsList.js";

browser.alarms.create("autologoutInterval", { "periodInMinutes": 5 });

export const eventsHandler = (controller) => {
  const fromPage = (sender) => {
    return sender.id == browser.runtime.id && sender.url.indexOf(`${browser.runtime.id}/page.html`) !== -1;
  }; // check that event from page.html

  const fromPopup = (sender) => {
    return sender.id == browser.runtime.id && sender.url.indexOf(`${browser.runtime.id}/popup.html`) !== -1;
  }; // check that event from popup.html

  const fromContent = (sender) => {
    return sender.id == browser.runtime.id;
  }; // check that event from external page, but sent from this extension

  currentAutologout.subscribe((value) => {
    browser.alarms.clear("autologoutInterval");
    browser.alarms.create("autologoutInterval", { "periodInMinutes": Number(value).valueOf() });
  });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "autologoutInterval") {
      const timestamp = await new Promise((resolve) => {
        lastActionTimestamp.subscribe((value) => {
          resolve(value);
        });
      });

      // get setting about autologout period
      const autologout = await new Promise((resolve) => {
        currentAutologout.subscribe((value) => {
          resolve(value);
        });
      });
      if (timestamp + autologout * 60 < ~~(new Date().getTime()/1000)) {
        controller.lock();
        browser.alarms.clear("autologoutInterval");
      }
    }
  });

  browser.runtime.onMessage.addListener( async (message, sender) => {
    // mark that the user is working
    lastActionTimestamp.set(~~(new Date().getTime()/1000));

    const isFromPage = fromPage(sender);
    const isFromPopup = fromPopup(sender);
    const isFromContent = fromContent(sender);

    //Reject any messages not from the App itself of from the autorized Dapp List.
    if (!isFromPopup && !isFromPage && !isFromContent) {
      return Promise.resolve("Wrong origin");
    } else {
      if (isFromContent) {
        // The web3 style request
        if (message.type === 'xtonwallet-request') {
          const data = {"id": message.data.id, "method": message.data.method, "params": message.data.params};

          if (methodsList[data.method]) {
            if (methodsList[data.method].MustBeAllowed) {
              const grantedPermission = await controller.checkPermission(data, sender.origin);
              if (!grantedPermission) {
                return Promise.resolve({"id": message.data.id, "data": {code: 4100, message: 'The requested method and/or account has not been authorized by the user.'}});
              }
            }
            if (methodsList[data.method].RequiredParams.length != 0) {
              let wrongParams = false;
              for (let i in methodsList[data.method].RequiredParams) {
                const paramName = Object.keys(methodsList[data.method].RequiredParams[i])[0];
                const paramType = methodsList[data.method].RequiredParams[i][paramName];
                if (typeof message.data.params[paramName] == "undefined") {
                  wrongParams = true;
                  break;
                }
                if (paramType == 'string' && typeof message.data.params[paramName] != 'string') {
                  wrongParams = true;
                  break;
                }
                if (paramType == 'number' && typeof message.data.params[paramName] != 'number') {
                  wrongParams = true;
                  break;
                }
                if (paramType == 'array' && !Array.isArray(message.data.params[paramName])) {
                  wrongParams = true;
                  break;
                }
              }
              if (wrongParams) {
                return Promise.resolve({"id": message.data.id, "data": {code: 4201, message: `Wrong parameters. Parameters for this method: '${methodsList[data.method].RequiredParams.map((item) => {return `${Object.keys(item)[0]}' must be '${Object.values(item)[0]}'`} ).join(', ')}`}});
              }
            }
          } else {
            //Maybe this request try to run SDK method
            const arrMethodName= data.method.split('_');
            const parsedMethodName = arrMethodName.splice(0,2);
                  parsedMethodName.push(arrMethodName.join('_'));

            const methodExist = await controller.sdk.checkThatSdkMethodExists(parsedMethodName[1], parsedMethodName[2]);
            if (parsedMethodName[0] == "ton" && methodExist) {
              const result = await controller.runSdkMethod(parsedMethodName[1], parsedMethodName[2], message.data.params);
              return Promise.resolve({"id": message.data.id, "data": {code: 4000, data: result}});
            } else {
              return Promise.resolve({"id": message.data.id, "data": {code: 4200, message: 'Unsupported Method'}});
            }
          }

          if (data.method === 'getProviderState') {
            return Promise.resolve(controller.getProviderState(data, sender.origin));
          }
          if (data.method === 'wallet_getSdkVersion') {
            return Promise.resolve(controller.getSdkVersion(data, sender.origin));
          }
          if (data.method === 'wallet_getPermissions') {
            return Promise.resolve(controller.getPermissions(data, sender.origin));
          }
          if (data.method === 'wallet_requestPermissions') {
            return Promise.resolve(controller.requestPermissions(data, sender.origin));
          }
          if (data.method === 'wallet_watchAsset') {
            return Promise.resolve(controller.watchAsset(data, sender.origin));
          }
          if (data.method === 'ton_account') {
            return Promise.resolve(controller.getCurrentAccount(data, sender.origin));
          }
          if (data.method === 'ton_endpoint') {
            return Promise.resolve(controller.getCurrentEndpoint(data, sender.origin));
          }
          if (data.method === 'ton_sendTransaction') {
            data.params.allBalance = false; // we don't need to allow this from web3
            return Promise.resolve(controller.sendTransaction(data, sender.origin));
          }
          if (data.method === 'ton_sendRawTransaction') {
            return Promise.resolve(controller.sendRawTransaction(data, sender.origin));
          }
          if (data.method === 'ton_signMessage') {
            return Promise.resolve(controller.signMessage(data, sender.origin));
          }
          if (data.method === 'ton_encryptMessage') {
            return Promise.resolve(controller.encryptMessage(data, sender.origin));
          }
          if (data.method === 'ton_decryptMessage') {
            return Promise.resolve(controller.decryptMessage(data, sender.origin));
          }
          if (data.method === 'ton_crypto_generate_random_bytes') {
            return Promise.resolve(controller.cryptoGenerateRandomBytes(data, sender.origin));
          }
          if (data.method === 'ton_getNaclBoxPublicKey') {
            return Promise.resolve(controller.getNaclBoxPublicKey(data, sender.origin));
          }
          if (data.method === 'ton_getSignature') {
            return Promise.resolve(controller.getMessageSignature(data, sender.origin));
          }

          if (data.method === 'ton_subscribe') {
            return Promise.resolve(controller.getSubscriptionId(data, sender.origin));
          }
          if (data.method === 'ton_unsubscribe') {
            return Promise.resolve(controller.removeSubscriptionId(data, sender.origin));
          }

          if (data.method === 'tonConnect_connect') {
            return Promise.resolve(controller.tonConnectConnect(data, sender.origin));
          }

          if (data.method === 'tonConnect_reconnect') {
            return Promise.resolve(controller.tonConnectReconnect(data, sender.origin));
          }

          if (data.method === 'tonConnect_disconnect') {
            return Promise.resolve(controller.tonConnectDisconnect(data, sender.origin));
          }

          if (data.method === 'tonConnect_sendTransaction') {
            return Promise.resolve(controller.tonConnectSendTransaction(data, sender.origin));
          }

          return Promise.resolve({"id": message.data.id, "data": {code: 4200, message: 'Unsupported Method'}});
        }
      }

      if (isFromPage || isFromPopup) {

        if (message.type === 'createPassword') return Promise.resolve(controller.createPassword(message.data));

        if (message.type === 'deployNewWallet') return Promise.resolve(controller.accounts.deployNewWallet(message.data.accountAddress, message.data.server));

        if (message.type === 'walletIsLocked') {
          return Promise.resolve(controller.accounts.walletIsLocked());
        }

        if (message.type === 'lockWallet') {
          browser.alarms.clear("autologoutInterval");
          return Promise.resolve(controller.lock());
        }

        if (message.type === 'isFirstRun') return Promise.resolve(controller.accounts.firstRun());

        if (message.type === 'checkPassword') return Promise.resolve(controller.accounts.checkPassword(message.data));

        if (message.type === 'unlockWallet') {
          currentAutologout.subscribe((value) => {
            browser.alarms.clear("autologoutInterval");
            browser.alarms.create("autologoutInterval", { "periodInMinutes": Number(value).valueOf() });
          });
          return Promise.resolve(controller.unlock(message.data));
        }

        const walletIsLocked = controller.accounts.walletIsLocked();
        if (!walletIsLocked.locked) {
          // Account
          if (message.type === 'backupKeystore') return Promise.resolve(controller.accounts.createKeystore(message.data));

          if (message.type === 'decryptKeys') return Promise.resolve(controller.accounts.decryptKeys(message.data));

          if (message.type === 'addNewAccount') return Promise.resolve(controller.accounts.addNewAccount(message.data));

          if (message.type === 'addAccounts') return Promise.resolve(controller.accounts.addAccounts(message.data.full, message.data.encrypted));

          if (message.type === 'addAccountByKeys') return Promise.resolve(controller.accounts.addAccountByKeys(message.data.nickname, message.data.keyPair, message.data.version));

          if (message.type === 'addAccountBySeed') return Promise.resolve(controller.accounts.addAccountBySeed(message.data.nickname, message.data.seed, message.data.version));

          if (message.type === 'getAllAccounts') return Promise.resolve(controller.accounts.getSanatizedAccounts(message.data));

          if (message.type === 'getTransactions') return Promise.resolve(controller.accounts.getTransactions(message.data.accountAddress, message.data.server, message.data.count, message.data.page));

          if (message.type === 'calculateFee') return Promise.resolve(controller.calculateFee(message.data.accountAddress, message.data.server,  message.data.txData));

          if (message.type === 'runTransaction') return Promise.resolve(controller.runTransaction(message.data.accountAddress, message.data.server,  message.data.txData));

          if (message.type === 'checkNewTransactions') return Promise.resolve(controller.checkNewTransactions(message.data.accountAddress, message.data.server));

          if (message.type === 'takeFromGiver') return Promise.resolve(controller.accounts.takeFromGiver(message.data.accountAddress, message.data.server));

          if (message.type === 'getDeployedState') return Promise.resolve(controller.accounts.getDeployedState(message.data.accountAddress, message.data.server));

          if (message.type === 'getCurrentBalance') return Promise.resolve(controller.accounts.getCurrentBalance(message.data.accountAddress, message.data.server));

          if (message.type === 'changeAccountNickname') return Promise.resolve(controller.accounts.changeAccountNickname(message.data.accountAddress, message.data.nickname));

          if (message.type === 'changeAccount') return Promise.resolve(controller.changeAccount(message.data));

          if (message.type === 'deleteAccount') return Promise.resolve(controller.accounts.deleteAccount(message.data));

          // Network
          if (message.type === 'getAllNetworks') return Promise.resolve(controller.networks.getAllNetworks(message.data));

          if (message.type === 'addNewNetwork') return Promise.resolve(controller.addNewNetwork(message.data));

          if (message.type === 'changeNetwork') return Promise.resolve(controller.changeNetwork(message.data));

          if (message.type === 'removeNetworks') return Promise.resolve(controller.removeNetworks(message.data));

          if (message.type === 'updateTransactions') return Promise.resolve(controller.updateTransactions(message.data.accountAddress, message.data.server));

          // Settings
          if (message.type === 'setSettings') return Promise.resolve(controller.setSettings(message.data));

          if (message.type === 'setPincode') return Promise.resolve(controller.accounts.setPincode(message.data));

          // Permissions
          if (message.type === 'saveGrantedPermissions') return Promise.resolve(controller.saveGrantedPermissions(message.data));

          if (message.type === 'getPermissionsList') return Promise.resolve(controller.getPermissionsList(message.data));

          if (message.type === 'savePermissionsList') return Promise.resolve(controller.savePermissionsList(message.data));

          // SDK
          if (message.type === 'signMessage') return Promise.resolve(controller.getSignForData(message.data));

          if (message.type === 'encryptMessage') return Promise.resolve(controller.doEncryptionForMessage(message.data));

          if (message.type === 'decryptMessage') return Promise.resolve(controller.doDecryptionForMessage(message.data));

          if (message.type === 'getSignature') return Promise.resolve(controller.getSignature(message.data));

          if (message.type === 'addWaitingTransaction') return Promise.resolve(controller.addWaitingTransaction(message.data));

          //Tokens
          if (message.type === 'getFamousTokens') return Promise.resolve(controller.getFamousTokens(message.data));

          if (message.type === 'importToken') return Promise.resolve(controller.importToken(message.data));
          
          if (message.type === 'getNftContent') return Promise.resolve(controller.getNftContent(message.data));

          if (message.type === 'tokenList') return Promise.resolve(controller.getTokenListForUser(message.data));

          if (message.type === 'getTokenInfo') return Promise.resolve(controller.accounts.getTokenInfo(message.data.server, message.data.tokenAddress));

          if (message.type === 'removeTokens') return Promise.resolve(controller.removeTokens(message.data));
        }
      }
    }
  });
};
