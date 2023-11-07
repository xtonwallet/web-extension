/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { beginCell } from "../boc/Builder";
import { loadAccount, storeAccount } from "./Account";
export function loadShardAccount(slice) {
    let accountRef = slice.loadRef();
    let account = undefined;
    if (!accountRef.isExotic) {
        let accountSlice = accountRef.beginParse();
        if (accountSlice.loadBit()) {
            account = loadAccount(accountSlice);
        }
    }
    return {
        account,
        lastTransactionHash: slice.loadUintBig(256),
        lastTransactionLt: slice.loadUintBig(64)
    };
}
export function storeShardAccount(src) {
    return (builder) => {
        if (src.account) {
            builder.storeRef(beginCell()
                .storeBit(true)
                .store(storeAccount(src.account)));
        }
        else {
            builder.storeRef(beginCell()
                .storeBit(false));
        }
        builder.storeUint(src.lastTransactionHash, 256);
        builder.storeUint(src.lastTransactionLt, 64);
    };
}
