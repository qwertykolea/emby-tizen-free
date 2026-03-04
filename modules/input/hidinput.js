define(["exports", "./../common/inputmanager.js", "./../common/servicelocator.js"], function (_exports, _inputmanager, _servicelocator) {
  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  /* jshint module: true */

  var hidInput = {
    requestCount: 0
  };

  // Some information here: https://learn.microsoft.com/en-us/previous-versions/windows/desktop/windows-media-center-sdk/bb417079(v=msdn.10)?redirectedfrom=MSDN
  // Microsoft Vendor ID
  // https://usb-ids.gowdy.us/read/UD/045e
  //const _USB_VENDOR_ID_MS = 0x045e;

  // eHome Infrared Receiver Device ID
  // https://usb-ids.gowdy.us/read/UD/045e/006d
  //const _USB_DEVICE_ID_EHOME_ID = 0x006d;

  var _COMPATIBLE_PRODUCT_IDs = [{
    vendorId: 0x045E,
    productId: 0x006D
  },
  // Microsoft SB
  {
    vendorId: 0x045E,
    productId: 0x00A0
  },
  //Microsoft BB
  {
    vendorId: 0x045E,
    productId: 0x00DA
  },
  //Microsoft SF
  {
    vendorId: 0x107B,
    productId: 0x3009
  },
  //Gateway BB
  {
    vendorId: 0x1509,
    productId: 0x9242
  },
  //FIC BB
  {
    vendorId: 0x03EE,
    productId: 0x2501
  },
  //Mitsumi BB
  {
    vendorId: 0x0471,
    productId: 0x0815
  },
  //Philips BB
  {
    vendorId: 0x0609,
    productId: 0x031D
  },
  //SMK BB
  {
    vendorId: 0x2040,
    productId: 0x6310
  },
  //Hauppauge BB
  {
    vendorId: 0x1009,
    productId: 0x000E
  },
  //eMuzed BB
  {
    vendorId: 0x1019,
    productId: 0x0F38
  },
  //ECS BB
  {
    vendorId: 0x03F3,
    productId: 0x0094
  },
  //Adaptec BB
  {
    vendorId: 0x0FB8,
    productId: 0x0002
  },
  //Wistron BB
  {
    vendorId: 0x04E8,
    productId: 0x7061
  },
  //Samsung BB
  {
    vendorId: 0x1460,
    productId: 0x9150
  },
  //Tatung BB
  {
    vendorId: 0x03EE,
    productId: 0x2502
  },
  //Mitsumi SF
  {
    vendorId: 0x0609,
    productId: 0x0322
  },
  //SMK SF
  {
    vendorId: 0x1308,
    productId: 0xC001
  },
  //Shuttle BB
  {
    vendorId: 0x0768,
    productId: 0x0023
  },
  //Ricavision BB
  {
    vendorId: 0x0471,
    productId: 0x0608
  },
  //Philips SF
  {
    vendorId: 0x043E,
    productId: 0x9803
  },
  //LG BB
  {
    vendorId: 0x179D,
    productId: 0x0010
  },
  //Ricavision BB
  {
    vendorId: 0x179D,
    productId: 0x0020
  },
  //Ricavision SF
  {
    vendorId: 0x1784,
    productId: 0x0001
  },
  //Topseed BB
  {
    vendorId: 0x1784,
    productId: 0x0002
  },
  //Topseed SF
  {
    vendorId: 0x17B8,
    productId: 0x1100
  },
  //Trojan SF
  {
    vendorId: 0x17B8,
    productId: 0x044C
  },
  //Trojan SF
  {
    vendorId: 0x17B8,
    productId: 0x04B0
  },
  //Trojan BB
  {
    vendorId: 0x15B1,
    productId: 0x8090
  },
  //Mitac SF
  {
    vendorId: 0x147A,
    productId: 0xE015
  },
  //Formosa21 BB
  {
    vendorId: 0x147A,
    productId: 0xE016
  },
  //Formosa21 SF
  {
    vendorId: 0x051C,
    productId: 0xC001
  },
  //Shuttle BB
  {
    vendorId: 0x051C,
    productId: 0xC002
  },
  //Shuttle SF
  {
    vendorId: 0x0C16,
    productId: 0x0081
  },
  //Gyration BB
  {
    vendorId: 0x0C16,
    productId: 0x0080
  },
  //Gyration SF
  {
    vendorId: 0x413C,
    productId: 0x8123
  },
  //Dell BB
  {
    vendorId: 0x413C,
    productId: 0x8124
  },
  //Dell SF
  {
    vendorId: 0x0409,
    productId: 0x0066
  },
  //V1 Emulator
  {
    vendorId: 0x0471,
    productId: 0x060C
  },
  //V1 Emulator
  {
    vendorId: 0x0471,
    productId: 0x060D
  },
  //V1 Emulator
  {
    vendorId: 0x0471,
    productId: 0x060F
  },
  //V1 Emulator
  {
    vendorId: 0x04B4,
    productId: 0x4C67
  },
  //V1 Emulator
  {
    vendorId: 0x04EB,
    productId: 0xE002
  },
  //NorthStar Systems Corp. Emulator
  {
    vendorId: 0x04EB,
    productId: 0xE004
  },
  //Northstar Systems Corp. Emulator
  {
    vendorId: 0x0609,
    productId: 0x0334
  },
  //SMK RXX6000-0101F
  {
    vendorId: 0x0609,
    productId: 0x0338
  },
  //SMK RXX6000-0201F
  {
    vendorId: 0x0A48,
    productId: 0x3282
  },
  //V1 Emulator
  {
    vendorId: 0x0BDA,
    productId: 0x0161
  },
  //V1 Emulator
  {
    vendorId: 0x0BDA,
    productId: 0x0168
  },
  //V1 Emulator
  {
    vendorId: 0x147A,
    productId: 0xE017
  },
  //F21 snowflake emulator
  {
    vendorId: 0x147A,
    productId: 0xE018
  },
  //V1 Emulator
  {
    vendorId: 0x147A,
    productId: 0xE034
  },
  //V1 Emulator
  {
    vendorId: 0x147A,
    productId: 0xE037
  },
  //V1 Emulator
  {
    vendorId: 0x147A,
    productId: 0xE03A
  },
  //V1 Emulator
  {
    vendorId: 0x147A,
    productId: 0xE03C
  },
  //V1 Emulator
  {
    vendorId: 0x1784,
    productId: 0x0008
  },
  //V1 Emulator
  {
    vendorId: 0x1784,
    productId: 0x0006
  },
  //V1 Emulator
  {
    vendorId: 0x1934,
    productId: 0x0602
  },
  //V1 Emulator
  {
    vendorId: 0x1934,
    productId: 0x0702
  },
  //V1 Emulator
  {
    vendorId: 0x1B64,
    productId: 0x0138
  } //V1 Emulator
  ];

  //const _USAGE_PAGE_GEN_DESKTOP = 0x01;
  //const _USAGE_PAGE_CONSUMER = 0x0C;
  //const _USAGE_PAGE_VENDOR = 0xFFBC;

  // In _USAGE_PAGE_GEN_DESKTOP
  var _Standby = 0x82;

  // In _USAGE_PAGE_VENDOR
  var _GREEN_BUTTON = 0x0D;
  var _DVD_Angle = 0x4B;
  var _DVD_Audio = 0x4C;
  var _DVD_Menu = 0x24;
  var _DVD_Subtitle = 0x4D;
  var _My_Music = 0x47;
  var _My_Pictures = 0x49;
  var _My_TV = 0x46;
  var _My_Videos = 0x4A;
  var _OEM1 = 0x80;
  var _OEM2 = 0x81;
  var _Recorded_TV = 0x48;
  var _TV_Jump = 0x25;
  var _ASPECT_RATIO = 0x27;
  var _TELETEXT = 0x5A;
  var _TELETEXT_RED = 0x5B;
  var _TELETEXT_GREEN = 0x5C;
  var _TELETEXT_YELLOW = 0x5D;
  var _TELETEXT_BLUE = 0x5E;

  // In _USAGE_PAGE_CONSUMER
  var _Details = 0x09;
  var _Guide = 0x8D;
  var _CHANNEL_UP = 0x9C;
  var _CHANNEL_DOWN = 0x9D;
  var _PLAY = 0xB0;
  var _PAUSE = 0xB1;
  var _RECORD = 0xB2;
  var _FAST_FWD = 0xB3;
  var _FAST_REV = 0xB4;

  //const _SKIP_FWD = 0xB5;
  //const _SKIP_REV = 0xB6;

  // ReportID 1: Type: 0, Usage: 137 (0x89), Page 65468 (0xFFBC) - Count: 24 - Size 8
  // ReportID 2: Type: 0, Usage: 1 (0x01), Page 12 (0x0C)        - Count:  1 - Size 16
  // ReportID 3: Type: 0, Usage: 136 (0x88), Page 65468 (0xFFBC) - Count:  1 - Size 8

  function allowInput() {
    var doc = document;
    if (doc.visibilityState === 'hidden') {
      return false;
    }
    if (!doc.hasFocus()) {
      return false;
    }
    return true;
  }
  function handleConnectedDevice(e) {
    console.info('HID Device connected: ' + e.device.productName);
    hidInput.isConnected = true;
  }
  function handleDisconnectedDevice(e) {
    console.info('HID Device disconnected: ' + e.device.productName);
    hidInput.isConnected = false;
  }
  function handleInputReport(e) {
    //console.info('HID Device ' + e.device.productName + ': got input report ' + e.reportId);
    //console.info(new Uint8Array(e.data.buffer));

    if (!allowInput()) {
      return;
    }

    ////if (e.device.vendorId === _USB_VENDOR_ID_MS && e.device.productId === _USB_DEVICE_ID_EHOME_ID) {
    // Handle WMC Remote Control Input 

    if (e.reportId === 3 && e.data.byteLength > 0) {
      var buttonId = e.data.getUint8(0);
      switch (buttonId) {
        case _GREEN_BUTTON:
          _inputmanager.default.trigger('home');
          break;
        case _DVD_Angle:
          _inputmanager.default.trigger('togglefullscreen');
          break;
        case _DVD_Audio:
          _inputmanager.default.trigger('changeaudiotrack');
          break;
        case _DVD_Menu:
          _inputmanager.default.trigger('movies');
          break;
        case _DVD_Subtitle:
          _inputmanager.default.trigger('changesubtitletrack');
          break;
        case _My_Music:
          _inputmanager.default.trigger('music');
          break;
        case _My_Pictures:
          _inputmanager.default.trigger('pictures');
          break;
        case _My_TV:
          _inputmanager.default.trigger('livetv');
          break;
        case _My_Videos:
          _inputmanager.default.trigger('videos');
          break;
        case _OEM1:
        case _OEM2:
          _inputmanager.default.trigger('settings');
          break;
        case _Recorded_TV:
          _inputmanager.default.trigger('recordedtv');
          break;
        case _TV_Jump:
          _inputmanager.default.trigger('nowplaying');
          break;
        case _ASPECT_RATIO:
          _inputmanager.default.trigger('changezoom');
          break;
        case _TELETEXT:
          _inputmanager.default.trigger('changesubtitletrack');
          break;
        case _TELETEXT_RED:
          _inputmanager.default.trigger('red');
          break;
        case _TELETEXT_GREEN:
          _inputmanager.default.trigger('green');
          break;
        case _TELETEXT_YELLOW:
          _inputmanager.default.trigger('yellow');
          break;
        case _TELETEXT_BLUE:
          _inputmanager.default.trigger('blue');
          break;
        default:
      }
    }
    if (e.reportId === 2 && e.data.byteLength > 0) {
      var _buttonId = e.data.getUint8(0);
      switch (_buttonId) {
        case _Standby:
          _servicelocator.appHost.sleep();
          break;
        case _Details:
          _inputmanager.default.trigger('info');
          break;
        case _Guide:
          _inputmanager.default.trigger('guide');
          break;
        case _CHANNEL_UP:
          _inputmanager.default.trigger('channelup');
          break;
        case _CHANNEL_DOWN:
          _inputmanager.default.trigger('channeldown');
          break;
        case _PLAY:
          _inputmanager.default.trigger('play');
          break;
        case _PAUSE:
          _inputmanager.default.trigger('pause');
          break;
        case _RECORD:
          _inputmanager.default.trigger('record');
          break;
        case _FAST_FWD:
          _inputmanager.default.trigger('fastforward');
          break;
        case _FAST_REV:
          _inputmanager.default.trigger('rewind');
          break;
        //    case _SKIP_FWD:
        //        inputManager.trigger('next');
        //        break;
        //    case _SKIP_REV:
        //        inputManager.trigger('previous');
        //        break;
      }
    }
  }
  function shouldTryConnect() {
    return isSupported() && !hidInput.isConnected;
  }

  // Note: This can only be called from an event handling direct 
  //       user input (such as a button click). Otherwise it won't work.
  function tryConnect() {
    ////if (!isSupported() || hidInput.isConnected || hidInput.requestCount > 2) {
    if (!isSupported() || hidInput.isConnected) {
      return;
    }
    var currentDevices = navigator.hid.getDevices();
    if (currentDevices.length > 0) {
      //console.info('Existing devices:');
      //console.info(currentDevices);

      var currentDevice = currentDevices[0];
      if (currentDevice) {
        openDevice(currentDevice);
        return;
      }
    }
    navigator.hid.requestDevice({
      filters: _COMPATIBLE_PRODUCT_IDs
    }).then(function (devices) {
      //console.info('Devices:');
      //console.info(devices);

      if (devices.length === 0) {
        hidInput.requestCount++;
        return;
      }
      openDevice(devices[0]);
    });
  }
  function openDevice(device) {
    if (device.opened) {
      onDeviceOpened(device);
    } else {
      device.open().then(function () {
        return onDeviceOpened(device);
      });
    }
  }
  function onDeviceOpened(device) {
    hidInput.isConnected = true;
    console.info("Opened device: " + device.productName);
    device.addEventListener('inputreport', handleInputReport);
  }
  function isSupported() {
    return navigator && !!navigator.hid;
  }
  if (navigator && navigator.hid) {
    navigator.hid.addEventListener('connect', handleConnectedDevice);
    navigator.hid.addEventListener('disconnect', handleDisconnectedDevice);
  }
  hidInput.shouldTryConnect = shouldTryConnect;
  hidInput.tryConnect = tryConnect;
  hidInput.isSupported = isSupported;
  var _default = _exports.default = hidInput;
});
