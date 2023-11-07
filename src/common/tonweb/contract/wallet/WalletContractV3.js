import {Cell} from "./../../toncore";
import WalletContract from "./WalletContract";
import {parseWalletV3TransferQuery, parseWalletV3TransferBody} from "./WalletQueryParser";
import {Buffer} from "buffer";

class WalletV3ContractBase extends WalletContract {

    /**
     * @override
     * @private
     * @param   seqno?   {number}
     * @param   expireAt? {number}
     * @return {Cell}
     */
    createSigningMessage(seqno, expireAt) {
        seqno = seqno || 0;
        expireAt = expireAt || (Math.floor(Date.now() / 1e3) + 60);
        const message = new Cell().asBuilder();
        message.storeUint(this.options.walletId, 32);
        if (seqno === 0) {
            // message.storeInt(-1, 32);// todo: dont work
            for (let i = 0; i < 32; i++) {
                message.storeBit(1);
            }
        } else {
            message.storeUint(expireAt, 32);
        }
        message.storeUint(seqno, 32);
        return message.asCell();
    }

    /**
     * @override
     * @return {Cell} cell contains wallet data
     */
    createDataCell() {
        const cell = new Cell().asBuilder();
        cell.storeUint(0, 32);
        cell.storeUint(this.options.walletId, 32);
        cell.storeBuffer(Buffer.from(this.options.publicKey, 'binary'));
        return cell.asCell();
    }
}

class WalletV3ContractR1 extends WalletV3ContractBase {
    /**
     * @param provider    {HttpProvider}
     * @param options {any}
     */
    constructor(provider, options) {
        options.code = Cell.fromBoc(Buffer.from("B5EE9C724101010100620000C0FF0020DD2082014C97BA9730ED44D0D70B1FE0A4F2608308D71820D31FD31FD31FF82313BBF263ED44D0D31FD31FD3FFD15132BAF2A15144BAF2A204F901541055F910F2A3F8009320D74A96D307D402FB00E8D101A4C8CB1FCB1FCBFFC9ED543FBE6EE0", 'hex'))[0];
        super(provider, options);
        if (!this.options.walletId) this.options.walletId = 698983191 + this.options.workChain;
    }

    getName() {
        return 'v3R1';
    }
}

WalletV3ContractR1.parseTransferQuery = parseWalletV3TransferQuery;
WalletV3ContractR1.parseTransferBody = parseWalletV3TransferBody;

class WalletV3ContractR2 extends WalletV3ContractBase {
    /**
     * @param provider    {HttpProvider}
     * @param options {any}
     */
    constructor(provider, options) {
        options.code = Cell.fromBoc(Buffer.from("B5EE9C724101010100710000DEFF0020DD2082014C97BA218201339CBAB19F71B0ED44D0D31FD31F31D70BFFE304E0A4F2608308D71820D31FD31FD31FF82313BBF263ED44D0D31FD31FD3FFD15132BAF2A15144BAF2A204F901541055F910F2A3F8009320D74A96D307D402FB00E8D101A4C8CB1FCB1FCBFFC9ED5410BD6DAD", 'hex'))[0];
        super(provider, options);
        if (!this.options.walletId) this.options.walletId = 698983191 + this.options.workChain;
    }

    getName() {
        return 'v3R2';
    }
}

WalletV3ContractR2.parseTransferQuery = parseWalletV3TransferQuery;
WalletV3ContractR2.parseTransferBody = parseWalletV3TransferBody;

export {WalletV3ContractR1, WalletV3ContractR2};

