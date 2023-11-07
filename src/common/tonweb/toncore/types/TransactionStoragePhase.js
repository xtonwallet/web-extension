/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadAccountStatusChange, storeAccountStatusChange } from "./AccountStatusChange";
export function loadTransactionStoragePhase(slice) {
    const storageFeesCollected = slice.loadCoins();
    let storageFeesDue = undefined;
    if (slice.loadBit()) {
        storageFeesDue = slice.loadCoins();
    }
    const statusChange = loadAccountStatusChange(slice);
    return {
        storageFeesCollected,
        storageFeesDue,
        statusChange
    };
}
export function storeTransactionsStoragePhase(src) {
    return (builder) => {
        builder.storeCoins(src.storageFeesCollected);
        if (src.storageFeesDue === null || src.storageFeesDue === undefined) {
            builder.storeBit(false);
        }
        else {
            builder.storeBit(true);
            builder.storeCoins(src.storageFeesDue);
        }
        builder.store(storeAccountStatusChange(src.statusChange));
    };
}
