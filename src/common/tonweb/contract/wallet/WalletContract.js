import {Buffer} from "buffer";
import nacl from "tweetnacl";
import Contract from "../index";
import {Cell, Address} from "./../../toncore";
import BigNumber from "bignumber.js";

/**
 * Abstract standard wallet class
 */
class WalletContract extends Contract {
    /**
     * @param provider    {HttpProvider}
     * @param options?    {{code: Uint8Array, publicKey?: Uint8Array, address?: Address | string, workChain?: number}}
     */
    constructor(provider, options) {
        if (!options.publicKey && !options.address) throw new Error('WalletContract required publicKey or address in options')
        super(provider, options);

        this.methods = {
            /**
             * @param   params {{secretKey: Uint8Array, toAddress: Address | string, amount: BigNumber | number, seqno: number, payload: string | Uint8Array | Cell, sendMode: number, stateInit?: Cell, expireAt?: number}}
             */
            transfer: (params) => Contract.createMethod(provider, this.createTransferMessage(params.secretKey, params.toAddress, params.amount, params.seqno, params.payload, params.sendMode, !Boolean(params.secretKey), params.stateInit, params.expireAt)),

            seqno: () => {
                return {
                    /**
                     * @return {Promise<number>}
                     */
                    call: async () => {
                        const address = await this.getAddress();
                        let n = null;
                        try {
                            n = (await provider.call2(address.toString(), 'seqno')).toNumber();
                        } catch (e) {
                        }
                        return n;
                    }
                }
            }
        }

        /**
         * @param secretKey {Uint8Array}
         */
        this.deploy = (secretKey) => Contract.createMethod(provider, this.createInitExternalMessage(secretKey));
    }

    getName() {
        throw new Error('override me');
    }

    /**
     * @override
     * @protected
     * @return {Cell} cell contains wallet data
     */
    createDataCell() {
        // 4 byte seqno, 32 byte publicKey
        const cell = new Cell().asBuilder();
        cell.storeUint(0, 32); // seqno
        cell.storeBuffer(Buffer.from(this.options.publicKey, 'binary'));
        return cell.asCell();
    }

    /**
     * @protected
     * @param   seqno?   {number}
     * @return {Cell}
     */
    createSigningMessage(seqno) {
        seqno = seqno || 0;
        const cell = new Cell().asBuilder();
        cell.storeUint(seqno, 32);
        return cell.asCell();
    }

    /**
     * External message for initialization
     * @param secretKey  {Uint8Array} nacl.KeyPair.secretKey
     * @return {{address: Address, message: Cell, body: Cell, sateInit: Cell, code: Cell, data: Cell}}
     */
    async createInitExternalMessage(secretKey) {
        if (!this.options.publicKey) {
            const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey)
            this.options.publicKey = keyPair.publicKey;
        }
        const {stateInit, address, code, data} = await this.createStateInit();

        const signingMessage = this.createSigningMessage();
        const signature = nacl.sign.detached(signingMessage.hash(), secretKey);

        const body = new Cell().asBuilder();
        body.storeBuffer(Buffer.from(signature, 'binary'));
        body.storeBuilder(signingMessage.asBuilder());

        const header = Contract.createExternalMessageHeader(address);
        const externalMessage = Contract.createCommonMsgInfo(header, {code, data}, body.asCell());

        return {
            address: address,
            message: externalMessage,
            body: body.asCell(),
            signingMessage,
            stateInit,
            code,
            data,
        };
    }

    /**
     * @protected
     * @param signingMessage {Cell}
     * @param secretKey {Uint8Array}  nacl.KeyPair.secretKey
     * @param seqno {number}
     * @param dummySignature?    {boolean}
     * @return {Promise<{address: Address, signature: Uint8Array, message: Cell, cell: Cell, body: Cell, resultMessage: Cell}>}
     */
    async createExternalMessage(
        signingMessage,
        secretKey,
        seqno,
        dummySignature = false
    ) {
        const signature = dummySignature ? Buffer.alloc(64) : nacl.sign.detached(signingMessage.hash(), secretKey);

        const body = new Cell().asBuilder();
        body.storeBuffer(Buffer.from(signature, 'binary'));
        body.storeBuilder(signingMessage.asBuilder());

        let stateInit = null, code = null, data = null;

        if (seqno === 0) {
            if (!this.options.publicKey) {
                const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
                this.options.publicKey = keyPair.publicKey;
            }
            const deploy = await this.createStateInit();
            stateInit = deploy.stateInit;
            code = deploy.code;
            data = deploy.data;
        }

        const selfAddress = await this.getAddress();
        const header = Contract.createExternalMessageHeader(selfAddress);
        const resultMessage = Contract.createCommonMsgInfo(header, stateInit, body.asCell());

        return {
            address: selfAddress,
            message: resultMessage, // old wallet_send_generate_external_message

            body: body.asCell(),
            signature: signature,
            signingMessage: signingMessage,

            stateInit,
            code,
            data,
        };
    }

    /**
     * @param secretKey {Uint8Array}  nacl.KeyPair.secretKey
     * @param address   {Address | string}
     * @param amount    {BigNumber | number} in nanograms
     * @param seqno {number}
     * @param payload?   {string | Uint8Array | Cell}
     * @param sendMode?  {number}
     * @param dummySignature?    {boolean}
     * @param stateInit? {Cell}
     * @param expireAt? {number}
     * @return {Promise<{address: Address, signature: Uint8Array, message: Cell, cell: Cell, body: Cell, resultMessage: Cell}>}
     */
    async createTransferMessage(
        secretKey,
        address,
        amount,
        seqno,
        payload = "",
        sendMode = 3,
        dummySignature = false,
        stateInit = null,
        expireAt = undefined
    ) {
        let payloadCell = new Cell().asBuilder();
        if (payload) {
            if (payload.refs) { // is Cell
                payloadCell = payload.asBuilder();
            } else if (typeof payload === 'string') {
                if (payload.length > 0) {
                    payloadCell.storeUint(0, 32);
                    payloadCell.storeStringTail(payload);
                }
            } else {
                payloadCell.storeBuffer(Buffer.from(payload, 'binary'))
            }
        }

        const orderHeader = Contract.createInternalMessageHeader(Address.parse(address), new BigNumber(amount));
        const order = Contract.createCommonMsgInfo(orderHeader, stateInit, payloadCell.endCell());
        const signingMessage = this.createSigningMessage(seqno, expireAt).asBuilder();
        signingMessage.storeUint(sendMode, 8);
        signingMessage.storeRef(order);

        return this.createExternalMessage(signingMessage.asCell(), secretKey, seqno, dummySignature);
    }
}

export default WalletContract;
