/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { beginCell } from "../boc/Builder";
import { loadCommonMessageInfo, storeCommonMessageInfo } from "./CommonMessageInfo";
import { loadStateInit, storeStateInit } from "./StateInit";

export function loadMessage(slice) {
  const info = loadCommonMessageInfo(slice);
  let init = null;
  if (slice.loadBit()) {
    if (!slice.loadBit()) {
      init = loadStateInit(slice);
    }
    else {
      init = loadStateInit(slice.loadRef().beginParse());
    }
  }
  const body = slice.loadBit() ? slice.loadRef() : slice.asCell();
  return {
    info,
    init,
    body
  };
}
export function storeMessage(message, opts) {
  return (builder) => {
    // Store CommonMsgInfo
    builder.store(storeCommonMessageInfo(message.info));
    // Store init
    if (message.init) {
      builder.storeBit(true);
      let initCell = beginCell().store(storeStateInit(message.init));
      // Check if need to store it in ref
      let needRef = false;
      if (opts && opts.forceRef) {
        needRef = true;
      }
      else if (builder.availableBits - 2 /* At least on byte for ref flag */ >= initCell.bits) {
        needRef = false;
      }
      else {
        needRef = true;
      }
      // Persist init
      if (needRef) {
        builder.storeBit(true);
        builder.storeRef(initCell);
      }
      else {
        builder.storeBit(false);
        builder.storeBuilder(initCell);
      }
    }
    else {
      builder.storeBit(false);
    }
    // Store body
    let needRef = false;
    if (opts && opts.forceRef) {
      needRef = true;
    }
    else {
      if (builder.availableBits - 1 /* At least on byte for ref flag */ >= message.body.bits.length &&
                builder.refs + message.body.refs.length <= 4) {
        needRef = false;
      }
      else {
        needRef = true;
      }
    }
    if (needRef) {
      builder.storeBit(true);
      builder.storeRef(message.body);
    }
    else {
      builder.storeBit(false);
      builder.storeBuilder(message.body.asBuilder());
    }
  };
}
export const MessageValue = {
  serialize(src, builder) {
    builder.storeRef(beginCell()
      .store(storeMessage(src)));
  },
  parse(slice) {
    return loadMessage(slice.loadRef().beginParse());
  }
};
