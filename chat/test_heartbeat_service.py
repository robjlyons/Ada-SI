"""Tests for heartbeat interval gating and maintenance prompt."""

from __future__ import annotations

import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import scout_persona as sp
from heartbeat_service import _maintenance_rules


class HeartbeatServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._persona_dir = Path(self._tmpdir.name) / "persona"
        self._env_patch = patch.dict("os.environ", {"ADA_PERSONA_DIR": str(self._persona_dir)})
        self._env_patch.start()
        sp.ensure_persona_layout()

    def tearDown(self) -> None:
        self._env_patch.stop()
        self._tmpdir.cleanup()

    def test_maintenance_rules_forbid_soul_replace(self) -> None:
        rules = _maintenance_rules()
        self.assertIn("memory_replace", rules)
        self.assertIn("Do not use soul_replace", rules)

    def test_heartbeat_state_tracks_last_run(self) -> None:
        sp.set_heartbeat_state(last_run_utc=datetime.now(timezone.utc).isoformat())
        state = sp.get_heartbeat_state()
        self.assertIn("last_run_utc", state)

    def test_heartbeat_disabled_via_config(self) -> None:
        sp.save_persona_config({"heartbeat_enabled": False})
        config = sp.load_persona_config()
        self.assertFalse(config["heartbeat_enabled"])


if __name__ == "__main__":
    unittest.main()
