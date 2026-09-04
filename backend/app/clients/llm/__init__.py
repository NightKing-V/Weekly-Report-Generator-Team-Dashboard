"""LLM client compatibility re-exports."""

from app.llm.clients.groq_client import (
    GroqClient,
    _apply_groq_patches,
)

__all__ = [
    "GroqClient",
    "_apply_groq_patches",
]

