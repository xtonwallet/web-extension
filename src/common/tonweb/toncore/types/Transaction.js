/**
 * Copyright (c) Whales Corp.
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { beginCell } from "../boc/Builder";
import { Dictionary } from "../dict/Dictionary";
import { loadAccountStatus, storeAccountStatus } from "./AccountStatus";
import { loadCurrencyCollection, storeCurrencyCollection } from "./CurrencyCollection";
import { loadHashUpdate, storeHashUpdate } from "./HashUpdate";
import { loadMessage, MessageValue, storeMessage } from "./Message";
import { loadTransactionDescription, storeTransactionDescription } from "./TransactionDescription";
export function loadTransaction(slice) {
    let raw = slice.asCell();
    if (slice.loadUint(4) !== 0x07) {
        throw Error('Invalid data');
    }
    let address = slice.loadUintBig(256);
    let lt = slice.loadUintBig(64);
    let prevTransactionHash = slice.loadUintBig(256);
    let prevTransactionLt = slice.loadUintBig(64);
    let now = slice.loadUint(32);
    let outMessagesCount = slice.loadUint(15);
    let oldStatus = loadAccountStatus(slice);
    let endStatus = loadAccountStatus(slice);
    let msgRef = slice.loadRef();
    let msgSlice = msgRef.beginParse();
    let inMessage = msgSlice.loadBit() ? loadMessage(msgSlice.loadRef().beginParse()) : undefined;
    let outMessages = msgSlice.loadDict(Dictionary.Keys.Uint(15), MessageValue);
    msgSlice.endParse();
    let totalFees = loadCurrencyCollection(slice);
    let stateUpdate = loadHashUpdate(slice.loadRef().beginParse());
    let description = loadTransactionDescription(slice.loadRef().beginParse());
    return {
        address,
        lt,
        prevTransactionHash,
        prevTransactionLt,
        now,
        outMessagesCount,
        oldStatus,
        endStatus,
        inMessage,
        outMessages,
        totalFees,
        stateUpdate,
        description,
        raw,
        hash: () => raw.hash(),
    };
}
export function storeTransaction(src) {
    return (builder) => {
        builder.storeUint(0x07, 4);
        builder.storeUint(src.address, 256);
        builder.storeUint(src.lt, 64);
        builder.storeUint(src.prevTransactionHash, 256);
        builder.storeUint(src.prevTransactionLt, 64);
        builder.storeUint(src.now, 32);
        builder.storeUint(src.outMessagesCount, 15);
        builder.store(storeAccountStatus(src.oldStatus));
        builder.store(storeAccountStatus(src.endStatus));
        let msgBuilder = beginCell();
        if (src.inMessage) {
            msgBuilder.storeBit(true);
            msgBuilder.storeRef(beginCell().store(storeMessage(src.inMessage)));
        }
        else {
            msgBuilder.storeBit(false);
        }
        msgBuilder.storeDict(src.outMessages);
        builder.storeRef(msgBuilder);
        builder.store(storeCurrencyCollection(src.totalFees));
        builder.storeRef(beginCell().store(storeHashUpdate(src.stateUpdate)));
        builder.storeRef(beginCell().store(storeTransactionDescription(src.description)));
    };
}
