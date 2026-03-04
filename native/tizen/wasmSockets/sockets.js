define(['./wasm_tools', './wasmSocketsModule'], function () {
    'use strict';

    var wasmModule = new Proxy(
            new ModuleLoader(
                '/native/tizen/wasmSockets/wasmSocketsModule.wasm',
                wasmSocketsModule,
                null,
                null),
            ModuleLoaderProxyHandler);

    function discoverservers(message, callback) {

        var question = message['question'];
        var port = message['port'];
        var timeout = message['timeout'];

        var response = wasmModule.ccall(
            'discoverServers',                  // name of C function
            'string',                           // return type
            ['string', 'number', 'number'],     // argument types
            [question, port, timeout]           // arguments
        );

        if (callback) {
            callback({'servers': JSON.parse(response)});
        }

        // Must free the response as it was allocated from the heap
        wasmModule._free(response);

    }

    function wakeonlan(message, callback) {

        var address = message['address'];
        var port = message['port'];

        var response = wasmModule.ccall(
            'sendWOL',              // name of C function
            'number',               // return type
            ['string', 'number'],   // argument types
            [address, port]         // arguments
        );

        if (callback) {
            callback(response);
        }
    }

    function execute(message, callback) {

        var func = message['function'];

        console.log('sockets() : wasm executing ' + func);

        switch (func) {
            case 'discoverservers':
                discoverservers(message, callback);
                break;
            case 'wakeonlan':
                wakeonlan(message, callback);
                break;
        }

    }

    return {
        execute: execute
    };

});
