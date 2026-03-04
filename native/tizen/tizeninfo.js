require(['browser', '$WEBAPIS/webapis/webapis.js'], function (browser) {
    'use strict';

    // Find the size (in GB) thats the nearest power of 2
    // A full list of possible values should be as follows: 0.25, 0.5, 1, 2, 4, 8
    // https://www.w3.org/TR/device-memory/#computing-device-memory-value
    function normalizeMemSize(MBytes) {
        var pwr = Math.floor( Math.log(MBytes) / Math.log(2) );
        var GBytes = Math.pow(2, pwr) / 1024;

        return Math.max(0.25, Math.min(8, GBytes));
    }

    if (!navigator.deviceMemory) {
        if (globalThis.tizen && globalThis.tizen.systeminfo) {
            var TotalMem = globalThis.tizen.systeminfo.getTotalMemory();
            var MBytes = TotalMem / 1024 / 1024;
            navigator.deviceMemory = normalizeMemSize(MBytes);
        }
    }

    var isTizenUhd = function () {
        if (globalThis.tizen) {
            try {
                var isUdPanelSupported = webapis.productinfo.isUdPanelSupported();
                console.log("isTizenUhd = " + isUdPanelSupported);
                return isUdPanelSupported;
            } catch (error) {
                console.log("isUdPanelSupported() error code = " + error.code);
            }
        }

        return false;
    }();

    var isTizen8K = function () {
        if (isTizenUhd) {
            try {
                var is8KPanelSupported = false;
                if (webapis.productinfo.is8KPanelSupported) {
                    is8KPanelSupported = webapis.productinfo.is8KPanelSupported();
                }
                console.log("is8KPanelSupported = " + is8KPanelSupported);
                return is8KPanelSupported;
            } catch (error) {
                console.log("is8KPanelSupported() error code = " + error.code);
            }
        }

        return false;
    }();

    var isTizenFhd = function () {
        if (globalThis.tizen && !isTizenUhd) {
            return true;
        }

        return false;
    }();

    if (globalThis.tizen) {

        browser.isTizen8K = isTizen8K;
        browser.isTizenUhd =isTizenUhd;
        browser.isTizenFhd = isTizenFhd;

        if (globalThis.tizen.systeminfo) {

            var v = tizen.systeminfo.getCapability('http://tizen.org/feature/platform.version');

            if (v && parseFloat(v)) {
                browser.sdkVersion = parseFloat(v);
            } else {
                browser.sdkVersion = 0;
            }

            browser.supportsWebAssembly = browser.sdkVersion >= 5.5;
        }
    }
});