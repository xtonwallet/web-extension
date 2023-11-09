/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { BitReader } from "../BitReader";
import { CellType } from "../CellType";
import { exoticLibrary } from "./exoticLibrary";
import { exoticMerkleProof } from "./exoticMerkleProof";
import { exoticMerkleUpdate } from "./exoticMerkleUpdate";
import { exoticPruned } from "./exoticPruned";
import { LevelMask } from "./LevelMask";

function resolvePruned(bits, refs) {
  // Parse pruned cell
  let pruned = exoticPruned(bits, refs);
  // Calculate parameters
  let depths = [];
  let hashes = [];
  let mask = new LevelMask(pruned.mask);
  for (let i = 0; i < pruned.pruned.length; i++) {
    depths.push(pruned.pruned[i].depth);
    hashes.push(pruned.pruned[i].hash);
  }
  return {
    type: CellType.PrunedBranch,
    depths,
    hashes,
    mask
  };
}
function resolveLibrary(bits, refs) {
  // Parse library cell
  let pruned = exoticLibrary(bits, refs);
  // Calculate parameters
  let depths = [];
  let hashes = [];
  let mask = new LevelMask();
  return {
    type: CellType.Library,
    depths,
    hashes,
    mask
  };
}
function resolveMerkleProof(bits, refs) {
  // Parse merkle proof cell
  let merkleProof = exoticMerkleProof(bits, refs);
  // Calculate parameters
  let depths = [];
  let hashes = [];
  let mask = new LevelMask(refs[0].level() >> 1);
  return {
    type: CellType.MerkleProof,
    depths,
    hashes,
    mask
  };
}
function resolveMerkleUpdate(bits, refs) {
  // Parse merkle proof cell
  let merkleUpdate = exoticMerkleUpdate(bits, refs);
  // Calculate parameters
  let depths = [];
  let hashes = [];
  let mask = new LevelMask((refs[0].level() | refs[1].level()) >> 1);
  return {
    type: CellType.MerkleUpdate,
    depths,
    hashes,
    mask
  };
}
export function resolveExotic(bits, refs) {
  let reader = new BitReader(bits);
  let type = reader.preloadUint(8);
  if (type === 1) {
    return resolvePruned(bits, refs);
  }
  if (type === 2) {
    return resolveLibrary(bits, refs);
  }
  if (type === 3) {
    return resolveMerkleProof(bits, refs);
  }
  if (type === 4) {
    return resolveMerkleUpdate(bits, refs);
  }
  throw Error('Invalid exotic cell type: ' + type);
}
