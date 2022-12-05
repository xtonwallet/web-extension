import nacl from 'tweetnacl';

import { mnemonicToSeed } from './mnemonic-to-seed';

export async function mnemonicToKeyPair(mnemonicArray, password = '') {
  const seed = await mnemonicToSeed(mnemonicArray, password);
  return nacl.sign.keyPair.fromSeed(seed);
}
