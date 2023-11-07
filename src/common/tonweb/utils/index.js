import BigNumber from "bignumber.js";

import {
    sha256,
    crc32c,
    crc16,
    compareBytes,
    readNBytesUIntFromArray,
    keyPairFromSeed,
    newKeyPair,
    newSeed,
    getSignature,
    signMessage,
    naclBox,
    naclBoxOpen,
    boxKeyPair,
    cryptoGenerateRandomBytes
} from "./Utils";

import {Address, ADNLAddress} from "./../toncore";

// ton://transfer/<address>
// ton://transfer/<address>?amount=<nanocoins>
// ton://transfer/<address>?text=<url-encoded-utf8-text>
// ton://transfer/<address>?bin=<url-encoded-base64-boc>
// ton://transfer/<address>?bin=<url-encoded-base64-boc>&init=<url-encoded-base64-boc>

/**
 * @param url {string}
 * @return {{address: string, amount?: string, text?: string, init?: string, bin?: string}}
 * @throws if invalid url
 */
function parseTransferUrl(url) {
    const PREFIX = 'ton://transfer/';

    if (!url.startsWith(PREFIX)) {
        throw new Error('must starts with ' + PREFIX);
    }

    const arr = url.substring(PREFIX.length).split('?');
    if (arr.length > 2) {
        throw new Error('multiple "?"');
    }

    const address = arr[0];
    if (!Address.isAddress(address)) {
        throw new Error('invalid address format ' + address);
    }
    const result = {
        address: address
    };

    const rest = arr[1];
    if (rest && rest.length) {
        const pairs = rest.split('&').map((s) => {
            if (s.includes('=')) {
                return [s.substring(0, s.indexOf('=')), s.substring(s.indexOf('=')+1, s.length)]
            }
            return [];
        });
        for (const pair of pairs) {
            if (pair.length !== 2) {
                throw new Error('invalid url pair');
            }
            const key = pair[0];
            const value = pair[1];

            if (key === 'amount') {
                if (result.amount) {
                    throw new Error('amount already set');
                }
                const bn = new BigNumber(value);
                if (bn.isNegative()) {
                    throw new Error('negative amount');
                }
                result.amount = value;
            } else if (key === 'text') {
                if (result.text) {
                    throw new Error('text already set');
                }
                result.text = decodeURIComponent(value);
            } else if (key === 'bin') {
                if (result.bin) {
                    throw new Error('bin already set');
                }
                result.bin = decodeURIComponent(value);
            } else if (key === 'init') {
                if (result.init) {
                    throw new Error('init already set');
                }
                result.init = decodeURIComponent(value);
            } else {
                throw new Error('unknown url var ' + key);
            }
        }
    }
    return result;
}

/**
 * @param address   {string}
 * @param amount?    {string} in nano
 * @param text?   {string}
 * @return {string}
 */
function formatTransferUrl(address, amount, text) {
    let url = 'ton://transfer/' + address;
    const params = [];

    if (amount) {
        params.push('amount=' + amount);
    }

    if (text) {
        params.push('text=' + encodeURIComponent(text));
    }

    if (params.length === 0) return url;

    return url + '?' + params.join('&');
}

export {
    Address,
    ADNLAddress,
    sha256,
    crc32c,
    crc16,
    compareBytes,
    readNBytesUIntFromArray,
    parseTransferUrl,
    formatTransferUrl,
    keyPairFromSeed,
    newKeyPair,
    newSeed,
    getSignature,
    signMessage,
    naclBox,
    naclBoxOpen,
    boxKeyPair,
    cryptoGenerateRandomBytes
};
