import logging
import time

import httpx
from fastapi import HTTPException

log = logging.getLogger("mifoo.db")


def run(query, attempts: int = 3, delay: float = 0.4):
    """query.execute(), trying again when the connection to Supabase drops.

    Only network failures are retried (a dropped or timed-out connection, which happens now and
    then on a hosted server that was idle). A database error such as "row not allowed" is not a
    network failure and is raised straight away. Use this for reads and for writes that give the
    same result when repeated; do NOT use it for inserts (a retry could create a duplicate).
    After the last attempt the user gets a clear 503 instead of a bare 500."""
    for attempt in range(1, attempts + 1):
        try:
            return query.execute()
        except httpx.TransportError as exc:  # includes timeouts and dropped connections
            log.warning("Supabase connection problem (attempt %s of %s): %r", attempt, attempts, exc)
            if attempt == attempts:
                raise HTTPException(
                    status_code=503,
                    detail="The database could not be reached. Please try again in a moment.",
                ) from exc
            time.sleep(delay * attempt)
