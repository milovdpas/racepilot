# Roadmap & planned features

Planned / deferred **features**, with enough context for an agent to pick them
up. Update this when shipping an item (move it out) or when scoping a new one.
See [`architecture.md`](architecture.md) for how the app is built, and
[`tech-debt.md`](tech-debt.md) for known refactors that were deliberately
deferred (tests, duplication, oversized views).

---

## 1. In-app AI plan coach (chat to edit your plan)

**Status:** designed, deferred. Full design already written in
[`ai-plan-coach.md`](ai-plan-coach.md) — read that before starting.

**Summary:** a chat panel where the user types a change ("I'm sick, make next
week easy") and an LLM edits the active plan via tool calls mapped to the store
actions. Chosen approach: in-app chat with the user's **own** API key (no
backend); see the doc for the tool schema, guardrails (propose-diff-then-confirm),
and the path to a serverless-proxy variant.

**Note:** today the equivalent is the **manual** export→AI→import flow already
shipped (the "Edit your plan with AI" prompt in Settings, and the add-plan
wizard). This item is about making that in-app/conversational.

---

## How to propose a new future item

Add a section here with: **what** it is, **why**, **where it hooks in** (files +
existing utilities to reuse), **what it entails**, and **considerations/risks**.
If it's large, write a dedicated `docs/<feature>.md` and link it from here.
