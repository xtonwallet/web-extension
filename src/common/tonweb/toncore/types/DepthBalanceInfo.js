/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadCurrencyCollection, storeCurrencyCollection } from "./CurrencyCollection";

export function loadDepthBalanceInfo(slice) {
  let splitDepth = slice.loadUint(5);
  return {
    splitDepth,
    balance: loadCurrencyCollection(slice)
  };
}
export function storeDepthBalanceInfo(src) {
  return (builder) => {
    builder.storeUint(src.splitDepth, 5);
    builder.store(storeCurrencyCollection(src.balance));
  };
}
