import scapy.all as scapy

def inject_can_packet(interface):
    try:
        # Some environments may not have CAN layers; construct defensively
        CAN = getattr(scapy, "CAN", None)
        if CAN is None:
            raise RuntimeError("Scapy CAN layer not available")
        packet = CAN(identifier=0x123, data=b"\x01\x02\x03\x04")
        scapy.sendp(packet, iface=interface, verbose=False)
        return [{"type": "inject", "status": "success", "packet": str(packet)}]
    except Exception as e:
        return [{"type": "inject", "status": "failed", "error": str(e)}]
