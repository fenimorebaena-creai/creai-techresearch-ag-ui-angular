"""Tests for intent routing in the mock agent's response pool."""

from __future__ import annotations

import pytest

from src import responses


@pytest.mark.parametrize(
    ("text", "expected_key"),
    [
        ("What is the overtime rate?", "overtime"),
        ("Do we get double time on a holiday?", "holiday"),
        ("How does seniority affect a layoff?", "seniority"),
        ("How do I file a grievance?", "grievance"),
        ("How much vacation do I accrue?", "leave"),
        ("Tell me about the union", "general"),
    ],
)
def test_select_intent_routes_by_keyword(text: str, expected_key: str) -> None:
    assert responses.select_intent(text).key == expected_key


def test_every_intent_has_clauses_and_variants() -> None:
    for intent in (*responses._INTENTS, responses._FALLBACK):
        assert intent.clauses, f"{intent.key} has no clauses"
        assert intent.intros and intent.answers
        for clause in intent.clauses:
            assert {"id", "union", "section", "excerpt"} <= clause.keys()


def test_pickers_return_pool_members() -> None:
    intent = responses.select_intent("overtime pay")
    assert responses.pick_intro(intent) in intent.intros
    assert responses.pick_answer(intent) in intent.answers


def test_build_llm_prompt_grounds_in_clauses() -> None:
    intent = responses.select_intent("overtime")
    system, user = responses.build_llm_prompt(intent, "overtime?")
    assert "Article XII" in system
    assert user == "overtime?"
