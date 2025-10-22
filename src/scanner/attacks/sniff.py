import scapy.all as scapy

def sniff_can_packets(interface, count=10, timeout=3):
    try:
        packets = scapy.sniff(iface=interface, filter="can", count=count, timeout=timeout)
        results = [{"type": "sniff", "status": "detected", "packet": str(pkt)} for pkt in packets]
        # If no packets captured, still return a diagnostic entry so callers don’t hang on empty
        if not results:
            return [{"type": "sniff", "status": "no_traffic", "details": f"No CAN traffic observed on {interface}"}]
        return results
    except Exception as e:
        # Graceful fallback for environments without CAN/scapy capabilities
        return [{"type": "sniff", "status": "failed", "error": str(e)}]
