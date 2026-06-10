// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  Button,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { listPorts } from 'react-native-serial-windows';
import { useSerialPort, SerialPortProvider } from './SerialPortProvider';

// ~2KB payload, roughly the size of a real label job. Big enough that a
// stalled printer pushes the write to the COMMTIMEOUTS ceiling
// (~200ms + 10ms/byte) — which must surface as `false`, not a UI freeze.
const makeLargePayload = (marker: string): string => {
  const line = `${marker} 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ the quick brown fox |`;
  let out = '';
  while (out.length < 2048) {
    out += line;
  }
  return out + '\n';
};

/**
 * Screen that lists all serial ports and allows connecting / disconnecting,
 * plus a write-test harness for the background-write native changes:
 *  - "JS alive" ticker: increments every 100ms; it freezing during a write
 *    means the JS thread is blocked (the bug this branch fixes).
 *  - Send 2KB: one large write, result + duration logged.
 *  - Burst x5: five concurrent writes to the same port; the per-port native
 *    mutex must serialize them with no interleaved bytes and all must
 *    resolve.
 *  - Send+Close: starts a large write and immediately closes the port —
 *    the close-vs-write race; must not crash, write resolves true/false.
 */
const SerialPortScreen: React.FC = () => {
  const { connectToPorts, send, close, receivedData, clearData } =
    useSerialPort();
  const [ports, setPorts] = useState<string[]>([]);
  const [connectingPort, setConnectingPort] = useState<string | null>(null);
  const [connectedPorts, setConnectedPorts] = useState<Set<string>>(new Set());

  // JS-thread liveness: if this stops counting while a write is in flight,
  // the write is blocking the JS thread.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const [writeLog, setWriteLog] = useState<string[]>([]);
  const seqRef = useRef(0);
  const logResult = (line: string) => {
    setWriteLog((prev) => [line, ...prev].slice(0, 20));
  };

  const timedSend = async (port: string, data: string, label: string) => {
    const seq = ++seqRef.current;
    const started = Date.now();
    try {
      const ok = await send(port, data);
      logResult(
        `#${seq} ${label} ${port} ${data.length}B -> ${ok ? 'ok' : 'FAILED'} in ${Date.now() - started}ms`
      );
      return ok;
    } catch (err) {
      logResult(
        `#${seq} ${label} ${port} ${data.length}B -> rejected (${err.message}) in ${Date.now() - started}ms`
      );
      return false;
    }
  };

  // COM1-COM6 are always shown so the harness works even when enumeration
  // comes up empty; listPorts results are merged in on top.
  const FIXED_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6'];
  useEffect(() => {
    setPorts(FIXED_PORTS);
    async function fetchPorts() {
      try {
        const available = await listPorts();
        setPorts((prev) => [...new Set([...prev, ...available])]);
      } catch (err) {
        console.error('Failed to list ports', err);
      }
    }
    fetchPorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (port: string) => {
    setConnectingPort(port);
    try {
      await connectToPorts([
        {
          portName: port,
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 0,
          flowControl: 0,
        },
      ]);
      setConnectedPorts((prev) => new Set(prev).add(port));
    } catch (err) {
      console.error(`Could not open ${port}`, err);
    } finally {
      setConnectingPort(null);
    }
  };

  const handleDisconnect = (port: string) => {
    close(port);
    setConnectedPorts((prev) => {
      const next = new Set(prev);
      next.delete(port);
      return next;
    });
    clearData(port);
  };

  // Five writes fired without awaiting in between: all land on the same
  // port's native mutex. Expect five successes and no garbled output on the
  // receiving end (each line keeps its BURSTn marker intact).
  const handleBurst = (port: string) => {
    for (let i = 1; i <= 5; i++) {
      timedSend(port, makeLargePayload(`BURST${i}`), 'burst');
    }
  };

  // Close-during-write race: the write hops to the background, then we close
  // immediately. shared_ptr + the port's io mutex must keep this safe — the
  // write finishes (or fails) cleanly, never a crash or dangling handle.
  const handleSendAndClose = (port: string) => {
    timedSend(port, makeLargePayload('SEND+CLOSE'), 'send+close');
    handleDisconnect(port);
    logResult(
      `#${++seqRef.current} close ${port} issued immediately after write`
    );
  };

  const handleConnectAll = async () => {
    for (const port of ports) {
      if (!connectedPorts.has(port)) {
        await handleConnect(port);
      }
    }
  };

  // Multi-port simultaneous write: one 2KB write to EVERY connected port,
  // fired in the same tick. With background writes these run in parallel —
  // expect near-identical durations instead of stacking sequentially, and
  // the JS ticker keeps counting throughout.
  const handleSendAll = () => {
    const targets = [...connectedPorts];
    if (targets.length === 0) {
      logResult('send-all: no connected ports');
      return;
    }
    logResult(
      `#${++seqRef.current} send-all -> ${targets.length} ports at once`
    );
    for (const port of targets) {
      timedSend(port, makeLargePayload(`ALL-${port}`), 'send-all');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Available Serial Ports</Text>
      <Text style={styles.tick}>
        JS alive: {tick} (freezes = JS thread blocked)
      </Text>

      <View style={styles.testRow}>
        <Button title="Connect All" onPress={handleConnectAll} />
        <Button title="Send 2KB to ALL ports" onPress={handleSendAll} />
      </View>

      <FlatList
        data={ports}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isConnected = connectedPorts.has(item);
          const lastData = receivedData[item] || '';

          return (
            <View style={styles.portBlock}>
              <View style={styles.portRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.portName}>{item}</Text>
                  {lastData !== '' && (
                    <Text style={styles.dataText}>
                      Last received: {lastData}
                    </Text>
                  )}
                </View>

                {isConnected ? (
                  <Button
                    title="Disconnect"
                    onPress={() => handleDisconnect(item)}
                  />
                ) : (
                  <View style={{ minWidth: 100 }}>
                    {connectingPort === item ? (
                      <ActivityIndicator />
                    ) : (
                      <Button
                        title="Connect"
                        onPress={() => handleConnect(item)}
                      />
                    )}
                  </View>
                )}
              </View>

              {isConnected && (
                <View style={styles.testRow}>
                  <Button
                    title="Send Test"
                    onPress={() => timedSend(item, 'Hello world\n', 'test')}
                  />
                  <Button
                    title="Send 2KB"
                    onPress={() =>
                      timedSend(item, makeLargePayload('LARGE'), '2KB')
                    }
                  />
                  <Button title="Burst x5" onPress={() => handleBurst(item)} />
                  <Button
                    title="Send+Close"
                    onPress={() => handleSendAndClose(item)}
                  />
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ marginTop: 20 }}>No serial ports found</Text>
        }
      />

      <Text style={styles.logTitle}>Write log</Text>
      <FlatList
        style={styles.log}
        data={writeLog}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Text style={styles.logLine}>{item}</Text>}
        ListEmptyComponent={<Text style={styles.logLine}>No writes yet</Text>}
      />
    </SafeAreaView>
  );
};

/**
 * Root App: wraps the SerialPortScreen with the SerialPortProvider.
 */
const App: React.FC = () => {
  return (
    <SerialPortProvider>
      <SerialPortScreen />
    </SerialPortProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tick: {
    fontSize: 13,
    color: '#0a7',
    marginBottom: 10,
  },
  portBlock: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  portRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  portName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataText: {
    fontSize: 14,
    color: '#333',
  },
  log: {
    maxHeight: 200,
    marginTop: 4,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  logLine: {
    fontSize: 12,
    fontFamily: 'Consolas',
    color: '#333',
  },
});
