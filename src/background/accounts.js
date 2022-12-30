import { Vault } from "../common/vault.js";
import { toNano, generateRandomHex, encrypt, decrypt, broadcastMessage, sendNotificationToInPageScript, hexToStr, Unibabel, getRate } from "../common/utils.js";
import TonLib from "../common/tonLib.js";
import { CURRENT_KS_PASSWORD, accountStore, currentRetrievingTransactionsPeriod, currentRetrievingTransactionsLastTime, settingsStore, currentEnabledPinPad, currentCurrency, messageSubscriptions } from "../common/stores.js";
import BigNumber from "bignumber.js";

const devMode = __DEV_MODE__;

const DEPLOY_WALLET_VALUE = toNano(0.01);
const TRANSFER_WALLET_VALUE = toNano(0.05);

browser.alarms.create("retrievingTransactions", { "periodInMinutes": 1 });

export const accounts = () => {
  let currentPassword = "";
  const vault = new Vault();

  vault.init();

  let retrievingTransactionsLastTime;
  currentRetrievingTransactionsPeriod.subscribe((value) => {
    browser.alarms.clear("retrievingTransactions");
    browser.alarms.create("retrievingTransactions", { "periodInMinutes": Number(value).valueOf() });
  });

  currentRetrievingTransactionsLastTime.subscribe((value) => {
    retrievingTransactionsLastTime = value;
  });

  const getComment = (msg) => {
    if (!msg.msg_data) return '';
    if (msg.msg_data['@type'] !== 'msg.dataText') return '';
    const base64 = msg.msg_data.text;
    return new TextDecoder().decode(TonLib.instance.utils.base64ToBytes(base64));
  };

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "retrievingTransactions") {
      const networks = await vault.getNetworks();
      const accounts = await vault.getAccounts();
      const allAddresses = accounts.map((item) => {return item.address});

      let needToUpdateWalletUI = false;
      for (let i in networks) {
        const network          = networks[i];
        const server           = networks[i].server;

        const TonLibClient     = await TonLib.getClient(server);
        //here can be case when network is not responded
        let transactions = [];
        let tokenWallets = {};
        let walletsTokenInfo = {};
        try {
          for (let index in allAddresses) {

            accountStore.removeWaitingTransaction(server + "-" + allAddresses[index]);

            const tokenList = await vault.tokenList(allAddresses[index], server);
            if (tokenList && tokenList.length != 0) {
              tokenList.forEach((item) => {
                tokenWallets[item.wallet] = allAddresses[index];
                walletsTokenInfo[item.wallet] = item;
              });
            }

            // regular txs
            const result = await TonLibClient.requestAccountTransactions(allAddresses[index], retrievingTransactionsLastTime);
            transactions = transactions.concat(result);
          }
          // token wallets
          for (let walletAddress in tokenWallets) {
            const result = await TonLibClient.requestAccountTransactions(walletAddress, retrievingTransactionsLastTime);
            transactions = transactions.concat(result);
          }
          if (transactions.length === 0) {
            continue;
          }
        } catch(e) {
          if (devMode) {
            console.log(server, e);
          }
          continue;
        }
        const transactionsAddresses = transactions.map((item) => {return item.in_msg.destination}).filter((v, i, a) => a.indexOf(v) === i);
        for (let j in transactionsAddresses) {
          // we need to replace token wallet address on the owner address
          if (typeof tokenWallets[transactionsAddresses[j]] != "undefined") {
            transactionsAddresses[j] = tokenWallets[transactionsAddresses[j]];
          }
          const lastTransactions = await vault.getTransactions(transactionsAddresses[j], server, 50, 1);
          const txIds = lastTransactions.map((tx) => {
            return tx.id;
          });
          for (let i in transactions) {
            if (txIds.includes(transactions[i].transaction_id.hash) ||
                (transactions[i].in_msg.destination != transactionsAddresses[j] &&
                (typeof tokenWallets[transactions[i].in_msg.destination] == "undefined" ||
                  tokenWallets[transactions[i].in_msg.destination] != transactionsAddresses[j]
                  )
                )
              ) {
              continue;
            }
            const txData = transactions[i];

            let detectedToken;

            if (txData.in_msg.msg_data.body) {
              detectedToken = await detectTokenTransaction(server, txData.in_msg.msg_data.body);
            } else {
              detectedToken = "error";
            }

            if (detectedToken != "error") {
              if (detectedToken.standard == "74") {
                txData.type          = detectedToken.type;
                txData.comment       = detectedToken.forwardPayload;
                txData.amount        = detectedToken.amount;
                txData.tokenAddress  = walletsTokenInfo[transactions[i].in_msg.destination].address;
                txData.walletAddress = walletsTokenInfo[transactions[i].in_msg.destination].wallet;
                txData.tokenSymbol   = walletsTokenInfo[transactions[i].in_msg.destination].symbol;
                txData.tokenName     = walletsTokenInfo[transactions[i].in_msg.destination].name;
                txData.tokenIcon     = walletsTokenInfo[transactions[i].in_msg.destination].icon;
                txData.detectedToken = detectedToken;
                txData.coinName      = network.coinName;
                txData.id            = txData.transaction_id.hash;
                txData.now           = txData.utime;
                await addTransaction(transactionsAddresses[j], server, txData);
                needToUpdateWalletUI = true;
              }
            } else {
              if (txData.in_msg.source == "" && txData.out_msgs.length == 0) {
                txData.type = "deploy";
                txData.amount  = txData.fee * -1;

                const walletDeployed = await checkWalletDeployed(transactions[i].in_msg.destination);
                if (walletDeployed.deployed.includes(server) !== true) {
                  await vault.markAsDeployed(transactions[i].in_msg.destination, server);
                }
                await vault.setWalletVersion(transactions[i].in_msg.destination, walletDeployed.version);
              }
              else if (txData.in_msg.source == "" && txData.out_msgs.length) {
                txData.type = "transfer";
                txData.amount  = txData.out_msgs[0].value * -1;
                txData.comment = getComment(txData.out_msgs[0]);
              } else if (txData.in_msg.source != "" && txData.out_msgs.length == 0) {
                txData.type    = "incoming";
                txData.amount  = txData.in_msg.value;
                txData.comment = getComment(txData.in_msg);
              } else {
                txData.type    = "error";
                txData.amount  = txData.in_msg.value;
                txData.comment = "";
              }

              txData.coinName     = network.coinName;
              txData.id           = txData.transaction_id.hash;
              txData.now          = txData.utime;
              await addTransaction(transactionsAddresses[j], server, txData);
              needToUpdateWalletUI = true;
            }
          }
        }
      }
      if (needToUpdateWalletUI) {
        broadcastMessage("updateWalletUI");
      }
      settingsStore.setRetrievingTransactionsLastTime(~~(new Date().getTime()/1000));

      const сurrency = await new Promise((resolve) => {
        currentCurrency.subscribe((value) => {
          resolve(value);
        });
      });

      const result = await getRate(сurrency);
      settingsStore.setRate(result);
    }
  });

  const updateTransactionsList = async (address, server, fromStart = false) => {
    accountStore.removeWaitingTransaction(server + "-" + address);
    const TonLibClient     = await TonLib.getClient(server);
    const network          = await vault.getNetwork(server);
    const lastTransactions = await vault.getTransactions(address, server, 50, 1);
    const txIds = lastTransactions.map((tx) => {
      return tx.id;
    });
    let tokenWallets = {};
    let walletsTokenInfo = {};
    let retrievingTransactionsLastTime;
    currentRetrievingTransactionsLastTime.subscribe((value) => {
      retrievingTransactionsLastTime = value;
    });

    const tokenList = await vault.tokenList(address, server);
    if (tokenList && tokenList.length != 0) {
      tokenList.forEach((item) => {
        tokenWallets[item.wallet] = address;
        walletsTokenInfo[item.wallet] = item;
      });
    }

    //here can be case when network is not responded
    let transactions = [];
    try {
      transactions = await TonLibClient.requestAccountTransactions(address, fromStart ? 0: retrievingTransactionsLastTime);

      // token wallets
      for (let walletAddress in tokenWallets) {
        const result = await TonLibClient.requestAccountTransactions(walletAddress, retrievingTransactionsLastTime);
        transactions = transactions.concat(result);
      }
      
      if (transactions.length === 0) {
        return;
      }
    } catch(e) {
      if (devMode) {
        console.log(e);
      }
      return;
    }
    let needToUpdateWalletUI = false;
    for (let i in transactions) {
      if (txIds.includes(transactions[i].id) === true) {
        continue;
      }
      const txData = transactions[i];

      let detectedToken;

      if (txData.in_msg.msg_data.body) {
        detectedToken = await detectTokenTransaction(server, txData.in_msg.msg_data.body);
      } else {
        detectedToken = "error";
      }

      if (detectedToken != "error") {
        if (detectedToken.standard == "74") {
          txData.type          = detectedToken.type;
          txData.comment       = detectedToken.forwardPayload;
          txData.amount        = detectedToken.amount;
          txData.tokenAddress  = walletsTokenInfo[transactions[i].in_msg.destination].address;
          txData.walletAddress = walletsTokenInfo[transactions[i].in_msg.destination].wallet;
          txData.tokenSymbol   = walletsTokenInfo[transactions[i].in_msg.destination].symbol;
          txData.tokenName     = walletsTokenInfo[transactions[i].in_msg.destination].name;
          txData.tokenIcon     = walletsTokenInfo[transactions[i].in_msg.destination].icon;
          txData.detectedToken = detectedToken;
          txData.coinName      = network.coinName;
          txData.id            = txData.transaction_id.hash;
          txData.now           = txData.utime;
          await addTransaction(address, server, txData);
          needToUpdateWalletUI = true;
        }
      } else {
        if (txData.in_msg.source == "" && txData.out_msgs.length == 0) {
          txData.type = "deploy";
          txData.amount  = txData.fee * -1;

          const walletDeployed = await checkWalletDeployed(transactions[i].in_msg.destination);
          if (walletDeployed.deployed.includes(server) !== true) {
            await vault.markAsDeployed(transactions[i].in_msg.destination, server);
          }
          await vault.setWalletVersion(transactions[i].in_msg.destination, walletDeployed.version);
        }
        else if (txData.in_msg.source == "" && txData.out_msgs.length) {
          txData.type = "transfer";
          txData.amount  = txData.out_msgs[0].value * -1;
          txData.comment = getComment(txData.out_msgs[0]);
        } else if (txData.in_msg.source != "" && txData.out_msgs.length == 0) {
          txData.type    = "incoming";
          txData.amount  = txData.in_msg.value;
          txData.comment = getComment(txData.in_msg);
        } else {
          txData.type    = "error";
          txData.amount  = txData.in_msg.value;
          txData.comment = "";
        }

        txData.coinName     = network.coinName;
        txData.id           = txData.transaction_id.hash;
        txData.now          = txData.utime;
        await addTransaction(address, server, txData);
        needToUpdateWalletUI = true;
      }
    }
    if (needToUpdateWalletUI) {
      broadcastMessage("updateWalletUI");
    }
  };

  /*
  //@TODO for batch updates
  const addressesRelatedToAccount = async (accountAddress, server) => {
    const tokenList = await vault.tokenList(accountAddress, server);
    const addresses = {};
    for( let i in tokenList) {
      if (tokenList[i].type == 74) {
        const walletAddress = await getTokenType74WalletAddress(server, tokenList[i].address, accountAddress);
        addresses[walletAddress] = tokenList[i];
      }
    }
    return addresses;
  };
  */

  const updateTransactionsListAllNetworks = async (address) => {
    const networks = await vault.getNetworks();
    for (let i in networks) {
      await updateTransactionsList(address, networks[i].server, true);
    }
  };

  const firstRun = async () => {
    return await vault.getAccountCount() == 0;
  };

  const createPassword = async (password) => {
    currentPassword = password;
    const key = generateRandomHex(256);
    const encrypted = await encrypt(currentPassword, {"key": key});
    await vault.addMasterKey(1, key, encrypted);
    return true;
  };

  const checkPassword = (password) => {
    return password === currentPassword;
  };

  const addNewAccount = async (nickname) => {
    const TonLibClient = await TonLib.getClient();
    const seed         = await TonLibClient.generateSeed();
    const keys         = await TonLibClient.convertSeedToKeys(seed);
    //prepare for saving
    const keyPair = {
      public: Unibabel.bufferToHex(Object.values(keys.publicKey)),
      secret: Unibabel.bufferToHex(Object.values(keys.secretKey))
    };
    const address = await TonLibClient.predictAddress(keyPair.public);
    const account = {
      address: address,
      nickname: nickname,
      balance: {},
      transactions: {},
      updatedDate: ~~(new Date().getTime()/1000), //rounded to seconds
      createdDate: ~~(new Date().getTime()/1000), //rounded to seconds
      contactList: {},
      contractList: {},
      tokenList: {},
      deployed: [],
      encrypted: await encrypt(currentPassword, keyPair) // must be encrypted
    };
    try {
      if (await vault.addNewAccount(account)) {
        accountStore.changeAccount(account);
        return { added: true,
          seed: seed.join(' '),
          account: {
            address: address,
            nickname: nickname,
            deployed: [],
            balance: {},
          },
          reason: `Added ${account.nickname} to your wallet`
        };
      } else {
        throw Error("Account by this address already exists");
      }
    } catch (e) {
      return {added: false, reason: e.message};
    }
  };

  const takeFromGiver = async (destination, server) => {
    const network = await vault.getNetwork(server);
    if (network.giver == "") {
      return Error("giver is not existed for this network");
    }
    console.log('It is not ready', destination);
    // @TODO Create giver for testnet
    /*
    const TonLibClient = await TonLib.getClient(server);
    try {
      let bounce = false;
      const accountData = await TonLibClient.requestAccountData(destination);
      if (accountData.account_state === "active") {
        bounce = true;
      }
      const result = await TonLibClient.sendTransaction("v4R2", network.giver, bounce,
        { toAddress: destination,
          amount: 5000000000,
          sendMode: 1 + 2, // transfer fees pay separately, ignore errors
        },
        giverkeyPair);
      if (result) {
        updateTransactionsList(destination, server); // here we don't need to sync this process
        return {added: true, id: result.id, reason: `5000000000 tons have been added to the address ${destination}`};
      } else {
        throw Error("Account by this address already exists");
      }
    } catch (e) {
      return {added: false, reason: e.message};
    }
    */
  };

/*
  const updateAllBalances = async (server) => {
    const TonLibClient = await TonLib.getClient(server);
    const accounts = await vault.getAccounts();
    let balances = [];
    try {
      balances = await TonLibClient.requestManyAccountBalances(accounts.map((item) => {return item.address;}));
    } catch(e) {
      throw e;
    }
    for (let i in balances) {
      await vault.updateBalance(balances[i]["id"], server, balances[i]["balance"]);
    }
    return true;
  };
*/

  const getCurrentBalance = async (destination, server) => {
    const TonLibClient = await TonLib.getClient(server);
    let amount = 0;
    try {
      amount = await TonLibClient.requestAccountBalance(destination);
    } catch(e) {
      throw e;
    }
    await vault.updateBalance(destination, server, amount);
    return amount;
  };

  const deployNewWallet = async (destination, server) => {
    try {
      const account = await vault.getAccount(destination);
      const TonLibClient = await TonLib.getClient(server);
      const keyPair = await decrypt(currentPassword, account.encrypted);

      await TonLibClient.sendDeployTransaction(destination, keyPair);

      return {success: true, id: 0, reason: `Wallet smart contract has been deployed for address ${destination}`};
    } catch (exp) {
      if (devMode) {
        console.log(exp);
      }
      const response = {success: false, reason: exp};
      if (exp.indexOf("External message was not accepted") != -1) {
        // mark that wallet has been deployed in vault db
        const walletDeployed = await checkWalletDeployed(destination);
        if (walletDeployed.deployed.includes(server)) {
          await vault.markAsDeployed(destination, server);
          response.alreadyDeployed = true;
          await vault.setWalletVersion(destination, walletDeployed.version);
        }
      }
      return response;
    }
  };

  // don't need to export this function
  const addTransaction = async (destination, server, txData) => {
    await vault.addTransaction(destination, server, txData);

    //If some DApp has a subscription, we must to send the notification
    const subscriptions = await new Promise((resolve) => {
      messageSubscriptions.subscribe((value) => {
        resolve(value);
      });
    });

    for (let i in subscriptions) {
      if (subscriptions[i].server == server && subscriptions[i].address == destination) {
        sendNotificationToInPageScript('xtonwallet-notification', 
          {"method": "message", "params": 
            {"subscriptionId": i, "type": "ton_subscription", "data": txData}
          });
      }
    }

    const network = await vault.getNetwork(server);
    await browser.notifications.create(`${network.explorer}/tx/${txData.id}`, {
      "type": "basic",
      "iconUrl": browser.runtime.getURL('/assets/img/icon-128.png'),
      "requireInteraction": true,
      "title": browser.i18n.getMessage("extName"),
      "message": browser.i18n.getMessage("TransactionIsConfirmed")
    });
  };

  const getTransactions = async (destination, server, count, page) => {
    return await vault.getTransactions(destination, server, count, page);
  };

  const removeAllTransactions = async (accountAddress, server) => {
    return await vault.removeAllTransactions(accountAddress, server);
  };

  const unlock = async (data) => {
    if (data.type == "password") {
      const checkKeyPassword = await vault.getMasterKey(1);
      try {
        const encrypted = await decrypt(data.value, checkKeyPassword.encrypted);
        if (checkKeyPassword.key == encrypted.key) {
          currentPassword = data.value;
          return true;
        } else {
          return false;
        }
      } catch (e) {
        return false;
      }
    }

    /*
     * This procedure has several steps. First of all we need to become sure that pincode is valid.
     * After this moment we know secret to decrypt password.
     */
    if (data.type == "pincode") {
      const checkKeyPassword = await vault.getMasterKey(1);
      const checkKeyPinPad = await vault.getMasterKey(2);
      let result = false;
      try {
        const encryptedPinpad = await decrypt(data.value, checkKeyPinPad.encrypted);
        if (checkKeyPinPad.key == encryptedPinpad.key) {
          const encryptedPassword = await decrypt(encryptedPinpad.password, checkKeyPassword.encrypted);
          if (encryptedPassword.key == checkKeyPassword.key) {
            currentPassword = encryptedPinpad.password;
            result = true;
          } else {
            result = false;
          }
        } else {
          result = false;
        }
      } catch (e) {
        result = false;
      }
      // Failed attempt - drop pin code. We can't give another attempt, because counter stores in local database. It is possible to go round all variants just by reducing this counter in local storage after each attempt.
      if (!result) {
        if (await vault.removeMasterKey(2)) {
          settingsStore.setEnabledPinPad(false);
        }
      }
      return result;
    }

    //default case
    return false;
  };

  const lock = () => {
    currentPassword = "";
  };

  const walletIsLocked = async () => {
    // get setting about enabled/disabled pin pad
    const enabledPinPad = await new Promise((resolve) => {
      currentEnabledPinPad.subscribe((value) => {
        resolve(value);
      });
    });
    return {"locked": currentPassword == "", "enabledPinPad": enabledPinPad};
  };

  const createKeystore = async (info) => {
    const decryptedAccounts = await decryptedVault(info.full);
    const data = {'version' : info.version, 'full': info.full, 'encrypted': decryptedAccounts};
    const encrypted = await encrypt(info.password, data);
    const keystore = { data: encrypted };
    if (info.hint == "") {
      keystore.hint = "";
    } else {
      const ks_password = await new Promise((resolve) => {
        CURRENT_KS_PASSWORD.subscribe((value) => {
          resolve(value);
        });
      });
      keystore.hint = await encrypt(ks_password, info.hint);
    }
    return JSON.stringify(keystore);
  };

  const decryptKeys = async () => {
    const decrypted = await decryptedVault(false);
    return decrypted;
  };

  const decryptedVault = async (full) => {
    const accounts = await vault.getAccounts();
    const decryptedAccounts = Promise.all(
      accounts.map(async (account) => {
        account.keyPair = await decrypt(currentPassword, account.encrypted);
        delete account.encrypted;
        return full ? account : { address: account.address, nickname: account.nickname, keyPair: account.keyPair};
      })
    );
    return await decryptedAccounts;
  };

  const changeAccountNickname = async (address, nickname) => {
    return await vault.updateNickname(address, nickname);
  };

  const checkWalletDeployed = async (account) => {
    let deployed = [];
    let version = {};
    const networks = await vault.getNetworks();
    for (let i in networks) {
      const network = networks[i];
      const TonLibClient = await TonLib.getClient(network.server);
      //here can be case when network is not responded
      try {
        const accountData = await TonLibClient.requestAccountData(account);
        if (accountData.account_state === "active") {
          deployed.push(network.server);
          switch(accountData.wallet_type) {
            /* 
            //for dinos?
            case 'wallet simple r1':
              version[network.server] = 'simpleR1';
            break;
            case 'wallet simple r2':
              version[network.server] = 'simpleR2';
            break;
            case 'wallet simple r3':
              version[network.server] = 'simpleR3';
            break;
            */
            case 'wallet v2 r1':
              version[network.server] = 'v2R1';
            break;
            case 'wallet v2 r2':
              version[network.server] = 'v2R2';
            break;
            case 'wallet v3 r1':
              version[network.server] = 'v3R1';
            break;
            case 'wallet v3 r2':
              version[network.server] = 'v3R2';
            break;
            case 'wallet v4 r1':
              version[network.server] = 'v4R1';
            break;
            case 'wallet v4 r2':
              version[network.server] = 'v4R2';
            break;
          }
        }
      } catch(e) {
        //console.log(e);
      }
    }
    return {deployed, version};
  };

  const addAccounts = async (full, accounts) => {
    const resultAccounts = Promise.all(
      accounts.map(async (account) => {
        let result;
        const walletDeployed = await checkWalletDeployed(account.address);
        if (full) {
          account.encrypted = await encrypt(currentPassword, account.keyPair);
          //stores only in encrypted form
          delete account.keyPair;
          //removes technical detail
          delete account.checked;

          account.deployed = walletDeployed.deployed;
          account.version = walletDeployed.version;
          result = await vault.addNewAccount(account);
        } else {
          const fullAccount = {
            address: account.address,
            nickname: account.nickname,
            balance: {},
            transactions: {},
            updatedDate: ~~(new Date().getTime()/1000), //rounded to seconds
            createdDate: ~~(new Date().getTime()/1000), //rounded to seconds
            contactList: {},
            contractList: {},
            tokenList: {},
            deployed: walletDeployed.deployed,
            version: walletDeployed.version,
            encrypted: await encrypt(currentPassword, account.keyPair) // must be encrypted
          };
          result = await vault.addNewAccount(fullAccount);
        }
        updateTransactionsListAllNetworks(account.address);
        return {"address": account.address, "nickname": account.nickname, "deployed": [], "balance": {},  "result": result};
      })
    );
    const output = await resultAccounts;
    accountStore.changeAccount(output[0]);
    return output;
  };

  const addAccountByKeys = async (nickname, keyPair, version) => {
    const TonLibClient = await TonLib.getClient();
    const address = await TonLibClient.predictAddress(keyPair.public, version);
    const walletDeployed = await checkWalletDeployed(address);
    const account = {
      address: address,
      nickname: nickname,
      balance: {},
      transactions: {},
      updatedDate: ~~(new Date().getTime()/1000), //rounded to seconds
      createdDate: ~~(new Date().getTime()/1000), //rounded to seconds
      contactList: {},
      contractList: {},
      tokenList: {},
      deployed: walletDeployed.deployed,
      version: walletDeployed.version,
      encrypted: await encrypt(currentPassword, keyPair) // must be encrypted
    };

    try {
      if (await vault.addNewAccount(account)) {
        updateTransactionsListAllNetworks(account.address);
        accountStore.changeAccount(account);
        return {"address": account.address, "nickname": account.nickname, "deployed": [], "balance": {}, "result": true};
      } else {
        return {"address": account.address, "nickname": account.nickname, "deployed": [], "balance": {}, "result": false};
      }
    } catch (e) {
      return {"added": false, "error": e.message};
    }
  };

  const addAccountBySeed  = async (nickname, seed, version) => {
    const TonLibClient = await TonLib.getClient();
    const keys = await TonLibClient.convertSeedToKeys(seed.split(' '));
    //prepare for saving
    const keyPair = {
      public: Unibabel.bufferToHex(Object.values(keys.publicKey)),
      secret: Unibabel.bufferToHex(Object.values(keys.secretKey))
    };
    const address = await TonLibClient.predictAddress(keyPair.public, version);
    const walletDeployed = await checkWalletDeployed(address);
    const account = {
      address: address,
      nickname: nickname,
      balance: {},
      transactions: {},
      updatedDate: ~~(new Date().getTime()/1000), //rounded to seconds
      createdDate: ~~(new Date().getTime()/1000), //rounded to seconds
      contactList: {},
      contractList: {},
      tokenList: {},
      deployed: walletDeployed.deployed,
      version: walletDeployed.version,
      encrypted: await encrypt(currentPassword, keyPair) // must be encrypted
    };
    try {
      if (await vault.addNewAccount(account)) {
        updateTransactionsListAllNetworks(account.address);
        accountStore.changeAccount(account);
        return {"address": account.address, "nickname": account.nickname, "deployed": [], "balance": {}, "result": true};
      } else {
        return {"address": account.address, "nickname": account.nickname, "deployed": [], "balance": {}, "result": false};
      }
    } catch (e) {
      return {"added": false, "error": e.message};
    }
  };

  const deleteAccount = async (accountAddress) => {
    return await vault.removeAccount(accountAddress);
  };

  const getSanatizedAccounts = async (fields = []) => {
    const accounts = await vault.getAccounts();
    return accounts.map((account) => {
      let newAccount = {};
      delete account.encrypted;
      if (fields.length) {
        for (const field in account) {
          if (fields.includes(field)) {
            newAccount[field] = account[field];
          }
        }
      } else {
        newAccount = account;
      }
      return newAccount;
    });
  };

  const calculateFeeForWallet = async (accountAddress, server, txData) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const keyPair      = await decrypt(currentPassword, account.encrypted);

      let result;
      if (txData.params.allBalance) { //@TODO need to be sure, that one-custodial wallet
        result = await TonLibClient.calcRunFees(account.version[server], accountAddress,
          {
            toAddress: txData.params.destination,
            amount: 0,
            payload: txData.params.message,
            sendMode: 128 + 2, // carry all balance + ignore errors
          },
          keyPair);
      } else {
        result = await TonLibClient.calcRunFees(account.version[server], accountAddress,
          {
            toAddress: txData.params.destination,
            amount: txData.params.amount,
            payload: txData.params.message,
            sendMode: 3, // ignore errors
          },
          keyPair);
      }
      const fees = result.source_fees;
      const common_fee = fees.fwd_fee + fees.gas_fee + fees.in_fwd_fee + fees.storage_fee;
      return {fee: common_fee};
    } catch (exp) {
      return {error: exp.message};
    }
  };

  const calculateFeeForRawTransaction = async (accountAddress, server, txData) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const keyPair      = await decrypt(currentPassword, account.encrypted);

      let result, txDataPrepared;

      switch(txData.params.dataType) {
        case "boc":
          txData.params.data = TonLibClient.oneFromBoc(Unibabel.base64ToBuffer(txData.params.data));
          break;
        case "hex":
          txData.params.data = Unibabel.hexToBuffer(txData.params.data);
          break;
        case "base64":
          txData.params.data = Unibabel.base64ToBuffer(txData.params.data);
          break;
      }
      txDataPrepared = {
        toAddress: txData.params.to,
        amount: txData.params.amount,
        payload: txData.params.data,
        sendMode: 1 + 2, // ignore errors
      };
      if (txData.params.stateInit) {
        txDataPrepared.stateInit = TonLibClient.oneFromBoc(Unibabel.base64ToBuffer(txData.params.stateInit));
      }

      result = await TonLibClient.calcRunFees(account.version[server], accountAddress,
        txDataPrepared,
        keyPair);

      const fees = result.source_fees;
      const common_fee = fees.fwd_fee + fees.gas_fee + fees.in_fwd_fee + fees.storage_fee;
      return {fee: common_fee};
    } catch (exp) {
      return {error: exp.message};
    }
  };

  const sendTransaction = async (accountAddress, server, txData) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const keyPair      = await decrypt(currentPassword, account.encrypted);

      let bounce = false;
      const accountData = await TonLibClient.requestAccountData(txData.params.destination);
      if (accountData.account_state === "active") {
        bounce = true;
      }
      let result;
      if (txData.params.allBalance) {
        result = await TonLibClient.sendTransaction(account.version[server], accountAddress, bounce,
          {
            toAddress: txData.params.destination,
            amount: 0,
            payload: txData.params.message,
            sendMode: 128 + 2, // carry all balance + ignore errors
          },
          keyPair);
      } else {
        result = await TonLibClient.sendTransaction(account.version[server], accountAddress, bounce,
          {
            toAddress: txData.params.destination,
            amount: txData.params.amount,
            payload: txData.params.message,
            sendMode: 1 + 2, // transfer fees pay separately, ignore errors
          },
          keyPair);
      }

      return {id: 0, reason: `SubmitTransaction for ${txData.params.destination} with amount ${txData.params.amount}`};
    } catch (exp) {
      return {error: exp.message};
    }
  };

  const sendRawTransaction = async (accountAddress, server, txData) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const keyPair      = await decrypt(currentPassword, account.encrypted);

      let result, txDataPrepared;
      switch(txData.params.dataType) {
        case "boc":
          txData.params.data = TonLibClient.oneFromBoc(Unibabel.base64ToBuffer(txData.params.data));
          break;
        case "hex":
          txData.params.data = Unibabel.hexToBuffer(txData.params.data);
          break;
        case "base64":
          txData.params.data = Unibabel.base64ToBuffer(txData.params.data);
          break;
      }
      txDataPrepared = {
        toAddress: txData.params.to,
        amount: txData.params.amount,
        payload: txData.params.data,
        sendMode: 1 + 2, // transfer fees pay separately, ignore errors
      };
      if (txData.params.stateInit) {
        txDataPrepared.stateInit = TonLibClient.oneFromBoc(Unibabel.base64ToBuffer(txData.params.stateInit));
      }
      result = await TonLibClient.sendTransaction(account.version[server], accountAddress, false, txDataPrepared, keyPair);
      
      return {id: 0, reason: `SubmitRawTransaction for ${txData.params.to} with amount ${txData.params.amount}`};
    } catch (exp) {
      return {error: exp.message};
    }
  };

  const setPincode = async (pincode) => {
    const key = generateRandomHex(256);
    const encrypted = await encrypt(pincode, {"key": key, "password": currentPassword});
    await vault.addMasterKey(2, key, encrypted);
  };

  const saveGrantedPermissions = async (account, origin, permissions) => {
    return await vault.savePermissions(account, origin, permissions);
  };

  const getPermissions = async (account, origin) => {
    return await vault.getPermissions(account, origin);
  };

  const checkPermission = async (account, origin, methodName) => {
    return await vault.checkPermission(account, origin, methodName);
  };

  const getSignForData = async (accountAddress, data) => {
    const account      = await vault.getAccount(accountAddress);
    const keyPair      = await decrypt(currentPassword, account.encrypted);
    const TonLibClient = await TonLib.getClient();
    return await TonLibClient.signMessageInBox(keyPair, data);
  };

  const getSignature = async (accountAddress, unsigned) => {
    const account      = await vault.getAccount(accountAddress);
    const keyPair      = await decrypt(currentPassword, account.encrypted);
    const TonLibClient = await TonLib.getClient();
    return await TonLibClient.getSignature(keyPair.secret, unsigned);
  };

  const getPublicKeyForAccount = async (accountAddress) => {
    const account = await vault.getAccount(accountAddress);
    const keyPair = await decrypt(currentPassword, account.encrypted);
    return keyPair.public;
  };

  const getWalletVersionForAccount = async (accountAddress) => {
    const account = await vault.getAccount(accountAddress);
    return account.version ? account.version: {};
  };

  /**
   * Danger method
  */
  const getKeyPairForAccount = async (accountAddress) => {
    const account = await vault.getAccount(accountAddress);
    const keyPair = await decrypt(currentPassword, account.encrypted);
    return keyPair;
  };

  const getNaclBoxPublicKey = async (accountAddress) => {
    const account = await vault.getAccount(accountAddress);
    const keyPair = await decrypt(currentPassword, account.encrypted);
    const TonLibClient = await TonLib.getClient();
    const result = await TonLibClient.getNaclBoxKeyPair(keyPair.secret);
    return Unibabel.bufferToHex(Object.values(result.publicKey));
  };

  const doEncryptionForMessage = async (accountAddress, data) => {
    const account      = await vault.getAccount(accountAddress);
    const keyPair      = await decrypt(currentPassword, account.encrypted);
    const TonLibClient = await TonLib.getClient();
    return Unibabel.bufferToBase64(Object.values(await TonLibClient.encryptMessageInNaclBox(keyPair, data)));
  };

  const doDecryptionForMessage = async (accountAddress, data) => {
    const account      = await vault.getAccount(accountAddress);
    const keyPair      = await decrypt(currentPassword, account.encrypted);
    const TonLibClient = await TonLib.getClient();
    const result = await TonLibClient.decryptMessageInNaclBox(keyPair, data);
    return (result == null ? "" : Unibabel.bufferToUtf8(result));
  };

  /**
   * Tokens
   */
  const getFamousTokens = () => {
    return {"mainnet": [
            {
              "name": "Kote Coin",
              "symbol": "KOTE",
              "decimals": 9,
              "address": "EQBlU_tKISgpepeMFT9t3xTDeiVmo25dW_4vUOl6jId_BNIj",
              "icon": "https://kotecoin.com/coin.png",
              "type": "74"
            },
            {
              "name": "Tegro",
              "symbol": "TGR",
              "decimals": 9,
              "address": "EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y",
              "icon": "https://tegro.io/tgr.png",
              "type": "74"
            },
            {
              "name": "Wrapped TON",
              "symbol": "wTON",
              "decimals": 9,
              "address": "EQDMB1pfK3wFtZWckWrMBgQ7zFH05iVC4kFsBumNyvKYUOZp",
              "icon": "https://wton.dev/logo256.png",
              "type": "74"
            }
            ],
           };
  };

  const importToken = async (accountAddress, server, tokenObject) => {
    if (tokenObject.type == "74") {
      tokenObject.wallet = await getTokenType74WalletAddress(server, tokenObject.address, accountAddress);
      await vault.addToken(accountAddress, server, tokenObject);
    }
    if (tokenObject.type == "64") {
      await vault.addToken(accountAddress, server, tokenObject);
    }
    broadcastMessage("updateWalletUI");
    return true;
  };

  /**
   *  we can add caching here later
   */
  const getTokenListForUser = async (accountAddress, server) => {
    const tokenList = await vault.tokenList(accountAddress, server);
    for (let i in tokenList) {
      try {
        tokenList[i].balance = await getCurrentTokenBalance(accountAddress, server, tokenList[i].address);
      } catch(e) {
        tokenList[i].balance = 0;
      }
    };
    return tokenList;
  };

  const calculateFeeForToken = async (accountAddress, server, txData, keyPair) => {
    if (txData.params.token.type == 74) {
      return calculateFeeForTokenType74(accountAddress, server, txData, keyPair);
    }
  };

  const transferToken = async (accountAddress, server, txData, keyPair) => {
    if (txData.params.token.type == 74) {
      return transferTokenType74(accountAddress, server, txData, keyPair);
    }
  };

  const getTokenData = async (accountAddress, server, tokenRootAddress) => {
    let tokenObject = {};
    try {
      tokenObject = await vault.getToken(accountAddress, server, tokenRootAddress);
    } catch(e) {
      throw e;
    }
    return tokenObject;
  }

  const getCurrentTokenBalance = async (destination, server, tokenRootAddress) => {
    let amount = 0;
    try {
      const tokenObject = await vault.getToken(destination, server, tokenRootAddress);
      if (typeof tokenObject.type != "undefined") {
        if (tokenObject.type == "74") {
          const walletAddress = await getTokenType74WalletAddress(server, tokenRootAddress, destination);
          amount = await getTokenType74Balance(server, walletAddress);
        }
      }
    } catch(e) {
      throw e;
    }
    await vault.updateTokenBalance(destination, server, tokenRootAddress, amount);
    return amount;
  };

  const getTokenInfo = async (server, tokenRootAddress) => {
    const type74 = await getTokenType74Info(server, tokenRootAddress);
    if (type74 != false) {
      type74.type = 74;
      return type74;
    }
    const type64 = await getTokenType64Info(server, tokenRootAddress);
    if (type64 != false) {
      type64.type = 64;
      return type64;
    }
    return false;
  };

  const detectTokenTransaction = async (server, message) => {
    const TonLibClient = await TonLib.getClient(server);

    let decodedMessageForTokenTransfer;
    try {
      decodedMessageForTokenTransfer = await TonLibClient.decodeMessage("74", message);
      decodedMessageForTokenTransfer.standard = "74";
      return decodedMessageForTokenTransfer;
    } catch (exp) {
      return "error";
    }
  };

  const calculateFeeForTokenType74 = async (accountAddress, server, txData, keyPair) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const walletAddressOwner = await getTokenType74WalletAddress(server, txData.params.token.address, accountAddress);
      const JtWallet = TonLibClient.getFtTokenWallet(walletAddressOwner);
      const result = await TonLibClient.estimateTransferFtTokenWallet(account.version[server], JtWallet, accountAddress, walletAddressOwner, {
        "jettonAmount": txData.params.amount,
        "toAddress": txData.params.destination,
        "responseAddress": accountAddress,
        "forwardPayload": txData.params.message,
        "forwardAmount": DEPLOY_WALLET_VALUE,
        "amount": TRANSFER_WALLET_VALUE
      }, keyPair);

      const fees = result.source_fees;
      const common_fee = TRANSFER_WALLET_VALUE + DEPLOY_WALLET_VALUE + fees.fwd_fee + fees.gas_fee + fees.in_fwd_fee + fees.storage_fee;
      return {fee: common_fee};
    } catch (exp) {
      return {error: exp.message};
    }
  };

  const getTokenType74WalletAddress = async (server, tokenRootAddress, ownerAddress) => {
    const TonLibClient = await TonLib.getClient(server);
    const JtMinter = TonLibClient.getFtToken(tokenRootAddress);
    return await TonLibClient.getJettonWalletAddress(JtMinter, ownerAddress);
  };

  const getTokenType74Info = async (server, tokenRootAddress) => {
    const TonLibClient = await TonLib.getClient(server);
    try {
      const FtWallet = TonLibClient.getFtToken(tokenRootAddress);
      const resultData = await FtWallet.getJettonData();
      if (resultData) {
        if (resultData.jettonContentUri) {
          const result = await fetch(resultData.jettonContentUri)
                                .then((response) => {
                                  return response.json();
                                })
                                .then((data) => {
                                  return data;
                                });
          return {
            name: result.name,
            symbol: result.symbol,
            decimals: result.decimal ? Number(result.decimal): 9,
            totalSupply: Number(resultData.totalSupply),
            icon: result.image
          }
        }
        if (resultData.jettonContentCell) {
          try {
            const result = await FtWallet.getOnchainMetadata(resultData.jettonContentCell);
            return {
              name: hexToStr(result.name.substring(2)),
              symbol: hexToStr(result.symbol.substring(2)),
              decimals: result.decimal ? Number(hexToStr(result.decimal.substring(2))): 9,
              totalSupply: Number(resultData.totalSupply),
              icon: hexToStr(result.image.substring(2))
            }
          } catch(e) {
            if (devMode) {
              console.log(e);
            }
            return false;
          }
        }
      } else {
        return false;
      }
    } catch(e) {
      if (devMode) {
        console.log(e);
      }
      return false;
    }
  };

  const getTokenType74Balance = async (server, walletAddress) => {
    const TonLibClient = await TonLib.getClient(server);
    const JtWallet = TonLibClient.getFtTokenWallet(walletAddress);
    const result = await TonLibClient.getFtTokenWalletData(JtWallet);
    return result && result.balance ? result.balance.toString(): 0;
  };

  const transferTokenType74 = async (accountAddress, server, txData, keyPair) => {
    try {
      const account      = await vault.getAccount(accountAddress);
      const TonLibClient = await TonLib.getClient(server);
      const walletAddressOwner = await getTokenType74WalletAddress(server, txData.params.token.address, accountAddress);

      const JtWallet = TonLibClient.getFtTokenWallet(walletAddressOwner);
      const result = await TonLibClient.sendTransferFtTokenWallet(account.version[server], JtWallet, accountAddress, walletAddressOwner, {
        "jettonAmount": txData.params.amount,
        "toAddress": txData.params.destination,
        "responseAddress": accountAddress,
        "forwardPayload": txData.params.message,
        "forwardAmount": DEPLOY_WALLET_VALUE,
        "amount": TRANSFER_WALLET_VALUE
      }, keyPair);

      return { result };
    } catch (exp) {
      return { error: exp.message };
    }
  };

  const getTokenType64Info = async (server, tokenItemAddress) => {
    const TonLibClient = await TonLib.getClient(server);
    try {
      const NftItem = TonLibClient.getNftItemToken(tokenItemAddress);
      const resultData = await NftItem.getData();
      if (resultData) {
        const NftCollection = TonLibClient.getNftToken(resultData.collectionAddress);
        const resultDataCollection = await NftCollection.getCollectionData();
        if (resultDataCollection) {
          if (resultDataCollection.collectionContentUri) {
            const result = await fetch(resultDataCollection.collectionContentUri)
                                  .then((response) => {
                                    return response.json();
                                  })
                                  .then((data) => {
                                    return data;
                                  });
            return {
              name: result.name,
              description: result.description,
              image: result.image,
              externalLink: result.external_link,
              itemIndex: new BigNumber(resultData.itemIndex).toString(),
              itemsCount: new BigNumber(resultDataCollection.itemsCount).toString(),
              ownerAddress: resultDataCollection.ownerAddress != null? resultDataCollection.ownerAddress.toString(true, true, true): ""
            }
          }
        }
        //OnChanin content for NFT is not supported yet
        //resultData.collectionContentCell 
      } else {
        return false;
      }
    } catch(e) {
      if (devMode) {
        console.log(e);
      }
      return false;
    }
  };

  const getNftContent = async (server, tokenItemAddress) => {
    const TonLibClient = await TonLib.getClient(server);
    try {
      const NftItem = TonLibClient.getNftItemToken(tokenItemAddress);
      const resultData = await NftItem.getData();
      if (resultData) {
        const result = await fetch(Unibabel.bufferToUtf8(resultData.content).substr(1))
                                  .then((response) => {
                                    return response.json();
                                  })
                                  .then((data) => {
                                    return data;
                                  });
        return {
          "name": result.name,
          "description": result.description,
          "image": result.image,
          "owner": resultData.ownerAddress.toString(true, true, true)
        }
      }
    } catch(e) {
      if (devMode) {
        console.log(e);
      }
      return false;
    }
  };

  const removeToken = async (accountAddress, server, tokenAddress) => {
    return await vault.removeToken(accountAddress, server, tokenAddress);
  };

  return {
    //Account
    createPassword,
    checkPassword,
    firstRun,
    takeFromGiver,
    getCurrentBalance,
    getPublicKeyForAccount,
    getWalletVersionForAccount,
    getKeyPairForAccount,
    deployNewWallet,
    createKeystore,
    addNewAccount,
    addAccounts,
    addAccountBySeed,
    addAccountByKeys,
    getSanatizedAccounts,
    changeAccountNickname,
    deleteAccount,
    unlock,
    lock,
    setPincode,
    walletIsLocked,
    decryptKeys,
    addTransaction,
    getTransactions,
    removeAllTransactions,
    calculateFeeForWallet,
    calculateFeeForRawTransaction,
    sendTransaction,
    sendRawTransaction,
    saveGrantedPermissions,
    getPermissions,
    checkPermission,
    getSignForData,
    getSignature,
    getNaclBoxPublicKey,
    doEncryptionForMessage,
    doDecryptionForMessage,
    updateTransactionsList,

    //Tokens
    getFamousTokens,
    getTokenInfo,
    getTokenData,
    getNftContent,
    importToken,
    getTokenListForUser,
    detectTokenTransaction,
    calculateFeeForToken,
    transferToken,
    getCurrentTokenBalance,
    removeToken,
  };
};
