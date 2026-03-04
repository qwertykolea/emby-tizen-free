require([], function () {
    'use strict';

    function registerKey(name) {

        try {
            tizen.tvinputdevice.registerKey(name);
        } catch (err) {
            console.log('Error registering tizen key: ' + err);
        }
    }

    function registerKeys() {

        if (!window.tizen) {
            return;
        }

        registerKey("Info");
        registerKey("MediaPlayPause");
        registerKey("MediaRewind");
        registerKey("MediaFastForward");
        registerKey("MediaPlay");
        registerKey("MediaPause");
        registerKey("MediaStop");
        registerKey("MediaRecord");
        registerKey("MediaTrackPrevious");
        registerKey("MediaTrackNext");
        registerKey("Search");
        registerKey("ChannelUp");
        registerKey("ChannelDown");
        registerKey("Guide");
        registerKey("Tools");
        registerKey("Caption");
        registerKey("PictureSize");
        registerKey("ColorF0Red");
        registerKey("ColorF1Green");
        registerKey("ColorF2Yellow");
        registerKey("ColorF3Blue");
        registerKey("0");
        registerKey("1");
        registerKey("2");
        registerKey("3");
        registerKey("4");
        registerKey("5");
        registerKey("6");
        registerKey("7");
        registerKey("8");
        registerKey("9");
    }

    registerKeys();
});