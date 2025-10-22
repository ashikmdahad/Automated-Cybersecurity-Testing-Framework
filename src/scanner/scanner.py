import scapy.all as scapy
from .attacks.sniff import sniff_can_packets
from .attacks.inject import inject_can_packet

class VulnerabilityScanner:
    def __init__(self, interface="vcan0"):
        self.interface = interface
        self.results = []

    def run_scan(self):
        print(f"Starting scan on {self.interface}...")
        self.results.extend(sniff_can_packets(self.interface))
        self.results.extend(inject_can_packet(self.interface))
        return self.results

    def get_results(self):
        return self.results
