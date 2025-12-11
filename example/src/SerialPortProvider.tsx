// @ts-nocheck
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef, // added
  useMemo,
} from 'react';
import { openPort, closePort, write } from 'react-native-serial-windows';
import NativeSerialportWindows from '../../src/NativeSerialportWindows';
type SerialPortConfig = {
  portName: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: number;
  flowControl: number;
};

type SerialPortContextType = {
  close: (portname: string) => void;
  send: (portName: string, data: string) => void;
  clearData: (portName?: string) => void;
  connectToPorts: (configs: SerialPortConfig[]) => void;
  receivedData: Record<string, string>;
  dataTimestamp: Record<string, number>; // per-port timestamps
};

const SerialPortContext = createContext<SerialPortContextType | undefined>(
  undefined
);

type ProviderProps = {
  children: ReactNode;
};

export const SerialPortProvider: React.FC<ProviderProps> = ({ children }) => {
  const [receivedData, setReceivedData] = useState<Record<string, string>>({});
  const [dataTimestamp, setDataTimestamp] = useState<Record<string, number>>(
    {}
  );

  const buffersRef = useRef<Record<string, string>>({}); // per-port accumulation buffers

  // Helper to normalize port keys (e.g., '\\\\.\\COM3' -> 'COM3')
  const normalizePort = (p: string): string => {
    if (!p) {
      return p;
    }
    const up = p.toUpperCase();
    const idx = up.indexOf('COM');
    return idx >= 0 ? up.slice(idx) : up;
  };

  // const receivedDataRef = useRef<string>('');

  useEffect(() => {
    console.log('SerialportWindows TurboModule:', NativeSerialportWindows);
    const subscription = NativeSerialportWindows.onSerialPortDataReceived?.(
      ({ port, data }) => {
        const key = normalizePort(port);
        console.log(data);
        if (!buffersRef.current[key]) {
          buffersRef.current[key] = '';
        }

        for (let i = 0; i < data.length; i++) {
          const byte = data[i];
          const char = String.fromCharCode(byte);

          // Treat 10 (LF), 13 (CR), and 12 (FF) as terminators
          if (byte !== 10 && byte !== 13 && byte !== 12) {
            if (byte >= 32) {
              buffersRef.current[key] += char;
            }
          } else {
            const finalMsg = buffersRef.current[key] || '';
            setReceivedData((prev) => ({ ...prev, [key]: finalMsg }));
            setDataTimestamp((prev) => ({ ...prev, [key]: Date.now() }));
            buffersRef.current[key] = '';
          }
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const connectToPorts = useCallback(async (configs: SerialPortConfig[]) => {
    for (const config of configs) {
      const { portName, baudRate, dataBits, stopBits, parity, flowControl } =
        config;
      try {
        await openPort(
          portName,
          baudRate,
          dataBits,
          stopBits,
          parity,
          flowControl
        );
        console.info(`Connected to ${portName}`);
      } catch (err: any) {
        console.error(`Failed to connect to ${portName}:`, err);
        console.error(`Failed to connect to ${portName}`, err.message);
      }
    }
  }, []); // stable

  const close = useCallback((portName: string) => {
    closePort(portName)
      .then(() => console.info(`Port ${portName} closed`))
      .catch((err) =>
        console.error(`Failed to close ${portName}${err.message}`)
      );
  }, []); // stable

  const send = useCallback((portName: string, data: string) => {
    const encoder = new TextEncoder();
    const byteArray = Array.from(encoder.encode(data));
    write(portName, byteArray)
      .then(() => console.info(`Sent to ${portName}:`, data))
      .catch((err) =>
        console.error(`Failed to send to ${portName} ${err.message}`)
      );
  }, []); // stable

  const clearData = useCallback((portName?: string) => {
    if (portName) {
      setReceivedData((prev) => {
        const copy = { ...prev };
        delete copy[portName];
        return copy;
      });
      setDataTimestamp((prev) => {
        const copy = { ...prev };
        delete copy[portName];
        return copy;
      });
      return;
    }

    setReceivedData({});
    setDataTimestamp({});
  }, []); // stable

  const contextValue = useMemo<SerialPortContextType>(() => {
    return {
      close,
      send,
      clearData,
      connectToPorts,
      receivedData,
      dataTimestamp,
    };
  }, [close, send, clearData, connectToPorts, receivedData, dataTimestamp]);

  return (
    <SerialPortContext.Provider value={contextValue}>
      {children}
    </SerialPortContext.Provider>
  );
};

export const useSerialPort = () => {
  const context = useContext(SerialPortContext);
  if (!context) {
    throw new Error('useSerialPort must be used within a SerialPortProvider');
  }
  return context;
};
