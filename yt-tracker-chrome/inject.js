/**
 * All connectors are defined here, instead of manifest.
 *
 * Matching connector is injected to the page after document_end event.
 *
 * Do not include jQuery - it is included by default.
 *
 *
 * Supported fields:
 *
 *    label
 *          - label to be shown in options to enable/disable the connector
 *          - be careful with renaming, as connector disable state depends on the label
 *
 *    matches
 *          - array of positive matches in format described in Chrome Ext. Dev. guide
 *          - connectors are processed in order and the first match is used; you can use
 *            this behaviour to emulate exclude matches
 *
 *    js
 *          - array of paths of files to be executed
 *          - all executions happen on or after 'document_end'
 *
 *    allFrames (optional)
 *          - boolean value representing InjectDetails.allFrames
 *          - FALSE by default
 *
 */
var connectors = [

    {
        label: "YouTube",
        matches: ["*://www.youtube.com/watch*", "*://www.youtube.com/user/*"],
        js: ["connectors/youtube.js"]
    }
    
];


/**
 * Creates regex from single match pattern
 *
 * @author lacivert
 * @param {String} input
 * @returns RegExp
 */
function createPattern(input) {
    if (typeof input !== 'string') return null;
    var match_pattern = '^'
        , regEscape = function (s) {
            return s.replace(/[[^$.|?*+(){}\\]/g, '\\$&');
        }
        , result = /^(\*|https?|file|ftp|chrome-extension):\/\//.exec(input);

    // Parse scheme
    if (!result) return null;
    input = input.substr(result[0].length);
    match_pattern += result[1] === '*' ? 'https?://' : result[1] + '://';

    // Parse host if scheme is not `file`
    if (result[1] !== 'file') {
        if (!(result = /^(?:\*|(\*\.)?([^\/*]+))/.exec(input))) return null;
        input = input.substr(result[0].length);
        if (result[0] === '*') {    // host is '*'
            match_pattern += '[^/]+';
        } else {
            if (result[1]) {         // Subdomain wildcard exists
                match_pattern += '(?:[^/]+\.)?';
            }
            // Append host (escape special regex characters)
            match_pattern += regEscape(result[2]);// + '/';
        }
    }
    // Add remainder (path)
    match_pattern += input.split('*').map(regEscape).join('.*');
    match_pattern += '$';

    return new RegExp(match_pattern);
}


/**
 * @param {String} label
 * @returns boolean
 */
function isConnectorEnabled(label) {
    return true;
}


/**
 * Injects connectors to tabs upon page loading
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // wait for the Loaded event
    if (changeInfo.status !== 'complete')
        return;

    // run first available connector
    var anyMatch = !connectors.every(function (connector) {
        var matchOk = false;

        connector.matches.forEach(function (match) {
            matchOk = matchOk || createPattern(match).test(tab.url);
        });

        if (matchOk === true) {
            console.log('connector ' + connector.label + ' matched for ' + tab.url);

            if (!isConnectorEnabled(connector.label)) {
                return false; // break forEach
            }

            // Ping the content page to see if the script is already in place.
            // In the future, connectors will have unified interface, so they will all support
            // the 'ping' request. Right now only YouTube supports this, because it
            // is the only site that uses ajax navigation via History API (which is quite hard to catch).
            // Other connectors will work as usual.
            //
            // Sadly there is no way to silently check if the script has been already injected
            // so we will see an error in the background console on load of every supported page
            chrome.tabs.sendMessage(tabId, { type: 'ping' }, function (response) {
                // if the message was sent to a non existing script or the script
                // does not implement the 'ping' message, we get response==undefined;
                if (!response) {
                    console.log('-- loaded for the first time, injecting the scripts');

                    // inject all scripts and jQuery, use slice to avoid mutating
                    var scripts = connector.js.slice(0);
                    scripts.unshift(JQUERY_PATH);

                    scripts.forEach(function (jsFile) {
                        var injectDetails = {
                            file: jsFile,
                            allFrames: connector.allFrames ? connector.allFrames : false
                        };
                        chrome.tabs.executeScript(tabId, injectDetails);
                    });
                }
                else {
                    console.log('-- subsequent ajax navigation, the scripts are already injected');
                }
            });

        }

        return !matchOk;
    });

    // hide page action if there is no match
    if (!anyMatch) {
        //chrome.pageAction.hide(tabId);
    }
});
