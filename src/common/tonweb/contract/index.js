import {Cell, storeStateInit, Address, storeMessage} from "./../toncore";
import {Buffer} from "buffer";
class Contract {
    /**
     * @param provider    {HttpProvider}
     * @param options    {{code?: Cell, address?: Address | string, workChain?: number}}
     */
    constructor(provider, options) {
        this.provider = provider;
        this.options = options;
        this.address = options.address ? (typeof options.address === "string" ? Address.parse(options.address): options.address) : null;
        if (!options.workChain) options.workChain = this.address ? this.address.workChain : 0;
        this.methods = {};
    }

    /**
     * @return {Promise<Address>}
     */
    async getAddress() {
        if (!this.address) {
            this.address = (await this.createStateInit()).address;
        }
        return this.address;
    }

    /**
     * @private
     * @return {Cell} cell contains contact code
     */
    createCodeCell() {
        if (!this.options.code) throw new Error('Contract: options.code is not defined')
        return this.options.code;
    }

    /**
     * Method to override
     * @protected
     * @return {Cell} cell contains contract data
     */
    createDataCell() {
        return new Cell();
    }

    /**
     * @protected
     * @return {Promise<{stateInit: Cell, address: Address, code: Cell, data: Cell}>}
     */
    async createStateInit() {
        const codeCell = this.createCodeCell();
        const dataCell = this.createDataCell();
        const stateInit = Contract.createStateInit(codeCell, dataCell);
        const address = new Address(this.options.workChain, stateInit.hash());
        return {
            stateInit: stateInit,
            address: address,
            code: codeCell,
            data: dataCell,
        }
    }

    // _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
    // code:(Maybe ^Cell) data:(Maybe ^Cell)
    // library:(Maybe ^Cell) = StateInit;
    /**
     * @param code  {Cell}
     * @param data  {Cell}
     * @param library {null}
     * @param splitDepth {null}
     * @param ticktock  {null}
     * @return {Cell}
     */
    static createStateInit(code,
                           data,
                           libraries = null,
                           splitDepth = null,
                           ticktock = null) {
        return new Cell().asBuilder().store(storeStateInit({
                                                splitDepth: splitDepth,
                                                special: ticktock,
                                                libraries: libraries,
                                                code: code,
                                                data: data
                                            })).asCell();
    }

    // extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32))
    // = ExtraCurrencyCollection;
    // currencies$_ grams:Grams other:ExtraCurrencyCollection
    // = CurrencyCollection;

    //int_msg_info$0 ihr_disabled:Bool bounce:Bool
    //src:MsgAddressInt dest:MsgAddressInt
    //value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
    //created_lt:uint64 created_at:uint32 = CommonMsgInfo;
    /**
     * @param dest  {Address | string}
     * @param gramValue  {number | BN}
     * @param ihrDisabled  {boolean}
     * @param bounce  {null | boolean}
     * @param bounced {boolean}
     * @param src  {Address | string}
     * @param currencyCollection  {null}
     * @param ihrFees  {number | BN}
     * @param fwdFees  {number | BN}
     * @param createdLt  {number | BN}
     * @param createdAt  {number | BN}
     * @return {CommonMessageInfo}
     */
    static createInternalMessageHeader(dest,
                                       gramValue = 0,
                                       ihrDisabled = true,
                                       bounce = null,
                                       bounced = false,
                                       src = null,
                                       currencyCollection = null,
                                       ihrFee = 0,
                                       forwardFee = 0,
                                       createdLt = 0,
                                       createdAt = 0) {
        return {
                    type: 'internal',
                    ihrDisabled: ihrDisabled,
                    bounce: bounce,
                    bounced: bounced,
                    src: src,
                    dest: dest,
                    value: currencyCollection == null ? {"coins": gramValue}: currencyCollection,
                    ihrFee: ihrFee,
                    forwardFee: forwardFee,
                    createdLt: createdLt,
                    createdAt: createdAt,
                };
    }

    //ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt
    //import_fee:Grams = CommonMsgInfo;
    /**
     * @param dest  {Address | string}
     * @param src  {Address | string}
     * @param importFee  {number | BN}
     * @return {Cell}
     */
    static createExternalMessageHeader(dest,
                                       src = null,
                                       importFee = 0) {
        return {
            type: 'external-in',
            src: src,
            dest: dest,
            importFee: importFee
        };
    }

    //tblkch.pdf, page 57
    /**
     * Create CommonMsgInfo contains header, stateInit, body
     * @param header {CommonMessageInfo}
     * @param stateInit?  {stateInit}
     * @param body?  {Cell}
     * @return {Cell}
     */
    static createCommonMsgInfo(info, init = null, body = null) {
        const commonMsgInfo = new Cell().asBuilder();
        commonMsgInfo.store(storeMessage({
            info: info,
            init: init,
            body: body
        }, {forceRef: true}));
        return commonMsgInfo.asCell();
    }

    static createMethod(provider, queryPromise) {
        return {
            getQuery: async () => {
                return (await queryPromise).message;
            },
            send: async () => {
                const query = await queryPromise;
                const boc = Buffer.from(await query.message.toBoc()).toString("base64");
                return provider.sendBoc(boc);
            },
            estimateFee: async () => {
                const query = await queryPromise;
                const serialized = query.code ? // deploy
                    {
                        address: query.address.toString({urlSafe: true, bounceable: false, testOnly: true}),
                        body: Buffer.from(await query.body.toBoc()).toString("base64"),
                        init_code: Buffer.from(await query.code.toBoc()).toString("base64"),
                        init_data: Buffer.from(await query.data.toBoc()).toString("base64"),
                    } : {
                        address: query.address.toString({urlSafe: true, bounceable: true, testOnly: true}),
                        body: Buffer.from(await query.body.toBoc()).toString("base64"),
                    };

                return provider.getEstimateFee(serialized);
            }
        }
    }
}

export default Contract;
