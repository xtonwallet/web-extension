const methods = {
  "getProviderState": {
    Description: "Web page will be able to know the provider state",
    UsePrivateKeys: false,
    MustBeAllowed: false,
    RequiredParams: [],
  },
  "wallet_getSdkVersion": {
    Description: "Web page will be able to get SDK version",
    UsePrivateKeys: false,
    MustBeAllowed: false,
    RequiredParams: []
  },
  "wallet_requestPermissions": {
    Description: "Method to request needed permissions from user",
    UsePrivateKeys: false,
    MustBeAllowed: false,
    RequiredParams: [{'permissions': 'array'}]
  },
  "wallet_getPermissions": {
    Description: "Method to get permissions granted by user",
    UsePrivateKeys: false,
    MustBeAllowed: false,
    RequiredParams: [],
  },
  "wallet_watchAsset": {
    Description: "Method to add asset for watching by user",
    UsePrivateKeys: false,
    MustBeAllowed: true,
    RequiredParams: [{'name': 'string'}, {'symbol': 'string'}, {'decimals': 'number'}, {'address': 'string'}, {'icon': 'string'}, {'type': 'string'}],
  },
  "ton_account": {
    Description: "Web page will be able to know the selected account",
    UsePrivateKeys: false,
    MustBeAllowed: true,
    RequiredParams: []
  },
  "ton_endpoint": {
    Description: "Web page will be able to know the selected endpoint",
    UsePrivateKeys: false,
    MustBeAllowed: true,
    RequiredParams: []
  },
  "ton_sendTransaction": {
    Description: "Web page will be able to initialize the transaction dialog",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'destination': 'string'}, {'token': 'string'}, {'amount': 'number'}, {'message': 'string'}]
  },
  "ton_sendRawTransaction": {
    Description: "Web page will be able to initialize the raw transaction dialog",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'to': 'string'}, {'amount': 'number'}, {'data': 'string'}, {'dataType': 'string'}, {'stateInit': 'string'}]
  },
  "ton_signMessage": {
    Description: "Web page will be able to initialize the signing message dialog",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'data': 'string'}]
  },
  "ton_getNaclBoxPublicKey": {
    Description: "Web page will be able to obtain the public key for ton_encryptMessage method",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: []
  },
  "ton_getSignature": {
    Description: "Web page will be able to initialize the dialog for obtaining user signature",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'data': 'string'}]
  },
  "ton_crypto_generate_random_bytes": {
    Description: "Web page will be able to run generate_random_bytes method from crypto module",
    UsePrivateKeys: false,
    MustBeAllowed: false,
    RequiredParams: [{'length': 'number'}]
  },
  "ton_encryptMessage": {
    Description: "Web page will be able to initialize the encrypting message dialog",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'decrypted': 'string'}, {'nonce': 'string'}, {'their_public': 'string'}]
  },
  "ton_decryptMessage": {
    Description: "Web page will be able to initialize the decrypting message dialog",
    UsePrivateKeys: true,
    MustBeAllowed: true,
    RequiredParams: [{'encrypted': 'string'}, {'nonce': 'string'}, {'their_public': 'string'}]
  },
  "ton_subscribe": {
    Description: "Web page will be able to subscribe on blockchain events",
    UsePrivateKeys: false,
    MustBeAllowed: true,
    RequiredParams: [{'address': 'string'}]
  },
  "ton_unsubscribe": {
    Description: "Web page will be able to unsubscribe on blockchain events",
    UsePrivateKeys: false,
    MustBeAllowed: true,
    RequiredParams: [{'address': 'string'}]
  }
};

export default methods;
