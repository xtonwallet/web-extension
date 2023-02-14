import {SimpleWalletContractR1, SimpleWalletContractR2, SimpleWalletContractR3} from "./WalletContractSimple";
import {WalletV2ContractR1, WalletV2ContractR2} from "./WalletContractV2";
import {WalletV3ContractR1, WalletV3ContractR2} from "./WalletContractV3";
import WalletV4ContractR1 from "./WalletContractV4";
import WalletV4ContractR2 from "./WalletContractV4R2";

const ALL = {
    'simpleR1': SimpleWalletContractR1,
    'simpleR2': SimpleWalletContractR2,
    'simpleR3': SimpleWalletContractR3,
    'v2R1': WalletV2ContractR1,
    'v2R2': WalletV2ContractR2,
    'v3R1': WalletV3ContractR1,
    'v3R2': WalletV3ContractR2,
    'v4R1': WalletV4ContractR1,
    'v4R2': WalletV4ContractR2
};

const LIST = [SimpleWalletContractR1, SimpleWalletContractR2, SimpleWalletContractR3, WalletV2ContractR1, WalletV2ContractR2, WalletV3ContractR1, WalletV3ContractR2, WalletV4ContractR1, WalletV4ContractR2];

class Wallets {
    /**
     * @param provider    {HttpProvider}
     */
    constructor(provider) {
        this.provider = provider;
        this.all = ALL;
        this.list = LIST;
        this.defaultVersion = 'v3R1';
        this.default = this.all[this.defaultVersion];
    }

    create(options) {
        return new this.default(this.provider, options);
    }
}

Wallets.all = ALL;
Wallets.list = LIST;

export default Wallets;
