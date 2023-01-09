import { writable} from 'svelte/store';
import { networksStore } from './stores/networks.js';
import { accountStore } from './stores/account.js';
import { settingsStore } from './stores/settings.js';
import { sendNotificationToInPageScript, broadcastMessage } from './utils.js';

let lastCurrentAccount = null;

//This is called everytime when accountStore is updated
accountStore.subscribe(async (current) => {
  if (current.currentAccount && current.currentAccount.address != lastCurrentAccount) {
    // need to send event only from background
    if (typeof window == "undefined") {
      sendNotificationToInPageScript('xtonwallet-notification', {"method": "accountChanged", "params": current.currentAccount.address});
    }
    broadcastMessage("accountChanged", current.currentAccount);
    lastCurrentAccount = current.currentAccount.address;
  }
});

let lastCurrentEndpoint = null;

//This is called everytime when networksStore is updated
networksStore.subscribe(async (current) => {
  if (current.currentNetwork && current.currentNetwork.server != lastCurrentEndpoint) {
    // need to send event only from background
    if (typeof window == "undefined") {
      sendNotificationToInPageScript('xtonwallet-notification', {"method": "endpointChanged", "params": current.currentNetwork.server});
    }
    broadcastMessage("endpointChanged", current.currentNetwork);
    lastCurrentEndpoint = current.currentNetwork.server;
  }
});

let lastThemeName = null;
//This is called everytime when settingsStore is updated
settingsStore.subscribe(async (current) => {
  if (current.themeName && current.themeName != lastThemeName) {
    broadcastMessage("themeChanged", current.themeName);
    lastThemeName = current.themeName;
  }
});

export { settingsStore, currentPage, currentThemeName, currentLang,
         currentAutologout, currentRetrievingTransactionsPeriod,
         currentRetrievingTransactionsLastTime, needsBackup,
         currentEnabledPinPad, currentEnabledProxy, currentCurrency,
         currentRate, currentResolution
       } from './stores/settings.js';
export { networksStore, currentNetwork } from './stores/networks.js';
export { accountStore, currentAccount, waitingTransaction, messageSubscriptions } from './stores/account.js';

//MISC Stores
export const CURRENT_KS_PASSWORD = writable("G1^8%3*c3Ra9c35");
export const CURRENT_KS_VERSION = writable("1.0");
export const APPROXIMATE_FEE = 0.02;
export const steps = writable({current:0, stepList:[]});
export const lastActionTimestamp = writable();
export const ASSET_TYPES = {"74": "Jetton", "64": "NFT", "81": "DNS"};
export const CURRENCIES_LIST = {"USD": "United States of America dollar",
                                "GBP": "Great Britain pound",
                                "EUR": "Economic and Monetary Union euro",
                                "RUB": "Russia ruble",
                                "JPY": "Japan yen",
                                "COP": "Colombia peso",
                                "CNY": "China yuan_renminbi",
                                "AED": "United Arab Emirates dirham",
                                "ARS": "Argentina peso",
                                "AUD": "Australia dollar",
                                "BRL": "Brazil real",
                                "CAD": "Canada dollar",
                                "CHF": "Switzerland franc",
                                "HKD": "Hong Kong dollar",
                                "ILS": "Israel shekel",
                                "INR": "India rupee",
                                "IRR": "Iran rial",
                                "KRW": "Korea (South) won",
                                "MXN": "Mexico peso",
                                "NZD": "New Zealand dollar",
                                "PKR": "Pakistan rupee",
                                "SAR": "Saudi Arabia riyal",
                                "SEK": "Sweden krona",
                                "SGD": "Singapore dollar",
                                "THB": "Thailand baht",
                                "TRY": "Turkey lira",
                                "UAH": "Ukraine hryvnia",
                                "VEF": "Venezuela bolivar",
                                "ZAR": "South Africa rand",
                              };
export function copyItem(item) {
  return JSON.parse(JSON.stringify(item));
}
