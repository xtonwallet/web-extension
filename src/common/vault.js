// API is available here https://www.npmjs.com/package/idb#api

import { openDB } from 'idb/with-async-ittr.js';

export class Vault {
  masterDb; //private
  db; //private
  async init () {
    if (typeof this.masterDb == "undefined") {
      this.masterDb = await openDB('master', 1, {
        upgrade(db) {
          const storeMasterKey = db.createObjectStore('keys', {
            // The 'id' property of the object will be the key.
            keyPath: 'id',
          });
        }
      });
    }

    if (typeof this.db == "undefined") {
      this.db = await openDB('vault', 1, {
        async upgrade(db, oldVersion, newVersion, transaction) {
          if (await checkMigration(db, oldVersion, newVersion, transaction)) {
            return;
          }
          // Create a store of objects
          const storeAccounts = db.createObjectStore('accounts', {
            // The 'id' property of the object will be the key.
            keyPath: 'address',
          });
          /*
          { address: "0:123", 
            nickname: "main",
            balance: {"mainnet": 5000000000},
            version: {"mainnet": "v3r2"},
            transactions: {"mainnet": [{...}]},
            permissions: {"domain.com": ['ton_address', 'ton_endpoint']},
            updatedDate: 123123,
            createdDate: 123123,
            contactList: {"mainnet": ["0:11", "0:12"]},
            contractList: {"mainnet": ["0:21", "0:22"]},
            tokenList: {"mainnet": [{"address": "0:31"}, {"address": "0:32"}]},
            deployed: [], // server list on which was deployed
            encrypted: { //this object is encrypted
              privKey: "e3412345fcd",
              pubKey: "e3412345fcd",
            }
          }
          */
          // Create an index on the 'updatedDate' property of the objects.
          storeAccounts.createIndex('updatedDate', 'updatedDate');
          // Create an index on the 'createdDate' property of the objects.
          storeAccounts.createIndex('createdDate', 'createdDate');

          // Create a store of objects
          const storeNetworks = db.createObjectStore('networks', {
            // The 'id' property of the object will be the key.
            keyPath: 'server',
            autoIncrement: true,
          });
          /*
          { id: 1,
            name: "Main",
            server: "mainnet",
            explorer: "https://tonscan.org",
            endpoints: ["https://mainnet.xtonwallet.com/jsonRPC"],
            test: false,
            giver: "",
            coinName: "TONCOIN",
            custom: false
          }
          */
          const networks = [
            { id: 1,
              name: "Main",
              server: "mainnet",
              explorer: "https://tonscan.org",
              endpoints: ["https://mainnet.xtonwallet.com/jsonRPC"],
              test: false,
              giver: "",
              coinName: "TONCOIN",
              custom: false
            },
            {
              id: 2,
              name: "Test",
              server: "testnet",
              explorer: "https://testnet.tonscan.org",
              endpoints: ["https://testnet.toncenter.com/api/v2/jsonRPC"],
              apiKey: "d9c3170c67e293760ea38d785bfd99a6e127e51f070a7ff97b8f375c3814a0bb",
              test: true,
              giver: "",
              coinName: "TESTCOIN",
              custom: false
            },
            {
              id: 3,
              name: "Local",
              server: "localhost:7777",
              explorer: "http://localhost:7777/graphql",
              endpoints: ["http://localhost:7777"],
              apiKey: "",
              test: true,
              giver: "0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5",
              coinName: "MOONCOIN",
              custom: false
            }
          ];

          networks.map((network) => {
            storeNetworks.put(network);
          });
        },
      });
    }
  }

  async addMasterKey (id, key, encrypted) {
    await this.init();
    const transaction = this.masterDb.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    await store.put({"id": id, "key": key, "encrypted": encrypted});
    return true;
  }

  async getMasterKey (id) {
    await this.init();
    const transaction = this.masterDb.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    const result = await store.get(id);
    return result;
  }

  async removeMasterKey (id) {
    await this.init();
    const transaction = this.masterDb.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    const existingKey = await store.get(id);
    if (existingKey) {
      store.delete(id);
    }
    return true;
  }

  async addContact (accountAddress, server, contact) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.contactList[server]) {
        existingAccount.contactList[server].push(contact);
      } else {
        existingAccount.contactList[server] = [];
        existingAccount.contactList[server].push(contact);
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async removeContact (accountAddress, server, contact) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      for (const i in existingAccount.contactList[server]) {
        if (existingAccount.contactList[server][i] == contact) {
          existingAccount.contactList[server].splice(i, 1);
          break;
        }
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async addContract (accountAddress, server, contract) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.contractList[server]) {
        existingAccount.contractList[server].push(contract);
      } else {
        existingAccount.contractList[server] = [];
        existingAccount.contractList[server].push(contract);
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async removeContract (accountAddress, server, contract) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      for (const i in existingAccount.contractList[server]) {
        if (existingAccount.contractList[server][i] == contract) {
          existingAccount.contractList[server].splice(i, 1);
          break;
        }
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async addToken (accountAddress, server, tokenObject) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.tokenList[server]) {
        existingAccount.tokenList[server].push(tokenObject);
      } else {
        existingAccount.tokenList[server] = [];
        existingAccount.tokenList[server].push(tokenObject);
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async removeToken (accountAddress, server, tokenAddress) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      for (const i in existingAccount.tokenList[server]) {
        if (existingAccount.tokenList[server][i].address == tokenAddress) {
          existingAccount.tokenList[server].splice(i, 1);
          break;
        }
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async getToken (accountAddress, server, tokenAddress) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      let tokenObject = {};
      for (const i in existingAccount.tokenList[server]) {
        if (existingAccount.tokenList[server][i].address == tokenAddress) {
          tokenObject = existingAccount.tokenList[server][i]
          break;
        }
      }
      return tokenObject;
    }
    return {};
  }

  async tokenList (accountAddress, server) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      return typeof existingAccount.tokenList[server] == "undefined" ? [] : existingAccount.tokenList[server];
    }
    return false;
  }

  async updateTokenBalance(destination, server, tokenAddress, amount) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(destination);
    if (existingAccount) {
      let needUpdate = false;
      for (const i in existingAccount.tokenList[server]) {
        if (existingAccount.tokenList[server][i].address == tokenAddress) {
          existingAccount.tokenList[server][i].balance = amount;
          needUpdate = true;
          break;
        }
      }
      if (needUpdate) {
        await store.put(existingAccount);
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  async removeAllTransactions (accountAddress, server) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.transactions[server]) {
        existingAccount.transactions[server] = [];
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async addTransaction (accountAddress, server, tx) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.transactions[server]) {
        existingAccount.transactions[server].push(tx);
      } else {
        existingAccount.transactions[server] = [];
        existingAccount.transactions[server].push(tx);
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async getTransactions (accountAddress, server, count, page) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.transactions[server]) {
        const sortedTransactions = existingAccount.transactions[server].sort(function(a, b) {
          return b.now - a.now;
        });
        return sortedTransactions.slice((page - 1) * count, page * count);
      } else {
        return [];
      }
    }
    return [];
  }

  async getUniqueTransactions (accountAddress, server, transactions) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.transactions[server]) {
        const txIds = existingAccount.transactions[server].map((tx) => {
          return tx.id;
        });
        return transactions.filter((item) => !txIds.includes(item.transaction_id.hash));
      } else {
        return transactions;
      }
    }
    return transactions;
  }

  async updateNickname (accountAddress, nickname) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      existingAccount.nickname = nickname;
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async updateBalance (accountAddress, server, amount) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      existingAccount.balance[server] = amount;
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async getDeployed (accountAddress, server) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.deployed) {
        return existingAccount.deployed.includes(server)
      }
    }
    return false;
  }

  async markAsDeployed (accountAddress, server) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.deployed) {
        if (!existingAccount.deployed.includes(server)) {
          existingAccount.deployed.push(server);
        }
      } else {
        existingAccount.deployed = [server];
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async setWalletVersion (accountAddress, version) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (existingAccount.version) {
        existingAccount.version = Object.assign({}, existingAccount.version, version);
      } else {
        existingAccount.version = version;
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async addNewAccount (account) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(account.address);
    if (!existingAccount) {
      store.put(account);
      return true;
    }
    return false;
  }

  async getAccount (accountAddress) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    return existingAccount;
  }

  async removeAccount (accountAddress) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      store.delete(accountAddress);
      return true;
    }
    return false;
  }

  async getAccountCount () {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    return await store.count();
  }

  async getAccounts () {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    return await store.getAll();
  }

  async addNewNetwork (network) {
    await this.init();
    const transaction = this.db.transaction('networks', 'readwrite');
    const store = transaction.objectStore('networks');
    const existingNetwork = await store.get(network.server);
    if (!existingNetwork) {
      store.add(network);
      return true;
    }
    return false;
  }

  async removeNetwork (server) {
    await this.init();
    const transaction = this.db.transaction('networks', 'readwrite');
    const store = transaction.objectStore('networks');
    const existingNetwork = await store.get(server);
    if (existingNetwork && existingNetwork.custom) {
      await store.delete(server);
      return true;
    }
    return false;
  }

  async getNetworks () {
    await this.init();
    const transaction = this.db.transaction('networks', 'readwrite');
    const store = transaction.objectStore('networks');
    return await store.getAll();
  }

  async getNetwork (server) {
    await this.init();
    const transaction = this.db.transaction('networks', 'readwrite');
    const store = transaction.objectStore('networks');
    return await store.get(server);
  }

  async getPermissionsList (accountAddress) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    return existingAccount && existingAccount.permissions ? existingAccount.permissions: [];
  }

  async getPermissions (accountAddress, origin) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    return existingAccount && existingAccount.permissions && existingAccount.permissions[origin] ? existingAccount.permissions[origin]: [];
  }

  async savePermissions (accountAddress, origin, permissions) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (typeof existingAccount.permissions == "undefined") {
        existingAccount.permissions = {};
        existingAccount.permissions[origin] = permissions;
      } else {
        if (existingAccount.permissions[origin]) {
          existingAccount.permissions[origin] = [...new Set([...existingAccount.permissions[origin],...permissions])]
        } else {
          existingAccount.permissions[origin] = permissions;
        }
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async removePermissions (accountAddress, origin, permissions) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    if (existingAccount) {
      if (typeof existingAccount.permissions == "undefined") {
        return false;
      } else {
        if (existingAccount.permissions[origin]) {
          existingAccount.permissions[origin] = existingAccount.permissions[origin].filter((item) => {
            return !permissions.includes(item);
          });
          if (existingAccount.permissions[origin].length == 0) {
            delete existingAccount.permissions[origin];
          }
        } else {
          return false;
        }
      }
      await store.put(existingAccount);
      return true;
    }
    return false;
  }

  async checkPermission (accountAddress, origin, methodName) {
    await this.init();
    const transaction = this.db.transaction('accounts', 'readwrite');
    const store = transaction.objectStore('accounts');
    const existingAccount = await store.get(accountAddress);
    return typeof existingAccount != "undefined" && typeof existingAccount.permissions != "undefined" && typeof existingAccount.permissions[origin] != "undefined" && existingAccount.permissions[origin].includes(methodName);
  }
}

async function checkMigration(db, oldVersion, newVersion, transaction) {
  /*
  if (oldVersion == 1 && newVersion == 2) {
    return true;
  }
  */
  return false;
}
