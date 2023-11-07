import Contract from "../../index";
import {Cell} from "./../../../toncore";
import {Address} from "../../../utils";
import {parseAddress, getRoyaltyParams} from './NftUtils.js';
import {parseOffchainUriCell} from "./NftUtils";
import BigNumber from "bignumber.js";
import {Buffer} from "buffer";

// https://github.com/ton-blockchain/token-contract/blob/1ad314a98d20b41241d5329e1786fc894ad811de/nft/nft-item.fc
const NFT_ITEM_CODE_HEX = 'B5EE9C7241020D010001D0000114FF00F4A413F4BCF2C80B0102016202030202CE04050009A11F9FE00502012006070201200B0C02D70C8871C02497C0F83434C0C05C6C2497C0F83E903E900C7E800C5C75C87E800C7E800C3C00812CE3850C1B088D148CB1C17CB865407E90350C0408FC00F801B4C7F4CFE08417F30F45148C2EA3A1CC840DD78C9004F80C0D0D0D4D60840BF2C9A884AEB8C097C12103FCBC20080900113E910C1C2EBCB8536001F65135C705F2E191FA4021F001FA40D20031FA00820AFAF0801BA121945315A0A1DE22D70B01C300209206A19136E220C2FFF2E192218E3E821005138D91C85009CF16500BCF16712449145446A0708010C8CB055007CF165005FA0215CB6A12CB1FCB3F226EB39458CF17019132E201C901FB00104794102A375BE20A00727082108B77173505C8CBFF5004CF1610248040708010C8CB055007CF165005FA0215CB6A12CB1FCB3F226EB39458CF17019132E201C901FB000082028E3526F0018210D53276DB103744006D71708010C8CB055007CF165005FA0215CB6A12CB1FCB3F226EB39458CF17019132E201C901FB0093303234E25502F003003B3B513434CFFE900835D27080269FC07E90350C04090408F80C1C165B5B60001D00F232CFD633C58073C5B3327B5520BF75041B';

class NftItem extends Contract {
    /**
     * @param provider
     * @param options   {{index: number|BigNumber, collectionAddress: Address, address?: Address | string, code?: Cell}}
     */
    constructor(provider, options) {
        options.workChain = 0;
        options.code = options.code || Cell.fromBoc(Buffer.from(NFT_ITEM_CODE_HEX, 'hex'))[0];
        super(provider, options);

        this.methods.getData = this.getData.bind(this);
    }

    /**
     * @override
     * @private
     * @return {Cell} cell contains nft data
     */
    createDataCell() {
        const cell = new Cell().asBuilder();
        cell.storeUint(this.options.index, 64);
        cell.storeAddress(this.options.collectionAddress);
        return cell.asCell();
    }

    /**
     * @return {Promise<{isInitialized: boolean, index: number, itemIndex: BigNumber, collectionAddress: Address|null, ownerAddress: Address|null, contentCell: Cell, content: Uint8Array|null, contentUri: string|null}>}
     */
    async getData() {
        const myAddress = await this.getAddress();
        const result = await this.provider.call2(myAddress.toString(), 'get_nft_data');

        const isInitialized = result[0].toNumber() === -1;
        const itemIndex = result[1];
        let index = NaN;
        try {
            index = itemIndex.toNumber();
        } catch (e) {
        }
        const collectionAddress =  parseAddress(result[2]);
        const ownerAddress = isInitialized ? parseAddress(result[3]) : null;
        const contentCell  = result[4];
        const contentSlice = contentCell.asSlice();
        let contentUri = null;
        try {
            contentUri = (isInitialized && collectionAddress === null) ? parseOffchainUriCell(contentSlice) : null; // single NFT without collection
        } catch (e) {
        }
        let content = null;
        if (contentUri === null) {
            content = contentSlice.loadStringTail();
        }

        return {isInitialized, index, itemIndex, collectionAddress, ownerAddress, contentCell, content, contentUri};
    }

    /**
     * @param params    {{queryId?: number, newOwnerAddress: Address, forwardAmount?: BigNumber, forwardPayload?: Uint8Array, responseAddress: Address}}
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
     * for single nft without collection
     * @return {Promise<{royalty: number, royaltyFactor: number, royaltyBase: number, royaltyAddress: Address}>}
     */
    async getRoyaltyParams() {
        const myAddress = await this.getAddress();
        return getRoyaltyParams(this.provider, myAddress.toString());
    }

}

export default NftItem;
