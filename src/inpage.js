import Provider from "./common/provider.js";

const provider = new Provider();
window.addEventListener("xtonwallet", (event) => {
  const { type, payload } = event.detail;
  if (type == "notification") {
    const { method, params } = payload;
    if (method === 'accountChanged') {
      provider.emit('accountChanged', params);
    } else if (method === 'unlockStateChanged') {
      provider.emit('unlockStateChanged', params);
    } else if (method === 'endpointChanged') {
      provider.emit('endpointChanged', params);
    } else if (method == "message") {
      provider.emit('message', params);
    }
  }
});

window.ton = provider;

const runSendTransaction = (destination, amount, message) => {
  window.ton
    .request({
      method: "ton_sendTransaction",
      params: {
        destination: destination,
        amount: amount,
        message: message,
        token: "native"
      },
    })
    .then((result) => {
      console.log(result);
    })
    .catch((result) => {
      console.log(result);
    });
}

const tonLinkListener = (event) => {
  const url = event.target.href;
  const resultURI = url.match(/ton:\/\/([^\/]*)\/([^\?]*)\?(.*)$/);
  switch(resultURI[1]) {
    case "transfer":
      let URIparams = {};
      resultURI[3].split("&").map((item) => {
        const res = item.split("=");
        URIparams[res[0]] = res[1];
      });
      if (resultURI[2]) {
        window.ton
          .request({
            method: "wallet_getPermissions",
            params: {},
          })
          .then((result) => {
            if (result.includes("ton_sendTransaction")) {
              runSendTransaction(resultURI[2], typeof URIparams["amount"] == "undefined" ? 0 : parseInt(URIparams["amount"]), typeof URIparams["text"] == "undefined" ? "" : URIparams["text"]);
            } else {
              window.ton
                .request({
                  method: "wallet_requestPermissions",
                  params: { permissions: ["ton_sendTransaction"] },
                })
                .then((result) => {
                  if (result.includes("ton_sendTransaction")) {
                    runSendTransaction(resultURI[2], typeof URIparams["amount"] == "undefined" ? 0 : parseInt(URIparams["amount"]), typeof URIparams["text"] == "undefined" ? "" : URIparams["text"]);
                  }
                });
            }
          });
        event.preventDefault();
      }
    break;
    default:
      console.log('Specified ton:// URL format is not supported');
    break;
  }
};

window.addEventListener('load', (event) => {
  const observer = new MutationObserver((mutationList, observer) => {
    document.querySelectorAll("a[href]").forEach((i) => { 
      if (i.href.indexOf('ton://') != -1) {
        i.removeEventListener('click', tonLinkListener);
        i.addEventListener('click', tonLinkListener);
      }
    });
  });
  
  const bodyElem = document.getElementsByTagName("body")[0];
  //Add handler for links like ton://
  observer.observe(bodyElem, { attributes: true, childList: true, subtree: true });  
});

/*--------------------THIRD PARTY API---------------------*/

window.tonProtocolVersion = 1;

//Emulate TON wallet API
window.ton.isTonWallet = true;
window.ton.send = async function(methodRaw, initialParams = []) {
  let method, params;
  //translate method name
  switch(methodRaw) {
    case 'ton_requestAccounts':
      method = "ton_account";
      break;
    case 'ton_requestWallets':
      method = "ton_account";
      break;
    case 'ton_getBalance':
      method = "ton_account";
      break;
    case 'ton_sendTransaction':
      method = "ton_sendRawTransaction";
      params = initialParams.shift();
      if (typeof params.value != "undefined") {
        params.amount = Number(params.value).valueOf()/10**9; // simple conversion to TON coin
      }
      if (typeof params.data == "undefined") {
        params.data = "";
      }
      if (typeof params.dataType == "undefined") {
        params.dataType = "";
      }
      if (typeof params.stateInit == "undefined") {
        params.stateInit = "";
      }
      break;
    case 'ton_rawSign':
      method = "ton_signMessage";
      params = initialParams.shift();
      break;
    case 'flushMemoryCache':
      // nothing to do
      break;
  }
  return new Promise((resolve) => {
    window.ton
      .request({
        method: "wallet_getPermissions",
        params: {},
      })
      .then(async (result) => {
        if (result.includes(method)) {
          let resultFromXTON = await window.ton.request({ method, params});
          resultFromXTON = window.ton._transformResult(methodRaw, resultFromXTON);
          resolve(resultFromXTON);
        } else {
          window.ton
            .request({
              method: "wallet_requestPermissions",
              params: { permissions: [method] },
            }).then(async (result) => {
              let resultFromXTON = await window.ton.request({ method, params});
              resultFromXTON = window.ton._transformResult(methodRaw, resultFromXTON);
              resolve(resultFromXTON);
            });
        }
      });
  });
}

/* Connection handling */
window.ton._connect = () => {};
window.ton._destroy = () => {};
window.ton._nextJsonRpcId = 0;
window.ton._promises = {};

/* Events */
window.ton.removeListener = (method, listener) => {};
window.ton._emitNotification = (result) => {};
window.ton._emitConnect = () => {};
window.ton._emitClose = (code, reason) => {};
window.ton._emitChainChanged = (chainId) => {};
window.ton._emitAccountsChanged = (accounts) => {};
window.ton._handleJsonRpcMessage = async() => {}

window.ton._transformResult = (method, result) => {
  let output;
  switch(method) {
    case "ton_requestAccounts":
      output = [result.address]
      break;
    case "ton_requestWallets":
      output = [{ address: result.address,
                  publicKey: result.publicKey,
                  walletVersion: result.walletVersion}]
      break;
    case "ton_getBalance":
      output = result.balance;
      break;
    case "ton_sendTransaction":
      output = true;
      break;
    case "ton_rawSign":
      output = result;
      break;
  }
  return output;
}
