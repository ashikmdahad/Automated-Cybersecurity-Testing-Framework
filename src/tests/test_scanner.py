import os
import sys
import pytest

# Ensure 'src' is importable when running pytest from repo root
CURRENT_DIR = os.path.dirname(__file__)
SRC_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from scanner.scanner import VulnerabilityScanner

@pytest.fixture
def scanner():
    return VulnerabilityScanner(interface="vcan0")

def test_vulnerability_scan(scanner):
    results = scanner.run_scan()
    # We should always get at least one result entry thanks to fallbacks
    assert len(results) > 0
    assert any(r["type"] == "sniff" for r in results)
    assert any(r["type"] == "inject" for r in results)
