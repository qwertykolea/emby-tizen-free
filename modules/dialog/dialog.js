define(["exports", "./../layoutmanager.js", "./../common/globalize.js", "./../approuter.js", "./../dialoghelper/dialoghelper.js", "./../dom.js", "./../common/inputmanager.js", "./../emby-apiclient/connectionmanager.js", "./../common/imagehelper.js", "./../common/itemmanager/itemmanager.js", "./../emby-elements/emby-button/emby-button.js", "./../emby-elements/emby-scroller/emby-scroller.js", "./../emby-elements/emby-dialogclosebutton/emby-dialogclosebutton.js"], function (_exports, _layoutmanager, _globalize, _approuter, _dialoghelper, _dom, _inputmanager, _connectionmanager, _imagehelper, _itemmanager, _embyButton, _embyScroller, _embyDialogclosebutton) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = _default;
  /* jshint module: true */

  require(['material-icons', 'formDialogStyle', 'flexStyles', 'css!modules/dialog/dialog.css']);
  function onInputCommand(e) {
    var command = e.detail.command;
    switch (command) {
      case 'up':
        {
          var scroller = this.querySelector('.emby-scroller');
          scroller.scrollBackwards();
          e.preventDefault();
          break;
        }
      case 'down':
        {
          var _scroller = this.querySelector('.emby-scroller');
          _scroller.scrollForwards();
          e.preventDefault();
          break;
        }
      default:
        break;
    }
  }
  function addDirectionalScrolling(dlg) {
    _inputmanager.default.on(dlg, onInputCommand.bind(dlg));
  }
  function wrapTextWithButtonIfNeeded(text, enableScrollWithDirectionButtons) {
    if (!enableScrollWithDirectionButtons) {
      return text;
    }

    // the button allows the dialog to receive focus
    text = '<button type="button" is="emby-button" class="button-link text-align-start button-link-no-focus-bg dialog-btn-textscroll" style="font-weight:normal;color:inherit!important;transform:none!important;text-decoration:none!important;background:none!important;">' + text;
    text += '</button>';
    return text;
  }
  function getTextLinkButton(item) {
    var href = _approuter.default.getRouteUrl(item);
    return '<a is="emby-linkbutton" class="button-link noautofocus" data-href="' + href + '" href="' + href + '" style="max-width:100%;overflow:hidden;">' + item.Name + '</a>';
  }
  function getItemPreviewHtml(options, item) {
    var html = '';
    html += '<div class="dialogItemPreview flex flex-direction-row align-items-center">';
    var apiClient = _connectionmanager.default.getApiClient(item);
    var imageUrlInfo = _imagehelper.default.getImageUrl(item, apiClient, {
      height: 60,
      width: 200
    });
    var imageUrl = imageUrlInfo.imgUrl;
    var imgClass = '';
    var round = item.Type === 'MusicArtist';
    if (imageUrl) {
      imgClass += ' dialogItemPreviewImage-bg';
      var imageAspect = imageUrlInfo.aspect || 1;
      var shape = _imagehelper.default.getShapeFromAspect(imageAspect);
      imgClass += ' dialogItemPreviewImage-bg-' + shape;
      if (round && shape === 'square') {
        imgClass += ' dialogItemPreviewImage-round';
      }
      html += '<div class="' + imgClass.trim() + '" style="aspect-ratio:' + imageAspect + ';background-image:url(' + imageUrl + ');">';
      html += '</div>';
    } else {
      imgClass += ' dialogItemPreviewImage-iconcontainer';
      if (round) {
        imgClass += ' dialogItemPreviewImage-round';
      }
      html += '<div class="' + imgClass.trim() + '">';
      html += '<i class="dialogItemPreviewImage-icon md-icon autortl">';
      html += _itemmanager.default.getDefaultIcon(item);
      html += '</i>';
      html += '</div>';
    }
    html += '<div class="dialogItemPreviewContent">';
    var lines = [];
    if (item.SeriesName) {
      if (item.SeriesId) {
        lines.push(getTextLinkButton({
          Type: 'Series',
          Id: item.SeriesId,
          Name: item.SeriesName,
          IsFolder: true,
          ServerId: item.ServerId
        }));
      } else {
        lines.push(item.SeriesName);
      }
    } else if (item.Type === 'Program') {
      lines.push(item.Name);
    }
    lines.push(_itemmanager.default.getDisplayName(item, {}));
    if (item.Type === 'Server') {
      if (apiClient && apiClient.serverVersion()) {
        lines.push(apiClient.serverVersion());
      }
      if (apiClient && apiClient.serverAddress()) {
        //if (item.LastConnectionMode != null) {
        //    lines.push('<div style="font-weight:bold;" class="secondaryText">Last Connected At</div>');
        //}

        lines.push(apiClient.serverAddress());
      }
    }
    if (item.Type === 'User' && options.showServerName) {
      var serverName = apiClient.serverName();
      if (serverName) {
        lines.push(serverName);
      }
    }
    if (item.IsFolder && item.AlbumArtists && item.AlbumArtists.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.AlbumArtists[0].Id,
        Name: item.AlbumArtists[0].Name,
        ServerId: item.ServerId
      }));
    } else if (item.ArtistItems && item.ArtistItems.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.ArtistItems[0].Id,
        Name: item.ArtistItems[0].Name,
        ServerId: item.ServerId
      }));
    } else if (item.AlbumArtists && item.AlbumArtists.length) {
      lines.push(getTextLinkButton({
        Type: 'MusicArtist',
        Id: item.AlbumArtists[0].Id,
        Name: item.AlbumArtists[0].Name,
        ServerId: item.ServerId
      }));
    }
    var secondaryTexts = [];
    if (item.Album && item.AlbumId) {
      secondaryTexts.push(getTextLinkButton({
        Type: item.MediaType === 'Photo' ? 'PhotoAlbum' : 'MusicAlbum',
        Id: item.AlbumId,
        Name: item.Album,
        ServerId: item.ServerId
      }));
    } else if (item.Album) {
      secondaryTexts.push(item.Album);
    }
    if (item.ProductionYear && item.Type !== 'Episode') {
      secondaryTexts.push(item.ProductionYear);
    }
    if (secondaryTexts.length) {
      lines.push(secondaryTexts.join(' &middot; '));
    }
    for (var i = 0, length = Math.min(lines.length, 3); i < length; i++) {
      if (i >= 1) {
        html += '<div class="dialogItemPreviewText secondaryText">';
        html += lines[i];
        html += '</div>';
      } else {
        html += '<div class="dialogItemPreviewText">';
        html += lines[i];
        html += '</div>';
      }
    }
    html += '</div>';
    html += '</div>';
    return html;
  }
  function showDialog(options, template) {
    var dialogOptions = {
      removeOnClose: true,
      scrollY: false,
      lowResAutoHeight: true
    };
    var enableTvLayout = _layoutmanager.default.tv;
    if (enableTvLayout) {
      dialogOptions.size = 'fullscreen';
    }
    var dlg = _dialoghelper.default.createDialog(dialogOptions);
    dlg.classList.add('formDialog', 'justify-content-center');

    // tizen networkerror uses this to close the dialog
    if (options.dialogType) {
      dlg.classList.add(options.dialogType + 'Dialog');
    }
    var optionButtons = options.buttons || [];
    var enableScrollWithDirectionButtons = enableTvLayout && optionButtons.length === 0;
    if (enableScrollWithDirectionButtons) {
      template = template.replace('data-focusscroll="true"', 'data-focusscroll="false"');
    }
    dlg.innerHTML = _globalize.default.translateHtml(template, 'sharedcomponents');
    var formDialogContent = dlg.querySelector('.formDialogContent');
    formDialogContent.classList.add('no-grow');
    if (enableTvLayout) {
      formDialogContent.style['max-height'] = '60%';
    } else {
      if (_dom.default.allowBackdropFilter()) {
        dlg.classList.add('dialog-blur');
      }
    }

    //dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
    //    dialogHelper.close(dlg);
    //});

    var titleElement = dlg.querySelector('.formDialogHeaderTitle');
    var headerElement = dlg.querySelector('.formDialogHeader');
    if (options.item) {
      headerElement.insertAdjacentHTML('afterbegin', getItemPreviewHtml(options, options.item));
      headerElement.classList.remove('justify-content-center');
      headerElement.classList.add('padded-left', 'padded-right', 'dialogHeader-withpreview', 'dialog-content-centered');
      titleElement.classList.add('hide');
    } else if (options.title) {
      titleElement.innerHTML = options.title || '';
    } else {
      titleElement.classList.add('hide');
      headerElement.style.height = 'auto';
    }
    var dialogContentInner = dlg.querySelector('.dialogContentInner');
    var isDialogContentCentered;
    if (options.centerText !== false) {
      dialogContentInner.style.textAlign = 'center';
      isDialogContentCentered = true;
    }
    if (!_layoutmanager.default.tv && !optionButtons.length) {
      dlg.classList.add('dialog-largefont');
    }
    if (options.html) {
      dialogContentInner.innerHTML = wrapTextWithButtonIfNeeded(options.html, enableScrollWithDirectionButtons);
    } else if (options.preFormattedText) {
      var preStartTag = '<pre class="text-align-start" style="font-size:inherit;margin:0;';
      if (options.formatText !== false) {
        preStartTag += 'text-wrap:wrap;font-family:inherit;white-space:pre-wrap;';
      }
      preStartTag += '">';
      dialogContentInner.innerHTML = wrapTextWithButtonIfNeeded(preStartTag + options.preFormattedText + '</pre>', enableScrollWithDirectionButtons);
    } else if (options.code) {
      dialogContentInner.innerHTML = wrapTextWithButtonIfNeeded('<div class="text-align-start"><code class="text-align-start" style="font-size:inherit;margin:0;">' + options.code + '</code></div>', enableScrollWithDirectionButtons);
    } else if (options.text) {
      // this extra span layer allows the text to be centered if it's only one line, but left-aligned if it's multi-line
      var textContainer = dialogContentInner;
      if (isDialogContentCentered) {
        dialogContentInner.innerHTML = '<span style="display:inline-block;" class="text-align-start"></span>';
        textContainer = dialogContentInner.querySelector('span');
      }
      textContainer.innerText = wrapTextWithButtonIfNeeded((options.text || '').replaceAll('<br/>', '\n'), enableScrollWithDirectionButtons);
    } else {
      dialogContentInner.classList.add('hide');
    }
    var i, length;
    var html = '';
    var hasDescriptions = false;
    for (i = 0, length = optionButtons.length; i < length; i++) {
      var item = optionButtons[i];
      var buttonClass = 'btnOption raised formDialogFooterItem formDialogFooterItem-autosize';
      if (item.type) {
        buttonClass += ' button-' + item.type;
      }
      if (item.description) {
        hasDescriptions = true;
      }
      if (item.href) {
        html += '<a is="emby-linkbutton" target="_blank" href="' + item.href + '" class="' + buttonClass + '" data-id="' + item.id + '">' + item.name + '</a>';
      } else {
        html += '<button is="emby-button" type="button" class="' + buttonClass + '" data-id="' + item.id + '"><span>' + item.name + '</span></button>';
      }
      if (item.description) {
        html += '<div class="formDialogFooterItem formDialogFooterItem-autosize fieldDescription" style="margin-top:.25em!important;margin-bottom:1.25em!important;">' + item.description + '</div>';
      }
    }
    var formDialogFooter = dlg.querySelector('.formDialogFooter');
    formDialogFooter.innerHTML = html;
    if (!html) {
      formDialogFooter.classList.add('hide');
      var scrollSlider = dlg.querySelector('.scrollSlider');
      scrollSlider.style['padding-bottom'] = '2em';
      if (options.item) {
        scrollSlider.style['padding-top'] = '0';
      }
      if (_layoutmanager.default.tv) {
        dlg.querySelector('.formDialogHeader').insertAdjacentHTML('afterbegin', '<button type="button" is="emby-dialogclosebutton" class="dialog-dialog-close" closetype="done"></button>');
      } else {
        dlg.querySelector('.formDialogHeader').insertAdjacentHTML('afterbegin', '<button type="button" is="emby-dialogclosebutton" class="dialog-dialog-close dialog-dialog-close-reducefont" closetype="done"></button>');
      }
    }
    if (hasDescriptions) {
      dlg.querySelector('.formDialogFooter').classList.add('formDialogFooter-vertical');
    }
    var dialogResult;
    function onButtonClick() {
      dialogResult = this.getAttribute('data-id');
      _dialoghelper.default.close(dlg);
    }
    var buttons = dlg.querySelectorAll('.btnOption');
    for (i = 0, length = buttons.length; i < length; i++) {
      buttons[i].addEventListener('click', onButtonClick);
    }
    if (enableScrollWithDirectionButtons) {
      addDirectionalScrolling(dlg);
    }
    var timeout;
    if (options.timeout) {
      timeout = setTimeout(function () {
        dialogResult = '_timeout';
        _dialoghelper.default.close(dlg);
      }, options.timeout);
    }
    return _dialoghelper.default.open(dlg).then(function () {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (dialogResult) {
        return dialogResult;
      } else {
        return Promise.reject();
      }
    });
  }
  var uiDependencies = ['material-icons', 'emby-button', 'paper-icon-button-light', 'formDialogStyle', 'flexStyles', 'emby-scroller'];
  function _default(text, title) {
    var options;
    if (typeof text === 'string') {
      options = {
        title: title,
        text: text
      };
    } else {
      options = text;
    }
    var uiDeps = uiDependencies;
    var deps;

    // Only needed the first time
    if (uiDeps.length) {
      deps = uiDeps.slice(0);
      uiDependencies = [];
    } else {
      deps = [];
    }
    deps.unshift('text!modules/dialog/dialog.template.html');
    return require(deps).then(function (responses) {
      window.dispatchEvent(new CustomEvent('userprompt', {
        detail: {
          promptType: options.dialogType
        },
        bubbles: true,
        cancelable: false
      }));
      return showDialog(options, responses[0]);
    });
  }
});
