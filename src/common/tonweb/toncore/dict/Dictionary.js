/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Buffer} from "buffer";
import { Address } from "../address/Address";
import { beginCell } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { BitString } from "../boc/BitString";
import { generateMerkleProof } from "./generateMerkleProof";
import { generateMerkleUpdate } from "./generateMerkleUpdate";
import { parseDict } from "./parseDict";
import { serializeDict } from "./serializeDict";
import { deserializeInternalKey, serializeInternalKey } from "./utils/internalKeySerializer";
export class Dictionary {
    /**
     * Create an empty map
     * @param key key type
     * @param value value type
     * @returns Dictionary<K, V>
     */
    static empty(key, value) {
        if (key && value) {
            return new Dictionary(new Map(), key, value);
        }
        else {
            return new Dictionary(new Map(), null, null);
        }
    }
    /**
     * Load dictionary from slice
     * @param key key description
     * @param value value description
     * @param src slice
     * @returns Dictionary<K, V>
     */
    static load(key, value, sc) {
        let slice;
        if (sc instanceof Cell) {
            if (sc.isExotic) {
                return Dictionary.empty(key, value);
            }
            slice = sc.beginParse();
        }
        else {
            slice = sc;
        }
        let cell = slice.loadMaybeRef();
        if (cell && !cell.isExotic) {
            return Dictionary.loadDirect(key, value, cell.beginParse());
        }
        else {
            return Dictionary.empty(key, value);
        }
    }
    /**
     * Low level method for rare dictionaries from system contracts.
     * Loads dictionary from slice directly without going to the ref.
     *
     * @param key key description
     * @param value value description
     * @param sc slice
     * @returns Dictionary<K, V>
     */
    static loadDirect(key, value, sc) {
        if (!sc) {
            return Dictionary.empty(key, value);
        }
        let slice;
        if (sc instanceof Cell) {
            slice = sc.beginParse();
        }
        else {
            slice = sc;
        }
        let values = parseDict(slice, key.bits, value.parse);
        let prepare = new Map();
        for (let [k, v] of values) {
            prepare.set(serializeInternalKey(key.parse(k)), v);
        }
        return new Dictionary(prepare, key, value);
    }
    constructor(values, key, value) {
        this._key = key;
        this._value = value;
        this._map = values;
    }
    get size() {
        return this._map.size;
    }
    get(key) {
        return this._map.get(serializeInternalKey(key));
    }
    has(key) {
        return this._map.has(serializeInternalKey(key));
    }
    set(key, value) {
        this._map.set(serializeInternalKey(key), value);
        return this;
    }
    delete(key) {
        const k = serializeInternalKey(key);
        return this._map.delete(k);
    }
    clear() {
        this._map.clear();
    }
    *[Symbol.iterator]() {
        for (const [k, v] of this._map) {
            const key = deserializeInternalKey(k);
            yield [key, v];
        }
    }
    keys() {
        return Array.from(this._map.keys()).map((v) => deserializeInternalKey(v));
    }
    values() {
        return Array.from(this._map.values());
    }
    store(builder, key, value) {
        if (this._map.size === 0) {
            builder.storeBit(0);
        }
        else {
            // Resolve serializer
            let resolvedKey = this._key;
            if (key !== null && key !== undefined) {
                resolvedKey = key;
            }
            let resolvedValue = this._value;
            if (value !== null && value !== undefined) {
                resolvedValue = value;
            }
            if (!resolvedKey) {
                throw Error('Key serializer is not defined');
            }
            if (!resolvedValue) {
                throw Error('Value serializer is not defined');
            }
            // Prepare map
            let prepared = new Map();
            for (const [k, v] of this._map) {
                prepared.set(resolvedKey.serialize(deserializeInternalKey(k)), v);
            }
            // Store
            builder.storeBit(1);
            let dd = beginCell();
            serializeDict(prepared, resolvedKey.bits, resolvedValue.serialize, dd);
            builder.storeRef(dd.endCell());
        }
    }
    storeDirect(builder, key, value) {
        if (this._map.size === 0) {
            throw Error('Cannot store empty dictionary directly');
        }
        // Resolve serializer
        let resolvedKey = this._key;
        if (key !== null && key !== undefined) {
            resolvedKey = key;
        }
        let resolvedValue = this._value;
        if (value !== null && value !== undefined) {
            resolvedValue = value;
        }
        if (!resolvedKey) {
            throw Error('Key serializer is not defined');
        }
        if (!resolvedValue) {
            throw Error('Value serializer is not defined');
        }
        // Prepare map
        let prepared = new Map();
        for (const [k, v] of this._map) {
            prepared.set(resolvedKey.serialize(deserializeInternalKey(k)), v);
        }
        // Store
        serializeDict(prepared, resolvedKey.bits, resolvedValue.serialize, builder);
    }
    generateMerkleProof(key) {
        return generateMerkleProof(this, key, this._key);
    }
    generateMerkleUpdate(key, newValue) {
        return generateMerkleUpdate(this, key, this._key, newValue);
    }
}
Dictionary.Keys = {
    /**
     * Standard address key
     * @returns DictionaryKey<Address>
     */
    Address: () => {
        return createAddressKey();
    },
    /**
     * Create standard big integer key
     * @param bits number of bits
     * @returns DictionaryKey<bigint>
     */
    BigInt: (bits) => {
        return createBigIntKey(bits);
    },
    /**
     * Create integer key
     * @param bits bits of integer
     * @returns DictionaryKey<number>
     */
    Int: (bits) => {
        return createIntKey(bits);
    },
    /**
     * Create standard unsigned big integer key
     * @param bits number of bits
     * @returns DictionaryKey<bigint>
     */
    BigUint: (bits) => {
        return createBigUintKey(bits);
    },
    /**
     * Create standard unsigned integer key
     * @param bits number of bits
     * @returns DictionaryKey<number>
     */
    Uint: (bits) => {
        return createUintKey(bits);
    },
    /**
     * Create standard buffer key
     * @param bytes number of bytes of a buffer
     * @returns DictionaryKey<Buffer>
     */
    Buffer: (bytes) => {
        return createBufferKey(bytes);
    },
    /**
     * Create BitString key
     * @param bits key length
     * @returns DictionaryKey<BitString>
     * Point is that Buffer has to be 8 bit aligned,
     * while key is TVM dictionary doesn't have to be
     * aligned at all.
     */
    BitString: (bits) => {
        return createBitStringKey(bits);
    }
};
Dictionary.Values = {
    /**
     * Create standard integer value
     * @returns DictionaryValue<bigint>
     */
    BigInt: (bits) => {
        return createBigIntValue(bits);
    },
    /**
     * Create standard integer value
     * @returns DictionaryValue<number>
     */
    Int: (bits) => {
        return createIntValue(bits);
    },
    /**
     * Create big var int
     * @param bits nubmer of header bits
     * @returns DictionaryValue<bigint>
     */
    BigVarInt: (bits) => {
        return createBigVarIntValue(bits);
    },
    /**
     * Create standard unsigned integer value
     * @param bits number of bits
     * @returns DictionaryValue<bigint>
     */
    BigUint: (bits) => {
        return createBigUintValue(bits);
    },
    /**
     * Create standard unsigned integer value
     * @param bits number of bits
     * @returns DictionaryValue<bigint>
     */
    Uint: (bits) => {
        return createUintValue(bits);
    },
    /**
     * Create big var int
     * @param bits nubmer of header bits
     * @returns DictionaryValue<bigint>
     */
    BigVarUint: (bits) => {
        return createBigVarUintValue(bits);
    },
    /**
     * Create standard boolean value
     * @returns DictionaryValue<boolean>
     */
    Bool: () => {
        return createBooleanValue();
    },
    /**
     * Create standard address value
     * @returns DictionaryValue<Address>
     */
    Address: () => {
        return createAddressValue();
    },
    /**
     * Create standard cell value
     * @returns DictionaryValue<Cell>
     */
    Cell: () => {
        return createCellValue();
    },
    /**
     * Create Builder value
     * @param bytes number of bytes of a buffer
     * @returns DictionaryValue<Builder>
     */
    Buffer: (bytes) => {
        return createBufferValue(bytes);
    },
    /**
     * Create BitString value
     * @param requested bit length
     * @returns DictionaryValue<BitString>
     * Point is that Buffer is not applicable
     * when length is not 8 bit alligned.
     */
    BitString: (bits) => {
        return createBitStringValue(bits);
    },
    /**
     * Create dictionary value
     * @param key
     * @param value
     */
    Dictionary: (key, value) => {
        return createDictionaryValue(key, value);
    }
};
//
// Keys and Values
//
function createAddressKey() {
    return {
        bits: 267,
        serialize: (src) => {
            if (!Address.isAddress(src)) {
                throw Error('Key is not an address');
            }
            return beginCell().storeAddress(src).endCell().beginParse().preloadUintBig(267);
        },
        parse: (src) => {
            return beginCell().storeUint(src, 267).endCell().beginParse().loadAddress();
        }
    };
}
function createBigIntKey(bits) {
    return {
        bits,
        serialize: (src) => {
            if (typeof src !== 'bigint') {
                throw Error('Key is not a bigint');
            }
            return beginCell().storeInt(src, bits).endCell().beginParse().loadUintBig(bits);
        },
        parse: (src) => {
            return beginCell().storeUint(src, bits).endCell().beginParse().loadIntBig(bits);
        }
    };
}
function createIntKey(bits) {
    return {
        bits: bits,
        serialize: (src) => {
            if (typeof src !== 'number') {
                throw Error('Key is not a number');
            }
            if (!Number.isSafeInteger(src)) {
                throw Error('Key is not a safe integer: ' + src);
            }
            return beginCell().storeInt(src, bits).endCell().beginParse().loadUintBig(bits);
        },
        parse: (src) => {
            return beginCell().storeUint(src, bits).endCell().beginParse().loadInt(bits);
        }
    };
}
function createBigUintKey(bits) {
    return {
        bits,
        serialize: (src) => {
            if (typeof src !== 'bigint') {
                throw Error('Key is not a bigint');
            }
            if (src < 0) {
                throw Error('Key is negative: ' + src);
            }
            return beginCell().storeUint(src, bits).endCell().beginParse().loadUintBig(bits);
        },
        parse: (src) => {
            return beginCell().storeUint(src, bits).endCell().beginParse().loadUintBig(bits);
        }
    };
}
function createUintKey(bits) {
    return {
        bits,
        serialize: (src) => {
            if (typeof src !== 'number') {
                throw Error('Key is not a number');
            }
            if (!Number.isSafeInteger(src)) {
                throw Error('Key is not a safe integer: ' + src);
            }
            if (src < 0) {
                throw Error('Key is negative: ' + src);
            }
            return beginCell().storeUint(src, bits).endCell().beginParse().loadUintBig(bits);
        },
        parse: (src) => {
            return Number(beginCell().storeUint(src, bits).endCell().beginParse().loadUint(bits));
        }
    };
}
function createBufferKey(bytes) {
    return {
        bits: bytes * 8,
        serialize: (src) => {
            if (!Buffer.isBuffer(src)) {
                throw Error('Key is not a buffer');
            }
            return beginCell().storeBuffer(src).endCell().beginParse().loadUintBig(bytes * 8);
        },
        parse: (src) => {
            return beginCell().storeUint(src, bytes * 8).endCell().beginParse().loadBuffer(bytes);
        }
    };
}
function createBitStringKey(bits) {
    return {
        bits,
        serialize: (src) => {
            if (!BitString.isBitString(src))
                throw Error('Key is not a BitString');
            return beginCell().storeBits(src).endCell().beginParse().loadUintBig(bits);
        },
        parse: (src) => {
            return beginCell().storeUint(src, bits).endCell().beginParse().loadBits(bits);
        }
    };
}
function createIntValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeInt(src, bits);
        },
        parse: (src) => {
            return src.loadInt(bits);
        }
    };
}
function createBigIntValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeInt(src, bits);
        },
        parse: (src) => {
            return src.loadIntBig(bits);
        }
    };
}
function createBigVarIntValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeVarInt(src, bits);
        },
        parse: (src) => {
            return src.loadVarIntBig(bits);
        }
    };
}
function createBigVarUintValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeVarUint(src, bits);
        },
        parse: (src) => {
            return src.loadVarUintBig(bits);
        }
    };
}
function createUintValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeUint(src, bits);
        },
        parse: (src) => {
            return src.loadUint(bits);
        }
    };
}
function createBigUintValue(bits) {
    return {
        serialize: (src, buidler) => {
            buidler.storeUint(src, bits);
        },
        parse: (src) => {
            return src.loadUintBig(bits);
        }
    };
}
function createBooleanValue() {
    return {
        serialize: (src, buidler) => {
            buidler.storeBit(src);
        },
        parse: (src) => {
            return src.loadBit();
        }
    };
}
function createAddressValue() {
    return {
        serialize: (src, buidler) => {
            buidler.storeAddress(src);
        },
        parse: (src) => {
            return src.loadAddress();
        }
    };
}
function createCellValue() {
    return {
        serialize: (src, buidler) => {
            buidler.storeRef(src);
        },
        parse: (src) => {
            return src.loadRef();
        }
    };
}
function createDictionaryValue(key, value) {
    return {
        serialize: (src, buidler) => {
            src.store(buidler);
        },
        parse: (src) => {
            return Dictionary.load(key, value, src);
        }
    };
}
function createBufferValue(size) {
    return {
        serialize: (src, buidler) => {
            if (src.length !== size) {
                throw Error('Invalid buffer size');
            }
            buidler.storeBuffer(src);
        },
        parse: (src) => {
            return src.loadBuffer(size);
        }
    };
}
function createBitStringValue(bits) {
    return {
        serialize: (src, builder) => {
            if (src.length !== bits) {
                throw Error('Invalid BitString size');
            }
            builder.storeBits(src);
        },
        parse: (src) => {
            return src.loadBits(bits);
        }
    };
}
