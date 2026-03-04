/* jshint module: true */

function executeAction(action, data, serverId) {
  if (action === 'restartserver') {
    globalThis.ConnectionManager.getApiClient(serverId).restartServer();
  }
  return Promise.resolve();
}
globalThis.addEventListener('notificationclick', function (event) {
  var notification = event.notification;
  notification.close();
  var data = notification.data;
  var serverId = data;
  var action = event.action;
  if (!action) {
    clients.openWindow("/");
    event.waitUntil(Promise.resolve());
    return;
  }
  event.waitUntil(executeAction(action, data, serverId));
}, false);
globalThis.addEventListener('push', function (e) {
  //    let options = {
  //        body: 'This notification was generated from a push!',
  //        icon: 'images/example.png',
  //        vibrate: [100, 50, 100],
  //        data: {
  //            dateOfArrival: Date.now(),
  //            primaryKey: '2'
  //        },
  //        actions: [
  //            {
  //                action: 'explore', title: 'Explore this new world',
  //                icon: 'images/checkmark.png'
  //            },
  //            {
  //                action: 'close', title: 'Close',
  //                icon: 'images/xmark.png'
  //            },
  //        ]
  //    };
  //    e.waitUntil(
  //        globalThis.registration.showNotification('Hello world!', options)
  //    );
});
