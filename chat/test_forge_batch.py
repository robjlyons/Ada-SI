"""Tests for multi-tool forge batch orchestration."""

import asyncio
import unittest

from forge_batch import (
    BATCH_MAX_TOOLS,
    BATCH_MIN_TOOLS,
    PENDING_FORGE_BATCHES,
    RUNTIME_INSTALL_LOCK,
    approve_all_plans,
    approve_plan,
    create_batch,
    plan_ids_ready_to_build,
    reject_plan,
    validate_batch_tools,
)


def _tool_exists(_name: str) -> bool:
    return False


class ForgeBatchTests(unittest.TestCase):
    def tearDown(self) -> None:
        PENDING_FORGE_BATCHES.clear()

    def test_validate_batch_tools_count_limits(self) -> None:
        with self.assertRaises(ValueError):
            validate_batch_tools([], tool_exists=_tool_exists)

        one = [{"tool_name": "only_one", "description": "x"}]
        with self.assertRaises(ValueError):
            validate_batch_tools(one, tool_exists=_tool_exists)

        too_many = [
            {"tool_name": f"tool_{i}", "description": "d"} for i in range(BATCH_MAX_TOOLS + 1)
        ]
        with self.assertRaises(ValueError):
            validate_batch_tools(too_many, tool_exists=_tool_exists)

    def test_validate_batch_tools_rejects_duplicates_and_bad_names(self) -> None:
        tools = [
            {"tool_name": "get_weather", "description": "Weather"},
            {"tool_name": "get_weather", "description": "Dup"},
        ]
        with self.assertRaises(ValueError):
            validate_batch_tools(tools, tool_exists=_tool_exists)

        bad = [
            {"tool_name": "get_weather", "description": "ok"},
            {"tool_name": "Bad-Name", "description": "bad"},
        ]
        with self.assertRaises(ValueError):
            validate_batch_tools(bad, tool_exists=_tool_exists)

    def test_create_batch_assigns_unique_plan_ids(self) -> None:
        tools = validate_batch_tools(
            [
                {"tool_name": "get_weather", "description": "Weather API"},
                {"tool_name": "get_stocks", "description": "Stock prices"},
            ],
            tool_exists=_tool_exists,
        )
        batch_id, batch = create_batch(
            run_id="run1",
            tools=tools,
            summary="Two tools",
            creator_model="test-model",
            reasoning_effort=None,
        )
        self.assertIn(batch_id, PENDING_FORGE_BATCHES)
        plan_ids = [entry["plan_id"] for entry in batch["tools"]]
        self.assertEqual(len(plan_ids), 2)
        self.assertEqual(len(set(plan_ids)), 2)

    def test_approve_all_plans_requires_all_drafted(self) -> None:
        tools = validate_batch_tools(
            [
                {"tool_name": "a_tool", "description": "A"},
                {"tool_name": "b_tool", "description": "B"},
            ],
            tool_exists=_tool_exists,
        )
        batch_id, _ = create_batch(
            run_id="run1",
            tools=tools,
            summary="s",
            creator_model="m",
            reasoning_effort=None,
        )
        with self.assertRaises(ValueError):
            approve_all_plans(batch_id)

        batch = PENDING_FORGE_BATCHES[batch_id]
        batch["tools"][0]["status"] = "plan_ready"
        batch["tools"][1]["status"] = "drafting"
        with self.assertRaises(ValueError):
            approve_all_plans(batch_id)

        batch["tools"][1]["status"] = "plan_ready"
        approve_all_plans(batch_id)
        self.assertTrue(all(entry["status"] == "plan_approved" for entry in batch["tools"]))

    def test_approve_plan_and_build_queue(self) -> None:
        tools = validate_batch_tools(
            [
                {"tool_name": "x_tool", "description": "X"},
                {"tool_name": "y_tool", "description": "Y"},
            ],
            tool_exists=_tool_exists,
        )
        batch_id, batch = create_batch(
            run_id="run1",
            tools=tools,
            summary="s",
            creator_model="m",
            reasoning_effort=None,
        )
        pid = batch["tools"][0]["plan_id"]
        batch["tools"][0]["status"] = "plan_ready"
        approve_plan(batch_id, pid)
        self.assertEqual(batch["tools"][0]["status"], "plan_approved")

        ready = plan_ids_ready_to_build(batch, None)
        self.assertEqual(ready, [pid])

        reject_plan(batch_id, batch["tools"][1]["plan_id"])
        self.assertEqual(batch["tools"][1]["status"], "skipped")

    def test_runtime_install_lock_serializes(self) -> None:
        async def _run() -> None:
            order: list[str] = []

            async def work(name: str) -> None:
                async with RUNTIME_INSTALL_LOCK:
                    order.append(f"{name}-start")
                    await asyncio.sleep(0.05)
                    order.append(f"{name}-end")

            await asyncio.gather(work("a"), work("b"))
            self.assertIn("a-start", order)
            self.assertIn("b-start", order)
            self.assertTrue(
                (order[1] == "a-end" and order[2] == "b-start")
                or (order[1] == "b-end" and order[2] == "a-start")
            )

        asyncio.run(_run())


if __name__ == "__main__":
    unittest.main()
