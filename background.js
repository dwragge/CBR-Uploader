function loadScript(scriptName, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = chrome.extension.getURL(scriptName + '.js');
    scriptEl.addEventListener('load', callback, false);
    document.head.appendChild(scriptEl);
}

loadScript('pdf')
loadScript('pdf.worker')

var s = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
s.src = chrome.extension.getURL('popup.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

