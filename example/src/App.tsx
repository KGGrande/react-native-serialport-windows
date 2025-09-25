// @ts-nocheck
import React, { useEffect, useState } from 'react';
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

/**
 * Screen that lists all serial ports and allows connecting / disconnecting.
 */
const SerialPortScreen: React.FC = () => {
  const { connectToPorts, send, close, receivedData, clearData } =
    useSerialPort();
  const [ports, setPorts] = useState<string[]>([]);
  const [connectingPort, setConnectingPort] = useState<string | null>(null);
  const [connectedPorts, setConnectedPorts] = useState<Set<string>>(new Set());

  // Load available ports on mount
  useEffect(() => {
    async function fetchPorts() {
      try {
        const available = await listPorts();
        setPorts(available);
      } catch (err) {
        console.error('Failed to list ports', err);
      }
    }
    fetchPorts();
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Available Serial Ports</Text>

      <FlatList
        data={ports}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isConnected = connectedPorts.has(item);
          const lastData = receivedData[item] || '';

          return (
            <View style={styles.portRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.portName}>{item}</Text>
                {lastData !== '' && (
                  <Text style={styles.dataText}>Last received: {lastData}</Text>
                )}
              </View>

              {isConnected ? (
                <>
                  <Button
                    title="Disconnect"
                    onPress={() => handleDisconnect(item)}
                  />
                  <Button
                    title="Send Test"
                    onPress={() => send(item, 'Hello world\n')}
                  />
                </>
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
          );
        }}
        ListEmptyComponent={
          <Text style={{ marginTop: 20 }}>No serial ports found</Text>
        }
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
    marginBottom: 10,
  },
  portRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  portName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataText: {
    fontSize: 14,
    color: '#333',
  },
});
