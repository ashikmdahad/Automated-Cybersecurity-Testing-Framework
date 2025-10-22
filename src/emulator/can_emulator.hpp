#pragma once
#include <string>
#include <linux/can.h>

class CanEmulator {
public:
    CanEmulator(const std::string& interface);
    ~CanEmulator();
    bool sendFrame(uint32_t can_id, const char* data, size_t length);
    bool receiveFrame(can_frame& frame);
private:
    int socket_;
    std::string interface_;
};
