import os
import logging
from typing import Optional
from langchain_groq import ChatGroq
from app.llm.LLMProvider import LLMProvider

logger = logging.getLogger("app.llm.clients.groq_client")


def _apply_groq_patches():
    """No-op compatibility placeholder."""
    pass


class GroqClient(LLMProvider):
    """Stateless provider - initializes ChatGroq instances for LangChain / LangGraph."""

    def __init__(self):
        self._api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not self._api_key:
            logger.warning("GROQ_API_KEY environment variable is not configured.")

    def create_llm(self, model: str, temperature: float = 0.1, max_tokens: int = 800, **kwargs) -> ChatGroq:
        clean_model = model[5:] if model.startswith("groq/") else model
        config = {
            "groq_api_key": self._api_key,
            "model_name": clean_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if "stop" in kwargs:
            config["stop_sequences"] = kwargs.pop("stop")

        return ChatGroq(**config, **kwargs)
