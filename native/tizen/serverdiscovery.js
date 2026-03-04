define(['sockets'], function (sockets) {
    'use strict';

    function listenerSession(resolve, timeoutMs) {

        var msg = {
            'function': 'discoverservers',
            question: 'who is EmbyServer?|emby',
            port: 7359,
            timeout: timeoutMs
        };

        console.log('serverdiscovery() : Discovering...');

        sockets.execute(msg, function (response) {

            var servers = [];

            if (response && response.servers) {

                response.servers.forEach(function (server) {

                    if (typeof server === 'object') {
                        // wasmSockets returns a JSON encoded array of objects
                        // which should already have been JSON parsed.  Just use the objects.
                        servers.push(server);
                    } else {
                        // naclSockets returns an array of JSON encoded objects
                        // These need to be JSON parsed.
                        servers.push(JSON.parse(server));
                    }

                });

            }

            // Expected server properties
            // Name, Id, Address, EndpointAddress (optional)
            resolve(servers);
        });

    }

    return {

        findServers: function (timeoutMs) {

            return new Promise(function (resolve, reject) {

                new listenerSession(resolve, timeoutMs);
            });
        }
    };


});