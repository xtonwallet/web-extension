import {Address} from "./toncore";
import {BitString, BitBuilder, Cell, Slice} from "./toncore";
import HttpProvider from "./providers";
import Contract from "./contract";
import Wallets from "./contract/wallet";
import LockupWallets from "./contract/lockup";
import * as utils from "./utils";
import * as NFT from "./contract/token/nft";
import * as JETTON from "./contract/token/ft";
import * as mnemonic from "./mnemonic";
import {BlockSubscription, InMemoryBlockStorage} from "./providers/blockSubscription";
import SubscriptionContract from "./contract/subscription/index";
import {Payments, PaymentChannel} from "./contract/payments/index";
//import AppTon from "./ledger/AppTon";
//import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
//import TransportWebHID from "@ledgerhq/hw-transport-webhid";
//import BluetoothTransport from "@ledgerhq/hw-transport-web-ble";
import {Dns, DnsCollection, DnsItem} from "./contract/dns";
import {Buffer} from "buffer";

const version = '0.0.58';

class TonWeb {
  constructor(provider) {
    this.version = version;
    this.utils = utils;
    this.Address = Address;
    this.boc = {BitString, BitBuilder, Cell, Slice};
    this.Contract = Contract;
    this.BlockSubscription = BlockSubscription;
    this.InMemoryBlockStorage = InMemoryBlockStorage;

    this.provider = provider || new HttpProvider();
    this.dns = new Dns(this.provider);
    this.wallet = new Wallets(this.provider);
    this.payments = new Payments(this.provider);
    this.lockupWallet = LockupWallets;
  }

  /**
     * Use this method to get transaction history of a given address.
     * @param address   {Address | string}
     * @param limit?    {number}
     * @param lt?    {number}
     * @param txhash?    {string}   in HEX
     * @param to_lt?    {number}
     * @return array of transaction objects
     */
  async getTransactions(address, limit = 20, lt = undefined, txhash = undefined, to_lt = undefined, archival = undefined) {
    if (lt == 0) {
      return this.provider.getTransactions(address.toString(), limit, lt, txhash, to_lt, true);
    } else {
      return this.provider.getTransactions(address.toString(), limit, lt, txhash, to_lt, archival);
    }
  };

  /**
     * @param address   {Address | string}
     * @return {Promise<string>} - The current balance for the given address in nanograms.
     */
  async getBalance(address) {
    return this.provider.getBalance(address.toString());
  }

  /**
     * Use this method to send serialized boc file: fully packed and serialized external message.
     * @param bytes {Uint8Array}
     */
  async sendBoc(bytes) {
    return this.provider.sendBoc(Buffer.from(bytes).toString("base64"));
  }

  /**
     * Invoke get-method of smart contract
     * @param address   {Address | string}    contract address
     * @param method   {string | number}        method name or method id
     * @param params?   Array of stack elements: [['num',3], ['cell', cell_object], ['slice', slice_object]]
     */
  async call(address, method, params = []) {
    return this.provider.call(address.toString(), method, params);
  }
}

TonWeb.version = version;
TonWeb.utils = utils;
TonWeb.Address = Address;
TonWeb.boc = {BitString, BitBuilder, Cell, Slice};
TonWeb.HttpProvider = HttpProvider;
TonWeb.Contract = Contract;
TonWeb.Wallets = Wallets;
TonWeb.LockupWallets = LockupWallets;
TonWeb.SubscriptionContract = SubscriptionContract;
TonWeb.BlockSubscription = BlockSubscription;
TonWeb.InMemoryBlockStorage = InMemoryBlockStorage;
/*
TonWeb.ledger = {
    TransportWebUSB,
    TransportWebHID,
    BluetoothTransport,
    AppTon,
};
*/
TonWeb.token = {
  nft: NFT,
  ft: JETTON,
  jetton: JETTON,
};
TonWeb.dns = Dns;
TonWeb.dns.DnsCollection = DnsCollection;
TonWeb.dns.DnsItem = DnsItem;
TonWeb.payments = Payments;
TonWeb.payments.PaymentChannel = PaymentChannel;
TonWeb.mnemonic = mnemonic;

export default TonWeb;
