import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

from runner import (
    delete_tool,
    install_tool,
    list_installed_packages,
    list_tools,
    load_manifest,
    pip_install,
    pip_uninstall,
    run_tool,
    verify_tool_in_runtime,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ada-SI Tool Runtime")

SAFE_ORIGIN_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
DEFAULT_ALLOWED_ORIGINS = frozenset(
    {
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    }
)


def allowed_browser_origins() -> set[str]:
    configured = os.environ.get("ADA_ALLOWED_ORIGINS", "").strip()
    if not configured:
        return set(DEFAULT_ALLOWED_ORIGINS)
    return {origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()}


def _same_origin_from_referer(referer: str, allowed: set[str]) -> bool:
    return any(referer == origin or referer.startswith(f"{origin}/") for origin in allowed)


@app.middleware("http")
async def reject_cross_origin_state_changes(request: Request, call_next):
    if request.method.upper() not in SAFE_ORIGIN_METHODS:
        allowed = allowed_browser_origins()
        origin = (request.headers.get("origin") or "").rstrip("/")
        referer = request.headers.get("referer") or ""
        if origin and origin not in allowed:
            return Response("Cross-origin requests are not allowed.", status_code=403)
        if not origin and referer and not _same_origin_from_referer(referer, allowed):
            return Response("Cross-origin requests are not allowed.", status_code=403)
    return await call_next(request)


class RunRequest(BaseModel):
    arguments: dict[str, Any] = Field(default_factory=dict)


class InstallRequest(BaseModel):
    tool_code: str
    test_code: str
    requirements: list[str] = Field(default_factory=list)
    skip_pip: bool = False


class PipInstallRequest(BaseModel):
    packages: list[str]


class VerifyRequest(BaseModel):
    test_code: str


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=400, detail=message)


@app.get("/health")
async def health() -> dict:
    manifest = load_manifest()
    return {
        "status": "ok",
        "approved_packages": manifest.get("approved_packages", []),
    }


@app.get("/tools")
async def get_tools() -> dict:
    tools = list_tools()
    return {
        "tools": [
            {"name": t["name"], "description": t["description"], "schema": t["schema"]}
            for t in tools
        ]
    }


@app.post("/tools/{name}/run")
async def execute_tool(name: str, payload: RunRequest) -> dict:
    try:
        result = run_tool(name, payload.arguments)
        return {"status": "ok", "result": result}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    except Exception as exc:
        logger.exception("Tool run failed: %s", name)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/tools/{name}/install")
async def install(name: str, payload: InstallRequest) -> dict:
    try:
        ok, logs = install_tool(
            name,
            payload.tool_code,
            payload.test_code,
            payload.requirements,
            skip_pip=payload.skip_pip,
        )
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    if not ok:
        logger.error("Install failed for %s:\n%s", name, logs)
        raise HTTPException(status_code=502, detail=logs)
    return {"status": "ok", "logs": logs}


@app.post("/tools/{name}/verify")
async def verify(name: str, payload: VerifyRequest) -> dict:
    if not (payload.test_code or "").strip():
        raise HTTPException(status_code=400, detail="test_code is required.")
    try:
        ok, logs = verify_tool_in_runtime(name, payload.test_code)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    if not ok:
        raise HTTPException(status_code=502, detail=logs)
    return {"status": "ok", "logs": logs}


@app.post("/pip/install")
async def pip_install_endpoint(payload: PipInstallRequest) -> dict:
    packages = [p.strip() for p in payload.packages if p.strip()]
    if not packages:
        raise HTTPException(status_code=400, detail="No packages specified.")
    try:
        ok, logs = pip_install(packages)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    if not ok:
        raise HTTPException(status_code=502, detail=logs)
    return {"status": "ok", "logs": logs}


@app.get("/pip/packages")
async def list_pip_packages() -> dict:
    return {"packages": list_installed_packages()}


@app.delete("/pip/packages/{package_name}")
async def uninstall_pip_package(package_name: str) -> dict:
    try:
        ok, logs = pip_uninstall(package_name)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    if not ok:
        if "not in the approved manifest" in logs:
            raise HTTPException(status_code=404, detail=logs)
        raise HTTPException(status_code=502, detail=logs)
    return {"status": "ok", "logs": logs, "packages": list_installed_packages()}


@app.get("/manifest")
async def manifest() -> dict:
    return load_manifest()


@app.delete("/tools/{name}")
async def remove_tool(name: str) -> dict:
    try:
        delete_tool(name)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    return {"status": "deleted", "tool_name": name}
