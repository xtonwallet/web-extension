/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { loadAccountStatusChange, storeAccountStatusChange } from "./AccountStatusChange";
import { loadStorageUsedShort, storeStorageUsedShort } from "./StorageUsedShort";

export function loadTransactionActionPhase(slice) {
  let success = slice.loadBit();
  let valid = slice.loadBit();
  let noFunds = slice.loadBit();
  let statusChange = loadAccountStatusChange(slice);
  let totalFwdFees = slice.loadBit() ? slice.loadCoins() : undefined;
  let totalActionFees = slice.loadBit() ? slice.loadCoins() : undefined;
  let resultCode = slice.loadInt(32);
  let resultArg = slice.loadBit() ? slice.loadInt(32) : undefined;
  let totalActions = slice.loadUint(16);
  let specActions = slice.loadUint(16);
  let skippedActions = slice.loadUint(16);
  let messagesCreated = slice.loadUint(16);
  let actionListHash = slice.loadUintBig(256);
  let totalMessageSize = loadStorageUsedShort(slice);
  return {
    success,
    valid,
    noFunds,
    statusChange,
    totalFwdFees,
    totalActionFees,
    resultCode,
    resultArg,
    totalActions,
    specActions,
    skippedActions,
    messagesCreated,
    actionListHash,
    totalMessageSize
  };
}
export function storeTransactionActionPhase(src) {
  return (builder) => {
    builder.storeBit(src.success);
    builder.storeBit(src.valid);
    builder.storeBit(src.noFunds);
    builder.store(storeAccountStatusChange(src.statusChange));
    builder.storeMaybeCoins(src.totalFwdFees);
    builder.storeMaybeCoins(src.totalActionFees);
    builder.storeInt(src.resultCode, 32);
    builder.storeMaybeInt(src.resultArg, 32);
    builder.storeUint(src.totalActions, 16);
    builder.storeUint(src.specActions, 16);
    builder.storeUint(src.skippedActions, 16);
    builder.storeUint(src.messagesCreated, 16);
    builder.storeUint(src.actionListHash, 256);
    builder.store(storeStorageUsedShort(src.totalMessageSize));
  };
}
