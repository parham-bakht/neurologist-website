import asyncio
import logging

from app.database import SessionLocal
from app.services.article_service import publish_due_articles


logger = logging.getLogger(__name__)


async def run_publication_scheduler(stop: asyncio.Event, interval_seconds: int = 30) -> None:
    """Publish due articles periodically while the API process is running."""
    while not stop.is_set():
        try:
            async with SessionLocal() as db:
                await publish_due_articles(db)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Scheduled article publication failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=interval_seconds)
        except TimeoutError:
            continue
