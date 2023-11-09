/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Dictionary } from "../dict/Dictionary";
import { SimpleLibraryValue } from "./SimpleLibrary";
import { loadTickTock, storeTickTock } from "./TickTock";

;
export function loadStateInit(slice) {
  // Split Depth
  let splitDepth;
  if (slice.loadBit()) {
    splitDepth = slice.loadUint(5);
  }
  // TickTock
  let special;
  if (slice.loadBit()) {
    special = loadTickTock(slice);
  }
  // Code and Data
  let code = slice.loadMaybeRef();
  let data = slice.loadMaybeRef();
  // Libs
  let libraries = slice.loadDict(Dictionary.Keys.BigUint(256), SimpleLibraryValue);
  if (libraries.size === 0) {
    libraries = undefined;
  }
  return {
    splitDepth,
    special,
    code,
    data,
    libraries
  };
}
export function storeStateInit(src) {
  return (builder) => {
    if (src.splitDepth !== null && src.splitDepth !== undefined) {
      builder.storeBit(true);
      builder.storeUint(src.splitDepth, 5);
    }
    else {
      builder.storeBit(false);
    }
    if (src.special !== null && src.special !== undefined) {
      builder.storeBit(true);
      builder.store(storeTickTock(src.special));
    }
    else {
      builder.storeBit(false);
    }
    builder.storeMaybeRef(src.code);
    builder.storeMaybeRef(src.data);
    builder.storeDict(src.libraries);
  };
}
