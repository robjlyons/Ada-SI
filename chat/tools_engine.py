import ast
import asyncio
import json
import logging
import re
import types
from pathlib import Path

from prompts_config import (
    get_scout_orchestrator_prompt,
    get_tool_edit_existing_description,
    get_tool_generate_new_description,
)
from runtime_client import (
    diff_new_requirements,
    fetch_runtime_manifest,
    fetch_runtime_tools,
    normalize_requirements,
    package_name,
    runtime_delete_tool,
    runtime_health,
    runtime_run_tool,
    set_runtime_url,
)

logger = logging.getLogger(__name__)

TOOLS_DIR = Path(__file__).parent / "custom_tools"
TOOLS_DIR.mkdir(exist_ok=True)


def build_generate_new_tool_schema() -> dict:
    return {
        "type": "function",
        "function": {
            "name": "generate_new_tool",
            "description": get_tool_generate_new_description(),
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_name": {
                        "type": "string",
                        "description": "Snake_case name for the new tool module.",
                    },
                    "description": {
                        "type": "string",
                        "description": (
                            "Detailed explanation of what the tool should do, its inputs, "
                            "and expected outputs."
                        ),
                    },
                },
                "required": ["tool_name", "description"],
            },
        },
    }


def build_edit_existing_tool_schema() -> dict:
    return {
        "type": "function",
        "function": {
            "name": "edit_existing_tool",
            "description": get_tool_edit_existing_description(),
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_name": {
                        "type": "string",
                        "description": "Snake_case name of the existing installed tool.",
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed description of the requested changes.",
                    },
                },
                "required": ["tool_name", "description"],
            },
        },
    }


def read_tool_file(tool_name: str) -> str:
    path = TOOLS_DIR / f"{tool_name}.py"
    if not path.exists():
        raise FileNotFoundError(f"Tool '{tool_name}' not found.")
    return path.read_text(encoding="utf-8")


def read_tool_requirements(tool_name: str) -> list[str]:
    path = TOOLS_DIR / f"{tool_name}.requirements.txt"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    return normalize_requirements([line.strip() for line in lines if line.strip()])


def get_package_usage() -> dict[str, list[str]]:
    """Map normalized package name to tool stems that declare it in requirements."""
    usage: dict[str, list[str]] = {}
    for req_path in TOOLS_DIR.glob("*.requirements.txt"):
        tool_name = req_path.name.removesuffix(".requirements.txt")
        for req in read_tool_requirements(tool_name):
            key = package_name(req)
            if not key:
                continue
            usage.setdefault(key, [])
            if tool_name not in usage[key]:
                usage[key].append(tool_name)
    for tools in usage.values():
        tools.sort()
    return usage


def tool_exists(tool_name: str) -> bool:
    return (TOOLS_DIR / f"{tool_name}.py").exists()


_JSON_LITERAL_PATTERNS = (
    (re.compile(r"(?<=[:\[,])\s*false\b(?=\s*[,}\]])"), "False"),
    (re.compile(r"(?<=[:\[,])\s*true\b(?=\s*[,}\]])"), "True"),
    (re.compile(r"(?<=[:\[,])\s*null\b(?=\s*[,}\]])"), "None"),
)


def sanitize_python_json_literals(code: str) -> str:
    """Replace JSON-style true/false/null that LLMs often emit inside Python dict literals."""
    for pattern, replacement in _JSON_LITERAL_PATTERNS:
        code = pattern.sub(replacement, code)
    return code


def _exec_tool_module_from_source(source: str, module_name: str):
    source = sanitize_python_json_literals(source)
    mod = types.ModuleType(module_name)
    mod.__file__ = f"{module_name}.py"
    exec(compile(source, mod.__file__, "exec"), mod.__dict__)
    return mod


def _schema_name_and_description(schema: dict) -> tuple[str, str]:
    fn = schema.get("function", schema)
    return fn.get("name", ""), fn.get("description", "")


def prepare_agent_messages(messages: list[dict]) -> list[dict]:
    rest: list[dict] = []
    for msg in messages:
        if msg.get("role") == "system":
            continue
        rest.append(msg)

    return [{"role": "system", "content": get_scout_orchestrator_prompt()}, *rest]


def _load_local_schemas() -> list[dict]:
    schemas: list[dict] = []
    for file in sorted(TOOLS_DIR.glob("*.py")):
        if file.name.startswith("__") or file.name.endswith(".test.py"):
            continue
        try:
            mod = _exec_tool_module_from_source(
                file.read_text(encoding="utf-8"), file.stem
            )
            if hasattr(mod, "get_tool_schema"):
                schemas.append(mod.get_tool_schema())
        except Exception as exc:
            logger.warning("Local schema load failed for %s: %s", file.name, exc)
    return schemas


def load_dynamic_tools() -> list[dict]:
    tools = [build_generate_new_tool_schema(), build_edit_existing_tool_schema()]
    try:
        runtime_tools = asyncio.get_event_loop().run_until_complete(fetch_runtime_tools())
        for item in runtime_tools:
            schema = item.get("schema")
            if schema:
                tools.append(schema)
        return tools
    except RuntimeError:
        pass
    except Exception as exc:
        logger.warning("Runtime tool list failed, falling back to local: %s", exc)

    try:
        loop = asyncio.new_event_loop()
        runtime_tools = loop.run_until_complete(fetch_runtime_tools())
        loop.close()
        for item in runtime_tools:
            schema = item.get("schema")
            if schema:
                tools.append(schema)
        return tools
    except Exception as exc:
        logger.warning("Runtime tool list failed, falling back to local: %s", exc)

    tools.extend(_load_local_schemas())
    return tools


async def aload_dynamic_tools() -> list[dict]:
    tools = [build_generate_new_tool_schema(), build_edit_existing_tool_schema()]
    runtime_loaded = False
    try:
        runtime_tools = await fetch_runtime_tools()
        for item in runtime_tools:
            schema = item.get("schema")
            if schema:
                tools.append(schema)
                runtime_loaded = True
    except Exception as exc:
        logger.warning("Runtime tool list failed, falling back to local: %s", exc)

    if not runtime_loaded:
        tools.extend(_load_local_schemas())
    return tools


async def alist_tool_summaries() -> list[dict[str, str]]:
    try:
        runtime_tools = await fetch_runtime_tools()
        if runtime_tools:
            return [
                {"name": t["name"], "description": t.get("description", "")}
                for t in runtime_tools
            ]
    except Exception as exc:
        logger.warning("Runtime summaries failed: %s", exc)

    summaries: list[dict[str, str]] = []
    for schema in _load_local_schemas():
        name, description = _schema_name_and_description(schema)
        if name:
            summaries.append({"name": name, "description": description})
    return summaries


def list_tool_summaries() -> list[dict[str, str]]:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return []
        return loop.run_until_complete(alist_tool_summaries())
    except Exception:
        try:
            loop = asyncio.new_event_loop()
            result = loop.run_until_complete(alist_tool_summaries())
            loop.close()
            return result
        except Exception as exc:
            logger.warning("list_tool_summaries failed: %s", exc)
            return []


async def execute_dynamic_tool(name: str, arguments: dict, *, run_id: str = "") -> str:
    if name in ("generate_new_tool", "edit_existing_tool"):
        raise ValueError(f"{name} must be intercepted by the orchestrator.")

    logger.debug("[run=%s][TOOL] executing %s args=%s", run_id or "-", name, arguments)
    return await runtime_run_tool(name, arguments)


def execute_dynamic_tool_sync(name: str, arguments: dict, *, run_id: str = "") -> str:
    return asyncio.get_event_loop().run_until_complete(
        execute_dynamic_tool(name, arguments, run_id=run_id)
    )


def validate_tool_module(code: str) -> bool:
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return False

    names = {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
    }
    return "get_tool_schema" in names and "run" in names


def validate_tool_schema(code: str) -> tuple[bool, str]:
    code = sanitize_python_json_literals(code)
    if not validate_tool_module(code):
        return False, "Generated tool code is missing get_tool_schema() or run()."
    try:
        mod = _exec_tool_module_from_source(code, "tool_validation_mod")
        schema = mod.get_tool_schema()
        if not isinstance(schema, dict):
            return False, "get_tool_schema() must return a dict."
        name, _ = _schema_name_and_description(schema)
        if not name:
            return False, "Tool schema is missing a name."
        return True, ""
    except Exception as exc:
        return False, f"get_tool_schema() failed: {exc}"


def read_tool_test(tool_name: str) -> str:
    path = TOOLS_DIR / f"{tool_name}.test.py"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def write_tool_files(
    tool_name: str,
    code: str,
    requirements: list[str] | None = None,
    test_code: str = "",
) -> Path:
    code = sanitize_python_json_literals(code)
    schema_ok, schema_reason = validate_tool_schema(code)
    if not schema_ok:
        raise ValueError(schema_reason)

    target = TOOLS_DIR / f"{tool_name}.py"
    target.write_text(code, encoding="utf-8")

    req_path = TOOLS_DIR / f"{tool_name}.requirements.txt"
    reqs = normalize_requirements(requirements or [])
    if reqs:
        req_path.write_text("\n".join(reqs) + "\n", encoding="utf-8")
    elif req_path.exists():
        req_path.unlink()

    test_path = TOOLS_DIR / f"{tool_name}.test.py"
    if test_code:
        test_path.write_text(test_code, encoding="utf-8")
    return target


def write_tool(tool_name: str, code: str) -> Path:
    return write_tool_files(tool_name, code, [])


async def delete_tool_async(tool_name: str) -> None:
    if not tool_name or not tool_name.replace("_", "").isalnum():
        raise ValueError(f"Invalid tool name: {tool_name}")

    target = TOOLS_DIR / f"{tool_name}.py"
    req_path = TOOLS_DIR / f"{tool_name}.requirements.txt"
    test_path = TOOLS_DIR / f"{tool_name}.test.py"
    tool_paths = (target, req_path, test_path)

    if not any(path.exists() for path in tool_paths):
        raise FileNotFoundError(f"Tool '{tool_name}' not found.")

    await runtime_delete_tool(tool_name)

    for path in tool_paths:
        path.unlink(missing_ok=True)

    pycache = TOOLS_DIR / "__pycache__"
    if pycache.is_dir():
        for pattern in (f"{tool_name}.cpython-*.pyc", f"{tool_name}.test.cpython-*.pyc"):
            for cached in pycache.glob(pattern):
                cached.unlink(missing_ok=True)


def delete_tool(tool_name: str) -> None:
    asyncio.get_event_loop().run_until_complete(delete_tool_async(tool_name))


async def get_new_packages_for_requirements(requirements: list[str]) -> tuple[list[str], list[str]]:
    manifest = await fetch_runtime_manifest()
    approved = manifest.get("approved_packages") or []
    new_packages = diff_new_requirements(requirements, approved)
    return new_packages, approved
