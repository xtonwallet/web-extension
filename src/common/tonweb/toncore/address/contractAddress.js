/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { beginCell } from "../boc/Builder";
import { storeStateInit } from "../types/StateInit";
import { Address } from "./Address";

export function contractAddress(workchain, init) {
  let hash = beginCell()
    .store(storeStateInit(init))
    .endCell()
    .hash();
  return new Address(workchain, hash);
}
