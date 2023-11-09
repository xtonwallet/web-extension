/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { beginCell } from "../boc/Builder";
import { loadSplitMergeInfo, storeSplitMergeInfo } from "./SplitMergeInfo";
import { loadTransaction, storeTransaction } from "./Transaction";
import { loadTransactionActionPhase, storeTransactionActionPhase } from "./TransactionActionPhase";
import { loadTransactionBouncePhase, storeTransactionBouncePhase } from "./TransactionBouncePhase";
import { loadTransactionComputePhase, storeTransactionComputePhase } from "./TransactionComputePhase";
import { loadTransactionCreditPhase, storeTransactionCreditPhase } from "./TransactionCreditPhase";
import { loadTransactionStoragePhase, storeTransactionsStoragePhase } from "./TransactionStoragePhase";

export function loadTransactionDescription(slice) {
  let type = slice.loadUint(4);
  if (type === 0x00) {
    const creditFirst = slice.loadBit();
    let storagePhase = undefined;
    if (slice.loadBit()) {
      storagePhase = loadTransactionStoragePhase(slice);
    }
    let creditPhase = undefined;
    if (slice.loadBit()) {
      creditPhase = loadTransactionCreditPhase(slice);
    }
    let computePhase = loadTransactionComputePhase(slice);
    let actionPhase = undefined;
    if (slice.loadBit()) {
      actionPhase = loadTransactionActionPhase(slice.loadRef().beginParse());
    }
    let aborted = slice.loadBit();
    let bouncePhase = undefined;
    if (slice.loadBit()) {
      bouncePhase = loadTransactionBouncePhase(slice);
    }
    const destroyed = slice.loadBit();
    return {
      type: 'generic',
      creditFirst,
      storagePhase,
      creditPhase,
      computePhase,
      actionPhase,
      bouncePhase,
      aborted,
      destroyed
    };
  }
  if (type === 0x01) {
    return {
      type: 'storage',
      storagePhase: loadTransactionStoragePhase(slice)
    };
  }
  if (type === 0x2 || type === 0x03) {
    const isTock = type === 0x03;
    let storagePhase = loadTransactionStoragePhase(slice);
    let computePhase = loadTransactionComputePhase(slice);
    let actionPhase = undefined;
    if (slice.loadBit()) {
      actionPhase = loadTransactionActionPhase(slice.loadRef().beginParse());
    }
    const aborted = slice.loadBit();
    const destroyed = slice.loadBit();
    return {
      type: 'tick-tock',
      isTock,
      storagePhase,
      computePhase,
      actionPhase,
      aborted,
      destroyed
    };
  }
  if (type === 0x04) {
    let splitInfo = loadSplitMergeInfo(slice);
    let storagePhase = undefined;
    if (slice.loadBit()) {
      storagePhase = loadTransactionStoragePhase(slice);
    }
    let computePhase = loadTransactionComputePhase(slice);
    let actionPhase = undefined;
    if (slice.loadBit()) {
      actionPhase = loadTransactionActionPhase(slice.loadRef().beginParse());
    }
    const aborted = slice.loadBit();
    const destroyed = slice.loadBit();
    return {
      type: 'split-prepare',
      splitInfo,
      storagePhase,
      computePhase,
      actionPhase,
      aborted,
      destroyed
    };
  }
  if (type === 0x05) {
    let splitInfo = loadSplitMergeInfo(slice);
    let prepareTransaction = loadTransaction(slice.loadRef().beginParse());
    const installed = slice.loadBit();
    return {
      type: 'split-install',
      splitInfo,
      prepareTransaction,
      installed
    };
  }
  throw Error(`Unsupported transaction description type ${type}`);
}
export function storeTransactionDescription(src) {
  return (builder) => {
    if (src.type === 'generic') {
      builder.storeUint(0x00, 4);
      builder.storeBit(src.creditFirst);
      if (src.storagePhase) {
        builder.storeBit(true);
        builder.store(storeTransactionsStoragePhase(src.storagePhase));
      }
      else {
        builder.storeBit(false);
      }
      if (src.creditPhase) {
        builder.storeBit(true);
        builder.store(storeTransactionCreditPhase(src.creditPhase));
      }
      else {
        builder.storeBit(false);
      }
      builder.store(storeTransactionComputePhase(src.computePhase));
      if (src.actionPhase) {
        builder.storeBit(true);
        builder.storeRef(beginCell().store(storeTransactionActionPhase(src.actionPhase)));
      }
      else {
        builder.storeBit(false);
      }
      builder.storeBit(src.aborted);
      if (src.bouncePhase) {
        builder.storeBit(true);
        builder.store(storeTransactionBouncePhase(src.bouncePhase));
      }
      else {
        builder.storeBit(false);
      }
      builder.storeBit(src.destroyed);
    }
    else if (src.type === 'storage') {
      builder.storeUint(0x01, 4);
      builder.store(storeTransactionsStoragePhase(src.storagePhase));
    }
    else if (src.type === 'tick-tock') {
      builder.storeUint(src.isTock ? 0x03 : 0x02, 4);
      builder.store(storeTransactionsStoragePhase(src.storagePhase));
      builder.store(storeTransactionComputePhase(src.computePhase));
      if (src.actionPhase) {
        builder.storeBit(true);
        builder.storeRef(beginCell().store(storeTransactionActionPhase(src.actionPhase)));
      }
      else {
        builder.storeBit(false);
      }
      builder.storeBit(src.aborted);
      builder.storeBit(src.destroyed);
    }
    else if (src.type === 'split-prepare') {
      builder.storeUint(0x04, 4);
      builder.store(storeSplitMergeInfo(src.splitInfo));
      if (src.storagePhase) {
        builder.storeBit(true);
        builder.store(storeTransactionsStoragePhase(src.storagePhase));
      }
      else {
        builder.storeBit(false);
      }
      builder.store(storeTransactionComputePhase(src.computePhase));
      if (src.actionPhase) {
        builder.storeBit(true);
        builder.store(storeTransactionActionPhase(src.actionPhase));
      }
      else {
        builder.storeBit(false);
      }
      builder.storeBit(src.aborted);
      builder.storeBit(src.destroyed);
    }
    else if (src.type === 'split-install') {
      builder.storeUint(0x05, 4);
      builder.store(storeSplitMergeInfo(src.splitInfo));
      builder.storeRef(beginCell().store(storeTransaction(src.prepareTransaction)));
      builder.storeBit(src.installed);
    }
    else {
      throw Error(`Unsupported transaction description type ${src.type}`);
    }
  };
}
