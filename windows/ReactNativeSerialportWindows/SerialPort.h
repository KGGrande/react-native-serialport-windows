#pragma once
#include "pch.h"
#include <string>
#include <Windows.h>
#include <functional>
#include <thread>
#include <atomic>
#include <mutex>

class SerialPort {
public:
    enum class DataBits { Five = 5, Six = 6, Seven = 7, Eight = 8 };
    enum class StopBits { One = 1, OnePointFive = 0, Two = 2 };
    enum class Parity { None = 0, Odd = 1, Even = 2 };
    enum class FlowControl { None = 0, Software = 1, Hardware = 2, HardwareSoftware = 3 };

    using DataReceivedCallback = std::function<void(const std::vector<uint8_t>&)>;

    SerialPort(const std::string& portName);
    ~SerialPort();

    // rtsEnable/dtrEnable set the idle line levels (RTS_/DTR_CONTROL_ENABLE vs
    // DISABLE); when flow control is Hardware or HardwareSoftware, RTS is
    // driven by the driver (RTS_CONTROL_HANDSHAKE) and rtsEnable is ignored.
    // discardNull maps to DCB fNull (drop received null bytes).
    bool open(int baudRate, DataBits dataBits, StopBits stopBits,
             Parity parity, FlowControl flowControl,
             bool rtsEnable, bool dtrEnable, bool discardNull);
    void close();
    bool write(const std::vector<uint8_t>& data);
    void setDataReceivedCallback(DataReceivedCallback callback);
    bool isOpen() const { return m_handle != INVALID_HANDLE_VALUE; }

private:
    void startReading();
    void readThread();
    void stopReading();

    std::string m_portName;
    HANDLE m_handle;
    // Serializes write() against close() and against concurrent writes to the
    // same port: prevents byte-level interleaving (corrupted output) when two
    // callers write to one port, and guarantees an in-flight write finishes
    // before close() destroys the handle. It does NOT promise FIFO ordering of
    // writes — per-port ordering is guaranteed by the JS-side
    // dispatchQueuedJobs grouping, which is load-bearing for label integrity.
    std::mutex m_ioMutex;
    std::atomic<bool> m_isRunning;
    std::thread m_readThread;
    DataReceivedCallback m_dataCallback;
    bool m_isReading;
};