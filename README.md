# [react-native-serialport-windows](https://github.com/KGGrande/react-native-serialport-windows)

Serial communication for React Native Windows apps.

This repo publishes to npm as [`react-native-serial-windows`](https://www.npmjs.com/package/react-native-serial-windows).

## Installation

```sh
npm install react-native-serial-windows
```

```ts
import {
  listPorts,
  openPort,
  closePort,
  write,
  subscribeSerialPortData,
} from 'react-native-serial-windows';
```

## Usage

### List available ports

```ts
const availablePorts = await listPorts(); // e.g. ["COM3", "COM4"]
```

### Open a port

```ts
await openPort('COM3', 9600, 8, 1, 0, 0);
// Parameters: portName, baudRate, dataBits, stopBits, parity, flowControl
```

### Write data

`write` takes the target port name and an array of bytes (`number[]`).

```ts
await write('COM3', [0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
```

To send a string, use `TextEncoder`:

```ts
const bytes = Array.from(new TextEncoder().encode('Hello world\n'));
await write('COM3', bytes);
```

### Receive data

Subscribe to incoming bytes via `subscribeSerialPortData`. The callback receives:

- `port`: the port name (e.g. `"COM3"`)
- `data`: an array of byte values (`number[]`)

```ts
useEffect(() => {
  const sub = subscribeSerialPortData(({ port, data }) => {
    console.log('Received from', port, data);
  });
  return () => sub.remove();
}, []);
```

### Close the port

```ts
await closePort('COM3');
```

## Example app

```sh
git clone https://github.com/KGGrande/react-native-serialport-windows.git
cd react-native-serialport-windows
yarn
cd example
yarn windows
```

![react-native-serialport-windows](https://github.com/user-attachments/assets/f5349528-211a-4d91-88d6-725ac754725f)

## Contributing

```sh
git checkout -b my-feature-branch

git add .
git commit -m "feat: New feature description"

git push origin my-feature-branch
```

and create a PR!

## License

MIT
