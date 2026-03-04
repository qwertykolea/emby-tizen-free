define(['events', 'playbackManager'], function (events, playbackManager) {

    'use strict';

    events.on(playbackManager, 'playbackstart', function (e, player, state) {

        if (state.NowPlayingItem && (state.NowPlayingItem.MediaType === 'Photo' || state.NowPlayingItem.MediaType === 'Video')) {

            console.log('playbackstart : Disabling Tizen system Screensaver');

            try {
                webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
            } catch (error) {
                console.log('screensavermanager() : error code = ' + error.code);
            }

        }
    });

    events.on(playbackManager, 'playbackstop', function (e, stopInfo) {
        var state = stopInfo.state;

        if (state.NowPlayingItem && (state.NowPlayingItem.MediaType === 'Photo' || state.NowPlayingItem.MediaType === 'Video')) {

            console.log('playbackstop : Enabling Tizen system Screensaver');

            try {
                webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_ON);
            } catch (error) {
                console.log('screensavermanager() : error code = ' + error.code);
            }

        }
    });

});
