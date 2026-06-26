"""Tests for Scout persona workspace and system instruction composition."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import scout_persona as sp


class ScoutPersonaTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._persona_dir = Path(self._tmpdir.name) / "persona"
        self._env_patch = patch.dict("os.environ", {"ADA_PERSONA_DIR": str(self._persona_dir)})
        self._env_patch.start()

    def tearDown(self) -> None:
        self._env_patch.stop()
        self._tmpdir.cleanup()

    def test_ensure_persona_layout_seeds_all_files(self) -> None:
        sp.ensure_persona_layout()
        for fname, _ in sp.PERSONA_FILE_SEEDS:
            self.assertTrue((self._persona_dir / fname).is_file(), fname)
        self.assertTrue(sp.persona_config_path().is_file())

    def test_build_scout_system_instruction_includes_routing_and_persona(self) -> None:
        sp.ensure_persona_layout()
        routing = "Scout routing rules (follow strictly):\n1. Test rule."
        composed = sp.build_scout_system_instruction(routing)
        self.assertIn("=== SCOUT_ROUTING ===", composed)
        self.assertIn("Test rule.", composed)
        self.assertIn("=== SOUL ===", composed)
        self.assertIn("=== AGENTS.md", composed)
        self.assertNotIn("=== BOOTSTRAP ===", composed)

    def test_bootstrap_section_included_when_present(self) -> None:
        sp.ensure_persona_layout()
        sp.write_bootstrap_markdown("# BOOTSTRAP\nHello world")
        composed = sp.build_scout_system_instruction("routing")
        self.assertIn("=== BOOTSTRAP ===", composed)
        self.assertIn("Hello world", composed)

    def test_memory_replace_size_limit(self) -> None:
        sp.ensure_persona_layout()
        huge = "x" * (sp.MEMORY_FILE_MAX_BYTES + 1)
        result = sp.replace_memory_markdown(huge)
        self.assertFalse(result["ok"])

    def test_soul_replace_size_limit(self) -> None:
        sp.ensure_persona_layout()
        huge = "x" * (sp.SOUL_FILE_MAX_BYTES + 1)
        result = sp.replace_soul_markdown(huge)
        self.assertFalse(result["ok"])

    def test_daily_log_append_creates_dated_file(self) -> None:
        sp.ensure_persona_layout()
        result = sp.append_daily_log_line("Notable event")
        self.assertTrue(result["ok"])
        day = result["day"]
        path = sp.daily_logs_dir() / f"{day}.md"
        self.assertTrue(path.is_file())
        self.assertIn("Notable event", path.read_text(encoding="utf-8"))

    def test_bootstrap_complete_removes_bootstrap(self) -> None:
        sp.ensure_persona_layout()
        sp.write_bootstrap_markdown("# BOOTSTRAP")
        self.assertTrue(sp.bootstrap_path().is_file())
        result = sp.delete_bootstrap_file()
        self.assertTrue(result.get("deleted"))
        self.assertFalse(sp.bootstrap_path().is_file())

    def test_heartbeat_maintenance_prompt_restricts_tools(self) -> None:
        sp.ensure_persona_layout()
        composed = sp.build_scout_system_instruction(
            "routing",
            for_heartbeat_maintenance=True,
        )
        self.assertIn("memory_replace", composed)
        self.assertIn("Do not call soul_replace", composed)
        self.assertNotIn("=== SOUL ===", composed)

    def test_migrate_scout_additional_directives(self) -> None:
        sp.ensure_persona_layout()
        migrated = sp.migrate_scout_additional_directives("Always be concise.")
        self.assertTrue(migrated)
        user = sp.read_persona_markdown("user")
        self.assertIn("## Migrated directives", user)
        self.assertIn("Always be concise.", user)
        self.assertFalse(sp.migrate_scout_additional_directives("again"))

    def test_parse_identity_display_name(self) -> None:
        sp.ensure_persona_layout()
        sp.write_persona_markdown("identity", "# IDENTITY\n\n## Name\nClawd\n")
        self.assertEqual(sp.parse_identity_display_name(), "Clawd")

    def test_execute_persona_tool_soul_replace(self) -> None:
        sp.ensure_persona_layout()
        result = sp.execute_persona_tool("soul_replace", {"markdown": "# New soul\n"})
        self.assertTrue(result["ok"])
        self.assertIn("New soul", sp.read_persona_markdown("soul"))

    def test_persona_replace_updates_display_name(self) -> None:
        sp.ensure_persona_layout()
        result = sp.execute_persona_tool(
            "persona_replace",
            {"file": "identity", "markdown": "# IDENTITY\n\n## Name\nPixel\n"},
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result.get("display_name"), "Pixel")

    def test_start_bootstrap_ritual(self) -> None:
        sp.ensure_persona_layout()
        sp.append_daily_log_line("old log")
        result = sp.start_bootstrap_ritual()
        self.assertTrue(result["ok"])
        self.assertTrue(sp.bootstrap_path().is_file())
        self.assertIn("suggested_opener", result)
        self.assertEqual(list(sp.daily_logs_dir().glob("*.md")), [])

    def test_persona_config_roundtrip(self) -> None:
        sp.ensure_persona_layout()
        saved = sp.save_persona_config({"heartbeat_enabled": False, "heartbeat_interval_minutes": 15})
        self.assertFalse(saved["heartbeat_enabled"])
        self.assertEqual(saved["heartbeat_interval_minutes"], 15)
        loaded = sp.load_persona_config()
        self.assertEqual(loaded["heartbeat_interval_minutes"], 15)


if __name__ == "__main__":
    unittest.main()
