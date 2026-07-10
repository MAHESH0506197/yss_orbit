# yss_orbit\backend\core\events\outbox_worker.py
import asyncio
import logging
from .outbox_processor import OutboxProcessor

logger = logging.getLogger(__name__)

async def start_outbox_worker(processor: OutboxProcessor, interval_seconds: int = 5):
    """
    Background task to continuously poll the outbox table and publish events.
    """
    logger.info("Starting Outbox Worker...")
    while True:
        try:
            processed = await processor.process_pending_events()
            if processed > 0:
                logger.info(f"Outbox Worker processed {processed} events.")
        except asyncio.CancelledError:
            logger.info("Outbox Worker cancelled. Shutting down.")
            break
        except Exception as e:
            logger.error(f"Error in Outbox Worker: {e}", exc_info=True)
            
        await asyncio.sleep(interval_seconds)
