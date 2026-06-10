#pragma once

#include "pch.h"
#include "resource.h"
#include "SerialPort.h"

#if __has_include("codegen/NativeSerialportWindowsDataTypes.g.h")
#include "codegen/NativeSerialportWindowsDataTypes.g.h"
#endif
#include "codegen/NativeSerialportWindowsSpec.g.h"

#include "NativeModules.h"
#include <unordered_map>
#include <memory>
#include <mutex>

namespace winrt::ReactNativeSerialportWindows
{

    REACT_MODULE(ReactNativeSerialportWindows)
        struct ReactNativeSerialportWindows
    {
        using ModuleSpec = ReactNativeSerialportWindowsCodegen::SerialportWindowsSpec;

        REACT_INIT(Initialize)
            void Initialize(React::ReactContext const& reactContext) noexcept;

        REACT_METHOD(listPorts)
            void listPorts(React::ReactPromise<std::vector<std::string>> promise) noexcept;

        REACT_METHOD(openPort)
            void openPort(std::string portName, double baudRate, double dataBits,
                double stopBits, double parity, double flowControl,
                React::ReactPromise<std::string>&& promise) noexcept;

        REACT_METHOD(closePort)
            void closePort(std::string portName, React::ReactPromise<std::string>&& promise) noexcept;

        // Coroutine: resolves the port on the JS thread, then hops to the
        // thread pool for the (potentially slow, synchronous) WriteFile so a
        // stalled printer can't block the JS thread. Parameters are taken by
        // value — required, since the coroutine outlives the caller's frame.
        REACT_METHOD(write)
            winrt::fire_and_forget write(std::string portName, std::vector<double> data, React::ReactPromise<bool> promise) noexcept;

        REACT_METHOD(addListener)
            void addListener(std::string eventType) noexcept;

        REACT_METHOD(removeListeners)
            void removeListeners(double count) noexcept;

        void OnDataReceived(const std::string& portName, const std::vector<uint8_t>& data);

    private:
        React::ReactContext m_context;
        // shared_ptr (not unique_ptr): write() copies the entry out under
        // m_portsMutex before hopping off the JS thread, so closePort erasing
        // the map entry can't dangle the pointer mid-write. The per-port
        // m_ioMutex inside SerialPort covers close-vs-write races.
        std::unordered_map<std::string, std::shared_ptr<SerialPort>> m_serialPorts;
        std::mutex m_portsMutex;
    };

} // namespace winrt::ReactNativeSerialportWindows
