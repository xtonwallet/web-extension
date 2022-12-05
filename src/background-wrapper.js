try {
    importScripts('./browser-polyfill.js');
    importScripts("background.js");
} catch (e) {
    console.error(e);
}