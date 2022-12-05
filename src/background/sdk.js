import TonLib from "../common/tonLib.js";
import { base64ToHex } from "../common/utils.js";

export const sdk = () => {
  const cryptoGenerateRandomBytes = async (data) => {
    const TonLibClient = await TonLib.getClient();
    const result = await TonLibClient.cryptoGenerateRandomBytes(data.length);
    return {base64: result, hex: base64ToHex(result)};
  };

  const getSdkVersion = async () => {
    const TonLibClient = await TonLib.getClient();
    const result = await TonLibClient.version;
    return result;
  };

  const checkThatSdkMethodExists = async (module, method) => {
    const prohibited_methods = ['net_subscribe_collection'];
    if (prohibited_methods.includes(`${module}_${method}`)) {
      return false;
    }
    const TonLibClient = await TonLib.getClient();
    return TonLibClient.checkThatSdkMethodExists(module, method);
  };

  const runSdkMethod = async (network, module, method, params) => {
    const TonLibClient = await TonLib.getClient(network);
    return await TonLibClient.runSdkMethodDirectly(module, method, params);
  };

  return {
    cryptoGenerateRandomBytes,
    getSdkVersion,
    checkThatSdkMethodExists,
    runSdkMethod
  };
};
