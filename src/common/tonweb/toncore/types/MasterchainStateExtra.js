/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Dictionary } from "../dict/Dictionary";
import { loadCurrencyCollection } from "./CurrencyCollection";

export function loadMasterchainStateExtra(cs) {
  // Check magic
  if (cs.loadUint(16) !== 0xcc26) {
    throw Error('Invalid data');
  }
  // Skip shard_hashes
  if (cs.loadBit()) {
    cs.loadRef();
  }
  // Read config
  let configAddress = cs.loadUintBig(256);
  let config = Dictionary.load(Dictionary.Keys.Int(32), Dictionary.Values.Cell(), cs);
  // Rad global balance
  const globalBalance = loadCurrencyCollection(cs);
  return {
    config,
    configAddress,
    globalBalance
  };
}
