import { isBasicSeed, isPasswordSeed, mnemonicToEntropy } from './common';

export async function isPasswordNeeded(mnemonicArray) {
  // password mnemonic (without password) should be password seed, but not basic seed
  const entropy = await mnemonicToEntropy(mnemonicArray, '');
  return (
    (await isPasswordSeed(entropy)) && !(await isBasicSeed(entropy))
  );
}
