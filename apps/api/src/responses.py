"""Intent-routed response pool for the mock agent.

The mock does not call a real LLM by default. To keep the demo from always
replying the same thing, user messages are routed to a Labor-Relations intent by
keyword, and each intent carries a few paraphrased intros/answers (picked at
random) plus the CBA clauses it cites. The clauses feed both the
``search_cba_clause`` tool result and the ``STATE_DELTA`` context panel.
"""

from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass(frozen=True)
class Intent:
    key: str
    keywords: tuple[str, ...]
    intros: tuple[str, ...]
    answers: tuple[str, ...]
    clauses: tuple[dict[str, str], ...]


# --- CBA clause snippets (reused across intents) ---------------------------

_OVERTIME = {
    "id": "cba-2024-art-12",
    "union": "Local 100 - Transit Workers",
    "section": "Article XII - Overtime Compensation",
    "excerpt": (
        "Overtime work performed in excess of forty (40) hours per week shall be "
        "compensated at one and one-half (1.5) times the regular hourly rate."
    ),
}
_HOLIDAY = {
    "id": "cba-2024-art-18",
    "union": "Local 100 - Transit Workers",
    "section": "Article XVIII - Holiday Pay",
    "excerpt": (
        "Employees required to work on a recognized holiday shall receive double "
        "(2.0) their regular hourly rate for all hours worked on such holiday."
    ),
}
_SENIORITY = {
    "id": "cba-2024-art-05",
    "union": "Local 100 - Transit Workers",
    "section": "Article V - Seniority and Layoff",
    "excerpt": (
        "In the event of a layoff, employees shall be laid off in inverse order of "
        "seniority, and recalled in order of seniority, within their classification."
    ),
}
_GRIEVANCE = {
    "id": "cba-2024-art-20",
    "union": "Local 100 - Transit Workers",
    "section": "Article XX - Grievance Procedure",
    "excerpt": (
        "A grievance must be filed in writing within fifteen (15) working days of "
        "the event giving rise to it; unresolved grievances may proceed to binding "
        "arbitration."
    ),
}
_LEAVE = {
    "id": "cba-2024-art-15",
    "union": "Local 100 - Transit Workers",
    "section": "Article XV - Paid Leave",
    "excerpt": (
        "Full-time employees accrue paid vacation at one (1) day per completed month "
        "of service, to a maximum of fifteen (15) days per contract year."
    ),
}


_INTENTS: tuple[Intent, ...] = (
    Intent(
        key="overtime",
        keywords=("overtime", "ot ", " ot", "40 hour", "time and a half", "1.5"),
        intros=(
            "Let me pull the overtime provisions from the current CBA...",
            "Checking the overtime compensation clauses for you...",
            "One moment — searching the agreement for overtime terms...",
        ),
        answers=(
            "Under Article XII, hours worked beyond 40 in a week are paid at 1.5x the "
            "regular rate. I've cited the clause in the panel on the right.",
            "Overtime past 40 hours/week is compensated at one-and-a-half times the "
            "regular hourly rate (Article XII). See the cited clause for the exact text.",
            "Per the Local 100 CBA, anything over 40 hours weekly is time-and-a-half "
            "(1.5x). The governing clause is now in the context panel.",
        ),
        clauses=(_OVERTIME, _HOLIDAY),
    ),
    Intent(
        key="holiday",
        keywords=("holiday", "double time", "2.0x", "double pay"),
        intros=(
            "Looking up the holiday pay rules...",
            "Let me find the holiday compensation clause...",
        ),
        answers=(
            "Work performed on a recognized holiday is paid at double (2.0x) the regular "
            "rate, per Article XVIII. The clause is in the panel.",
            "Holiday work is compensated at 2.0x the regular hourly rate (Article XVIII). "
            "I've added the clause to the context panel.",
        ),
        clauses=(_HOLIDAY,),
    ),
    Intent(
        key="seniority",
        keywords=("seniority", "layoff", "lay off", "recall", "bump"),
        intros=(
            "Searching the seniority and layoff provisions...",
            "Let me check how seniority governs layoffs here...",
        ),
        answers=(
            "Layoffs follow inverse seniority and recalls follow seniority, within the "
            "classification (Article V). The clause is cited on the right.",
            "Per Article V, the least senior employees in a classification are laid off "
            "first and recalled last. See the cited clause.",
        ),
        clauses=(_SENIORITY,),
    ),
    Intent(
        key="grievance",
        keywords=("grievance", "dispute", "arbitration", "complaint", "file a"),
        intros=(
            "Let me look up the grievance procedure...",
            "Checking the grievance and arbitration timeline...",
        ),
        answers=(
            "A grievance must be filed in writing within 15 working days; if unresolved "
            "it can go to binding arbitration (Article XX). Clause cited in the panel.",
            "Per Article XX, you have 15 working days to file in writing, and unresolved "
            "grievances may proceed to binding arbitration.",
        ),
        clauses=(_GRIEVANCE,),
    ),
    Intent(
        key="leave",
        keywords=("vacation", "pto", "paid leave", "sick", "time off", "accrue"),
        intros=(
            "Pulling the paid-leave accrual terms...",
            "Let me find the vacation accrual clause...",
        ),
        answers=(
            "Full-time staff accrue 1 vacation day per completed month, up to 15 days a "
            "contract year (Article XV). The clause is in the panel.",
            "Per Article XV, paid vacation accrues at one day per month of service, "
            "capped at 15 days per contract year.",
        ),
        clauses=(_LEAVE,),
    ),
)

_FALLBACK = Intent(
    key="general",
    keywords=(),
    intros=(
        "Let me search the relevant CBA clauses for you...",
        "Searching the collective bargaining agreement...",
        "One moment while I look that up in the agreement...",
    ),
    answers=(
        "Based on the current CBA for Local 100, overtime above 40 hours/week is paid at "
        "1.5x and holiday work at 2.0x. I've added both clauses to the context panel.",
        "Here's what the Local 100 agreement says on common pay questions: overtime is "
        "1.5x beyond 40 hours and holidays are 2.0x. See the cited clauses on the right.",
    ),
    clauses=(_OVERTIME, _HOLIDAY),
)


def select_intent(text: str) -> Intent:
    """Route a user message to an intent by keyword; fall back to ``general``."""
    haystack = f" {text.lower()} "
    for intent in _INTENTS:
        if any(kw in haystack for kw in intent.keywords):
            return intent
    return _FALLBACK


def pick_intro(intent: Intent, rng: random.Random = random) -> str:
    return rng.choice(intent.intros)


def pick_answer(intent: Intent, rng: random.Random = random) -> str:
    return rng.choice(intent.answers)


def build_llm_prompt(intent: Intent, user_text: str) -> tuple[str, str]:
    """Return (system, user) prompts for the optional Ollama path, grounded in the
    selected intent's clauses so the model stays on-topic."""
    clause_text = "\n".join(f"- {c['section']}: {c['excerpt']}" for c in intent.clauses)
    system = (
        "You are a Labor Relations assistant for the Local 100 CBA. Answer in 2-3 "
        "sentences, concise and professional. Ground your answer ONLY in the provided "
        "clauses and mention the relevant Article. Do not invent figures.\n\n"
        f"Relevant clauses:\n{clause_text}"
    )
    return system, user_text
