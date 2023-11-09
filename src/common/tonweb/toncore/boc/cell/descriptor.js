/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Buffer} from "buffer";
import { CellType } from "../CellType";
import { bitsToPaddedBuffer } from "../utils/paddedBits";

export function getRefsDescriptor(refs, level, type) {
  return refs.length + (type !== CellType.Ordinary ? 1 : 0) * 8 + level * 32;
}
export function getBitsDescriptor(bits) {
  let len = bits.length;
  return Math.ceil(len / 8) + Math.floor(len / 8);
}
export function getRepr(originalBits, bits, refs, level, type) {
  // Allocate
  const bitsLen = Math.ceil(bits.length / 8);
  const repr = Buffer.alloc(2 + bitsLen + (2 + 32) * refs.length);
  // Write descriptors
  let reprCursor = 0;
  repr[reprCursor++] = getRefsDescriptor(refs, level, type);
  repr[reprCursor++] = getBitsDescriptor(originalBits);
  // Write bits
  bitsToPaddedBuffer(bits).copy(repr, reprCursor);
  reprCursor += bitsLen;
  // Write refs
  for (const c of refs) {
    let childDepth;
    if (type == CellType.MerkleProof || type == CellType.MerkleUpdate) {
      childDepth = c.depth(level + 1);
    }
    else {
      childDepth = c.depth(level);
    }
    repr[reprCursor++] = Math.floor(childDepth / 256);
    repr[reprCursor++] = childDepth % 256;
  }
  for (const c of refs) {
    let childHash;
    if (type == CellType.MerkleProof || type == CellType.MerkleUpdate) {
      childHash = c.hash(level + 1);
    }
    else {
      childHash = c.hash(level);
    }
    childHash.copy(repr, reprCursor);
    reprCursor += 32;
  }
  // Result
  return repr;
}
