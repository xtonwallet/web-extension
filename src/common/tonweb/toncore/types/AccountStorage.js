/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadAccountState, storeAccountState } from "./AccountState";
import { loadCurrencyCollection, storeCurrencyCollection } from "./CurrencyCollection";

export function loadAccountStorage(slice) {
  return {
    lastTransLt: slice.loadUintBig(64),
    balance: loadCurrencyCollection(slice),
    state: loadAccountState(slice)
  };
}
export function storeAccountStorage(src) {
  return (builder) => {
    builder.storeUint(src.lastTransLt, 64);
    builder.store(storeCurrencyCollection(src.balance));
    builder.store(storeAccountState(src.state));
  };
}
