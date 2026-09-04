import logging
from app.llm.LLMFactory import LLMFactory
from app.llm.tiers import LLMTier
from app.llm.clients.groq_client import GroqClient, _apply_groq_patches

logger = logging.getLogger("app.llm")

# Register Groq provider
try:
    LLMFactory.register_provider("groq", GroqClient)
    _apply_groq_patches()
    logger.info("Successfully registered Groq LLM Provider.")
except Exception as e:
    logger.error(f"Failed to register Groq provider: {e}")

__all__ = [
    "LLMFactory",
    "LLMTier",
    "GroqClient",
    "_apply_groq_patches",
]

