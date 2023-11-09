import {Buffer} from "buffer";
import Contract from "../../contract/index";
import {Cell, Address} from "./../../toncore";
import {parseAddress} from './../token/nft/NftUtils';
import {dnsResolve, categoryToBigNumber} from "./DnsUtils";
import BigNumber from "bignumber.js";

class DnsItem extends Contract {
  /**
     * @param provider
     * @param options   {{index: BigNumber, collectionAddress: Address, address?: Address | string, code?: Cell}}
     */
  constructor(provider, options) {
    options.workChain = 0;
    options.code = options.code;
    super(provider, options);

    this.methods.getData = this.getData.bind(this);
    this.methods.getDomain = this.getDomain.bind(this);
    this.methods.getAuctionInfo = this.getAuctionInfo.bind(this);
    this.methods.getLastFillUpTime = this.getLastFillUpTime.bind(this);
    this.methods.resolve = this.resolve.bind(this);
  }

  /**
     * @override
     * @private
     * @return {Cell} cell contains nft data
     */
  createDataCell() {
    const cell = new Cell().asBuilder();
    cell.storeUint(this.options.index, 256);
    cell.storeAddress(this.options.collectionAddress);
    return cell.asCell();
  }

  /**
     * @return {Promise<{isInitialized: boolean, index: BigNumber, collectionAddress: Address|null, ownerAddress: Address|null, contentCell: Cell}>}
     */
  async getData() {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_nft_data');

    const isInitialized = result[0].toNumber() === -1;
    const index = result[1];
    const collectionAddress = parseAddress(result[2]);
    const ownerAddress = isInitialized ? parseAddress(result[3]) : null;
    const contentCell = result[4];

    return {isInitialized, index, collectionAddress, ownerAddress, contentCell};
  }

  /**
     * @param params    {{queryId?: number, newOwnerAddress: Address, forwardAmount?: BN, forwardPayload?: Uint8Array, responseAddress: Address}}
     */
  async createTransferBody(params) {
    const cell = new Cell().asBuilder();
    cell.storeUint(0x5fcc3d14, 32); // transfer op
    cell.storeUint(params.queryId || 0, 64);
    cell.storeAddress(params.newOwnerAddress);
    cell.storeAddress(params.responseAddress);
    cell.storeBit(false); // null custom_payload
    cell.storeCoins(params.forwardAmount || new BigNumber(0));
    cell.storeBit(false); // forward_payload in this slice, not separate cell
    if (params.forwardPayload) {
      cell.storeBuffer(Buffer.from(params.forwardPayload, 'binary'));
    }
    return cell.asCell();
  }

  /**
     * params   {{queryId?: number}}
     * @return {Cell}
     */
  createGetStaticDataBody(params) {
    const body = new Cell().asBuilder();
    body.storeUint(0x2fcb26a2, 32); // OP
    body.storeUint(params.queryId || 0, 64); // query_id
    return body.asCell();
  }

  /**
     * @return {Promise<string>}
     */
  async getDomain() {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_domain');
    return new TextDecoder().decode(result.bits.array.buffer);
  }

  /**
     * @return {Promise<{maxBidAddress: Address|null, maxBidAmount: BigNumber, auctionEndTime: number}>}
     */
  async getAuctionInfo() {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_auction_info');
    const maxBidAddress = parseAddress(result[0]);
    const maxBidAmount = result[1];
    const auctionEndTime = result[2].toNumber();
    return {maxBidAddress, maxBidAmount, auctionEndTime};
  }

  /**
     * @return {Promise<number>}
     */
  async getLastFillUpTime() {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_last_fill_up_time');
    return result.toNumber();
  }

  /**
     * @param domain    {string} e.g "sub.alice.ton"
     * @param category?  {string} category of requested DNS record, null for all categories
     * @param oneStep? {boolean} non-recursive
     * @returns {Promise<Cell | Address | ADNLAddress | null>}
     */
  async resolve(domain, category, oneStep) {
    const myAddress = await this.getAddress();
    return dnsResolve(this.provider, myAddress.toString(), domain, category, oneStep);
  }
}

/**
 * params   {{category: string, value: Cell|null, queryId?: number}}
 * @return {Cell}
 */
DnsItem.createChangeContentEntryBody = async (params) => {
  const body = new Cell().asBuilder();
  body.storeUint(0x4eb1f0f9, 32); // OP
  body.storeUint(params.queryId || 0, 64); // query_id
  body.storeUint(categoryToBigNumber(params.category), 256);
  if (params.value) {
    body.storeRef(params.value);
  }
  return body.asCell();
};

export default DnsItem;