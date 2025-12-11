
/*
 * This file is auto-generated from a NativeModule spec file in js.
 *
 * This is a C++ Spec class that should be used with MakeTurboModuleProvider to register native modules
 * in a way that also verifies at compile time that the native module matches the interface required
 * by the TurboModule JS spec.
 */
#pragma once
// clang-format off

// #include "NativeSerialportWindowsDataTypes.g.h" before this file to use the generated type definition
#include <NativeModules.h>
#include <tuple>

namespace ReactNativeSerialportWindowsCodegen {

inline winrt::Microsoft::ReactNative::FieldMap GetStructInfo(SerialportWindowsSpec_SerialPortData*) noexcept {
    winrt::Microsoft::ReactNative::FieldMap fieldMap {
        {L"com", &SerialportWindowsSpec_SerialPortData::com},
        {L"data", &SerialportWindowsSpec_SerialPortData::data},
    };
    return fieldMap;
}

struct SerialportWindowsSpec : winrt::Microsoft::ReactNative::TurboModuleSpec {
  static constexpr auto methods = std::tuple{
      Method<void(Promise<std::vector<std::string>>) noexcept>{0, L"listPorts"},
      Method<void(std::string, double, double, double, double, double, Promise<std::string>) noexcept>{1, L"openPort"},
      Method<void(std::string, Promise<std::string>) noexcept>{2, L"closePort"},
      Method<void(std::string, std::vector<double>, Promise<bool>) noexcept>{3, L"write"},
      EventEmitter<void(SerialportWindowsSpec_SerialPortData)>{4, L"onSerialPortDataReceived"},
  };

  template <class TModule>
  static constexpr void ValidateModule() noexcept {
    constexpr auto methodCheckResults = CheckMethods<TModule, SerialportWindowsSpec>();

    REACT_SHOW_METHOD_SPEC_ERRORS(
          0,
          "listPorts",
          "    REACT_METHOD(listPorts) void listPorts(::React::ReactPromise<std::vector<std::string>> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(listPorts) static void listPorts(::React::ReactPromise<std::vector<std::string>> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          1,
          "openPort",
          "    REACT_METHOD(openPort) void openPort(std::string portName, double baudRate, double dataBits, double stopBits, double parity, double flowControl, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(openPort) static void openPort(std::string portName, double baudRate, double dataBits, double stopBits, double parity, double flowControl, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          2,
          "closePort",
          "    REACT_METHOD(closePort) void closePort(std::string portName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(closePort) static void closePort(std::string portName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          3,
          "write",
          "    REACT_METHOD(write) void write(std::string portName, std::vector<double> const & data, ::React::ReactPromise<bool> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(write) static void write(std::string portName, std::vector<double> const & data, ::React::ReactPromise<bool> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_EVENTEMITTER_SPEC_ERRORS(
          4,
          "onSerialPortDataReceived",
          "    REACT_EVENT(onSerialPortDataReceived) std::function<void(SerialportWindowsSpec_SerialPortData)> onSerialPortDataReceived;\n");
  }
};

} // namespace ReactNativeSerialportWindowsCodegen
