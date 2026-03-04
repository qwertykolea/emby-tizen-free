// Don't enable in production release as
// console logging is probably disabled
// and sending messages for no reason will waste resources
var ENABLE_CONSOLE_LOGGING = false;

var appId = 'vYmY3AFREE.emby'; //Application ID for foreground application

var messagePortName = 'FOREGROUND_APP_PORT';
var localPort;
var listenerId;

var consolePortName = 'CONSOLE_APP_PORT';
var consolePort;

// Mandatory Callbacks for Service application
// onStart Callback
module.exports.onStart = function () {
    logResponse('Start Callback');
    initMessagePort();
}

//onRequest Callback
module.exports.onRequest = function () {
    logResponse('Request Callback');
}

// onExit Callback
module.exports.onExit = function () {
    logResponse('Exit Callback');
    localPort.removeMessagePortListener(listenerId);

    localPort = null;
    consolePort = null;
}

function logResponse(response) {

    if (ENABLE_CONSOLE_LOGGING) {
        if (!consolePort) {
            try {
                consolePort = tizen.messageport.requestRemoteMessagePort(appId, consolePortName);
            } catch (e) {
                return;
            }
        }

        var messageData = {
            key: 'LOGGING',
            value: response
        };

        consolePort.sendMessage([messageData]);
    }
}

//get Metadata from foreground Application
function setPreviewData(previewData) {
    logResponse('setPreviewData()');

    try {
        // setPreviewData with preview JSON data
        webapis.preview.setPreviewData(previewData,
            function () {
                logResponse('setPreviewData SuccessCallback');

                // Terminate service after setting preview data
                tizen.application.getCurrentApplication().exit();
            },
            function (e) {
                logResponse('setPreviewData failed : ' + e.message);
            }
        );
    } catch (e) {
        logResponse('setPreviewData exception : ' + e.message);
    }
}

function onReceived(data, remotePort) {
    // logResponse('onReceived : ' + JSON.stringify(data) + ' remotePort : ' + remotePort);

    data.forEach(function (item) {
        // logResponse('item : ' + JSON.stringify(item));

        if (item.key == 'PREVIEWDATA') {
            var previewData = item.value;
            setPreviewData(previewData);
        }
    });
}

// receive data from foreground application
function initMessagePort() {
    try {
        logResponse('request local message port ' + messagePortName);
        localPort = tizen.messageport.requestLocalMessagePort(messagePortName);
    } catch (e) {
        logResponse('request message port error : ' + e.message);
    }

    try {
        logResponse('addMessagePortListener');
        listenerId = localPort.addMessagePortListener(onReceived);
    } catch (e) {
        logResponse('add message port listener error : ' + e.message);
    }
}