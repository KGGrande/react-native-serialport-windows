import { NativeEventEmitter } from 'react-native';
import SerialportWindows from './NativeSerialportWindows';

export const eventEmitter = new NativeEventEmitter(SerialportWindows);

export function listPorts(): Promise<string[]> {
  return SerialportWindows.listPorts();
}

export function openPort(
  portName: string,
  baudRate: number,
  dataBits: number,
  stopBits: number,
  parity: number,
  flowControl: number,
  // Defaults preserve pre-1.1.0 behavior (RTS/DTR asserted, nulls kept) so
  // existing callers are unaffected until they pass explicit config.
  rtsEnable: boolean = true,
  dtrEnable: boolean = true,
  discardNull: boolean = false
): Promise<string> {
  return SerialportWindows.openPort(
    portName,
    baudRate,
    dataBits,
    stopBits,
    parity,
    flowControl,
    rtsEnable,
    dtrEnable,
    discardNull
  );
}

export function closePort(portName: string): Promise<string> {
  return SerialportWindows.closePort(portName); // <-- updated
}

export function write(portName: string, data: number[]): Promise<boolean> {
  return SerialportWindows.write(portName, data); // <-- updated
}
