define(["exports", "./events.js", "./../common/servicelocator.js"], function (_exports, _events, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var StorageKey = 'servercredentials3';
  function normalizeCredentialsObject(credentials) {
    if (!credentials.Servers) {
      credentials.Servers = [];
    }
  }
  function ensure(instance) {
    if (!instance._credentials) {
      var json = _servicelocator.appStorage.getItem(StorageKey) || '{}';
      console.log("credentials initialized with: " + json);
      var credentials = JSON.parse(json);
      normalizeCredentialsObject(credentials);
      instance._credentials = credentials;
    }
  }
  function set(instance, data) {
    var json = JSON.stringify(data);
    var current = _servicelocator.appStorage.getItem(StorageKey) || '{}';
    if (json === current) {
      return;
    }
    normalizeCredentialsObject(data);
    instance._credentials = data;
    _servicelocator.appStorage.setItem(StorageKey, json);
    _events.default.trigger(instance, 'credentialsupdated', [{
      credentials: data,
      credentialsJson: json
    }]);
  }
  function stringEqualsIgnoreCase(str1, str2) {
    return (str1 || '').toLowerCase() === (str2 || '').toLowerCase();
  }
  function Credentials() {}
  Credentials.prototype.clear = function () {
    this._credentials = null;
    _servicelocator.appStorage.removeItem(StorageKey);
  };
  Credentials.prototype.credentials = function (data) {
    if (data) {
      set(this, data);
    }
    ensure(this);
    return this._credentials;
  };
  Credentials.prototype.addOrUpdateServer = function (list, server, serverUrlToMatch) {
    if (!server.Id && !serverUrlToMatch) {
      throw new Error('Server.Id cannot be null or empty');
    }
    var existing;
    if (server.Id) {
      existing = list.filter(function (_ref) {
        var Id = _ref.Id;
        return Id === server.Id;
      })[0];
    } else if (serverUrlToMatch) {
      existing = list.filter(function (s) {
        return stringEqualsIgnoreCase(s.ManualAddress, serverUrlToMatch) || stringEqualsIgnoreCase(s.LocalAddress, serverUrlToMatch) || stringEqualsIgnoreCase(s.RemoteAddress, serverUrlToMatch);
      })[0];
    }
    if (existing) {
      var changed = false;

      // Merge the data
      var dateLastAccessed = Math.max(existing.DateLastAccessed || 0, server.DateLastAccessed || 0);
      if (server.DateLastAccessed !== dateLastAccessed) {
        changed = true;
        existing.DateLastAccessed = dateLastAccessed;
      }
      if (server.AccessToken || server.UserId) {
        if (server.AccessToken !== existing.AccessToken || server.UserId !== existing.UserId) {
          changed = true;
          existing.AccessToken = server.AccessToken;
          existing.UserId = server.UserId;
        }
      }
      if (server.ExchangeToken) {
        if (server.ExchangeToken !== existing.ExchangeToken) {
          changed = true;
          existing.ExchangeToken = server.ExchangeToken;
        }
      }
      if (server.RemoteAddress) {
        if (server.RemoteAddress !== existing.RemoteAddress) {
          changed = true;
          existing.RemoteAddress = server.RemoteAddress;
        }
      }
      if (server.ManualAddress) {
        if (server.ManualAddress !== existing.ManualAddress) {
          changed = true;
          existing.ManualAddress = server.ManualAddress;
        }
      }
      if (server.ManualAddressOnly != null) {
        if (server.ManualAddressOnly !== existing.ManualAddressOnly) {
          changed = true;
          existing.ManualAddressOnly = server.ManualAddressOnly;
        }
      }
      if (server.IsLocalServer != null) {
        if (server.IsLocalServer !== existing.IsLocalServer) {
          changed = true;
          existing.IsLocalServer = server.IsLocalServer;
        }
      }
      if (server.LocalAddress) {
        if (server.LocalAddress !== existing.LocalAddress) {
          changed = true;
          existing.LocalAddress = server.LocalAddress;
        }
      }
      if (server.Name) {
        if (server.Name !== existing.Name) {
          changed = true;
          existing.Name = server.Name;
        }
      }
      if (server.Users) {
        if (!changed) {
          if (JSON.stringify(existing.Users || []) !== JSON.stringify(server.Users)) {
            changed = true;
          }
        }
        existing.Users = server.Users;
      }
      if (server.WakeOnLanInfos) {
        if (!changed) {
          if (JSON.stringify(existing.WakeOnLanInfos || []) !== JSON.stringify(server.WakeOnLanInfos)) {
            changed = true;
          }
        }
        existing.WakeOnLanInfos = server.WakeOnLanInfos;
      }
      if (server.LastConnectionMode != null) {
        if (server.LastConnectionMode !== existing.LastConnectionMode) {
          changed = true;
          existing.LastConnectionMode = server.LastConnectionMode;
        }
      }
      if (server.ConnectServerId) {
        if (server.ConnectServerId !== existing.ConnectServerId) {
          changed = true;
          existing.ConnectServerId = server.ConnectServerId;
        }
      }

      // TODO: this is a bug and it should return changed
      // fixing this will require testing all of the places that use this method. most are just updating the original object and therefore changed will be false
      return existing;
    } else {
      list.push(server);
      return true;
    }
  };
  var _default = _exports.default = new Credentials();
});
