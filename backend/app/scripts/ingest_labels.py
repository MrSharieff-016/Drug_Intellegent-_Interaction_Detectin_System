"""
CLI script to ingest curated, cited package labels into the database for TF-IDF RAG retrieval.
Run via: python -m app.scripts.ingest_labels
"""

import sys
import logging
from app.scripts.seed_demo_data import seed_all_demo_data
from app.services.retrieval_service import initialize_retrieval_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("medsafe.ingest")


def main():
    logger.info("Starting FDA DailyMed label ingestion process...")
    try:
        seed_all_demo_data()
        logger.info("Initializing and fitting TF-IDF RAG vectorizer engine...")
        initialize_retrieval_engine()
        logger.info("Label ingestion and TF-IDF matrix construction completed successfully!")
    except Exception as e:
        logger.error(f"Error during label ingestion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
