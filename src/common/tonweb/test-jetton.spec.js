import TonWeb from "./index";
import {Address, toNano} from "./toncore";
import {Buffer} from "buffer";
const {JettonMinter, JettonWallet} = TonWeb.token.jetton;

const init = async () => {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC'));

    const seed = Buffer.from('vt58J2v6FaSuXFGcyGtqT5elpVxcZ+I1zgu/GUfA5uY=', 'base64');
    const seed2 = Buffer.from('at58J2v6FaSuXFGcyGtqT5elpVxcZ+I1zgu/GUfA5uY=', 'base64');
    const WALLET2_ADDRESS = 'EQB6-6po0yspb68p7RRetC-hONAz-JwxG9514IEOKw_llXd5';
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);
    const WalletClass = tonweb.wallet.all['v3R1'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        workChain: 0
    });
    const walletAddress = await wallet.getAddress();
    console.log('wallet address=', walletAddress.toString(true, true, true));

    const minter = new JettonMinter(tonweb.provider, {
        adminAddress: walletAddress,
        jettonContentUri: 'https://ton.org/jetton.json',
        jettonWalletCodeHex: JettonWallet.codeHex
    });
    const minterAddress = await minter.getAddress();
    console.log('minter address=', minterAddress.toString(true, true, true));

    const deployMinter = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: minterAddress.toString(true, true, true),
                amount: toNano('0.05'),
                seqno: seqno,
                payload: null, // body
                sendMode: 3,
                stateInit: (await minter.createStateInit()).stateInit
            }).send()
        );
    }

    const getMinterInfo = async () => {
        const data = await minter.getJettonData();
        data.totalSupply = data.totalSupply.toString();
        data.adminAddress = data.adminAddress.toString(true, true, true);
        console.log(data);

        const jettonWalletAddress = await minter.getJettonWalletAddress(walletAddress);
        console.log('getJettonWalletAddress=', jettonWalletAddress.toString(true, true, true));
    }

    const mint = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: minterAddress.toString(true, true, true),
                amount: toNano('0.05'),
                seqno: seqno,
                payload: await minter.createMintBody({
                    jettonAmount: toNano('100500'),
                    destination: walletAddress,
                    amount: toNano('0.04')
                }),
                sendMode: 3,
            }).send()
        );
    }

    const editContent = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: minterAddress.toString(true, true, true),
                amount: toNano('0.05'),
                seqno: seqno,
                payload: await minter.createEditContentBody({
                    jettonContentUri: 'http://localhost/nft-marketplace/my_collection.123',
                }),
                sendMode: 3,
            }).send()
        );
    }

    const changeAdmin = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: minterAddress.toString(true, true, true),
                amount: toNano('0.05'),
                seqno: seqno,
                payload: await minter.createChangeAdminBody({
                    newAdminAddress: Address.parse(WALLET2_ADDRESS)
                }),
                sendMode: 3,
            }).send()
        );
    }

    const JETTON_WALLET_ADDRESS = 'EQBGpCSFJpAb1guZHVWIO8b_8g0e8yxp2ZfZWcTXvTjvvyFd';
    // const JETTON_WALLET_ADDRESS = 'EQAG6NvUCTxgQfcuUJVypQxN4rCm6krVH6T-mngXhSQwY0Ae';
    console.log('jettonWalletAddress=', JETTON_WALLET_ADDRESS);

    const jettonWallet = new JettonWallet(tonweb.provider, {
        address: JETTON_WALLET_ADDRESS
    });

    const getJettonWalletInfo = async () => {
        const data = await jettonWallet.getData();
        data.balance = data.balance.toString();
        data.ownerAddress = data.ownerAddress.toString(true, true, true);
        data.jettonMinterAddress = data.jettonMinterAddress.toString(true, true, true);
        console.log(data);
    }

    const transfer = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: JETTON_WALLET_ADDRESS,
                amount: toNano('0.05'),
                seqno: seqno,
                payload: await jettonWallet.createTransferBody({
                    jettonAmount: toNano('500'),
                    toAddress: Address.parse(WALLET2_ADDRESS),
                    forwardAmount: toNano('0.01'),
                    forwardPayload: new TextEncoder().encode('gift'),
                    responseAddress: walletAddress
                }),
                sendMode: 3,
            }).send()
        );
    }

    const burn = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: JETTON_WALLET_ADDRESS,
                amount: toNano('0.05'),
                seqno: seqno,
                payload: await jettonWallet.createBurnBody({
                    jettonAmount: toNano('400'),
                    responseAddress: walletAddress
                }),
                sendMode: 3,
            }).send()
        );
    }

    // await deployMinter();
    // await getMinterInfo();
    // await mint();
    // await getJettonWalletInfo();
    // await editContent();
    // await changeAdmin();
    // await transfer();
    // await burn();
}

init();