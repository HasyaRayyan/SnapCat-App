# Prose & Documentation Slop

Guidelines for detecting, stripping, and humanizing synthetic AI writing patterns across documentation, PR descriptions, commit messages, and technical explanations.

---

## 1. The Banned AI Vocabulary (Hall-of-Fame)

Language models over-index on specific evocative adjectives and transitional phrases that immediately identify text as synthetic slop.

### Banned Word / Phrase List
| Category | Slop Words to Eradicate |
|---|---|
| **Verbs** | *delve, embark, harness, unlock, revolutionize, elevate, foster, empower, navigate, demystify* |
| **Nouns** | *tapestry, beacon, testament, realm, synergy, landscape, paradigm, nuances, facets* |
| **Adjectives** | *pivotal, overarching, multifaceted, bustling, vibrant, indispensable, robust, seamless* |
| **Transitions** | *In conclusion, In summary, It is worth noting that, It is important to bear in mind, Furthermore, Moreover, By leveraging...* |

### Replacement Strategy
Replace with plain, direct Anglo-Saxon words:
- Instead of *"delve into the codebase"*, write *"inspect the code"* or *"read the files"*.
- Instead of *"a testament to our robust architecture"*, write *"our architecture handled 50k req/s without crashing"*.
- Instead of *"harnessing the power of caching"*, write *"caching queries in Redis"*.
- Instead of *"It is important to note that the API has rate limits"*, write *"The API rate limits at 60 req/min"*.

---

## 2. Conversational Sycophancy & Artificial Pleasantries

### Smell
Unprompted flattery, artificial cheerfulness, and robotic acknowledgments before answering technical questions.

```text
SLOP:
"Certainly! I would be absolutely delighted to help you refactor this function! That's a fantastic question. Let's explore how we can optimize this together to ensure seamless integration into your project."
```

### Remedy
Start immediately with the solution. Zero preamble.

```text
HUMAN-FIRST:
"Here is the refactored function with the redundant loop removed:"
```

---

## 3. Formulaic Structure (The 3-Act AI Essay)

### The Cliché Pattern
AI drafts almost always follow this rigid template:
1. **Introductory platitude**: *"In today's modern development workflow, automated testing plays an overarching role..."*
2. **The Symmetrical Rule of Three**: Exactly three bullet points, each starting with the exact same grammatical structure (e.g. *Action Verb + Adjective + Noun*):
   - *Enhance developer productivity*
   - *Mitigate deployment risks*
   - *Streamline release cadence*
3. **Fake-profound ending**: *"In conclusion, testing is not merely a practice, but a foundational pillar of sustainable engineering excellence."*

### Humanizing Fix
- Delete the introduction and conclusion completely.
- Break mechanical symmetry: real human writing varies sentence length, rhythm, and structure.
- Lead with the concrete conclusion or takeaway.

---

## 4. False Balance & Vague Generalizations

### Smell
Refusing to commit to a technical decision by giving equal weight to bad options, or talking in vague abstractions without real numbers or constraints.

```text
SLOP:
"Choosing between PostgreSQL and MongoDB depends on various multifaceted factors. PostgreSQL offers robust relational capabilities, while MongoDB provides flexible schema paradigms. Both have their merits and demerits depending on your unique organizational objectives."
```

```text
HUMAN-FIRST:
"Use PostgreSQL. We have relational customer and billing records that require ACID transactions. MongoDB offers no advantage for this schema and adds operational overhead."
```

---

## 5. PR & Git Commit Slop

### Commit Message Slop
- **Bad**: `Refactor codebase to enhance maintainability and optimize performance`
- **Good**: `Replace custom array filter loop with Array.prototype.filter`

### PR Description Slop
- **Bad**: An 8-paragraph treatise explaining what Git commits are, repeating the diff word-for-word, and concluding with *"Happy coding!"*.
- **Good**:
  ```markdown
  ## Context
  Fixes slow order checkout query caused by missing foreign key index on `order_items.product_id`.

  ## Changes
  - Added index `idx_order_items_product_id` via migration `2026_09_24_add_index.sql`.
  - Tested on 100k seeded rows: checkout query dropped from 420ms to 4ms.
  ```
