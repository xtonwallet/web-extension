import {Buffer} from "buffer";
import BigNumber from "bignumber.js";
import Contract from "../../index";
import {Cell} from "./../../../toncore";
import {parseAddress} from "../nft/NftUtils";

const JETTON_WALLET_CODE_HEX = 'B5EE9C7241021201000328000114FF00F4A413F4BCF2C80B0102016202030202CC0405001BA0F605DA89A1F401F481F481A8610201D40607020148080900BB0831C02497C138007434C0C05C6C2544D7C0FC02F83E903E900C7E800C5C75C87E800C7E800C00B4C7E08403E29FA954882EA54C4D167C0238208405E3514654882EA58C511100FC02780D60841657C1EF2EA4D67C02B817C12103FCBC2000113E910C1C2EBCB853600201200A0B020120101101F500F4CFFE803E90087C007B51343E803E903E90350C144DA8548AB1C17CB8B04A30BFFCB8B0950D109C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C032483E401C1D3232C0B281F2FFF274013E903D010C7E801DE0063232C1540233C59C3E8085F2DAC4F3208405E351467232C7C6600C03F73B51343E803E903E90350C0234CFFE80145468017E903E9014D6F1C1551CDB5C150804D50500F214013E809633C58073C5B33248B232C044BD003D0032C0327E401C1D3232C0B281F2FFF274140371C1472C7CB8B0C2BE80146A2860822625A020822625A004AD822860822625A028062849F8C3C975C2C070C008E00D0E0F009ACB3F5007FA0222CF165006CF1625FA025003CF16C95005CC2391729171E25008A813A08208989680AA008208989680A0A014BCF2E2C504C98040FB001023C85004FA0258CF1601CF16CCC9ED5400705279A018A182107362D09CC8CB1F5230CB3F58FA025007CF165007CF16C9718018C8CB0524CF165006FA0215CB6A14CCC971FB0010241023000E10491038375F040076C200B08E218210D53276DB708010C8CB055008CF165004FA0216CB6A12CB1F12CB3FC972FB0093356C21E203C85004FA0258CF1601CF16CCC9ED5400DB3B51343E803E903E90350C01F4CFFE803E900C145468549271C17CB8B049F0BFFCB8B0A0822625A02A8005A805AF3CB8B0E0841EF765F7B232C7C572CFD400FE8088B3C58073C5B25C60063232C14933C59C3E80B2DAB33260103EC01004F214013E809633C58073C5B3327B55200083200835C87B51343E803E903E90350C0134C7E08405E3514654882EA0841EF765F784EE84AC7CB8B174CFCC7E800C04E81408F214013E809633C58073C5B3327B55205ECCF23D';

class JettonWallet extends Contract {
    /**
     * @param provider
     * @param options   {{address?: Address | string, code?: Cell}}
     */
    constructor(provider, options) {
        options.workChain = 0;
        options.code = options.code || Cell.fromBoc(Buffer.from(JETTON_WALLET_CODE_HEX, 'hex'))[0];
        super(provider, options);
    }

    /**
     * @param params    {{queryId?: number, jettonAmount: BigNumber, toAddress: Address, responseAddress: Address, forwardAmount: BigNumber, forwardPayload: Uint8Array}}
     */
    async createTransferBody(params) {
        const cell = new Cell().asBuilder();
        cell.storeUint(0xf8a7ea5, 32); // request_transfer op
        cell.storeUint(params.queryId || 0, 64);
        cell.storeCoins(params.jettonAmount);
        cell.storeAddress(params.toAddress);
        cell.storeAddress(params.responseAddress);
        cell.storeBit(false); // null custom_payload
        cell.storeCoins(params.forwardAmount || new BigNumber(0));
        cell.storeBit(false); // forward_payload in this slice, not separate cell
        if (params.forwardPayload) {
            cell.storeBuffer(Buffer.from(params.forwardPayload, 'binary'));
        }
        return cell.asCell();
    }

    /**
     * @param params    {{queryId?: number, jettonAmount: BigNumber, responseAddress: Address}}
     */
    async createBurnBody(params) {
        const cell = new Cell().asBuilder();
        cell.storeUint(0x595f07bc, 32); // burn op
        cell.storeUint(params.queryId || 0, 64);
        cell.storeCoins(params.jettonAmount);
        cell.storeAddress(params.responseAddress);
        return cell.asCell();
    }

    async getData() {
        const myAddress = await this.getAddress();
        const result = await this.provider.call2(myAddress.toString(), 'get_wallet_data');

        const balance = result[0];
        const ownerAddress = parseAddress(result[1]);
        const jettonMinterAddress =  parseAddress(result[2]);
        const jettonWalletCode = result[3];

        return {balance, ownerAddress, jettonMinterAddress, jettonWalletCode};
    }
}

JettonWallet.codeHex = JETTON_WALLET_CODE_HEX;

export default JettonWallet;
