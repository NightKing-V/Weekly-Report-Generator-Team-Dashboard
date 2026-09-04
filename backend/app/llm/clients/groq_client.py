import os
import logging
from typing import Optional
from langchain_groq import ChatGroq
from app.llm.LLMProvider import LLMProvider

logger = logging.getLogger("app.llm.clients.groq_client")

# Disable CrewAI telemetry and console tracing popups
os.environ.setdefault("CREWAI_TELEMETRY_OPT_OUT", "true")
os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true")
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("OPENAI_API_KEY", "fake-key-crewai-requires-this")


def _sanitize_groq_kwargs(kwargs):
    """Sanitize kwargs sent to Groq API to avoid validation errors.
    
    1. If tool_choice is 'none', remove tools entirely so Groq does not fail with:
       'Tool choice is none, but model called a tool'.
    2. If tools are present, remove strict: True and remove fields with default values
       from 'required' list so Groq does not fail when the LLM omits optional parameters.
    3. Remove cache_breakpoint from messages.
    """
    if kwargs.get("tool_choice") == "none":
        kwargs.pop("tools", None)
        kwargs.pop("tool_choice", None)

    tools = kwargs.get("tools")
    if tools and isinstance(tools, list):
        for t in tools:
            fn = t.get("function", {}) if isinstance(t, dict) else {}
            fn.pop("strict", None)
            params = fn.get("parameters", {})
            props = params.get("properties", {})
            required = params.get("required", [])
            if required:
                params["required"] = [r for r in required if "default" not in props.get(r, {})]

    messages = kwargs.get("messages")
    if messages and isinstance(messages, list):
        for m in messages:
            if isinstance(m, dict):
                m.pop("cache_breakpoint", None)
                m.pop("cache_control", None)


def _apply_groq_patches():
    """Apply LiteLLM and CrewAI monkeypatches for Groq API."""
    try:
        import litellm
        litellm.drop_params = True

        if not getattr(litellm, "_groq_completion_patched", False):
            orig_completion = litellm.completion
            orig_acompletion = getattr(litellm, "acompletion", None)

            def _patched_completion(*args, **kwargs):
                _sanitize_groq_kwargs(kwargs)
                return orig_completion(*args, **kwargs)

            async def _patched_acompletion(*args, **kwargs):
                _sanitize_groq_kwargs(kwargs)
                return await orig_acompletion(*args, **kwargs)

            litellm.completion = _patched_completion
            if orig_acompletion:
                litellm.acompletion = _patched_acompletion
            litellm._groq_completion_patched = True
    except Exception as e:
        logger.warning(f"Could not patch litellm.completion: {e}")

    try:
        from crewai.llms import cache
        cache.mark_cache_breakpoint = lambda msg: msg
    except Exception:
        pass

    try:
        from crewai.utilities import agent_utils

        if not getattr(agent_utils, "_groq_patched", False):
            orig_convert = agent_utils.convert_tools_to_openai_schema

            def _patched_convert(tools):
                schemas, funcs, mapping = orig_convert(tools)
                for s in schemas:
                    fn = s.get("function", {})
                    fn.pop("strict", None)
                    params = fn.get("parameters", {})
                    props = params.get("properties", {})
                    required = params.get("required", [])
                    params["required"] = [r for r in required if "default" not in props.get(r, {})]
                return schemas, funcs, mapping

            agent_utils.convert_tools_to_openai_schema = _patched_convert
            agent_utils._groq_patched = True
    except Exception as e:
        logger.warning(f"Could not apply convert_tools_to_openai_schema patch: {e}")


# Run patches on module import
_apply_groq_patches()


class GroqClient(LLMProvider):
    """Stateless provider - initializes ChatGroq instances for LangChain / LangGraph."""

    def __init__(self):
        self._api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not self._api_key:
            logger.warning("GROQ_API_KEY environment variable is not configured.")

    def create_llm(self, model: str, temperature: float = 0.1, max_tokens: int = 2048, **kwargs) -> ChatGroq:
        _apply_groq_patches()
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

