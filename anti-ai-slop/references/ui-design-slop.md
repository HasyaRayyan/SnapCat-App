# UI & Frontend Design Slop

Guidelines for detecting and eliminating generic "AI template" aesthetics in web applications, dashboards, and landing pages.

---

## 1. The "Generic AI SaaS" Aesthetic

When asked to design a modern interface, language models default to a predictable, tired visual language:
- **Pitch black background (`#000000`) with glowing electric purple / cyan blur orbs**.
- **Transparent glassmorphic cards (`backdrop-blur-md bg-white/5 border border-white/10`)** with zero contrast or legibility.
- **Identical 3-column pricing or feature grids** with generic Lucide icons (Rocket, Sparkles, Lightning bolt).
- **Vague stock hero text**: *"Supercharge Your Workflow with Next-Gen Intelligence"*.

### The Remedy: Grounded Aesthetics
- **Purposeful Color System**: Derive colors from the domain, brand identity, or real materials (slate, cream, forest green, warm amber, corporate navy) rather than AI cyberpunk purple.
- **Solid Contrast & Hierarchy**: Real cards need solid or high-contrast backgrounds with defined elevations and shadows, not semi-transparent illegible glass.
- **Domain-Specific Terminology**: Speak directly to the user's task. Replace "Empower your workflows" with "Reconcile payment discrepancies".

---

## 2. The Missing Micro-States (The AI Blindspot)

AI models excel at generating static "happy path" UI mockups but almost universally omit essential real-world application states:

### The 7 Essential States Checklist
1. **Loading State**: Skeletons or pulse states that match the final content geometry; no sudden layout shift.
2. **Empty State**: What does the card/table look like when `items.length === 0`? Include an illustrative icon, brief message, and a primary action button ("Create your first invoice").
3. **Error State**: Inline banners or fallback components with a retry button when an API call fails.
4. **Hover State**: Subtle, performance-friendly background or border transitions (using `transition-colors duration-150`).
5. **Tactile Active/Press State**: Buttons must feel physical. Use `active:scale-[0.98]` or `active:translate-y-px`.
6. **Focus-Visible State**: Never write `outline: none` without providing a distinct focus ring (e.g., `focus-visible:ring-2 focus-visible:ring-offset-2`). Accessibility is non-negotiable.
7. **Reduced Motion**: Respect `@media (prefers-reduced-motion: reduce)`. Eliminate continuous spin or spring animations when requested by the OS.

---

## 3. Layout Responsiveness & Mobile Collapse

### Slop Symptom
AI frequently hardcodes multi-column grids (e.g. `grid-cols-4` or `w-[800px]`) without responsive breakpoints, resulting in clipped text or horizontal scrolling on mobile viewports.

### Remedy
- Default to mobile-first column stacking: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.
- Use fluid clamping (`clamp()`) or responsive typography scales.
- Ensure touch targets are at least `44x44px` on touch devices.
