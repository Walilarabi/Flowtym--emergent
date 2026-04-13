"""
Flowtym PMS — Background Cron Scheduler
Runs payment automation and maintenance tasks periodically.
"""
import asyncio
import logging
import threading
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

_cron_running = False
_cron_thread = None

CRON_INTERVAL_SECONDS = 900  # 15 minutes


async def _run_payment_cron():
    """Execute the payment automation cron job"""
    try:
        from routes.payment_automation import process_cron
        result = await process_cron()
        if result.get("processed", 0) > 0 or result.get("errors"):
            logger.info(f"[CRON] Payment automation: {result}")
        return result
    except Exception as e:
        logger.error(f"[CRON] Payment automation error: {e}")
        return {"error": str(e)}


def _cron_loop():
    """Background thread running the async cron loop"""
    global _cron_running
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    logger.info(f"[CRON] Started — interval={CRON_INTERVAL_SECONDS}s")

    while _cron_running:
        try:
            loop.run_until_complete(_run_payment_cron())
        except Exception as e:
            logger.error(f"[CRON] Loop error: {e}")

        # Sleep in small chunks so we can stop quickly
        for _ in range(CRON_INTERVAL_SECONDS):
            if not _cron_running:
                break
            import time
            time.sleep(1)

    loop.close()
    logger.info("[CRON] Stopped")


def start_cron():
    """Start the background cron scheduler"""
    global _cron_running, _cron_thread
    if _cron_running:
        return

    _cron_running = True
    _cron_thread = threading.Thread(target=_cron_loop, daemon=True, name="flowtym-cron")
    _cron_thread.start()
    logger.info("[CRON] Background scheduler started")


def stop_cron():
    """Stop the background cron scheduler"""
    global _cron_running
    _cron_running = False
    logger.info("[CRON] Stopping...")
