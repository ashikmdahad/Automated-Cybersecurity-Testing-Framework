#!/bin/sh
set -e

# Setup virtual CAN if not already present
if ! ip link show vcan0 >/dev/null 2>&1; then
  modprobe vcan || true
  ip link add dev vcan0 type vcan || true
  ip link set up vcan0 || true
fi

# Optionally generate traffic for demos/tests
if [ "${ENABLE_TRAFFIC}" = "1" ]; then
  # cangen sends random CAN frames; run in background
  (cangen vcan0 >/dev/null 2>&1 &) || true
fi

exec uvicorn main:app --host 0.0.0.0 --port 8000
