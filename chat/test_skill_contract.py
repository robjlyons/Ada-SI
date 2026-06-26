"""Tests for interactive skill API contract verification."""

import tools_engine


LIST_TOOL = '''
import json
import uuid
from pathlib import Path

def get_tool_schema():
    return {"name": "contract_demo", "description": "x", "parameters": {"type": "object", "properties": {"action": {"type": "string"}}, "required": ["action"]}}

def run(action, title=None, task_id=None):
    p = Path(__file__).parent / "skill_data" / "contract_demo.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(p.read_text()) if p.exists() else {"records": []}
    if action == "add_task":
        rec = {"id": str(uuid.uuid4()), "title": title, "done": False}
        data["records"].append(rec)
        p.write_text(json.dumps(data))
    elif action == "delete_task":
        data["records"] = [r for r in data["records"] if r["id"] != task_id]
        p.write_text(json.dumps(data))
    elif action == "list_tasks":
        pass
    return {"records": data["records"]}
'''

MANIFEST = {
    "kind": "interactive",
    "display_name": "Demo",
    "operations": ["list_tasks", "add_task", "delete_task"],
    "ui": {
        "template": "list",
        "title_field": "title",
        "done_field": "done",
        "actions": {
            "fetch": "list_tasks",
            "create": "add_task",
            "delete": "delete_task",
        },
    },
}

TABLE_TOOL = '''
import json
import uuid
from pathlib import Path

def get_tool_schema():
    return {
        "name": "contract_contacts",
        "description": "x",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "id": {"type": "string"},
            },
            "required": ["action", "name", "email", "phone"],
        },
    }

def run(action, name=None, email=None, phone=None, id=None):
    p = Path(__file__).parent / "skill_data" / "contract_contacts.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(p.read_text()) if p.exists() else {"records": []}
    if action == "add_contact":
        if not name or not email or not phone:
            return {"error": "name, email, and phone are required for add_contact"}
        rec = {"id": str(uuid.uuid4()), "name": name, "email": email, "phone": phone}
        data["records"].append(rec)
        p.write_text(json.dumps(data))
    elif action == "delete_contact":
        data["records"] = [r for r in data["records"] if r["id"] != id]
        p.write_text(json.dumps(data))
    elif action == "list_contacts":
        pass
    return {"records": data["records"]}
'''

TABLE_MANIFEST = {
    "kind": "interactive",
    "display_name": "Contacts",
    "operations": ["list_contacts", "add_contact", "delete_contact"],
    "ui": {
        "template": "table",
        "fields": [
            {"key": "name", "label": "Name"},
            {"key": "email", "label": "Email"},
            {"key": "phone", "label": "Phone"},
        ],
        "actions": {
            "fetch": "list_contacts",
            "create": "add_contact",
            "delete": "delete_contact",
        },
    },
}

NOTES_TOOL = '''
import json
import uuid
from pathlib import Path

def get_tool_schema():
    return {
        "name": "contract_notes",
        "description": "x",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string"},
                "title": {"type": "string"},
                "body": {"type": "string"},
                "note_id": {"type": "string"},
            },
            "required": ["action", "title", "body"],
        },
    }

def run(action, title=None, body=None, note_id=None):
    p = Path(__file__).parent / "skill_data" / "contract_notes.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(p.read_text()) if p.exists() else {"records": []}
    if action == "add_note":
        if not title or not body:
            return {"error": "title and body are required for add_note"}
        rec = {"id": str(uuid.uuid4()), "title": title, "body": body}
        data["records"].append(rec)
        p.write_text(json.dumps(data))
    elif action == "delete_note":
        data["records"] = [r for r in data["records"] if r["id"] != note_id]
        p.write_text(json.dumps(data))
    elif action == "list_notes":
        pass
    return {"records": data["records"]}
'''

NOTES_MANIFEST = {
    "kind": "interactive",
    "display_name": "Notes",
    "operations": ["list_notes", "add_note", "delete_note"],
    "ui": {
        "template": "custom",
        "fields": [
            {"key": "title", "label": "Title"},
            {"key": "body", "label": "Body"},
        ],
        "actions": {
            "fetch": "list_notes",
            "create": "add_note",
            "delete": "delete_note",
        },
    },
}

STOPWATCH_TOOL = '''
import json
import time
from pathlib import Path

def get_tool_schema():
    return {
        "name": "stopwatch_app",
        "description": "Stopwatch",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["get_state", "start", "stop", "reset"],
                }
            },
            "required": ["action"],
        },
    }

def run(action):
    p = Path(__file__).parent / "skill_data" / "stopwatch_app.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    default_state = {
        "id": "stopwatch_state",
        "is_running": False,
        "start_time": 0.0,
        "accumulated_time": 0.0,
    }
    if p.exists():
        data = json.loads(p.read_text())
        records = data.get("records", [])
        state = records[0] if records else default_state.copy()
    else:
        state = default_state.copy()
    now = time.time()
    if action == "start" and not state["is_running"]:
        state["is_running"] = True
        state["start_time"] = now
    elif action == "stop" and state["is_running"]:
        state["is_running"] = False
        state["accumulated_time"] += now - state["start_time"]
        state["start_time"] = 0.0
    elif action == "reset":
        state = default_state.copy()
    p.write_text(json.dumps({"records": [state]}))
    return {"records": [state]}
'''

STOPWATCH_MANIFEST = {
    "kind": "interactive",
    "display_name": "Stopwatch",
    "operations": ["get_state", "start", "stop", "reset"],
    "ui": {
        "template": "custom",
        "entry": "index.html",
        "actions": {
            "getState": "get_state",
            "start": "start",
            "stop": "stop",
            "reset": "reset",
        },
    },
}


def test_verify_skill_api_contract_list():
    ok, reason = tools_engine.verify_skill_api_contract(
        "contract_demo", LIST_TOOL, dict(MANIFEST)
    )
    assert ok, reason


def test_verify_skill_api_contract_table():
    ok, reason = tools_engine.verify_skill_api_contract(
        "contract_contacts", TABLE_TOOL, dict(TABLE_MANIFEST)
    )
    assert ok, reason


def test_verify_skill_api_contract_custom_notes():
    ok, reason = tools_engine.verify_skill_api_contract(
        "contract_notes", NOTES_TOOL, dict(NOTES_MANIFEST)
    )
    assert ok, reason


def test_verify_skill_api_contract_custom_stopwatch():
    ok, reason = tools_engine.verify_skill_api_contract(
        "stopwatch_app", STOPWATCH_TOOL, dict(STOPWATCH_MANIFEST)
    )
    assert ok, reason


TODO_TOOL = '''
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

def get_tool_schema():
    return {
        "name": "todo_list_app",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["list_tasks", "add_task", "complete_task", "delete_task"],
                },
                "title": {"type": "string"},
                "task_id": {"type": "string"},
            },
            "required": ["action"],
        },
    }

def run(action, title=None, task_id=None):
    p = Path(__file__).parent / "skill_data" / "todo_list_app.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        data = json.loads(p.read_text())
    else:
        data = {"records": []}
    if action == "list_tasks":
        return data
    if action == "add_task":
        if not title:
            return {"error": "title is required for add_task"}
        task = {
            "id": str(uuid.uuid4()),
            "title": title,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        data["records"].append(task)
        p.write_text(json.dumps(data))
        return task
    if action == "complete_task":
        if not task_id:
            return {"error": "task_id is required for complete_task"}
        for task in data["records"]:
            if task["id"] == task_id:
                task["status"] = "completed"
                p.write_text(json.dumps(data))
                return task
        return {"error": "not found"}
    if action == "delete_task":
        if not task_id:
            return {"error": "task_id is required for delete_task"}
        data["records"] = [t for t in data["records"] if t["id"] != task_id]
        p.write_text(json.dumps(data))
        return {"success": True}
    return {"error": "unknown"}
'''

TODO_MANIFEST = {
    "kind": "interactive",
    "display_name": "Todo List",
    "operations": ["list_tasks", "add_task", "complete_task", "delete_task"],
    "ui": {
        "template": "custom",
        "entry": "index.html",
        "actions": {
            "fetch": "list_tasks",
            "create": "add_task",
            "toggle": "complete_task",
            "delete": "delete_task",
        },
    },
}


def test_verify_skill_api_contract_custom_todo_list():
    ok, reason = tools_engine.verify_skill_api_contract(
        "todo_list_app", TODO_TOOL, dict(TODO_MANIFEST)
    )
    assert ok, reason


if __name__ == "__main__":
    test_verify_skill_api_contract_list()
    test_verify_skill_api_contract_table()
    test_verify_skill_api_contract_custom_notes()
    test_verify_skill_api_contract_custom_stopwatch()
    test_verify_skill_api_contract_custom_todo_list()
    print("All test_skill_contract tests passed.")
