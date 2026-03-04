define(["exports", "./../modules/viewmanager/baseview.js", "./../modules/emby-apiclient/connectionmanager.js", "./../modules/loading/loading.js", "./../modules/common/servicelocator.js", "./../modules/focusmanager.js", "./../modules/emby-elements/emby-button/emby-button.js", "./../modules/emby-elements/emby-scroller/emby-scroller.js", "./../modules/navdrawer/navdrawercontent.js", "./../modules/layoutmanager.js"], function (_exports, _baseview, _connectionmanager, _loading, _servicelocator, _focusmanager, _embyButton, _embyScroller, _navdrawercontent, _layoutmanager) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  require(['css!settings/settings.css']);
  function renderSettings(instance, params) {
    var apiClient = params.serverId ? _connectionmanager.default.getApiClient(params.serverId) : _connectionmanager.default.currentApiClient();
    return apiClient.getUser(params.userId || apiClient.getCurrentUserId()).then(function (user) {
      return apiClient.getCurrentUser().then(function (loggedInUser) {
        return renderSettingsWithUser(instance, apiClient, user, loggedInUser);
      });
    });
  }
  function renderSettingsWithUser(instance, apiClient, user, loggedInUser) {
    var mobileBorders = _layoutmanager.default.tv ? false : true;
    var options = {
      apiClient: apiClient,
      user: user,
      loggedInUser: loggedInUser,
      userImage: true,
      selectServer: true,
      signOut: true,
      itemClass: 'navMenuOption-settings' + (mobileBorders ? ' navMenuOption-settings-hidelastborder' : ''),
      itemsContainerClass: mobileBorders ? ' navDrawerItemsContainer-shaded defaultCardBackground' : null,
      home: false,
      search: false,
      collapsible: false,
      header: false,
      border: false,
      highlight: mobileBorders,
      allowBorderXOffset: true,
      asideIcon: true,
      contextMenu: false,
      listItemBodyClass: 'settingsMenuListItemBody' + (_layoutmanager.default.tv ? '' : ' settingsMenuListItemBody-extrapadding'),
      itemBackground: _layoutmanager.default.tv,
      headerClass: 'navMenuHeader-settings'
    };
    return _navdrawercontent.default.getSettingsDrawerHtml(options).then(function (html) {
      var routesElem = instance.view.querySelector('.dynamicRoutes');
      if (mobileBorders) {
        routesElem.classList.add('padded-left', 'padded-right');
      }
      routesElem.innerHTML = html;
      return _navdrawercontent.default.initItemsContainers(routesElem, options).then(function () {
        var autoFocusElem = routesElem;
        if (instance.params.start === 'server') {
          var serverElem = routesElem.querySelector('div[data-section="server"]');
          if (serverElem) {
            autoFocusElem = serverElem;
          }
        }

        // the setTimeout is because this list actually gets rendered twice. 
        // Once with purely client - side options, and then the extra options from the server get injected in
        setTimeout(function () {
          _focusmanager.default.autoFocus(autoFocusElem, {
            skipIfNotEnabled: true
          });
        }, 100);
      });
    });
  }
  function addSettingsDescriptionContainer(view) {
    var html = '<div class="settingsDescriptionContainer padded-top-page padded-left padded-right">';
    html += '<div class="padded-left padded-right flex-grow flex-direction-column flex justify-content-flex-start align-items-center settingsDescriptionContent">';
    html += "<svg class=\"settingsDescriptionContent-logo\"\n   width=\"200mm\"\n   height=\"200mm\"\n   viewBox=\"0 0 200 200\"\n   version=\"1.1\"\n   enable-background=\"new\"\n   xmlns=\"http://www.w3.org/2000/svg\"\n   xmlns:svg=\"http://www.w3.org/2000/svg\"\n   xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"\n   xmlns:cc=\"http://creativecommons.org/ns#\"\n   xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n  <defs />\n  <metadata>\n    <rdf:RDF>\n      <cc:Work\n         rdf:about=\"\">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource=\"http://purl.org/dc/dcmitype/StillImage\" />\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     style=\"display:inline;opacity:1\"\n     transform=\"translate(0,-97)\">\n    <path\n       d=\"M 91.599577 97.595313 L 39.096838 150.09753 L 47.497359 158.49806 L 0.59479574 205.40062 L 53.097534 257.90336 L 61.498055 249.50284 L 108.40062 296.4054 L 164.4034 240.4021 L 156.00288 232.00158 L 199.40488 188.59958 L 146.90266 136.09684 L 138.50162 144.49788 L 91.599577 97.595313 z M 76.911068 159.30782 L 109.77314 178.28083 L 142.63522 197.25383 L 109.77314 216.22683 L 76.911068 235.19983 L 76.911068 197.25383 L 76.911068 159.30782 z \"\n       class=\"logo-shape\" />\n  </g>\n  <g />\n</svg>";
    html += '<div class="settingsDescriptionContent-description secondaryText" style="margin-top:1em;">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    view.insertAdjacentHTML('afterbegin', html);
  }
  function View(view, params) {
    _baseview.default.apply(this, arguments);
    var appInfoText = _servicelocator.appHost.appName() + ' ' + _servicelocator.appHost.appVersion();
    if (_layoutmanager.default.tv) {
      addSettingsDescriptionContainer(view);
      view.querySelector('.settingsDescriptionContent-description').innerHTML = appInfoText;
    }
  }
  Object.assign(View.prototype, _baseview.default.prototype);
  View.prototype.onResume = function (options) {
    _baseview.default.prototype.onResume.apply(this, arguments);
    _loading.default.hide();
    if (options.refresh) {
      renderSettings(this, this.params);
    }
  };
  var _default = _exports.default = View;
});
