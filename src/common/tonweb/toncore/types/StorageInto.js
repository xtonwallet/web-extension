/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadStorageUsed, storeStorageUsed } from "./StorageUsed";

export function loadStorageInfo(slice) {
  return {
    used: loadStorageUsed(slice),
    lastPaid: slice.loadUint(32),
    duePayment: slice.loadMaybeCoins()
  };
}
export function storeStorageInfo(src) {
  return (builder) => {
    builder.store(storeStorageUsed(src.used));
    builder.storeUint(src.lastPaid, 32);
    builder.storeMaybeCoins(src.duePayment);
  };
}
