"use strict";

import { NativeEventEmitter } from 'react-native';
import SerialportWindows from "./NativeSerialportWindows.js";
export const eventEmitter = new NativeEventEmitter(SerialportWindows);
export function listPorts() {
  return SerialportWindows.listPorts();
}
export function openPort(portName, baudRate, dataBits, stopBits, parity, flowControl,
// Defaults preserve pre-1.1.0 behavior (RTS/DTR asserted, nulls kept) so
// existing callers are unaffected until they pass explicit config.
rtsEnable = true, dtrEnable = true, discardNull = false) {
  return SerialportWindows.openPort(portName, baudRate, dataBits, stopBits, parity, flowControl, rtsEnable, dtrEnable, discardNull);
}
export function closePort(portName) {
  return SerialportWindows.closePort(portName); // <-- updated
}
export function write(portName, data) {
  return SerialportWindows.write(portName, data); // <-- updated
}
//# sourceMappingURL=index.js.map