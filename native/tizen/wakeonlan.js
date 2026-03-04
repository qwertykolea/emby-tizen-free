define(['sockets'], function (sockets) {
    'use strict';

    //info.MacAddress
    //info.Port
    function send(info) {

        var msg = {
            'function': 'wakeonlan',
            address: info.MacAddress,
            port: info.Port
        };

        console.log('wakeonlan() : Posting MacAddress and Port...' + info.MacAddress + ':' + info.Port);

        sockets.execute(msg);

        return Promise.resolve();
    }

    function isSupported() {
        return true;
    }

    return {
        send: send,
        isSupported: isSupported
    };

});