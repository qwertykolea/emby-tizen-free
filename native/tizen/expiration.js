require([], function () {
    'use strict';

    function showExpiredMessage() {

        require(['alert'], function (alert) {
            alert('There is a newer version of this app available. Please download the latest version from https://emby.media/download');
        });
    }

    if (Date.now() > new Date(2026, 2, 9).getTime()) {

        setTimeout(showExpiredMessage, 10000);
    }
});