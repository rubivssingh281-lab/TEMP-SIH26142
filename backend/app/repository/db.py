import sqlite3
from contextlib import contextmanager
from pathlib import Path
from app.core.config import settings

# In a real app, this path should come from settings
DB_PATH = Path("data/atlas.db")

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                stage TEXT,
                progress INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                input_path TEXT,
                input_crs TEXT,
                input_bands TEXT,
                input_res_m REAL,
                input_size TEXT,
                config TEXT,
                scale_factor INTEGER,
                output_res_m REAL,
                metrics_summary TEXT,
                calibration_status TEXT DEFAULT 'not_evaluated',
                degradation_tier INTEGER,
                validation_level TEXT,
                error_code TEXT,
                error_message TEXT
            )
        ''')
        
        conn.execute('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at)')
        
        # Enable WAL mode for better concurrency with a single writer
        conn.execute('PRAGMA journal_mode=WAL')

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
