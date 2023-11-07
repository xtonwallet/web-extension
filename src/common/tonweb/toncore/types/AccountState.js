/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadStateInit, storeStateInit } from "./StateInit";
export function loadAccountState(cs) {
    if (cs.loadBit()) {
        return { type: 'active', state: loadStateInit(cs) };
    }
    else if (cs.loadBit()) {
        return { type: 'frozen', stateHash: cs.loadUintBig(256) };
    }
    else {
        return { type: 'uninit' };
    }
}
export function storeAccountState(src) {
    return (builder) => {
        if (src.type === 'active') {
            builder.storeBit(true);
            builder.store(storeStateInit(src.state));
        }
        else if (src.type === 'frozen') {
            builder.storeBit(false);
            builder.storeBit(true);
            builder.storeUint(src.stateHash, 256);
        }
        else if (src.type === 'uninit') {
            builder.storeBit(false);
            builder.storeBit(false);
        }
    };
}
