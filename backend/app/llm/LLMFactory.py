from typing import Dict, Type, Any
from app.llm.LLMProvider import LLMProvider
from app.llm.tiers import LLMTierConfig


class LLMFactory:
    _providers: Dict[str, Type[LLMProvider]] = {}

    @classmethod
    def register_provider(cls, provider_name: str, provider_class: Type[LLMProvider]):
        cls._providers[provider_name.lower()] = provider_class

    @classmethod
    def get_llm(cls, tier: "LLMTierConfig") -> Any:
        """Create an LLM from a tier config."""
        provider_name = tier.provider.lower()

        if provider_name not in cls._providers:
            raise ValueError(
                f"Provider '{provider_name}' is not registered. "
                f"Available: {list(cls._providers.keys())}"
            )

        provider = cls._providers[provider_name]()
        return provider.create_llm(**tier.kwargs)

