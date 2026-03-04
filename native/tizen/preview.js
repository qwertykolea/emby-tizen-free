require(['globalize', 'events', 'connectionManager', 'serverNotifications'], function (globalize, events, connectionManager, serverNotifications) {
    "use strict";

    var sectionItemLimit = 3;       // Maximum number of tiles is 40

    function setShortcuts(user) {

        var shortcuts;
        var sections = [];

        var apiClient = connectionManager.getApiClient(user.ServerId);

        shortcuts = createUserShortcuts(apiClient, user);

        if (shortcuts) {
            sections.push({ title: user.Name, tiles: shortcuts });
        }

        createOnNowShortcut(apiClient, user).then(function (shortcuts) {

            if (shortcuts.length > 0) {
                sections.push({
                    title: globalize.translate('HeaderOnNow'),
                    tiles: shortcuts
                });
            }

            createContinueWatchingShortcuts(apiClient, user).then(function (shortcuts) {

                if (shortcuts.length > 0) {
                    sections.push({
                        title: globalize.translate('HeaderContinueWatching'),
                        tiles: shortcuts
                    });
                }

                createLatestShortcuts(apiClient).then(function (shortcuts) {

                    if (shortcuts.length > 0) {
                        sections.push({
                            title: globalize.translate('HeaderLatestMedia'),
                            tiles: shortcuts
                        });
                    }

                    createViewShortcuts(apiClient, user).then(function (shortcuts) {

                        if (shortcuts.length > 0) {
                            sections.push({
                                title: globalize.translate('Libraries'),
                                tiles: shortcuts
                            });
                        }

                        setPreview(sections);

                    });
                });
            });
        });
    }

    function createUserShortcuts(apiClient, user) {

        var shortcuts = [];
        var imageUrl;

        if (user.PrimaryImageTag) {
            imageUrl = apiClient.getUserImageUrl(user.Id, {
                type: "Primary",
                height: "250",
                tag: user.PrimaryImageTag
            });
        } else {
            imageUrl = 'https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/images/static/user.png';
        }

        var actionData = { action: 'login', serverId: user.ServerId };

        shortcuts.push({
            image_url: imageUrl,                                          // ref to image url - what happens when apiKey token expires?
            image_ratio: '1by1',                                          // "16by9", "4by3", "1by1", and "2by3"
            action_data: JSON.stringify(actionData),
            is_playable: false
        });

        return shortcuts;
    }

    function createOnNowShortcut(apiClient, user) {

        var shortcuts = [];

        if (!user.Policy.EnableLiveTvAccess) {
            return Promise.resolve(shortcuts);
        }

        return apiClient.getUserViews().then(function (result) {

            var views = result.Items;
            var actionData;

            for (var i = 0, length = views.length; i < length; i++) {

                var view = views[i];

                if (view.CollectionType === 'livetv') {

                    var imageUrl;

                    if (view.ImageTags.Primary) {
                        imageUrl = apiClient.getImageUrl(view.Id, {
                            type: "Primary"
                        });
                        imageUrl += '&height=250';
                    } else {
                        imageUrl = 'https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/images/static/livetv.png';
                    }

                    actionData = { action: 'invokeShortcut', shortcut: 'livetv' + '_' + user.ServerId };

                    shortcuts.push({
                        image_url: imageUrl,
                        image_ratio: '1by1',
                        action_data: JSON.stringify(actionData),
                        is_playable: false
                    });
                }
            }

            return Promise.resolve(shortcuts);
        });
    }

    function createContinueWatchingShortcuts(apiClient, user) {

        var options = {
            Limit: sectionItemLimit,
            ImageTypeLimit: 1,
            MediaTypes: 'Video',
            Recursive: true,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getResumableItems(user.Id, options).then(function (result) {

            var shortcuts = addItems(apiClient, result.Items);

            return Promise.resolve(shortcuts);
        });
    }

    function createLatestShortcuts(apiClient) {

        var options = {
            IncludeItemTypes: "Episode,Movie",
            Limit: sectionItemLimit,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            Fields: 'PrimaryImageAspectRatio',
            ImageTypeLimit: 1
        };

        return apiClient.getLatestItems(options).then(function (items) {

            var shortcuts = addItems(apiClient, items);

            return Promise.resolve(shortcuts);
        });

    }

    function addItems(apiClient, items) {

        var shortcuts = [];

        if (items) {

            var imageUrl;
            var subtitle;
            var actionData;

            for (var i = 0, length = items.length; i < length; i++) {

                var item = items[i];

                imageUrl = getImageUrl(item, apiClient);

                if (item.ParentIndexNumber && item.IndexNumber) {
                    subtitle = 'S' + item.ParentIndexNumber + ':E' + item.IndexNumber + ' - ' + item.Name;
                } else {
                    subtitle = item.Name;
                }

                actionData = { action: 'invokeShortcut', shortcut: 'item-' + item.Id + '_' + item.ServerId };

                shortcuts.push({
                    subtitle: subtitle,
                    image_url: imageUrl + '&height=250',
                    image_ratio: '16by9',
                    action_data: JSON.stringify(actionData),
                    is_playable: true,
                    position: i
                });
            }
        }

        return shortcuts;
    }

    function createViewShortcuts(apiClient, user) {

        return apiClient.getUserViews().then(function (result) {

            var views = result.Items;
            var title;
            var actionData;
            var shortcuts = [];

            for (var i = 0, length = views.length; i < length; i++) {

                if (shortcuts.length >= sectionItemLimit) {
                    break;
                }

                var view = views[i];

                var imageUrl = apiClient.getImageUrl(view.Id, {
                    type: "Primary"
                });

                if (view.ImageTags.Primary && view.CollectionType !== 'livetv') {
                    title = view.Name;
                    actionData = { action: 'invokeShortcut', shortcut: 'library-' + view.Id + '_' + view.ServerId };

                    shortcuts.push({
                        subtitle: title,
                        image_url: imageUrl + '&height=250',
                        image_ratio: '16by9',
                        action_data: JSON.stringify(actionData),
                        is_playable: false
                    });

                }
            }

            return Promise.resolve(shortcuts);
        });
    }

    function setPreview(sections) {
        // previewData contains an array of sections
        var previewData = { sections: sections };

        try {
            updatePreviewData(JSON.stringify(previewData));
            console.log('appShortcuts loaded');
        } catch (ex) {
            console.log(ex.message);
        }
    }

    function clearShortcuts() {
        try {
            updatePreviewData(JSON.stringify({}));
            console.log('appShortcuts cleared');
        } catch (ex) {
            console.log(ex.message);
        }
    }

    function deepLink() {

        var requestedAppControl = tizen.application.getCurrentApplication().getRequestedAppControl();
        var appControlData;
        var values;
        var actionData;

        if (requestedAppControl) {
            appControlData = requestedAppControl.appControl.data; // get appcontrol data. action_data is in it.

            for (var i = 0; i < appControlData.length; i++) {

                if (appControlData[i].key === 'PAYLOAD') { // find PAYLOAD property.
                    values = JSON.parse(appControlData[i].value[0]).values; // Get action_data
                    actionData = JSON.parse(values);

                    if (actionData.action === 'login') {
                        var currentServerId = actionData.serverId;
                        var apiClient = currentServerId ? connectionManager.getApiClient(currentServerId) : connectionManager.currentApiClient();
                        Emby.Page.showServerLogin({
                          apiClient: apiClient
                        });
                    } else if (actionData.action === 'invokeShortcut') {
                        Emby.Page.invokeShortcut(actionData.shortcut);
                    }
                }
            }
        } else {
            console.log('[preview.deepLink()] : no req app control');
        }
    }

    function onVisibilityChanged() {
        var server = connectionManager.getLastUsedServer();
        if (server) {
            var apiClient = connectionManager.getApiClient(server.Id);
            apiClient.getCurrentUser().then(setShortcuts).catch(function (e) {
            });
        }
    }

    function bindEvents() {

        var started = false;

        window.addEventListener('appcontrol', deepLink);
        window.addEventListener('blur', onVisibilityChanged);

        document.addEventListener('visibilitychange', onVisibilityChanged);

        events.on(connectionManager, 'localusersignedout', clearShortcuts);

        events.on(connectionManager, 'localusersignedin', function (e, serverId, userId) {
            var apiClient = connectionManager.getApiClient(serverId);
            apiClient.getCurrentUser().then(setShortcuts);

            if (!started) {
                started = true;
                setTimeout(deepLink, 300);     // must call on initial load, but make sure UI is fully loaded first - make timeout longer if shortcuts aren't launching on startup
            }
        });

        events.on(serverNotifications, 'UserDataChanged', function (e, apiClient, userData) {
            if (userData.LastPlayedDate) {
                apiClient.getCurrentUser().then(setShortcuts);
            }
        });

    }

    // Start
    bindEvents();

    //*************************************************************************

    // From cardbuilder.getCardImageUrl(), only includes 'PreferThumb' logic
    function getImageUrl(item, apiClient) {

        var imgUrl = null;

        if (item.ImageTags && item.ImageTags.Thumb) {

            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                tag: item.ImageTags.Thumb
            });

        } else if (item.SeriesThumbImageTag) {

            imgUrl = apiClient.getScaledImageUrl(item.SeriesId, {
                type: "Thumb",
                tag: item.SeriesThumbImageTag
            });

        } else if (item.ParentThumbItemId) {

            imgUrl = apiClient.getScaledImageUrl(item.ParentThumbItemId, {
                type: "Thumb",
                tag: item.ParentThumbImageTag
            });

        } else if (item.BackdropImageTags && item.BackdropImageTags.length) {

            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                tag: item.BackdropImageTags[0]
            });

        } else if (item.ParentBackdropImageTags && item.ParentBackdropImageTags.length && item.Type === 'Episode') {

            imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                type: "Backdrop",
                tag: item.ParentBackdropImageTags[0]
            });

        } else if (item.ImageTags && item.ImageTags.Primary) {

            imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                tag: item.ImageTags.Primary
            });

        } else if (item.PrimaryImageTag) {

            imgUrl = apiClient.getScaledImageUrl(item.PrimaryImageItemId || item.Id || item.ItemId, {
                type: "Primary",
                tag: item.PrimaryImageTag
            });

        }
        else if (item.ParentPrimaryImageTag) {

            imgUrl = apiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
                type: "Primary",
                tag: item.ParentPrimaryImageTag
            });
        }
        else if (item.SeriesPrimaryImageTag) {

            imgUrl = apiClient.getScaledImageUrl(item.SeriesId, {
                type: "Primary",
                tag: item.SeriesPrimaryImageTag
            });
        }
        else if (item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {

            imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                type: "Backdrop",
                tag: item.ParentBackdropImageTags[0]
            });

        }

        return imgUrl;
    }

    //*************************************************************************

    var remotePort;
    var consolePort;

    // https://developer.samsung.com/tv/develop/api-references/samsung-product-api-references/preview-api
    // https://developer.samsung.com/tv/develop/guides/smart-hub-preview/

    // https://developer.samsung.com/tv/develop/guides/smart-hub-preview/#implementing-the-background-service-application
    function updatePreviewData(previewData) {
        var serviceId = 'vYmY3AFREE.service'; //Application ID for background service application
        var messagePortName = 'FOREGROUND_APP_PORT';
        var consolePortName = 'CONSOLE_APP_PORT';

        function sendPreviewData(data) {
            var messageData = {
                key: 'PREVIEWDATA',
                value: data
            };

            try {
                console.log('sendMessage - sending previewdata');
                remotePort.sendMessage([messageData]);
            } catch (e) {
                console.log('sendMessage error ' + e.message);
            }
        }

        function onReceivedConsoleMsg(data, remotePort) {
            console.log('[' + serviceId + '] ' + data[0].value);
        }

        if (!consolePort) {
            // var ENABLE_CONSOLE_LOGGING in service.js must be set to true to receive messages
            console.log('start listening for console messages from ' + serviceId + ' (if enabled in service.js)');

            consolePort = tizen.messageport.requestLocalMessagePort(consolePortName);
            consolePort.addMessagePortListener(onReceivedConsoleMsg);
        }

        // launch the service
        tizen.application.launchAppControl(
            new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service'),
            serviceId,
            function () {
                console.log('Launch success: ' + serviceId);

                setTimeout(function () {
                    try {
                        remotePort = tizen.messageport.requestRemoteMessagePort(serviceId, messagePortName);
                        console.log('got port: ' + messagePortName);
                        sendPreviewData(previewData);
                    } catch (e) {
                    }
                }, 500);
            },
            function (error) {
                console.log(JSON.stringify(error));
            }
        );
    }

});