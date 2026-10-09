# ia-anti-ai-slop Specification

## Intent

`ia-anti-ai-slop` is a `discipline`-class skill (an engineering practice not tied to one stack). Detects, prevents, and eliminates AI slop across code, prose, documentation, architecture, and user interfaces. Use when auditing code or text for AI tells, removing hallucinated or redundant abstractions, stripping synthetic pleasantries, de-bloating boilerplate, or establishing human-first rigor.

## Scope

In scope:
- Behaviors described in `SKILL.md` and routed via should_trigger phrasings.
- Auditing code, prose, UI, and architecture for automated / LLM hallucination and slop patterns.
- Concrete purge and refactoring workflows that preserve domain invariants and behavior while ruthlessly cutting bloat.
- Prevention guidelines (pre-commit, prompt constraints, review checklists).

Out of scope:
- General debugging of runtime crashes (routed to `ia-debugging`).
- General feature development or greenfield UI design (routed to `ia-frontend-design`).
- Full test suite authoring (routed to `ia-writing-tests`).
- Deep architectural performance optimization (routed to stack-specific skills).

## Trigger Context

- Class: `discipline`
- Hook regex: `plugins/whetstone/hooks/skill-patterns.sh` -> `SKILL_PATTERNS[ia-anti-ai-slop]`
- Common requests (from fixture should_trigger):
  - "clean up this AI slop from the PR"
  - "remove unnecessary comments and over-engineered boilerplate"
  - "this reads like ChatGPT wrote it, make it sound human and concise"
  - "audit this code for AI hallucinations, fake defensive checks, and redundant wrappers"
  - "stop writing generic purple SaaS landing page components"
  - "refactor this code to be simple and remove artificial defensive code"
- Should not trigger for (from fixture should_not_trigger):
  - "why is this database query throwing a syntax error"
  - "install tailwind and configure postcss"
  - "write end-to-end playwright tests for checkout"
  - "add a new column to the users table"
  - "deploy the application to AWS ECS"

## Source And Evidence Model

Authoritative sources:

- `SKILL.md` -- runtime instructions and reference routing.
- `references/*.md` -- bundled supplementary content (4 file(s)).
- `distillery/tests/fixtures/triggers/ia-anti-ai-slop.jsonl` -- positive and negative trigger phrasings under regression test.
- `plugins/whetstone/hooks/skill-patterns.sh` -- regex pattern that fires this skill.
- `distillery/.eval-data/ia-anti-ai-slop/` -- harvested session examples (when present).

Data that must not be stored in this skill or its references:

- Secrets, credentials, tokens.
- Machine-specific filesystem paths (`/home/...`, `/Users/...`, `~/ai/...`).
- Private URLs, customer data, or unredacted personal information.

### Coverage matrix

| Dimension | Status | Evidence |
|---|---|---|
| Trigger fixtures | complete | distillery/tests/fixtures/triggers/ia-anti-ai-slop.jsonl (>=5 should_trigger, >=5 should_not_trigger) |
| Hook regex pattern | complete | plugins/whetstone/hooks/skill-patterns.sh (`SKILL_PATTERNS[ia-anti-ai-slop]`) |
| Reference architecture | complete | 4 file(s) under references/ |
| Real-usage signal | pending | distillery/.eval-data/ia-anti-ai-slop/ |

## Evaluation

Lightweight (run on every change):

```bash
# Verify skill structure and references integrity
pytest distillery/tests/test_skills.py -k "ia-anti-ai-slop"
```
