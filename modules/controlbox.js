define(["./common/servicelocator.js", "./emby-elements/emby-button/paper-icon-button-light.js"], function (_servicelocator, _paperIconButtonLight) {
  /* jshint module: true */

  function bindEvents() {
    document.querySelector('.appExitButton').addEventListener('click', function () {
      _servicelocator.appHost.exit();
    });
    document.querySelector('.minimizeButton').addEventListener('click', function () {
      _servicelocator.appHost.setWindowState('Minimized');
    });
    document.querySelector('.maximizeButton').addEventListener('click', function () {
      if (_servicelocator.appHost.getWindowState() === 'Normal') {
        _servicelocator.appHost.setWindowState('Maximized');
      } else {
        _servicelocator.appHost.setWindowState('Normal');
      }
    });
  }
  function renderControlBox() {
    var html = '';
    html += '<button is="paper-icon-button-light" class="controlBoxButton minimizeButton" tabindex="-1"><i class="md-icon controlBoxButtonIcon">remove</i></button><button is="paper-icon-button-light" class="controlBoxButton maximizeButton" tabindex="-1"><i class="md-icon controlBoxButtonIcon">crop_square</i></button><button is="paper-icon-button-light" class="controlBoxButton appExitButton" tabindex="-1"><i class="md-icon controlBoxButtonIcon">close</i></button>';
    var div = document.createElement('div');
    div.innerHTML = html;
    div.classList.add('controlBox');
    document.querySelector('.windowDragRegion').appendChild(div);
    bindEvents();
  }
  renderControlBox();
});
