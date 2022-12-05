import {parseAddress} from "../token/nft/NftUtils";
import {AdnlAddress, sha256, bytesToHex, bytesToBase64} from "../../utils";
import {Cell} from "../../boc";

const DNS_CATEGORY_NEXT_RESOLVER = 'dns_next_resolver'; // Smart Contract address
const DNS_CATEGORY_WALLET = 'wallet'; // Smart Contract address
const DNS_CATEGORY_SITE = 'site'; // ADNL address

/**
 * @param category  {string | undefined}
 * @return  {BigNumber}
 */
const categoryToBigNumber = async (category) => {
    if (!category) return new BigNumber(0); // all categories
    const categoryBytes = new TextEncoder().encode(category);
    const categoryHash = new Uint8Array(await sha256(categoryBytes));
    return new BigNumber(bytesToHex(categoryHash), 16);
}

/**
 * @param smartContractAddress   {Address}
 * @return {Cell}
 */
const createSmartContractAddressRecord = (smartContractAddress) => {
    const cell = new Cell();
    cell.bits.writeUint(0x9fd3, 16); // https://github.com/ton-blockchain/ton/blob/7e3df93ca2ab336716a230fceb1726d81bac0a06/crypto/block/block.tlb#L827
    cell.bits.writeAddress(smartContractAddress);
    cell.bits.writeUint(0, 8); // flags
    return cell;
}

/**
 * @param adnlAddress   {AdnlAddress}
 * @return {Cell}
 */
const createAdnlAddressRecord = (adnlAddress) => {
    const cell = new Cell();
    cell.bits.writeUint(0xad01, 16); // https://github.com/ton-blockchain/ton/blob/7e3df93ca2ab336716a230fceb1726d81bac0a06/crypto/block/block.tlb#L821
    cell.bits.writeBytes(adnlAddress.bytes);
    cell.bits.writeUint(0, 8); // flags
    return cell;
}

/**
 * @param smartContractAddress   {Address}
 * @return {Cell}
 */
const createNextResolverRecord = (smartContractAddress) => {
    const cell = new Cell();
    cell.bits.writeUint(0xba93, 16); // https://github.com/ton-blockchain/ton/blob/7e3df93ca2ab336716a230fceb1726d81bac0a06/crypto/block/block.tlb#L819
    cell.bits.writeAddress(smartContractAddress);
    return cell;
}

/**
 * @private
 * @param cell  {Cell}
 * @param prefix0 {number}
 * @param prefix1 {number}
 * @return {Address|null}
 */
const parseSmartContractAddressImpl = (cell, prefix0, prefix1) => {
    if (cell.bits.array[0] !== prefix0 || cell.bits.array[1] !== prefix1) throw new Error('Invalid dns record value prefix');
    cell.bits.array = cell.bits.array.slice(2); // skip prefix - first 16 bits
    return parseAddress(cell);
}

/**
 * @param cell  {Cell}
 * @return {Address|null}
 */
const parseSmartContractAddressRecord = (cell) => {
    return parseSmartContractAddressImpl(cell, 0x9f, 0xd3);
}

/**
 * @param cell  {Cell}
 * @return {Address|null}
 */
const parseNextResolverRecord = (cell) => {
    return parseSmartContractAddressImpl(cell, 0xba, 0x93);
}

/**
 * @param cell  {Cell}
 * @return {AdnlAddress}
 */
const parseAdnlAddressRecord = (cell) => {
    if (cell.bits.array[0] !== 0xad || cell.bits.array[1] !== 0x01) throw new Error('Invalid dns record value prefix');
    const bytes = cell.bits.array.slice(2, 2 + 32); // skip prefix - first 16 bits
    return new AdnlAddress(bytes);
}

/**
 * @private
 * @param provider  {HttpProvider}
 * @param dnsAddress   {string} address of dns smart contract
 * @param rawDomainBytes {Uint8Array}
 * @param category  {string | undefined} category of requested DNS record
 * @param oneStep {boolean | undefined} non-recursive
 * @returns {Promise<Cell | Address | AdnlAddress | null>}
 */
const dnsResolveImpl = async (provider, dnsAddress, rawDomainBytes, category, oneStep) => {
    const len = rawDomainBytes.length * 8;

    const domainCell = new Cell();
    domainCell.bits.writeBytes(rawDomainBytes);

    const categoryBigNumber = await categoryBigNumber(category);
    const result = await provider.call2(dnsAddress, 'dnsresolve', [['tvm.Slice', bytesToBase64(await domainCell.toBoc(false))], ['num', categoryBN.toString()]]);
    if (result.length !== 2) {
        throw new Error('Invalid dnsresolve response');
    }
    const resultLen = result[0].toNumber();

    let cell = result[1];
    if ((cell instanceof Array) && cell.length === 0) {
        cell = null;
    }

    if (cell && !cell.bits) { // not a Cell
        throw new Error('Invalid dnsresolve response');
    }

    if (resultLen === 0) {
        return null;  // domain cannot be resolved
    }

    if (resultLen % 8 !== 0) {
        throw new Error('domain split not at a component boundary');
    }
    // if (rawDomainBytes[resultLen] !== 0) {
    //     throw new Error('domain split not at a component boundary');
    // }
    if (resultLen > len) {
        throw new Error('invalid response ' + resultLen + '/' + len);
    } else if (resultLen === len) {
        if (category === DNS_CATEGORY_NEXT_RESOLVER) {
            return cell ? parseNextResolverRecord(cell) : null;
        } else if (category === DNS_CATEGORY_WALLET) {
            return cell ? parseSmartContractAddressRecord(cell) : null;
        } else if (category === DNS_CATEGORY_SITE) {
            return cell ? parseAdnlAddressRecord(cell) : null;
        } else {
            return cell;
        }
    } else {
        if (!cell) {
            return null; // domain cannot be resolved
        } else {
            const nextAddress = parseNextResolverRecord(cell);
            if (oneStep) {
                if (category === DNS_CATEGORY_NEXT_RESOLVER) {
                    return nextAddress;
                } else {
                    return null;
                }
            } else {
                return await dnsResolveImpl(provider, nextAddress.toString(), rawDomainBytes.slice(resultLen / 8), category, false);
            }
        }
    }
}

/**
 * Verify and convert domain
 * @param domain    {string}
 * @return {Uint8Array}
 */
const domainToBytes = (domain) => {
    if (!domain || !domain.length) {
        throw new Error('empty domain');
    }
    if (domain === '.') {
        return new Uint8Array([0]);
    }

    domain = domain.toLowerCase();

    for (let i = 0; i < domain.length; i++) {
        if (domain.charCodeAt(i) <= 32) {
            throw new Error('bytes in range 0..32 are not allowed in domain names');
        }
    }

    for (let i = 0; i < domain.length; i++) {
        const s = domain.substring(i, i + 1);
        for (let c = 127; c <= 159; c++) { // another control codes range
            if (s === String.fromCharCode(c)) {
                throw new Error('bytes in range 127..159 are not allowed in domain names');
            }
        }
    }

    const arr = domain.split('.');

    arr.forEach(part => {
        if (!part.length) {
            throw new Error('domain name cannot have an empty component');
        }
    });

    let rawDomain = arr.reverse().join('\0') + '\0';
    if (rawDomain.length < 126) {
        rawDomain = '\0' + rawDomain;
    }

    return new TextEncoder().encode(rawDomain);
}

/**
 * @param provider  {HttpProvider}
 * @param rootDnsAddress {string} address of root DNS smart contract
 * @param domain    {string} e.g "sub.alice.ton"
 * @param category  {string | undefined} category of requested DNS record
 * @param oneStep {boolean | undefined} non-recursive
 * @returns {Promise<Cell | Address | AdnlAddress | null>}
 */
const dnsResolve = async (provider, rootDnsAddress, domain, category, oneStep) => {
    const rawDomainBytes = domainToBytes(domain);

    return dnsResolveImpl(provider, rootDnsAddress, rawDomainBytes, category, oneStep);
}

export {
    DNS_CATEGORY_NEXT_RESOLVER,
    DNS_CATEGORY_SITE,
    DNS_CATEGORY_WALLET,
    categoryToBigNumber,
    domainToBytes,
    createSmartContractAddressRecord,
    createAdnlAddressRecord,
    createNextResolverRecord,
    parseSmartContractAddressRecord,
    parseAdnlAddressRecord,
    parseNextResolverRecord,
    dnsResolve
}