/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import "bigint-polyfill";
import { beginCell } from "../boc/Builder";
import { Cell } from "../boc/Cell";
import { Slice } from "../boc/Slice";

export class TupleBuilder {
  constructor() {
    this._tuple = [];
  }
  writeNumber(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'int', value: BigInt(v) });
    }
  }
  writeBoolean(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'int', value: v ? -1n : 0n });
    }
  }
  writeBuffer(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'slice', cell: beginCell().storeBuffer(v).endCell() });
    }
  }
  writeString(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'slice', cell: beginCell().storeStringTail(v).endCell() });
    }
  }
  writeCell(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      if (v instanceof Cell) {
        this._tuple.push({ type: 'cell', cell: v });
      }
      else if (v instanceof Slice) {
        this._tuple.push({ type: 'cell', cell: v.asCell() });
      }
    }
  }
  writeSlice(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      if (v instanceof Cell) {
        this._tuple.push({ type: 'slice', cell: v });
      }
      else if (v instanceof Slice) {
        this._tuple.push({ type: 'slice', cell: v.asCell() });
      }
    }
  }
  writeBuilder(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      if (v instanceof Cell) {
        this._tuple.push({ type: 'builder', cell: v });
      }
      else if (v instanceof Slice) {
        this._tuple.push({ type: 'builder', cell: v.asCell() });
      }
    }
  }
  writeTuple(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'tuple', items: v });
    }
  }
  writeAddress(v) {
    if (v === null || v === undefined) {
      this._tuple.push({ type: 'null' });
    }
    else {
      this._tuple.push({ type: 'slice', cell: beginCell().storeAddress(v).endCell() });
    }
  }
  build() {
    return [...this._tuple];
  }
}
