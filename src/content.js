const checkDoctype = () => {
    const { doctype } = window.document;
    if (doctype) {
        return doctype.name === 'html';
    }
    return true;
}

const checkSuffix = () => {
    const excludedTypes = [/\.xml$/u, /\.pdf$/u];
    const currentUrl = window.location.pathname;
    for (const type of excludedTypes) {
        if (type.test(currentUrl)) {
            return false;
        }
    }
    return true;
}

const checkDocumentElement = () => {
    const documentElement = document.documentElement.nodeName;
    if (documentElement) {
        return documentElement.toLowerCase() === 'html';
    }
    return true;
}

function checkExcludedDomains() {
    const excludedDomains = []; // need to take from blockchain
    const currentUrl = window.location.href;

    let currentRegex;
    for (let i = 0; i < excludedDomains.length; i++) {
        const blockedDomain = excludedDomains[i].replace('.', '\\.');
        currentRegex = new RegExp(`(?:https?:\\/\\/)(?:(?!${blockedDomain}).)*$`, 'u');
        if (!currentRegex.test(currentUrl)) {
            return false;
        }
    }
    return true;
}

const injectScript = () => {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.src = browser.runtime.getURL('inpage.js');
        scriptTag.setAttribute('async', 'false');
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
    } catch (e) {
        console.error('TON provider injection failed', e);
    }
}

if (checkDoctype() && checkSuffix() && checkDocumentElement() && checkExcludedDomains()) {
    injectScript();

    // Listen from the injected script and send to the background
    window.addEventListener('xtonwallet-request', (event) => {
      browser.runtime.sendMessage({ type: "xtonwallet-request", data: event.detail })
      .then((message) => {
          window.dispatchEvent(new CustomEvent(`xtonwallet-response-${message.id}`, {
            detail: message.data,
          }));
      }).catch((error) => {
        console.error("Error on sendMessage:" + JSON.stringify(error));
      });
    });

    // Listen notifications from the background
    browser.runtime.onMessage.addListener((message, sender) => {
      if (sender.id == browser.runtime.id && sender.origin == 'null' && message.type === 'xtonwallet-notification') {
        window.dispatchEvent(new CustomEvent(`xtonwallet`, {
          detail: {type: "notification", payload: {"method": message.data.method, "params": message.data.params}},
        }));
      }
      return true;
    });
}
