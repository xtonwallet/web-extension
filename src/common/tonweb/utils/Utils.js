import nacl from "tweetnacl";

/**
 * @param bytes {Uint8Array}
 * @return  {Promise<ArrayBuffer>}
 */
function sha256(bytes) {
  return crypto.subtle.digest("SHA-256", bytes);
}

/**
 * @private
 * @param crc {number}
 * @param bytes {Uint8Array}
 * @return {number}
 */
function _crc32c(crc, bytes) {
  const POLY = 0x82f63b78;

  crc ^= 0xffffffff;
  for (let n = 0; n < bytes.length; n++) {
    crc ^= bytes[n];
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
    crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
  }
  return crc ^ 0xffffffff;
}

/**
 * @param bytes {Uint8Array}
 * @return {Uint8Array}
 */
function crc32c(bytes) {
  //Version suitable for crc32-c of BOC
  const int_crc = _crc32c(0, bytes);
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setUint32(0, int_crc, false);
  return new Uint8Array(arr).reverse();
}

/**
 * @param data  {ArrayLike<number>}
 * @return {Uint8Array}
 */
function crc16(data) {
  const poly = 0x1021;
  let reg = 0;
  const message = new Uint8Array(data.length + 2);
  message.set(data);
  for (let byte of message) {
    let mask = 0x80;
    while (mask > 0) {
      reg <<= 1;
      if (byte & mask) {
        reg += 1;
      }
      mask >>= 1;
      if (reg > 0xffff) {
        reg &= 0xffff;
        reg ^= poly;
      }
    }
  }
  return new Uint8Array([Math.floor(reg / 256), reg % 256]);
}

/**
 * @param a {Uint8Array}
 * @param b {Uint8Array}
 * @return {boolean}
 */
function compareBytes(a, b) {
  // TODO Make it smarter
  return a.toString() === b.toString();
}

/**
 * @param n  {number}
 * @param ui8array  {Uint8Array}
 * @return {number}
 */
function readNBytesUIntFromArray(n, ui8array) {
  let res = 0;
  for (let c = 0; c < n; c++) {
    res *= 256;
    res += ui8array[c];
  }
  return res;
}

/**
 * @param seed  {Uint8Array}
 * @returns {nacl.SignKeyPair}
 */
function keyPairFromSeed(seed) {
  return nacl.sign.keyPair.fromSeed(seed);
}

/**
 * @returns {nacl.SignKeyPair}
 */
function newKeyPair() {
  return nacl.sign.keyPair();
}

/**
 * @returns {Uint8Array}
 */
function newSeed() {
  return nacl.sign.keyPair().secretKey.slice(0, 32);
}

/**
 * @returns {Uint8Array}
 */
function cryptoGenerateRandomBytes(length) {
  return nacl.randomBytes(length);
}

/**
 * @returns {String}
 */
function getSignature(unsigned, secretKey) {
  return nacl.sign(unsigned, secretKey);
}

/**
 * @returns {String}
 */
function signMessage(unsigned, secretKey) {
  return nacl.sign.detached(unsigned, secretKey);
}

/**
 * @returns {String}
 */
function naclBox(decrypted, nonce, their_public, secret) {
  return nacl.box(decrypted, nonce, their_public, secret);
}

/**
 * @returns {String}
 */
function naclBoxOpen(encrypted, nonce, their_public, secret) {
  return nacl.box.open(encrypted, nonce, their_public, secret);
}

/**
 * @returns {String}
 */
function boxKeyPair(secret) {
  return nacl.box.keyPair.fromSecretKey(secret);
}

export {
  sha256,
  crc32c,
  crc16,
  compareBytes,
  readNBytesUIntFromArray,
  keyPairFromSeed,
  newKeyPair,
  newSeed,
  getSignature,
  signMessage,
  naclBox,
  naclBoxOpen,
  boxKeyPair,
  cryptoGenerateRandomBytes
};
