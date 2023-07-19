import TonLib from "../common/tonLib.js";
import { base64ToHex } from "../common/utils.js";

export const sdk = () => {
  const cryptoGenerateRandomBytes = async (data) => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    const result = await TonLibClient.cryptoGenerateRandomBytes(data.length);
    return {base64: result, hex: base64ToHex(result)};
  };

  const getSdkVersion = async () => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    const result = await TonLibClient.version;
    return result;
  };

  const checkThatSdkMethodExists = async (module, method) => {
    const prohibited_methods = ['net_subscribe_collection'];
    if (prohibited_methods.includes(`${module}_${method}`)) {
      return false;
    }
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    return TonLibClient.checkThatSdkMethodExists(module, method);
  };

  const runSdkMethod = async (network, module, method, params) => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient(network);
    return await TonLibClient.runSdkMethodDirectly(module, method, params);
  };
  
  const sha256 = async (data) => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    return await TonLibClient.sha256(data);
  };

  const parseAddress = async (data) => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    return TonLibClient.parseAddress(data);
  };

  const makeTonProof = async (walletAddress, domain, timestamp, payload) => {
    const Tlib         = new TonLib();
    const TonLibClient = await Tlib.getClient();
    return TonLibClient.tonProof(walletAddress, domain, timestamp, payload);
  };

  return {
    cryptoGenerateRandomBytes,
    getSdkVersion,
    checkThatSdkMethodExists,
    runSdkMethod,
    sha256,
    parseAddress,
    makeTonProof
  };
};
