import "bigint-polyfill";
import {Cell, Address} from "../../../toncore";
import {Buffer} from "buffer";

const SNAKE_DATA_PREFIX = 0x00;
const CHUNK_DATA_PREFIX = 0x01;
const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;

/**
 * @param uri   {string}
 * @returns {Uint8Array}
 */
const serializeUri = (uri) => {
    return new TextEncoder().encode(encodeURI(uri));
}

/**
 * @param uri {string}
 * @return {Cell}
 */
const createOffchainUriCell = (uri) => {
    const cell = new Cell().asBuilder();
    cell.storeUint(OFFCHAIN_CONTENT_PREFIX, 8);
    cell.storeBuffer(Buffer.from(serializeUri(uri), 'binary'));
    return cell.asCell();
}

/**
 * @param cell {Cell}
 * @returns {string}
 */
const parseOffchainUriCell = (slice) => {
    if (slice.loadUint(8) !== OFFCHAIN_CONTENT_PREFIX) {
        throw new Error('no OFFCHAIN_CONTENT_PREFIX');
    }

    return slice.loadStringTail();
}

/**
 * @param cell  {Cell}
 * @return {Address|null}
 */
const parseAddress = cell => {
    return cell.asSlice().loadAddress().toString({urlSafe: true, bounceable: true, testOnly: false});
};

/**
 * @param provider {HttpProvider}
 * @param address {string}
 * @return {Promise<{royalty: number, royaltyFactor: number, royaltyBase: number, royaltyAddress: Address}>}
 */
const getRoyaltyParams = async (provider, address) => {
    const result = await provider.call2(address, 'royalty_params');

    const royaltyFactor = result[0].toNumber();
    const royaltyBase = result[1].toNumber();
    const royalty = royaltyFactor / royaltyBase;
    const royaltyAddress = parseAddress(result[2]);

    return {royalty, royaltyBase, royaltyFactor, royaltyAddress};
}

export {
    SNAKE_DATA_PREFIX,
    CHUNK_DATA_PREFIX,
    ONCHAIN_CONTENT_PREFIX,
    OFFCHAIN_CONTENT_PREFIX,
    parseAddress,
    serializeUri,
    createOffchainUriCell,
    parseOffchainUriCell,
    getRoyaltyParams
};
