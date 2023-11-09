/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Buffer} from "buffer";
import { beginCell } from "../Builder";

function readBuffer(slice) {
  // Check consistency
  if (slice.remainingBits % 8 !== 0) {
    throw new Error(`Invalid string length: ${slice.remainingBits}`);
  }
  if (slice.remainingRefs !== 0 && slice.remainingRefs !== 1) {
    throw new Error(`invalid number of refs: ${slice.remainingRefs}`);
  }
  // Read string
  let res;
  if (slice.remainingBits === 0) {
    res = Buffer.alloc(0);
  }
  else {
    res = slice.loadBuffer(slice.remainingBits / 8);
  }
  // Read tail
  if (slice.remainingRefs === 1) {
    res = Buffer.concat([res, readBuffer(slice.loadRef().beginParse())]);
  }
  return res;
}
export function readString(slice) {
  return readBuffer(slice).toString();
}
function writeBuffer(src, builder) {
  if (src.length > 0) {
    let bytes = Math.floor(builder.availableBits / 8);
    if (src.length > bytes) {
      let a = src.subarray(0, bytes);
      let t = src.subarray(bytes);
      builder = builder.storeBuffer(a);
      let bb = beginCell();
      writeBuffer(t, bb);
      builder = builder.storeRef(bb.endCell());
    }
    else {
      builder = builder.storeBuffer(src);
    }
  }
}
export function stringToCell(src) {
  let builder = beginCell();
  writeBuffer(Buffer.from(src), builder);
  return builder.endCell();
}
export function writeString(src, builder) {
  writeBuffer(Buffer.from(src), builder);
}
