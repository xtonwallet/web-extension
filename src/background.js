import { eventsHandler } from './background/eventsHandler.js';
import { controller } from './background/controller.js';

const devMode = __DEV_MODE__;

let INSTALL_URL = {
  "en": "https://xtonwallet.com/welcome_page_for_extension",
  "ru": "https://xtonwallet.com/ru/welcome_page_for_extension",
};

let UNINSTALL_URL = {
  "en": "https://xtonwallet.com/regret_page_for_extension",
  "ru": "https://xtonwallet.com/ru/regret_page_for_extension",
};

if (devMode) {
  browser.action.setBadgeText({'text': 'Dev'}); // to mark that it is not from the webstore
}

browser.notifications.onClicked.addListener((id) => {
  browser.tabs.create({ url: id });
});

eventsHandler(Object.freeze(controller()));

const check_intro = async function () {
  const result = await browser.storage.local.get(['xtonwallet_user_has_seen_intro']);
  if (!result.xtonwallet_user_has_seen_intro) {
    await browser.storage.local.set({'xtonwallet_user_has_seen_intro': true});
    if (navigator.language && INSTALL_URL[navigator.language]) {
      browser.tabs.create({url: INSTALL_URL[navigator.language]});
    } else {
      browser.tabs.create({url: INSTALL_URL["en"]});
    }
  }
};

check_intro();

if (navigator.language && UNINSTALL_URL[navigator.language]) {
  browser.runtime.setUninstallURL(UNINSTALL_URL[navigator.language]);
} else {
  browser.runtime.setUninstallURL(UNINSTALL_URL["en"]);
}
