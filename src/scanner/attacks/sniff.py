import scapy.all as scapy


def sniff_can_packets(interface, count=10, timeout=3):
    try:
        packets = scapy.sniff(iface=interface, filter="can", count=count, timeout=timeout)
        results = []
        for pkt in packets:
            entry = {"type": "sniff", "status": "detected", "packet": str(pkt)}
            # Try to enrich with CAN fields if present
            try:
                CAN = getattr(scapy, "CAN", None)
                if CAN is not None and pkt.haslayer(CAN):
                    layer = pkt[CAN]
                    entry.update({
                        "can_id": int(layer.identifier),
                        "dlc": int(layer.length) if hasattr(layer, "length") else None,
                        "data_hex": getattr(layer, "data", b"").hex() if hasattr(layer, "data") else None,
                        "timestamp": getattr(pkt, "time", None),
                    })
            except Exception:
                pass
            results.append(entry)
        if not results:
            return [{"type": "sniff", "status": "no_traffic", "details": f"No CAN traffic observed on {interface}"}]
        return results
    except Exception as e:
        return [{"type": "sniff", "status": "failed", "error": str(e)}]
