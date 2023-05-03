import { Vault } from "../common/vault.js";
import TonWeb from "./tonweb";
import { Unibabel } from "./utils.js";

class TonLib {
  defaultWalletVersion = 'v4R2'; //private //v3R2
  instance = null; //private
  version = '1.1'; //private

  constructor() {
    this.vault = new Vault();
    this.vault.init();
  }

  async getClient(server = "mainnet") {
    const network = await this.vault.getNetwork(server);
    if (this.instance == null || !network.endpoints.includes(this.instance.provider.host)) {
      if (network.apiKey != "") {
        this.instance = new TonWeb(new TonWeb.HttpProvider(network.endpoints[0], {apiKey: network.apiKey}));
      } else {
        this.instance = new TonWeb(new TonWeb.HttpProvider(network.endpoints[0]));
      }
    }
    return this;
  }

  async generateSeed() {
    try {
      return await TonWeb.mnemonic.generateMnemonic();
    } catch (exp) {
      throw exp;
    }
  }

  async convertSeedToKeys(seed) {
    try {
      return await TonWeb.mnemonic.mnemonicToKeyPair(seed);
    } catch (exp) {
      throw exp;
    }
  }

  async cryptoGenerateRandomBytes(length = 12) {
    try {
      return Unibabel.bufferToHex(Object.values(TonWeb.utils.cryptoGenerateRandomBytes(length)));
    } catch (exp) {
      throw exp;
    }
  }

  async predictAddress(publicKey, _version = "") {
    try {
      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }
      const WalletClass = this.instance.wallet.all[version];
      const walletContract = new WalletClass(this.instance.provider, {
            publicKey: Unibabel.hexToBuffer(publicKey),
            wc: 0
      });
      return (await walletContract.getAddress()).toString(true, true, true);
    } catch (exp) {
      throw exp;
    }
  }

  async walletStateInit(publicKey, _version = "") {
    try {
      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }
      const WalletClass = this.instance.wallet.all[version];
      const walletContract = new WalletClass(this.instance.provider, {
            publicKey: Unibabel.hexToBuffer(publicKey),
            wc: 0
      });
      const { stateInit } = await walletContract.createStateInit();
      return Unibabel.bufferToBase64(await stateInit.toBoc());
    } catch (exp) {
      throw exp;
    }
  }

  async sendTransaction(_version, address, bounce, data, keyPair) {
    try {
      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }

      const WalletClass = this.instance.wallet.all[version];
      const toAddress = (new TonWeb.Address(address)).toString(true, true, false);
      const walletContract = new WalletClass(this.instance.provider, {address: toAddress});

      const seqno = await walletContract.methods.seqno().call();
      data.toAddress = (new TonWeb.Address(data.toAddress)).toString(true, true, bounce);
      data.seqno = seqno;
      data.secretKey = Unibabel.hexToBuffer(keyPair.secret);
      const transfer = walletContract.methods.transfer(data);

      return await transfer.send();
    } catch (exp) {
      throw exp;
    }
  }

  async sendDeployTransaction(address, keyPair) {
    try {
      const toAddress = (new TonWeb.Address(address)).toString(true, true, false);
      const WalletClass = this.instance.wallet.all[this.defaultWalletVersion];
      const walletContract = new WalletClass(this.instance.provider, {address: toAddress});
      const deploy = walletContract.deploy(Unibabel.hexToBuffer(keyPair.secret));
      return await deploy.send();
    } catch (exp) {
      throw exp;
    }
  }

  async requestAccountTransactions(address, now) {
    try {
      return await this.instance.getTransactions(address, 20, now);
    } catch (exp) {
      throw exp;
    }
  }

  async requestAccountBalance(address) {
    try {
      return await this.instance.getBalance(address);
    } catch (exp) {
      throw exp;
    }
  }

  async signMessageInBox(keyPair, unsigned) {
    try {
      const signed = this.instance.utils.signMessage(Unibabel.hexToBuffer(unsigned), Unibabel.hexToBuffer(keyPair.secret));
      return Unibabel.bufferToHex(Object.values(signed));
    } catch (exp) {
      throw exp;
    }
  }

  async encryptMessageInNaclBox(keyPair, data) {
    try {
      const naclKeyPair = await this.getNaclBoxKeyPair(keyPair.secret);
      return this.instance.utils.naclBox(Unibabel.utf8ToBuffer(data.decrypted), Unibabel.hexToBuffer(data.nonce), Unibabel.hexToBuffer(data.their_public), naclKeyPair.secretKey);
    } catch (exp) {
      throw exp;
    }
  }

  async decryptMessageInNaclBox(keyPair, data) {
    try {
      const naclKeyPair = await this.getNaclBoxKeyPair(keyPair.secret);
      return this.instance.utils.naclBoxOpen(Unibabel.base64ToBuffer(data.encrypted), Unibabel.hexToBuffer(data.nonce), Unibabel.hexToBuffer(data.their_public), naclKeyPair.secretKey);
    } catch (exp) {
      throw exp;
    }
  }

  async getNaclBoxKeyPair(secret) {
    try {
      return this.instance.utils.boxKeyPair(Unibabel.hexToBuffer(secret).slice(0, 32));
    } catch (exp) {
      throw exp;
    }
  }

  async getSignature(secret, unsigned) {
    try {
      const signed = this.instance.utils.getSignature(Unibabel.hexToBuffer(unsigned), Unibabel.hexToBuffer(secret));
      return Unibabel.bufferToHex(Object.values(signed));
    } catch (exp) {
      throw exp;
    }
  }

  checkThatSdkMethodExists(module, method) {
    return typeof this.instance[module] != "undefined" && typeof this.instance[module][method] != "undefined";
  }

  async runSdkMethodDirectly(module, method, params = {}) {
    try {
      if (Object.keys(params).length != 0) {
        return await this.instance[module][method](params);
      } else {
        return await this.instance[module][method]();
      }
    } catch (exp) {
      throw exp;
    }
  }

/*
  async requestManyAccountBalances(accountsList) {
    try {
      let filter = "";
      for (let i in accountsList) {
        filter += `OR: {id: {eq: "${accountsList[i]}"}
        `;
      }
      filter += new String("}").repeat(accountsList.length);
      const data = await this.instance.net.query({"query": `
        query {
         accounts(
           filter: {
             ${filter}
           }
         ) {
           id
           balance(format: DEC)
         }
        }
      `});
      return data.result.data.accounts;
    } catch (exp) {
      throw exp;
    }
  }
*/

  async requestAccountData(address) {
    try {
      return await this.instance.provider.getWalletInfo(address);
    } catch (exp) {
      throw exp;
    }
  }

  parseAddress(address) {
    try {
      return new TonWeb.utils.Address(address);
    } catch (exp) {
      throw exp;
    }
  }

  /*
  message = utf8_encode("ton-proof-item-v2/") ++ 
          Address ++
          AppDomain ++
          Timestamp ++  
          Payload 
  signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("ton-connect") ++ sha256(message)))
  
  Where
  Address is the wallet address encoded as a sequence:
      workchain: 32-bit signed integer big endian;
      hash: 256-bit unsigned integer big endian;
  AppDomain is Length ++ EncodedDomainName
      Length is 32-bit value of utf-8 encoded app domain name length in bytes
      EncodedDomainName id Length-byte utf-8 encoded app domain name
  Timestamp 64-bit unix epoch time of the signing operation
  Payload is a variable-length binary string.
  */
  tonProof(walletAddress, domain, timestamp, payload) {
    try {
      let proof = new TonWeb.boc.BitString(5000);
      proof.writeString('ton-proof-item-v2/');
      proof.writeUint(walletAddress.wc, 32);
      proof.writeBytes(walletAddress.hashPart);

      let len;
      const domainLengthHEX = domain.length.toString(16).padStart(2, '0');
      const domainLengthLE = [];
      len = domainLengthHEX.length - 2;
      while (len >= 0) {
        domainLengthLE.push(domainLengthHEX.substr(len, 2));
        len -= 2;
      }

      proof.writeUint(domainLengthLE.join('').padEnd(8, '0'), 32, 16); //LE
      proof.writeString(domain);

      const timestampHEX = timestamp.toString(16);
      const timestampLE = [];
      len = timestampHEX.length - 2;
      while (len >= 0) {
        timestampLE.push(timestampHEX.substr(len, 2));
        len -= 2;
      }

      proof.writeUint(timestampLE.join('').padEnd(16, '0'), 64, 16); //LE

      proof.writeString(payload);
      return proof.toHex();
    } catch (exp) {
      throw exp;
    }
  }

  sha256(data) {
    try {
      return TonWeb.utils.sha256(data);
    } catch (exp) {
      throw exp;
    }
  }

  async calcRunFees(_version, address, data, keyPair = null) {
    try {
      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }

      const WalletClass = this.instance.wallet.all[version];
      const toAddress = (new TonWeb.Address(address)).toString(true, true, false);
      const walletContract = new WalletClass(this.instance.provider, {address: toAddress});

      const seqno = await walletContract.methods.seqno().call();
      data.seqno = seqno;
      data.secretKey = Unibabel.hexToBuffer(keyPair.secret);
      const transfer = walletContract.methods.transfer(data);

      return await transfer.estimateFee();
    } catch (exp) {
      throw exp;
    }
  }

  async calcDeployFees(keyPair) {
    try {
      const WalletClass = this.instance.wallet.all[this.defaultWalletVersion];
      const walletContract = new WalletClass(this.instance.provider, {
            publicKey: Unibabel.hexToBuffer(keyPair.public),
            wc: 0
      });

      const deploy = walletContract.deploy(Unibabel.hexToBuffer(keyPair.secret)); // deploy method
      return await deploy.estimateFee();
    } catch (exp) {
      throw exp;
    }
  }

  async base64ToBytes(text) {
    try {
      return this.instance.utils.base64ToBytes(text);
    } catch (exp) {
      throw exp;
    }
  }

  getFtToken(address) {
    try {
      return new TonWeb.token.ft.JettonMinter(this.instance.provider, {"address": (new TonWeb.Address(address))});
    } catch (exp) {
      throw exp;
    }
  }

  async getJettonData(JtMinter) {
    return (await JtMinter.getJettonData());
  }

  async getJettonWalletAddress(JtMinter, address) {
    return (await JtMinter.getJettonWalletAddress((new TonWeb.Address(address)))).toString(true, true, true);
  }

  getFtTokenWallet(address) {
    try {
      return new TonWeb.token.ft.JettonWallet(this.instance.provider, {"address": (new TonWeb.Address(address))});
    } catch (exp) {
      throw exp;
    }
  }

  async getFtTokenWalletData(JtWallet) {
    try {
      return (await JtWallet.getData());
    } catch (exp) {
      throw exp;
    }
  }

  async estimateTransferFtTokenWallet(_version, JtWallet, accountAddress, walletAddressOwner, params, keyPair) {
    try {
      params.toAddress = new TonWeb.Address(params.toAddress);
      params.responseAddress = new TonWeb.Address(params.responseAddress);
      params.forwardPayload = Unibabel.utf8ToBuffer(params.forwardPayload);

      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }

      const WalletClass = this.instance.wallet.all[version];
      const toAddress = (new TonWeb.Address(accountAddress)).toString(true, true, false);
      const walletContract = new WalletClass(this.instance.provider, {address: toAddress});
      const JtWalletTransferBody = (await JtWallet.createTransferBody(params));

      const data = {};
      data.toAddress = (new TonWeb.Address(walletAddressOwner)).toString(true, true, true);
      data.seqno = (await walletContract.methods.seqno().call());
      data.secretKey = Unibabel.hexToBuffer(keyPair.secret);
      data.payload = JtWalletTransferBody;
      data.amount = params.amount;

      const transfer = walletContract.methods.transfer(data);
      return await transfer.estimateFee();
    } catch (exp) {
      throw exp;
    }
  }

  async sendTransferFtTokenWallet(_version, JtWallet, accountAddress, walletAddressOwner, params, keyPair) {
    try {
      params.toAddress = (new TonWeb.Address(params.toAddress));
      params.responseAddress = (new TonWeb.Address(params.responseAddress));
      params.forwardPayload = Unibabel.utf8ToBuffer(params.forwardPayload);

      let version = this.defaultWalletVersion;
      if (_version != "" && this.instance.wallet.all[_version]) {
        version = _version;
      }

      const WalletClass = this.instance.wallet.all[version];
      const toAddress = (new TonWeb.Address(accountAddress)).toString(true, true, false);
      const walletContract = new WalletClass(this.instance.provider, {address: toAddress});
      const JtWalletTransferBody = (await JtWallet.createTransferBody(params));

      const data = {};
      data.toAddress = (new TonWeb.Address(walletAddressOwner)).toString(true, true, true);
      data.seqno = (await walletContract.methods.seqno().call());
      data.secretKey = Unibabel.hexToBuffer(keyPair.secret);
      data.payload = JtWalletTransferBody;
      data.amount = params.amount;

      const transfer = walletContract.methods.transfer(data);
      return await transfer.send();
    } catch (exp) {
      throw exp;
    }
  }

  getNftToken(address) {
    try {
      return new TonWeb.token.nft.NftCollection(this.instance.provider, {"address": (new TonWeb.Address(address))});
    } catch (exp) {
      throw exp;
    }
  }

  getNftItemToken(address) {
    try {
      return new TonWeb.token.nft.NftItem(this.instance.provider, {"address": (new TonWeb.Address(address))});
    } catch (exp) {
      throw exp;
    }
  }
  
  oneFromBoc(data) {
    try {
      return TonWeb.boc.Cell.oneFromBoc(data);
    } catch (exp) {
      throw exp;
    }
  }

  async decodeMessage(standard, message) {
    try {
      const cell = TonWeb.boc.Cell.oneFromBoc(this.instance.utils.base64ToBytes(message));
      const slice = cell.beginParse();
      const typeTx = slice.loadUint(32).toString(16);
      if (standard == "74" &&
          (typeTx == "f8a7ea5" || // outgoing transfer
           typeTx == "178d4519")  // incoming transfer
         ) {
          let type, queryId, amount, toAddress, responseAddress, forwardAmount, forwardPayload;
          switch(typeTx) {
            case "f8a7ea5":
              type = "tokenTransfer";
              queryId = slice.loadUint(64);
              amount = slice.loadCoins();
              toAddress = slice.loadAddress();
              responseAddress = slice.loadAddress();
              slice.loadBit(); // null custom_payload
              forwardAmount = slice.loadCoins();
              slice.loadBit(); // forward_payload in this slice, not separate cell
              forwardPayload = slice.loadBits(slice.getFreeBits());
              try {
                // if text
                forwardPayload = Unibabel.bufferToUtf8(forwardPayload);
              } catch(e) {
                // if something else
                forwardPayload = this.instance.utils.bytesToBase64(forwardPayload);
              }
              break;
            case "178d4519":
              type = "tokenIncoming";
              queryId = slice.loadUint(64);
              amount = slice.loadCoins();
              toAddress = slice.loadAddress();
              responseAddress = slice.loadAddress();
              //slice.loadBit(); // here no null custom_payload
              forwardAmount = slice.loadCoins();
              slice.loadBit(); // forward_payload in this slice, not separate cell
              forwardPayload = slice.loadBits(slice.getFreeBits()-1);
              try {
                // if text
                forwardPayload = Unibabel.bufferToUtf8(forwardPayload);
              } catch(e) {
                // if something else
                forwardPayload = this.instance.utils.bytesToBase64(forwardPayload);
              }
              break;
          }
          return {
            type: type,
            amount: amount.toNumber(),
            toAddress: toAddress.toString(true, true, true),
            forwardPayload: forwardPayload
          }
        }

      if (standard == "64" &&
          (typeTx == "5fcc3d14" || // outgoing transfer
            typeTx == "05138d91")  // incoming transfer
          ) {
          let type, queryId, newOwnerAddress, toAddress, responseAddress, forwardAmount, forwardPayload;
          switch(typeTx) {
            case "5fcc3d14":
              type = "tokenTransfer";
              queryId = slice.loadUint(64);
              newOwnerAddress = slice.loadAddress();
              responseAddress = slice.loadAddress();
              slice.loadBit(); // null custom_payload
              forwardAmount = slice.loadCoins();
              slice.loadBit(); // forward_payload in this slice, not separate cell
              forwardPayload = slice.loadBits(slice.getFreeBits());
              try {
                // if text
                forwardPayload = Unibabel.bufferToUtf8(forwardPayload);
              } catch(e) {
                // if something else
                forwardPayload = this.instance.utils.bytesToBase64(forwardPayload);
              }
              break;
            case "05138d91":
              type = "tokenIncoming";
              queryId = slice.loadUint(64);
              amount = slice.loadCoins();
              toAddress = slice.loadAddress();
              responseAddress = slice.loadAddress();
              //slice.loadBit(); // here no null custom_payload
              forwardAmount = slice.loadCoins();
              slice.loadBit(); // forward_payload in this slice, not separate cell
              forwardPayload = slice.loadBits(slice.getFreeBits()-1);
              try {
                // if text
                forwardPayload = Unibabel.bufferToUtf8(forwardPayload);
              } catch(e) {
                // if something else
                forwardPayload = this.instance.utils.bytesToBase64(forwardPayload);
              }
              break;
          }
          return {
            type: type,
            amount: amount.toNumber(),
            toAddress: toAddress.toString(true, true, true),
            forwardPayload: forwardPayload
          }
        }
    } catch (exp) {
      throw exp;
    }
  }
};

export default new TonLib();
