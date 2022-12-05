import { Vault } from "../common/vault.js";

export const networks = () => {
  const vault = new Vault();
  vault.init();

  const getAllNetworks = async () => {
    return await vault.getNetworks();
  };

  const addNewNetwork = async (network) => {
    network.custom = true;
    return await vault.addNewNetwork(network);
  };

  const removeNetwork = async (server) => {
    return await vault.removeNetwork(server);
  };

  return {
    getAllNetworks,
    addNewNetwork,
    removeNetwork
  };
};
