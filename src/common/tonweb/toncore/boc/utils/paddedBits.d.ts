/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BitString } from "../BitString";
export declare function bitsToPaddedBuffer(bits: BitString): Buffer;
export declare function paddedBufferToBits(buff: Buffer): BitString;
