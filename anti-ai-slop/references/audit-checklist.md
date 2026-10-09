# Anti-Slop Audit & Verification Checklist

Use this checklist to conduct a fast 60-second audit on any PR, diff, code file, or document before merging.

---

## Quick 60-Second Scan

Scan the target diff and ask these 5 questions:
1. **Did I delete more lines than I added?** (Slop adds mass; craftsmanship subtracts it).
2. **Are there comments explaining obvious code?** (Kill every comment that simply narrates the syntax).
3. **Are there defensive checks on values guaranteed by types or framework?** (If TypeScript/ORM guarantees it, remove the check).
4. **Are there banned AI buzzwords or synthetic sycophancy in text?** (*delve, tapestry, pivotal, beacon, "Certainly!"*).
5. **Are UI components complete with loading, empty, and focus states?**

---

## Severity Rubric

| Severity | Smells | Action Required |
|---|---|---|
| **Critical** | Swallowed errors (`catch(e){}`), hallucinated API methods, broken mobile layout, broken type safety via `as any` to silence linter | Must fix before merge. Blocks PR. |
| **Important** | Premature factory/interface with only 1 implementation, hand-rolled loop replacing standard library, missing loading/error UI states, AI buzzword salad in user-facing copy | Fix before merge. |
| **Minor / Nit** | Restating comment on helper method, slightly formulaic commit message, minor redundant null check in internal helper | Suggest cleanup; non-blocking. |

---

## Fast Automated Heuristics (Ripgrep / Grep)

Run these checks in your terminal to catch slop instantly:

```bash
# 1. Search for common AI vocabulary in docs and markdown
rg -i "(delve|tapestry|beacon|pivotal|overarching|testament|multifaceted|seamlessly)" *.md docs/

# 2. Search for restating/superficial comments
rg "(//\s*(check if|loop through|increment|set state|return|constructor))" src/

# 3. Search for swallowed or stack-killing errors
rg "catch\s*\([^\)]+\)\s*\{\s*throw\s+\w+;\s*\}" src/
rg "catch\s*\([^\)]+\)\s*\{\s*\}" src/

# 4. Search for lazy AI stubs
rg "(//\s*\.\.\.|//\s*TODO:\s*implement|//\s*add more as needed)" src/
```
