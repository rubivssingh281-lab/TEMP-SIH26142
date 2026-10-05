import threading
import queue
import time
import logging

logger = logging.getLogger(__name__)

job_queue = queue.Queue()
_worker_thread = None
_stop_event = threading.Event()

def _worker_loop():
    logger.info("Worker thread started.")
    # Import inside to avoid circular imports during app initialization
    from app.services.orchestrator import Orchestrator
    
    while not _stop_event.is_set():
        try:
            # Timeout allows the thread to periodically check _stop_event
            job_id = job_queue.get(timeout=1.0)
        except queue.Empty:
            continue
            
        try:
            logger.info(f"Worker picked up job {job_id}")
            Orchestrator.run_pipeline(job_id)
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
        finally:
            job_queue.task_done()
            
    logger.info("Worker thread stopped.")

def start_worker():
    global _worker_thread
    if _worker_thread is None or not _worker_thread.is_alive():
        _stop_event.clear()
        _worker_thread = threading.Thread(target=_worker_loop, daemon=True)
        _worker_thread.start()

def stop_worker():
    _stop_event.set()
    if _worker_thread:
        _worker_thread.join(timeout=5.0)

def enqueue(job_id: str):
    job_queue.put(job_id)
