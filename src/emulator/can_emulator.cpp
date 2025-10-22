#include "can_emulator.hpp"
#include <linux/can/raw.h>
#include <sys/socket.h>
#include <unistd.h>
#include <stdexcept>
#include <pybind11/pybind11.h>

CanEmulator::CanEmulator(const std::string& interface) : interface_(interface) {
    socket_ = socket(PF_CAN, SOCK_RAW, CAN_RAW);
    if (socket_ < 0) throw std::runtime_error("Failed to create CAN socket");
    // Bind logic omitted for brevity
}

CanEmulator::~CanEmulator() {
    close(socket_);
}

bool CanEmulator::sendFrame(uint32_t can_id, const char* data, size_t length) {
    struct can_frame frame = {};
    frame.can_id = can_id;
    frame.can_dlc = length;
    memcpy(frame.data, data, length);
    return write(socket_, &frame, sizeof(frame)) == sizeof(frame);
}

bool CanEmulator::receiveFrame(can_frame& frame) {
    return read(socket_, &frame, sizeof(frame)) == sizeof(frame);
}

namespace py = pybind11;
PYBIND11_MODULE(can_emulator, m) {
    py::class_<CanEmulator>(m, "CanEmulator")
        .def(py::init<const std::string&>())
        .def("send_frame", &CanEmulator::sendFrame)
        .def("receive_frame", &CanEmulator::receiveFrame);
}
