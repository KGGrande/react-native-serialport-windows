"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closePort = closePort;
exports.eventEmitter = void 0;
exports.listPorts = listPorts;
exports.openPort = openPort;
exports.write = write;
var _reactNative = require("react-native");
var _NativeSerialportWindows = _interopRequireDefault(require("./NativeSerialportWindows.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const eventEmitter = exports.eventEmitter = new _reactNative.NativeEventEmitter(_NativeSerialportWindows.default);
function listPorts() {
  return _NativeSerialportWindows.default.listPorts();
}
function openPort(portName, baudRate, dataBits, stopBits, parity, flowControl,
// Defaults preserve pre-1.1.0 behavior (RTS/DTR asserted, nulls kept) so
// existing callers are unaffected until they pass explicit config.
rtsEnable = true, dtrEnable = true, discardNull = false) {
  return _NativeSerialportWindows.default.openPort(portName, baudRate, dataBits, stopBits, parity, flowControl, rtsEnable, dtrEnable, discardNull);
}
function closePort(portName) {
  return _NativeSerialportWindows.default.closePort(portName); // <-- updated
}
function write(portName, data) {
  return _NativeSerialportWindows.default.write(portName, data); // <-- updated
}
//# sourceMappingURL=index.js.map