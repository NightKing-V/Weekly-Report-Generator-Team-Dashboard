import logging
from app.llm.LLMFactory import LLMFactory
from app.llm.tiers import LLMTier
from app.clients.llm.groq_client import GroqClient

logger = logging.getLogger("app.llm")

# Register Groq provider
try:
    LLMFactory.register_provider("groq", GroqClient)
    logger.info("Successfully registered Groq LLM Provider.")
except Exception as e:
    logger.error(f"Failed to register Groq provider: {e}")

__all__ = [
    "LLMFactory",
    "LLMTier",
    "GroqClient",
]
