from typing import List, Dict, Any
from .rules import apply_all


class DetectionEngine:
    def __init__(self, config: Dict[str, Any] | None = None):
        self.config = config or {}

    def analyze(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return apply_all(events, config=self.config)
