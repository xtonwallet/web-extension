import Contract from "../../contract";
import {Cell, Address} from "./../../toncore";
import {parseAddress} from '../token/nft/NftUtils';
import {dnsResolve} from "./DnsUtils";
import {parseOffchainUriCell} from "../token/nft/NftUtils";
import {Buffer} from "buffer";

class DnsCollection extends Contract {
  /**
     * @param provider
     * @param options   {{collectionContent: Cell, dnsItemCodeHex: string, address?: Address | string, code?: Cell}}
     */
  constructor(provider, options) {
    options.workChain = 0;
    options.code = options.code;
    super(provider, options);

    if (!options.collectionContent && !options.address) throw new Error('required collectionContent cell');

    this.methods.getCollectionData = this.getCollectionData.bind(this);
    this.methods.getNftItemAddressByIndex = this.getNftItemAddressByIndex.bind(this);
    this.methods.getNftItemContent = this.getNftItemContent.bind(this);
    this.methods.resolve = this.resolve.bind(this);
  }

  /**
     * @override
     * @private
     * @return {Cell} cell contains dns collection data
     */
  createDataCell() {
    const cell = new Cell().asBuilder();
    cell.storeRef(this.options.collectionContent);
    cell.storeRef(Cell.fromBoc(Buffer.from(this.options.dnsItemCodeHex, 'hex'))[0]);
    return cell.asCell();
  }

  /**
     * @return {Promise<{collectionContent: Cell}>}
     */
  async getCollectionData() {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_collection_data');

    const nextItemIndex = result[0].toNumber();
    const collectionContent = result[1];
    const collectionContentUri = parseOffchainUriCell(collectionContent.asSlice());

    return {collectionContentUri, collectionContent, ownerAddress: null, nextItemIndex};
  }

  /**
     * @param nftItem   {DnsItem}
     * @return {Promise<{isInitialized: boolean, index: BigNumber, collectionAddress: Address|null, ownerAddress: Address|null, contentCell: Cell}>}
     */
  async getNftItemContent(nftItem) {
    const nftData = await nftItem.getData();
    return nftData;
  }

  /**
     * @param index {BigNumber}
     * @return {Promise<Address>}
     */
  async getNftItemAddressByIndex(index) {
    const myAddress = await this.getAddress();
    const result = await this.provider.call2(myAddress.toString(), 'get_nft_address_by_index', [['num', index.toString()]]);

    return parseAddress(result);
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

export default DnsCollection;
