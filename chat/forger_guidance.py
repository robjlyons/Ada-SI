"""Backward-compatible re-exports from prompts_config."""

from prompts_config import get_forge_appendix as get_forger_system_appendix, load_prompts_config

__all__ = [
    "get_forger_runtime_context",
    "get_forger_system_appendix",
    "load_forger_guidance",
    "save_forger_guidance",
    "default_forger_guidance",
    "GUIDANCE_KEYS",
]


def get_forger_runtime_context() -> str:
    return load_prompts_config()["forge_runtime_context"]


GUIDANCE_KEYS = ("forger_runtime_context",)


def default_forger_guidance() -> dict:
    config = load_prompts_config()
    return {"forger_runtime_context": config["forge_runtime_context"]}


def load_forger_guidance(*, refresh: bool = False) -> dict:
    return default_forger_guidance()


def save_forger_guidance(data: dict) -> dict:
    from prompts_config import save_prompts_config

    mapped = {"forge_runtime_context": data.get("forger_runtime_context", "")}
    save_prompts_config({**load_prompts_config(), **mapped})
    return default_forger_guidance()
