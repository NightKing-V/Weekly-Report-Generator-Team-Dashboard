"""Groq LLM Client configuration and factory.

Provides unified initialization for CrewAI, LangChain, and native Groq SDK.
"""

import os
from typing import Optional
import logging

logger = logging.getLogger("app.clients.llm.groq_client")


def get_groq_api_key() -> Optional[str]:
    """Retrieve GROQ_API_KEY from environment, returning None if unset or blank."""
    key = os.getenv("GROQ_API_KEY", "").strip()
    return key if key else None


def get_groq_model() -> str:
    """Retrieve target Groq model name, defaulting to llama-3.3-70b-versatile."""
    return os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()


def is_groq_available() -> bool:
    """Check if a non-empty Groq API key is configured."""
    return get_groq_api_key() is not None


# Disable CrewAI telemetry and console tracing
os.environ.setdefault("CREWAI_TELEMETRY_OPT_OUT", "true")
os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")


def _sanitize_groq_kwargs(kwargs):
    # If tool_choice is 'none' (force final answer), strip tools to avoid Groq validation error
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


class GroqInputHandler:
    """LiteLLM custom callback to sanitize tool parameters and messages for Groq API."""

    def log_pre_api_call(self, model, messages, kwargs):
        _sanitize_groq_kwargs(kwargs)


def _apply_groq_patches():
    """Apply compatibility patches for Groq API with LiteLLM and CrewAI.
    
    1. litellm.drop_params: drops unsupported model parameters.
    2. Wraps litellm.completion and litellm.acompletion directly to sanitize kwargs:
       - Strips tools when tool_choice='none' (preventing Groq 'Tool choice is none, but model called a tool').
       - Removes strict: True and filters required fields for tool definitions.
       - Strips cache_breakpoint from messages.
    3. cache.mark_cache_breakpoint: Groq rejects cache_breakpoint in messages.
    4. agent_utils.convert_tools_to_openai_schema: Removes strict: True and
       strips optional fields with default values from 'required' so Groq
       does not fail validation when the LLM calls a tool with partial arguments.
    """
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

        if not any(isinstance(cb, GroqInputHandler) for cb in getattr(litellm, "callbacks", [])):
            litellm.callbacks.append(GroqInputHandler())
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


def get_crewai_groq_llm():
    """Instantiate and return CrewAI LLM configured for Groq.
    
    Returns None if GROQ_API_KEY is not configured.
    """
    api_key = get_groq_api_key()
    if not api_key:
        logger.info("GROQ_API_KEY not configured; CrewAI will run with fallback mode.")
        return None

    try:
        _apply_groq_patches()

        from crewai import LLM

        model = get_groq_model()
        model_name = model if model.startswith("groq/") else f"groq/{model}"
        return LLM(
            model=model_name,
            api_key=api_key,
            temperature=0.2,
        )
    except Exception as exc:
        logger.error(f"Failed to initialize CrewAI LLM for Groq: {exc}")
        return None


def get_langchain_groq_llm():
    """Instantiate and return LangChain ChatGroq instance for graph nodes/summarizer.
    
    Returns None if GROQ_API_KEY is not configured.
    """
    api_key = get_groq_api_key()
    if not api_key:
        return None

    try:
        from langchain_groq import ChatGroq

        model = get_groq_model()
        clean_model = model[5:] if model.startswith("groq/") else model
        return ChatGroq(
            model_name=clean_model,
            groq_api_key=api_key,
            temperature=0.2,
        )
    except Exception as exc:
        logger.error(f"Failed to initialize LangChain ChatGroq: {exc}")
        return None


def get_groq_client():
    """Instantiate native Groq client."""
    api_key = get_groq_api_key()
    if not api_key:
        return None

    try:
        from groq import Groq

        return Groq(api_key=api_key)
    except Exception as exc:
        logger.error(f"Failed to initialize native Groq client: {exc}")
        return None
