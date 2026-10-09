---
name: anti-ai-slop
class: discipline
description: >-
  Detects, eliminates, and prevents AI slop across code, prose, documentation,
  architecture, and UI design. Use when auditing for AI tells, stripping
  hallucinated or redundant abstractions, purging synthetic filler phrases,
  removing obvious comments, or enforcing human-first technical rigor.
---

# Anti AI Slop

Eliminate low-value, hallucinated, overly defensive, sycophantic, and formulaic artifacts introduced by language models. Ground all output in human craftsmanship, domain intent, and concrete necessity.

## Working rules

- **Subtraction over addition**: The fastest way to improve AI output is deleting what does not need to exist. Zero code or prose is better than unnecessary code or prose.
- **Chesterton's fence**: Before removing an apparent redundant guard, differentiate an *external hazard* (network drop, race condition, platform bug, untrusted user payload) from *unearned cargo-cult* (checking undefined 4 times on a typed local variable). Retain guards against external hazards unless upstream handling is proven.
- **Ban the synthetic assistant register**: In docs, PRs, comments, and conversation, ban canned sycophancy ("Certainly!", "I'd be happy to help"), filler padding ("In today's fast-paced digital world..."), and fake-profound endings.
- **Reject generic visual templates**: In frontend design, reject the cliche purple-indigo dark-mode glow, feature cards with placeholder icons, and stock copy ("Empower your workflow"). Build state-complete interfaces with real tactile feedback.
- **Verify invariants after purge**: In code, simplification must preserve behavior, public API contracts, return types, and side effects. Run tests and type checks after every purge.

## Taxonomy of Slop

| Domain | Slop Smells | Root Cause |
|---|---|---|
| **Code** | Restating comments (`// increments counter`), paranoid multi-null checks, single-implementation interfaces, factory-of-one, phantom error wrapping (`catch(e) { throw e; }`), hand-rolled stdlib loops, stubbed TODOs (`// ...rest of code`) | LLM attempts to look thorough and defensive without understanding runtime guarantees |
| **Prose & Docs** | AI buzzwords (*delve, tapestry, testament, beacon, pivotal, overarching*), sycophancy, symmetrical 3-point lists with identical verb-object phrasing, vacuous summaries, false balance | RLHF training rewarding polite, risk-averse, formulaic essay structures |
| **UI & Frontend** | Purple/indigo dark-mode glow, floating cards with 1px border blur, identical 3-column pricing, missing interactive states (hover/focus/active/empty/error), generic placeholder text | Defaulting to popular landing page training corpuses without thinking about real UX |
| **Architecture** | Premature microservices, 7-layer Clean Architecture for a 2-column CRUD table, generic event buses for direct function calls | Over-indexing on enterprise patterns to mimic perceived "best practices" |

## Modes

- **Audit (`detect`)**: Scan existing files, diffs, or drafts. Report findings with file:line citations, severity rating (`Critical`, `Important`, `Minor`), and concrete human rewrites. Do not modify files in audit mode.
- **Purge (`remedy`)**: Surgically refactor and clean. Strip restating comments, inline unearned wrappers, remove redundant try-catches, replace boilerplate with idiomatic stdlib calls, humanize copy. Run tests and verify behavior parity.
- **Guard (`authoring`)**: Enforce zero-slop constraints while generating fresh code, writing documentation, or creating UI components from line one.

## The Anti-Slop Workflow

1. **Classify Scope & Surface**: Determine whether the target is code, documentation, UI component, or architecture specification.
2. **Apply Diagnostic Filter**:
   - For code: Run the [code-slop-catalog.md](./references/code-slop-catalog.md) filter. Look for comment noise, cargo-cult guards, over-abstraction, and stack-squashing errors.
   - For prose: Run the [prose-and-docs-slop.md](./references/prose-and-docs-slop.md) blacklist and structural check.
   - For UI: Run the [ui-design-slop.md](./references/ui-design-slop.md) checklist. Inspect interactive states, typography, and color intent.
3. **Execute Surgical Removal**:
   - Strip comments that explain *what* the code does instead of *why*.
   - Unwrap single-implementation abstractions into direct calls.
   - Replace hand-rolled loops with idiomatic language utilities (`Array.prototype.filter`, `array_map`, list comprehensions).
   - Delete formulaic introductions and fake-profound conclusions in text.
4. **Preserve Invariants**:
   - Check public interfaces, schemas, and external consumers before deleting or renaming identifiers.
   - Keep defensive guards that handle actual I/O, untrusted boundaries, or asynchronous race conditions.
5. **Verify**:
   - Ensure test suite passes and type checker succeeds with zero warnings.
   - Ensure rendered UI has visible focus states, loading states, and error handling.
   - Audit the final diff: every retained line must earn its existence.

## High-Impact Transformations

| Slop Pattern | Slop Example | Anti-Slop Fix |
|---|---|---|
| **Restating Comment** | `// Check if user is active`<br>`if (user.isActive) {` | Delete comment completely. The code is already self-describing. |
| **Paranoid Guard** | `if (id !== null && id !== undefined && typeof id === 'string' && id.length > 0)` in typed code | `if (id)` or rely on TypeScript type narrowing. |
| **Phantom Error Catch** | `try { await save(data); } catch (err) { logger.error(err); throw err; }` | Let the caller handle it or use an unhandled rejection boundary unless adding actual context. |
| **Premature Factory** | `interface UserFactory { create(): User; }`<br>`class DefaultUserFactory implements UserFactory { ... }` (only 1 user type) | `function createUser(params: UserParams): User { ... }` |
| **AI Prose Cliché** | *"In today's fast-paced landscape, it is pivotal to delve deep into the tapestry of cloud solutions..."* | *"Cloud infrastructure requires predictable latency and clear failover strategies."* |
| **Generic UI Hero** | *"Supercharge Your Workflow with Next-Gen Intelligence"* + purple gradient button | Specific domain value: *"Track inventory discrepancies in real time"* + brand-aligned tokens. |

## Stop Conditions

Stop and ask before proceeding when:
- Removing a guard where it is ambiguous whether an upstream caller guarantees non-null/valid data.
- Deleting an abstraction that may be exported or consumed across service or package boundaries.
- Refactoring involves changing public API method signatures or database schemas.
- Prose editing risks altering legally binding terms, compliance statements, or sensitive security disclaimers.

## Verify

- No restating or superficial comments remain in changed files.
- No single-implementation wrappers or factory-of-one classes introduced.
- No swallowed errors (`catch(e) {}` with no handling or stack-killing wrappers).
- All banned AI words (*delve, tapestry, testament, pivotal, beacon, etc.*) removed from prose.
- UI components include hover, active/press, focus-visible, loading, and empty states.
- All existing tests pass and types check cleanly.

## References

- [Code Slop Catalog](./references/code-slop-catalog.md) -- Detailed catalog of code anti-patterns, premature abstractions, fake error wraps, redundant guards, and clean replacements.
- [Prose & Documentation Slop](./references/prose-and-docs-slop.md) -- Vocabulary blacklist, formulaic structural patterns, conversational sycophancy, and humanizing rewrites.
- [UI & Design Slop](./references/ui-design-slop.md) -- Generic AI design cliches, missing micro-states, token discipline, and domain-grounded frontend aesthetics.
- [Audit & Verification Checklist](./references/audit-checklist.md) -- 60-second review rubric, severity triage table, and regex search patterns for scanning code and text.
