cmake_minimum_required(VERSION 3.14)
project(can_emulator)

# Try to find a system-wide pybind11
find_package(pybind11 CONFIG QUIET)

if (pybind11_FOUND)
    message(STATUS "Found pybind11: ${pybind11_DIR}")
    pybind11_add_module(can_emulator src/emulator/can_emulator.cpp)
else()
    message(WARNING "pybind11 not found; skipping can_emulator build. Install pybind11 with CMake config to enable.")
    add_custom_target(can_emulator ALL
        COMMAND ${CMAKE_COMMAND} -E echo "pybind11 not found; skipping can_emulator build"
    )
endif()
