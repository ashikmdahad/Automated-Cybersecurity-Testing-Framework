from collections import Counter
from typing import List, Dict, Any, Tuple, Optional


def _extract_can_fields(event: Dict[str, Any]) -> Tuple[int, str]:
    """Best-effort parse to get CAN ID and data hex from various event payloads.
    Returns (can_id, data_hex) where can_id = -1 if unknown.
    """
    # Structured fields first
    can_id = event.get("can_id")
    data_hex = event.get("data_hex") or event.get("data")

    if can_id is not None:
        try:
            return int(can_id), (data_hex or "")
        except Exception:
            pass

    # Try to parse from string form like "CAN(id=0x123, data=01020304..."
    pkt_str = event.get("packet") or event.get("details") or ""
    if "CAN(" in pkt_str and "id=" in pkt_str:
        try:
            # Extract hex id after id=
            seg = pkt_str.split("id=")[1]
            # Allow formats 0x123) or 0x123,
            hex_part = seg.split(")")[0].split(",")[0].strip()
            if hex_part.startswith("0x"):
                can_id = int(hex_part, 16)
            else:
                can_id = int(hex_part)
        except Exception:
            can_id = -1
        try:
            if "data=" in pkt_str:
                dseg = pkt_str.split("data=")[1]
                data_hex = dseg.split(",")[0].split(")")[0].strip()
            else:
                data_hex = ""
        except Exception:
            data_hex = ""
        return can_id if can_id is not None else -1, data_hex or ""

    return -1, data_hex or ""


def rule_unexpected_id(events: List[Dict[str, Any]], whitelist=None, blacklist=None) -> List[Dict[str, Any]]:
    whitelist = set(whitelist or [0x123, 0x456])
    blacklist = set(blacklist or [0x7DF, 0x6F1])
    findings = []
    for ev in events:
        if ev.get("type") != "sniff":
            continue
        can_id, _ = _extract_can_fields(ev)
        if can_id == -1:
            continue
        if can_id in blacklist:
            findings.append({
                "rule_id": "UNEXPECTED_ID_BLACKLIST",
                "title": "Blacklisted CAN ID observed",
                "severity": "high",
                "affected_id": hex(can_id),
                "description": f"Observed blacklisted CAN ID {hex(can_id)}",
                "evidence": ev,
            })
        elif can_id not in whitelist:
            findings.append({
                "rule_id": "UNEXPECTED_ID",
                "title": "Unexpected CAN ID",
                "severity": "medium",
                "affected_id": hex(can_id),
                "description": f"Observed unexpected CAN ID {hex(can_id)} not in whitelist",
                "evidence": ev,
            })
    return findings


def rule_injection_possible(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    findings = []
    for ev in events:
        if ev.get("type") == "inject" and (ev.get("status") == "success"):
            can_id, _ = _extract_can_fields(ev)
            findings.append({
                "rule_id": "INJECTION_POSSIBLE",
                "title": "CAN frame injection succeeded",
                "severity": "high",
                "affected_id": hex(can_id) if can_id != -1 else None,
                "description": "Injection of a crafted CAN frame succeeded; review network filtering and security gateway policies.",
                "evidence": ev,
            })
    return findings


def rule_rate_anomaly(events: List[Dict[str, Any]], threshold: int = 50) -> List[Dict[str, Any]]:
    ids = []
    for ev in events:
        if ev.get("type") != "sniff":
            continue
        can_id, _ = _extract_can_fields(ev)
        if can_id != -1:
            ids.append(can_id)
    counts = Counter(ids)
    findings = []
    for can_id, cnt in counts.items():
        if cnt >= threshold:
            findings.append({
                "rule_id": "RATE_ANOMALY",
                "title": "High packet rate for CAN ID",
                "severity": "medium",
                "affected_id": hex(can_id),
                "count": cnt,
                "description": f"Observed {cnt} frames for CAN ID {hex(can_id)} in a short interval (>= {threshold}).",
            })
    return findings


def apply_all(events: List[Dict[str, Any]], config: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    cfg = config or {}
    wl = cfg.get("whitelist")
    bl = cfg.get("blacklist")
    thr = cfg.get("rate_threshold", 50)
    # Normalize whitelist/blacklist entries that might be strings (e.g., "0x123")
    def _norm_list(xs):
        if not xs:
            return None
        out = []
        for v in xs:
            try:
                if isinstance(v, str):
                    out.append(int(v, 16) if v.lower().startswith("0x") else int(v))
                else:
                    out.append(int(v))
            except Exception:
                continue
        return out
    wl = _norm_list(wl)
    bl = _norm_list(bl)

    # Run rules with config
    try:
        findings.extend(rule_unexpected_id(events, whitelist=wl, blacklist=bl))
    except Exception:
        pass
    try:
        findings.extend(rule_injection_possible(events))
    except Exception:
        pass
    try:
        findings.extend(rule_rate_anomaly(events, threshold=int(thr)))
    except Exception:
        pass
    return findings
