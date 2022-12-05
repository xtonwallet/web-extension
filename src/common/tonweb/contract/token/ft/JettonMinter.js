import BigNumber from "bignumber.js";
import Contract from "../../index";
import {Cell} from "../../../boc";
import {createOffchainUriCell, parseOffchainUriCell, parseAddress, SNAKE_DATA_PREFIX} from "../nft/NftUtils";
import {Address, bytesToBase64, bytesToHex, concatBytes, stringToBytes, sha256} from "../../../utils";

class JettonMinter extends Contract {

    /**
     * @param provider
     * @param options   {{adminAddress: Address, jettonContentUri: string, jettonWalletCodeHex: string, address?: Address | string, code?: Cell}}
     */
    constructor(provider, options) {
        options.wc = 0;
        options.code = options.code || Cell.oneFromBoc('B5EE9C7241020B010001ED000114FF00F4A413F4BCF2C80B0102016202030202CC040502037A60090A03EFD9910E38048ADF068698180B8D848ADF07D201800E98FE99FF6A2687D007D206A6A18400AA9385D47181A9AA8AAE382F9702480FD207D006A18106840306B90FD001812881A28217804502A906428027D012C678B666664F6AA7041083DEECBEF29385D71811A92E001F1811802600271812F82C207F97840607080093DFC142201B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064907C80383A6465816503E5FFE4E83BC00C646582AC678B28027D0109E5B589666664B8FD80400FE3603FA00FA40F82854120870542013541403C85004FA0258CF1601CF16CCC922C8CB0112F400F400CB00C9F9007074C8CB02CA07CBFFC9D05008C705F2E04A12A1035024C85004FA0258CF16CCCCC9ED5401FA403020D70B01C3008E1F8210D53276DB708010C8CB055003CF1622FA0212CB6ACB1FCB3FC98042FB00915BE200303515C705F2E049FA403059C85004FA0258CF16CCCCC9ED54002E5143C705F2E049D43001C85004FA0258CF16CCCCC9ED54007DADBCF6A2687D007D206A6A183618FC1400B82A1009AA0A01E428027D012C678B00E78B666491646580897A007A00658064FC80383A6465816503E5FFE4E840001FAF16F6A2687D007D206A6A183FAA904051007F09');
        super(provider, options);
        this.jettonOnChainMetadata = {
          "bf4546a6ffe1b79cfdd86bad3db874313dcde2fb05e6a74aa7f3552d9617c79d12": "name",
          "bf5208def46f5a1d4f9dce66ab309f4a851305f166f91ef79d923ef58e34f9a208": "description",
          "bff082eb663b57a00192f4a6ac467288df2dfeddb9da1bee28f6521c8bebd21f1e80": "image",
          "bf5d01fa5e3c06901c45046c6b2ddcea5af764fea0eed72a10d404f2312ceb247c": "decimals",
          "bf6ed4f942a7848ce2cb066b77a1128c6a1ff8c43f438a2dce24612ba9ffab8b02": "symbol"
        };
    }

    /**
     * @override
     * @private
     * @return {Cell} cell contains jetton minter data
     */
    createDataCell() {
        const cell = new Cell();
        cell.bits.writeCoins(0); // total supply
        cell.bits.writeAddress(this.options.adminAddress);
        cell.refs[0] = createOffchainUriCell(this.options.jettonContentUri);
        cell.refs[1] = Cell.oneFromBoc(this.options.jettonWalletCodeHex);
        return cell;
    }

    /**
     * params   {{jettonAmount: BigNumber, destination: Address, amount: BigNumber, queryId?: number}}
     * @return {Cell}
     */
     createMintBody(params) {
        const body = new Cell();
        body.bits.writeUint(21, 32); // OP mint
        body.bits.writeUint(params.queryId || 0, 64); // query_id
        body.bits.writeAddress(params.destination);
        body.bits.writeCoins(params.amount); // in Toncoins

        const transferBody = new Cell(); // internal transfer
        transferBody.bits.writeUint(0x178d4519, 32); // internal_transfer op
        transferBody.bits.writeUint(params.queryId || 0, 64);
        transferBody.bits.writeCoins(params.jettonAmount);
        transferBody.bits.writeAddress(null); // from_address
        transferBody.bits.writeAddress(null); // response_address
        transferBody.bits.writeCoins(new BigNumber(0)); // forward_amount
        transferBody.bits.writeBit(false); // forward_payload in this slice, not separate cell

        body.refs[0] = transferBody;
        return body;
    }

    /**
     * params   {{queryId?: number, newAdminAddress: Address}}
     * @return {Cell}
     */
    createChangeAdminBody(params) {
        if (params.newAdminAddress === undefined) throw new Error('Specify newAdminAddress');

        const body = new Cell();
        body.bits.writeUint(3, 32); // OP
        body.bits.writeUint(params.queryId || 0, 64); // query_id
        body.bits.writeAddress(params.newAdminAddress);
        return body;
    }

    /**
     * params   {{jettonContentUri: string, queryId?: number}}
     * @return {Cell}
     */
    createEditContentBody(params) {
        const body = new Cell();
        body.bits.writeUint(4, 32); // OP
        body.bits.writeUint(params.queryId || 0, 64); // query_id
        body.refs[0] = createOffchainUriCell(params.jettonContentUri);
        return body;
    }

    /**
     * @return {Promise<{ totalSupply: BigNumber, isMutable: boolean, adminAddress: Address|null, jettonContentCell: Cell, jettonContentUri: string|null, jettonWalletCode: Cell }>}
     */
    async getJettonData() {
        const myAddress = await this.getAddress();
        const result = await this.provider.call2(myAddress.toString(), 'get_jetton_data');

        const totalSupply = result[0];
        const isMutable = result[1].toNumber() === -1;
        const adminAddress = parseAddress(result[2]);
        const jettonContentCell = result[3];
        let jettonContentUri = null;
        try {
            jettonContentUri = parseOffchainUriCell(jettonContentCell);
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
        const cell = new Cell()
        cell.bits.writeAddress(ownerAddress)

        const result = await this.provider.call2(
            myAddress.toString(),
            'get_wallet_address',
            [['tvm.Slice', bytesToBase64(await cell.toBoc(false))]],
        );
        return parseAddress(result)
    }

    async getOnchainMetadata(cell) {
      const slice = cell.beginParse();
      if (slice.loadUint(8).toNumber() !== SNAKE_DATA_PREFIX) {
        throw new Error("Only snake format is supported");
      }

      const loadRefs = (slice, arr) => {
        arr.push(bytesToHex(slice.loadBits(slice.length)));
        for (let k in slice.refs) {
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
