require(['pluginManager', 'dialogHelper'], function (pluginManager, dialogHelper) {
    'use strict';

    var isDisplayingAlert = false;
    var isSuspended = false;

    var plugin = pluginManager.plugins().filter(function (p) {
        return (p.id === 'tizenavplayer');
    })[0];

    function onAlertClose() {
        isDisplayingAlert = false;
    }

    function closeAlert() {
        if (isDisplayingAlert) {
            var dlg = document.querySelector('.alertDialog');

            if (dlg) {
                dialogHelper.close(dlg);
            }
        }
    }

    function suspendVideoPlayer() {
        if (!isSuspended) {
            isSuspended = true;
            plugin.suspend();
        }
    }

    function restoreVideoPlayer() {

        var isConnected = webapis.network.isConnectedToGateway();

        if (isConnected) {

            closeAlert();

            if (!document.hidden) {
                plugin.restore();
                isSuspended = false;
            }
        }
    }

    function showNetworkErrorMessage() {

        if (isDisplayingAlert) {
            console.log('network error message already displaying');
            return;
        }

        console.log('setting timer to check for network failure');

        setTimeout(function() {

            var isConnected = webapis.network.isConnectedToGateway();

            if (!isConnected) {

                console.log('displaying network error message');

                isDisplayingAlert = true;

                require(['alert'], function (alert) {
                    alert('No network found. Please check your connection and try again').then(onAlertClose, onAlertClose);
                });
            }
        }, 1500);
    }

    document.addEventListener('visibilitychange', function() {

        console.log('document visibility changed - hidden : ' + document.hidden);

        if (document.hidden) {
            suspendVideoPlayer();
        } else {
            setTimeout(restoreVideoPlayer, 500);	// Give time for app to come to foreground before resuming playback.
        }
    });

    webapis.network.addNetworkStateChangeListener(function (value) {
        if (value === webapis.network.NetworkState.GATEWAY_DISCONNECTED){
            console.log('network changed - no gateway');
            suspendVideoPlayer();
            showNetworkErrorMessage();
        } else if(value === webapis.network.NetworkState.GATEWAY_CONNECTED){
            console.log('network changed to available');
            setTimeout(restoreVideoPlayer, 500);
        }
    });

});