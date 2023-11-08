import BigNumber from "bignumber.js";
import Contract from "../../index";
import {Cell, Address} from "./../../../toncore";
import {createOffchainUriCell, parseOffchainUriCell, parseAddress, SNAKE_DATA_PREFIX} from "../nft/NftUtils";
import {Buffer} from "buffer";

class JettonMinter extends Contract {

    /**
     * @param provider
     * @param options   {{adminAddress: Address, jettonContentUri: string, jettonWalletCodeHex: string, address?: Address | string, code?: Cell}}
     */
    constructor(provider, options) {
        options.workChain = 0;
        options.code = options.code || Cell.fromBoc(Buffer.from('B5EE9C7241020B010001ED000114FF00F4A413F4BCF2C80B0102016202030202CC040502037A60090A03EFD9910E38048ADF068698180B8D848ADF07D201800E98FE99FF6A2687D007D206A6A18400AA9385D47181A9AA8AAE382F9702480FD207D006A18106840306B90FD001812881A28217804502A906428027D012C678B666664F6AA7041083DEECBEF29385D71811A92E001F1811802600271812F82C207F97840607080093DFC142201B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064907C80383A6465816503E5FFE4E83BC00C646582AC678B28027D0109E5B589666664B8FD80400FE3603FA00FA40F82854120870542013541403C85004FA0258CF1601CF16CCC922C8CB0112F400F400CB00C9F9007074C8CB02CA07CBFFC9D05008C705F2E04A12A1035024C85004FA0258CF16CCCCC9ED5401FA403020D70B01C3008E1F8210D53276DB708010C8CB055003CF1622FA0212CB6ACB1FCB3FC98042FB00915BE200303515C705F2E049FA403059C85004FA0258CF16CCCCC9ED54002E5143C705F2E049D43001C85004FA0258CF16CCCCC9ED54007DADBCF6A2687D007D206A6A183618FC1400B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064FC80383A6465816503E5FFE4E840001FAF16F6A2687D007D206A6A183FAA904051007F09', 'hex'))[0];
        super(provider, options);
        this.jettonOnChainMetadata = {
          "BF4546A6FFE1B79CFDD86BAD3DB874313DCDE2FB05E6A74AA7F3552D9617C79D13_": "name",
          "BF5208DEF46F5A1D4F9DCE66AB309F4A851305F166F91EF79D923EF58E34F9A209_": "description",
          "BFF082EB663B57A00192F4A6AC467288DF2DFEDDB9DA1BEE28F6521C8BEBD21F1EC_": "image",
          "BF5D01FA5E3C06901C45046C6B2DDCEA5AF764FEA0EED72A10D404F2312CEB247D_": "decimals",
          "BF6ED4F942A7848CE2CB066B77A1128C6A1FF8C43F438A2DCE24612BA9FFAB8B03_": "symbol"
        };
    }

    /**
     * @override
     * @private
     * @return {Cell} cell contains jetton minter data
     */
    createDataCell() {
        const cell = new Cell().asBuilder();
        cell.storeCoins(0); // total supply
        cell.storeAddress(this.options.adminAddress);
        cell.storeRef(createOffchainUriCell(this.options.jettonContentUri));
        cell.storeRef(Cell.fromBoc(Buffer.from(this.options.jettonWalletCodeHex, 'hex'))[0]);
        return cell.asCell();
    }

    /**
     * params   {{jettonAmount: BigNumber, destination: Address, amount: BigNumber, queryId?: number}}
     * @return {Cell}
     */
     createMintBody(params) {
        const body = new Cell().asBuilder();
        body.storeUint(21, 32); // OP mint
        body.storeUint(params.queryId || 0, 64); // query_id
        body.storeAddress(params.destination);
        body.storeCoins(params.amount); // in Toncoins

        const transferBody = new Cell().asBuilder(); // internal transfer
        transferBody.storeUint(0x178d4519, 32); // internal_transfer op
        transferBody.storeUint(params.queryId || 0, 64);
        transferBody.storeCoins(params.jettonAmount);
        transferBody.storeAddress(null); // from_address
        transferBody.storeAddress(null); // response_address
        transferBody.storeCoins(new BigNumber(0)); // forward_amount
        transferBody.storeBit(false); // forward_payload in this slice, not separate cell

        body.storeRef(transferBody.asCell());
        return body.asCell();
    }

    /**
     * params   {{queryId?: number, newAdminAddress: Address}}
     * @return {Cell}
     */
    createChangeAdminBody(params) {
        if (params.newAdminAddress === undefined) throw new Error('Specify newAdminAddress');

        const body = new Cell().asBuilder();
        body.storeUint(3, 32); // OP
        body.storeUint(params.queryId || 0, 64); // query_id
        body.storeAddress(params.newAdminAddress);
        return body.asCell();
    }

    /**
     * params   {{jettonContentUri: string, queryId?: number}}
     * @return {Cell}
     */
    createEditContentBody(params) {
        const body = new Cell().asBuilder();
        body.storeUint(4, 32); // OP
        body.storeUint(params.queryId || 0, 64); // query_id
        body.storeRef(createOffchainUriCell(params.jettonContentUri));
        return body.asCell();
    }

    /**
     * @return {Promise<{ totalSupply: BigNumber, isMutable: boolean, adminAddress: Address|null, jettonContentCell: Cell, jettonContentUri: string|null, jettonWalletCode: Cell }>}
     */
    async getJettonData() {
        const myAddress = await this.getAddress();
        const result = await this.provider.call2(myAddress.toString(), 'get_jetton_data');

        const totalSupply = result[0].toNumber();
        const isMutable = result[1].toNumber() === -1;
        const adminAddress = parseAddress(result[2]);
        const jettonContentCell = result[3];
        let jettonContentUri = null;
        try {
            jettonContentUri = parseOffchainUriCell(jettonContentCell.asSlice());
        } catch (e) {
        }
        const jettonWalletCode = result[4];

        return {totalSupply, isMutable, adminAddress, jettonContentCell, jettonContentUri, jettonWalletCode};
    }

    /**
     * params   {{ownerAddress: Address}}
     * @return {Promise<Address>}
     */
    async getJettonWalletAddress(ownerAddress) {
        const myAddress = await this.getAddress();
        const cell = new Cell().asBuilder();
        cell.storeAddress(ownerAddress)

        const result = await this.provider.call2(
            myAddress.toString(),
            'get_wallet_address',
            [['tvm.Slice', Buffer.from(cell.asCell().toBoc()).toString("base64")]],
        );
        return parseAddress(result)
    }

    async getOnchainMetadata(cell) {
      let slice = cell.asSlice();
      if (slice.loadUint(8) !== SNAKE_DATA_PREFIX) {
        throw new Error("Only snake format is supported");
      }

      const loadRefs = (cell, arr) => {
        let slice = cell.asSlice();
        arr.push(slice.loadBits(slice.remainingBits).toString());
        for (let k in cell.refs) {
          arr.concat(loadRefs(slice.loadRef(), arr));
        }
        return arr;
      };
      const _result = loadRefs(slice.loadRef(), []);

      let result = {};
      for (let i = 0; i < _result.length; i++) {
        if (this.jettonOnChainMetadata[_result[i]]) {
          result[this.jettonOnChainMetadata[_result[i]]] = _result[i+1];
          i++;
        }
      }
      return result;
    }
}

export default JettonMinter;
