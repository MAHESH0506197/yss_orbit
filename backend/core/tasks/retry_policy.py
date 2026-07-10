# yss_orbit\backend\core\tasks\retry_policy.py
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

@dataclass
class RetryPolicy:
    """Configuration for exponential backoff retry policies."""
    max_retries: int = 3
    countdown: int = 60  # Initial delay in seconds
    backoff_factor: float = 2.0
    jitter: bool = True
    
    def get_next_delay(self, current_attempt: int) -> int:
        """Calculates the delay for the next retry attempt using exponential backoff."""
        delay = self.countdown * (self.backoff_factor ** current_attempt)
        if self.jitter:
            import random
            # Add up to 20% jitter
            jitter_amount = delay * 0.2
            delay += random.uniform(-jitter_amount, jitter_amount)
        return int(delay)

def get_default_retry_policy() -> RetryPolicy:
    return RetryPolicy()
