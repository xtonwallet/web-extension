/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadAccountStorage, storeAccountStorage } from "./AccountStorage";
import { loadStorageInfo, storeStorageInfo } from "./StorageInto";
export function loadAccount(slice) {
    return {
        addr: slice.loadAddress(),
        storageStats: loadStorageInfo(slice),
        storage: loadAccountStorage(slice)
    };
}
export function storeAccount(src) {
    return (builder) => {
        builder.storeAddress(src.addr);
        builder.store(storeStorageInfo(src.storageStats));
        builder.store(storeAccountStorage(src.storage));
    };
}
