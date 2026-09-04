from dataclasses import dataclass, field
from typing import Any, Dict
import os


@dataclass
class LLMTierConfig:
    """Describes which provider + model settings to use. Holds no LLM instance."""
    provider: str
    kwargs: Dict[str, Any] = field(default_factory=dict)


def get_default_groq_model() -> str:
    return os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()


class LLMTier:
    SMALL = LLMTierConfig(
        provider="groq",
        kwargs={"model": os.getenv("GROQ_MODEL_SMALL", "qwen/qwen3.8-27b"), "temperature": 0.0},
    )
    """Tier 1: Fast & lightweight - LangGraph routing, summarizer, FAQ"""

    STANDARD = LLMTierConfig(
        provider="groq",
        kwargs={"model": get_default_groq_model(), "temperature": 0.1},
    )
    """Tier 2: Workhorse - standard reasoning agent"""

    LARGE = LLMTierConfig(
        provider="groq",
        kwargs={"model": os.getenv("GROQ_MODEL_LARGE", get_default_groq_model()), "temperature": 0.1},
    )
    """Tier 3: Complex reasoning agent"""

