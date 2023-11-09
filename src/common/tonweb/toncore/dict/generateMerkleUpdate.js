import { beginCell } from '../boc/Builder';
import { Cell } from '../boc/Cell';
import { generateMerkleProof } from './generateMerkleProof';

function convertToMerkleUpdate(c1, c2) {
  return new Cell({
    exotic: true,
    bits: beginCell()
      .storeUint(4, 8)
      .storeBuffer(c1.hash(0))
      .storeBuffer(c2.hash(0))
      .storeUint(c1.depth(0), 16)
      .storeUint(c2.depth(0), 16)
      .endCell()
      .beginParse()
      .loadBits(552),
    refs: [c1, c2],
  });
}
export function generateMerkleUpdate(dict, key, keyObject, newValue) {
  const oldProof = generateMerkleProof(dict, key, keyObject).refs[0];
  dict.set(key, newValue);
  const newProof = generateMerkleProof(dict, key, keyObject).refs[0];
  return convertToMerkleUpdate(oldProof, newProof);
}
