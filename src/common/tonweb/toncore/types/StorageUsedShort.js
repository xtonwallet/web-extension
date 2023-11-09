/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export function loadStorageUsedShort(slice) {
  let cells = slice.loadVarUintBig(3);
  let bits = slice.loadVarUintBig(3);
  return {
    cells,
    bits
  };
}
export function storeStorageUsedShort(src) {
  return (builder) => {
    builder.storeVarUint(src.cells, 3);
    builder.storeVarUint(src.bits, 3);
  };
}
