import { writable, get } from 'svelte/store';
import BigNumber from "bignumber.js";
import QRCode from "./qrcode.js";

const devMode = __DEV_MODE__;

const NOTIFICATION_HEIGHT = 620;
const NOTIFICATION_WIDTH = 365;
const PROXY_HOSTS = "in1.ton.org:8080 in2.ton.org:8080 in3.ton.org:8080";
const API_RATE_URL = "https://min-api.cryptocompare.com/data/price?fsym=TONCOIN&tsyms=";

let _popupId;

const setStorageItem = async (name, value) => {
  const obj = {};
  obj[name] = value;
  await browser.storage.local.set(obj);
  return true;
};

const getStorageItem = async (name) => {
  const result = await browser.storage.local.get(name);
  return result[name];
};

const removeStorageItem = async (name) => {
  await browser.storage.local.remove(name);
  return true;
};

const createRequestsStore = () => {
  const startValue = [];
  //Create Intial Store
  const requestsStore = writable(startValue);
  let initialized = false;

  const getStore = async() => {
    let requests = await getStorageItem("requests");
    if (typeof requests != "undefined") {
      requestsStore.set(requests);
    } else {
      requestsStore.set(startValue);
    }
    initialized = true;
  };

  //This is called everytime when requestsStore is updated
  requestsStore.subscribe(async (current) => {
    if (!initialized) {
      return current;
    }
    await setStorageItem("requests", current);
  });

  getStore();

  let subscribe = requestsStore.subscribe;
  let update = requestsStore.update;
  let set = requestsStore.set;

  return {
    subscribe,
    set,
    update,
    initialized: () => initialized
  };
};

//Requests Store
const requestsStore = createRequestsStore();

const broadcastMessage = (type, data) => {
  browser.runtime.sendMessage({type: `page-${type}`, data})
  .catch((error) => {
    if (devMode)  {
      console.error(`Error on sendMessage ${type}: ${JSON.stringify(error)}`);
    }
  });
  browser.runtime.sendMessage({type: `popup-${type}`, data})
  .catch((error) => {
    if (devMode)  {
      console.error(`Error on sendMessage ${type}: ${JSON.stringify(error)}`);
    }
  });
};

const sendNotificationToInPageScript = (type, data) => {
  browser.tabs.query({active: true}).then((tabs) => {
    if (tabs.length > 0) {
      for (let i in tabs) {
        if (tabs[i].url.indexOf("chrome-extension://") == -1 && tabs[i].url.indexOf("chrome://") == -1) {
          browser.windows.get(tabs[i].windowId).then(() => {
            browser.tabs.sendMessage(tabs[i].id, {"type": type, "data": data})
              .catch((error) => {
                if (devMode)  {
                  console.error("Error on sendMessage:" + JSON.stringify(error) + 
                    " " + 
                    JSON.stringify({"type": type, "data": data}) +
                    " " + 
                    JSON.stringify(tabs[i])
                    );
                }
              });
          });
        }
      }
    }
  });
};

const openPageWithPath = (path) => {
  browser.tabs.query({ url: `chrome-extension://${browser.runtime.id}/page.html`}).then((tabs) => {
    if (tabs.length != 0) {
      browser.tabs.update(tabs[0].id, { active: true, highlighted: true, url: `/page.html#${path}` }).then((tab) => {
        browser.tabs.reload(tabs[0].id);
      });
    } else {
      browser.tabs.create({ url: `/page.html#${path}` });
    }
  });
};

const openRequestPopup = (modalName, data) => {
  const openPopup = (modalName, data) => {
    browser.windows.getAll().then(async (windows) => {
      if (windows.length != 0) {
        const popup = windows.filter((win) => {
          return win && win.type === 'popup' && win.id === _popupId;
        });
        if (popup.length > 0 ) {
          await browser.windows.update(popup[0].id, { focused: true });
        } else {
          let left = 0;
          let top = 0;
          try {
            const lastFocused = await browser.windows.getLastFocused();
            // Position window in top right corner of lastFocused window.
            top = lastFocused.top;
            left = lastFocused.left + (lastFocused.width - NOTIFICATION_WIDTH);
          } catch (_) {
            // The following properties are more than likely 0, due to being
            // opened from the background chrome process for the extension that
            // has no physical dimensions
            const { screenX, screenY, outerWidth } = window;
            top = Math.max(screenY, 0);
            left = Math.max(screenX + (outerWidth - NOTIFICATION_WIDTH), 0);
          }
          const popupWindow = await browser.windows.create({
            url: '/popup.html',
            type: 'popup',
            width: NOTIFICATION_WIDTH,
            height: NOTIFICATION_HEIGHT,
            left,
            top,
          });

          // Firefox currently ignores left/top for create, but it works for update
          if (popupWindow.left !== left && popupWindow.state !== 'fullscreen') {
            await browser.windows.update(popupWindow.id, { left, top });
          }

          _popupId = popupWindow.id;
        }

        //send information to the opened Popup
        setTimeout(() => {
          browser.runtime.sendMessage({ type: 'popupMessage', data: {'modalName': modalName, 'data': data} })
          .catch((error) => {
            if (devMode)  {
              console.error("Error on sendMessage:" + JSON.stringify(error));
            }
          });
        }, 1000); // let's wait for 1 seconds, because maybe will be some delay on the window opening
      }
    });
  };

  browser.runtime.sendMessage({ type: 'popupView'})
  .then((popupView) => {
    if (popupView) {
      browser.runtime.sendMessage({ type: 'popupMessage', data: {'modalName': modalName, 'data': data} })
      .catch((error) => {
        if (devMode)  {
          console.error("Error on sendMessage:" + JSON.stringify(error));
        }
      });
    } else {
      openPopup(modalName, data);
    }
  })
  .catch(() => {
    openPopup(modalName, data);
  });
};

const generateQRcode = (element, data, width = 200, height = 200) => {
  return new QRCode(element, {
    text: data,
    width: width,
    height: height,
    logo: '/assets/img/icon-128.png'
  });
}

const closeRequestPopup = () => {
  if (_popupId) {
    browser.windows.remove(_popupId);
    _popupId = false;
  }
};

const sendRequestReject = (id) => {
  const newRequestQueue = get(requestsStore);
  requestsStore.update((store) => {
    store = newRequestQueue.filter(item => item.data.id != id);
    return store;
  });
  browser.runtime.sendMessage({ type: 'popupMessageResponse', id: id, data: {code: 4001, message: 'User rejected request'} })
  .catch((error) => {
    if (devMode)  {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    }
  });
};

const sendRequestResolve = (id, data) => {
  const newRequestQueue = get(requestsStore);
  requestsStore.update((store) => {
    store = newRequestQueue.filter(item => item.data.id != id);
    return store;
  });
  browser.runtime.sendMessage({ type: 'popupMessageResponse', id: id, data: data })
  .catch((error) => {
    if (devMode)  {
      console.error("Error on sendMessage:" + JSON.stringify(error));
    }
  });
};

const generateRandomBytes = (len) => {
  return crypto.getRandomValues(new Uint8Array(len));
};

//@TODO return serializeBufferForStorage(generateRandomBytes(len));
const generateRandomHex = (len) => {
  const result = Array.prototype.map.call(generateRandomBytes(len), function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
  return result;
};

//from here https://git.coolaj86.com/coolaj86/unibabel.js/src/branch/master/index.js
class Unibabel {
  static utf8ToBinaryString (str) {
    const escstr = encodeURIComponent(str);
    // replaces any uri escape sequence, such as %0A,
    // with binary escape, such as 0x0A
    const binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    });

    return binstr;
  }

  static binaryStringToBuffer(binstr) {
    let buf;

    if ('undefined' !== typeof Uint8Array) {
      buf = new Uint8Array(binstr.length);
    } else {
      buf = [];
    }

    Array.prototype.forEach.call(binstr, function (ch, i) {
      buf[i] = ch.charCodeAt(0);
    });

    return buf;
  }

  static utf8ToBuffer(str) {
    const binstr = this.utf8ToBinaryString(str);
    const buf = this.binaryStringToBuffer(binstr);
    return buf;
  }

  static utf8ToBase64(str) {
    const binstr = this.utf8ToBinaryString(str);
    return btoa(binstr);
  }

  static binaryStringToUtf8(binstr) {
    const escstr = binstr.replace(/(.)/g, function (m, p) {
      let code = p.charCodeAt(0).toString(16).toUpperCase();
      if (code.length < 2) {
        code = '0' + code;
      }
      return '%' + code;
    });

    return decodeURIComponent(escstr);
  }

  static bufferToUtf8(buf) {
    const binstr = this.bufferToBinaryString(buf);
    return this.binaryStringToUtf8(binstr);
  }

  static base64ToUtf8(b64) {
    const binstr = atob(b64);
    return this.binaryStringToUtf8(binstr);
  }

  static bufferToBinaryString(buf) {
    const binstr = Array.prototype.map.call(buf, function (ch) {
      return String.fromCharCode(ch);
    }).join('');

    return binstr;
  }

  static bufferToBase64(arr) {
    const binstr = this.bufferToBinaryString(arr);
    return btoa(binstr);
  }

  static base64ToBuffer(base64) {
    const binstr = atob(base64);
    const buf = this.binaryStringToBuffer(binstr);
    return buf;
  }

  static bufferToHex(buffer) {
    return buffer.map(x => x.toString(16).padStart(2, '0')).join('');
  }

  static hexToBuffer(hex) {
    let buf;

    if ('undefined' !== typeof Uint8Array) {
      buf = new Uint8Array(hex.length/2);
    } else {
      buf = [];
    }
    const charsLength = hex.length;
    let index = 0;
    for (let i = 0; i < charsLength; i += 2) {
      buf[index] = Number.parseInt(hex.substring(i, i + 2), 16);
      index++;
    }
    return buf;
  }
}

// from here https://github.com/danfinlay/browser-passworder
const encrypt = (password, dataObj) => {
  var salt = generateSalt();

  return keyFromPassword(password, salt)
    .then((passwordDerivedKey) => {
      return encryptWithKey(passwordDerivedKey, dataObj);
    })
    .then(function (payload) {
      payload.salt = salt;
      return JSON.stringify(payload);
    });
};

// Takes encrypted text, returns the restored object.
const decrypt = (password, text) => {
  const payload = JSON.parse(text);
  const salt = payload.salt;
  return keyFromPassword(password, salt)
    .then((key) => {
      return decryptWithKey(key, payload);
    });
};

const encryptWithKey = (key, dataObj) => {
  const data = JSON.stringify(dataObj);
  const dataBuffer = Unibabel.utf8ToBuffer(data);
  const vector = crypto.getRandomValues(new Uint8Array(16));
  return crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: vector,
  }, key, dataBuffer).then((buf) => {
    const buffer = new Uint8Array(buf);
    const vectorStr = Unibabel.bufferToBase64(vector);
    const vaultStr = Unibabel.bufferToBase64(buffer);
    return {
      data: vaultStr,
      iv: vectorStr,
    };
  });
};

const decryptWithKey = (key, payload) => {
  const encryptedData = Unibabel.base64ToBuffer(payload.data);
  const vector = Unibabel.base64ToBuffer(payload.iv);
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: vector}, key, encryptedData)
    .then((result) => {
      const decryptedData = new Uint8Array(result);
      const decryptedStr = Unibabel.bufferToUtf8(decryptedData);
      const decryptedObj = JSON.parse(decryptedStr);
      return decryptedObj;
    })
    .catch((reason) => {
      throw new Error('Incorrect password');
    });
};

const keyFromPassword = (password, salt) => {
  const passBuffer = Unibabel.utf8ToBuffer(password);
  const saltBuffer = Unibabel.base64ToBuffer(salt);

  return crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  ).then(function (key) {
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 10000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  });
};

const serializeBufferFromStorage = (str) => {
  const stripStr = (str.slice(0, 2) === '0x') ? str.slice(2) : str;
  let buf = new Uint8Array(stripStr.length / 2);
  for (let i = 0; i < stripStr.length; i += 2) {
    const seg = stripStr.substr(i, 2);
    buf[i / 2] = parseInt(seg, 16);
  }
  return buf;
};

// Should return a string, ready for storage, in hex format.
const serializeBufferForStorage = (buffer) => {
  let result = '0x';
  const len = buffer.length || buffer.byteLength;
  for (let i = 0; i < len; i++) {
    result += unprefixedHex(buffer[i]);
  }
  return result;
};

const unprefixedHex = (num) => {
  let hex = num.toString(16);
  while (hex.length < 2) {
    hex = '0' + hex;
  }
  return hex;
};

const generateSalt = (byteCount = 32) => {
  const view = new Uint8Array(byteCount);
  crypto.getRandomValues(view);
  const b64encoded = btoa(String.fromCharCode.apply(null, view));
  return b64encoded;
};

const shortAddress = (address) => {
  return `${address.substr(0,4)}...${address.substr(-4,4)}`;
};

const copyToClipboard = ( text ) => {
  var dummy = document.createElement("input");
  dummy.setAttribute("id", "copyhelper");
  document.body.appendChild(dummy);
  document.getElementById("copyhelper").value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
};

//compare two number, will be true if amount1 greater or equal than amount2
const gte = (amount1, amount2) => {
  return new BigNumber(amount1).gte(amount2);
};

//compare two number, will be true if amount1 lower than amount2
const lt = (amount1, amount2) => {
  return new BigNumber(amount1).lt(amount2);
};

const fromNano = (amount, num = 4) => {
  return new BigNumber(amount).div(10**9).toFixed(parseInt(num));
};

const toNano = (amount) => {
  return new BigNumber(amount).times(10**9).toNumber();
};

const fromDecimal = (amount, decimal) => {
  return new BigNumber(amount).div(10**decimal).toNumber();
};

const strToHex = (text) => {
  return serializeBufferForStorage(Unibabel.utf8ToBuffer(text)).substr(2);
};

const hexToStr = (hex) => {
  return Unibabel.bufferToUtf8(serializeBufferFromStorage(hex));
};

const base64ToHex = (base64) => {
  return serializeBufferForStorage(Unibabel.base64ToBuffer(base64)).substr(2);
};

const utf8ToBase64 = (utf8) => {
  return Unibabel.utf8ToBase64(utf8);
};

const base64ToUtf8 = (base64) => {
  return Unibabel.base64ToUtf8(base64);
};

const enableProxy = async (isEnabled) => {
  const PROXY_HOSTS_ARR = PROXY_HOSTS.split(' ');
  const proxyHost = PROXY_HOSTS_ARR[Math.floor(Math.random() * (PROXY_HOSTS_ARR.length))];
  browser.proxy.settings.set({
    scope: 'regular',
    value: isEnabled ? {
      mode: 'pac_script',
      pacScript: {
        data: `function FindProxyForURL(url, host) { return host.endsWith('.ton') || host.endsWith('.adnl') ? 'PROXY ${proxyHost}' : 'DIRECT'; }`,
      },
    } : {
      mode: 'system',
    },
  });
};

const getRate = async (сurrency) => {
  //Receive the rate by this time
  const result = await fetch(API_RATE_URL + сurrency)
                        .then((response) => {
                          return response.json();
                        })
                        .then((data) => {
                          return data[сurrency];
                        });
  return result;
};

export {
  Unibabel,
  // Simple methods to store in localStorage:
  setStorageItem, getStorageItem, removeStorageItem,
  // Broadcast messages:
  broadcastMessage, sendNotificationToInPageScript,
  // Simple encryption methods:
  encrypt, decrypt,
  // More advanced encryption methods:
  keyFromPassword, encryptWithKey, decryptWithKey,
  // Buffer <-> Hex string methods
  serializeBufferForStorage, serializeBufferFromStorage,
  //Store for requests
  requestsStore,
  sendRequestReject,
  sendRequestResolve,
  // Open pages
  openPageWithPath,
  openRequestPopup,
  closeRequestPopup,
  strToHex,
  hexToStr,
  base64ToHex,
  utf8ToBase64,
  base64ToUtf8,
  generateRandomHex,
  generateRandomBytes,
  generateSalt,
  shortAddress,
  copyToClipboard,
  gte,
  lt,
  fromNano,
  toNano,
  fromDecimal,
  enableProxy,
  generateQRcode,
  getRate,
};
