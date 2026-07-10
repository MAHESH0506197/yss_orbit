# yss_orbit\backend\core\testing\mock_event_bus.py
"""
Mock event bus for testing.
"""
class MockEventBus:
    def __init__(self):
        self.published_events = []
        
    def publish(self, event):
        self.published_events.append(event)
        
    def clear(self):
        self.published_events.clear()
        
    @property
    def event_count(self) -> int:
        return len(self.published_events)
