import os
import sys
import platform
import pytest

CAN_MODULE = None
try:
    import can_emulator as CAN_MODULE  # noqa: F401
except Exception:
    CAN_MODULE = None


@pytest.mark.skipif(platform.system().lower() != "linux" or CAN_MODULE is None, reason="CAN emulator only supported on Linux with compiled module")
def test_can_emulator_import_and_init():
    # Basic import/init test; deeper integration requires a bound interface and is verified in integration runs
    emulator = CAN_MODULE.CanEmulator("vcan0")
    assert emulator is not None
