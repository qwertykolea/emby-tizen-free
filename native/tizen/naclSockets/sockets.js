define([], function () {
    'use strict';

    var instanceID = 0;
    var callbacks = {};

    function pushCallback(callback) {
        var id = instanceID + 1;
        instanceID = id;

        callbacks[id] = callback;

        return id;
    }

    function popCallback(id) {
        var callback = callbacks[id];
        delete callbacks[id];

        return callback;
    }

    var div = document.createElement('div');
    div.classList.add('naclSocketsContainer');

    var html = '';
    html += '<embed id="naclSockets" type="application/x-nacl" src="native/tizen/naclSockets/naclSockets.nmf" width=0 height=0 />';

    div.innerHTML = html;
    document.body.insertBefore(div, document.body.firstChild);

    var naclSocketsContainer = document.querySelector('.naclSocketsContainer');

    /* Handles messages sent from a NaCl module by PostMessage(). */
    function handleMessage(message) {
        var msg = message.data;

        if (msg !== null && typeof msg === 'object') {
            if (msg.instance && msg.instance > 0) {
                var callback = popCallback(msg.instance);
                callback(msg);
            }
        } else {
          // Just a debug message
          console.log('sockets() : ' + msg);
        }
    }

    function handleLoad(event) {
        console.log('sockets() : loaded successfully');
    }

    function handleCrash(event) {
        var naclSockets = document.getElementById('naclSockets');
        console.log('sockets() : crashed/exited with status: ' + naclSockets.exitStatus);
    }

    /* Bind events specific for an "application/x-nacl" type embed element.
    for more info see: https://developer.chrome.com/native-client/devguide/coding/progress-events */
    naclSocketsContainer.addEventListener("message", handleMessage, true);
    naclSocketsContainer.addEventListener("load", handleLoad, true);
    naclSocketsContainer.addEventListener("crash", handleCrash, true);

    function execute(message, callback) {

        var naclSockets = document.getElementById('naclSockets');
        console.log('sockets() : nacl executing ' + message['function']);

        message.instance = (callback) ? pushCallback(callback) : 0;

        naclSockets.postMessage(message);
    }

    return {
        execute: execute
    };

});
