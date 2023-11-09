/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Dictionary } from "../dict/Dictionary";
import { loadDepthBalanceInfo, storeDepthBalanceInfo } from "./DepthBalanceInfo";
import { loadShardAccount, storeShardAccount } from "./ShardAccount";

export const ShardAccountRefValue = {
  parse: (cs) => {
    let depthBalanceInfo = loadDepthBalanceInfo(cs);
    let shardAccount = loadShardAccount(cs);
    return {
      depthBalanceInfo,
      shardAccount
    };
  },
  serialize(src, builder) {
    builder.store(storeDepthBalanceInfo(src.depthBalanceInfo));
    builder.store(storeShardAccount(src.shardAccount));
  },
};
export function loadShardAccounts(cs) {
  return Dictionary.load(Dictionary.Keys.BigUint(256), ShardAccountRefValue, cs);
}
export function storeShardAccounts(src) {
  return (Builder) => {
    Builder.storeDict(src);
  };
}
