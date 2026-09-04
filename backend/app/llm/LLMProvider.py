from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    @abstractmethod
    def create_llm(self, **kwargs) -> Any:
        """Instantiate and return a new LLM with the given kwargs."""
        pass

