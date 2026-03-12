# The Humphrey Writing Index (HWI)

A practical scoring system to answer one question:

**Does this draft sound like Austin Humphrey, and does it carry Austin‑level reasoning discipline?**

Use it to:
- audit AI‑assisted drafts
- detect “voice drift” over time
- coach collaborators and editors
- keep multi‑author projects anchored in one consistent engine

---

## Scoring overview

### Step 1: Score the 9 core categories (0–100)
Each category is scored on a 0–5 scale and weighted.

### Step 2: Apply anti‑pattern deductions (0 to –15)
These are the most common ways drafts drift into generic AI or generic academic voice.

### Final score

**HWI = Core Score (0–100) – Deductions (0–15)**

### Thresholds

- **90–100**: Signature Austin. Publish as‑is.
- **80–89**: Strong Austin. Minor tightening only.
- **70–79**: “Austin‑adjacent.” Rewrite weakest two categories.
- **< 70**: Voice drift. Rebuild structure and cadence.

---

## Core categories

### 1) Position and claim pressure (Weight: 15)

**Question:** Does the piece commit to a testable position early, then defend it?

**5/5 signals**
- The claim appears in the opening 1–3 paragraphs.
- The claim is concrete enough to be wrong.
- The piece doesn’t “tour the topic” before taking a stance.

**0/5 signals**
- Polite hedging, vague framing, or “it depends” without a decision.
- Thesis arrives late or never arrives.

**Quick tests**
- Can you underline one sentence that functions as the verdict?
- If you delete the first paragraph, does the argument still start on page one?

---

### 2) Systemic lens and causal chain (Weight: 15)

**Question:** Does it place the event inside a system and explain what drives what?

**5/5 signals**
- Defines the system (incentives, constraints, feedback loops).
- Uses causal language deliberately (because, therefore, which means).
- Tracks second‑order consequences (the consequence of the consequence).

**0/5 signals**
- “Things happened” narration with no mechanism.
- Analysis that stays at the surface story.

**Quick tests**
- Count causal connectors per 500 words. Target: enough to show mechanism, not so many it becomes robotic.
- If you remove all adjectives, does the logic still stand?

---

### 3) Evidence at the point of need (Weight: 15)

**Question:** Does evidence land exactly where the claim needs it, and is sourcing discipline visible?

**5/5 signals**
- Facts and numbers appear in the same paragraph as the claim they support.
- Evidence is interpreted immediately (not dropped like a brick).
- Unavailable data is acknowledged (transparent constraints).

**0/5 signals**
- Evidence is front‑loaded in a “data dump.”
- No sourcing discipline in high‑specificity claims.
- Fake specificity (numbers with no provenance).

**Quick tests**
- Highlight every number. For each one, ask: *what claim does this number prove?*
- If something is reconstructed, is it labeled as reconstructed?

---

### 4) Counterintuitive turn (Weight: 10)

**Question:** Does the piece deliver at least one second‑order insight that reverses the obvious read?

**5/5 signals**
- Names the expected narrative.
- Shows why it’s incomplete.
- Replaces it with a deeper mechanism.

**0/5 signals**
- The piece only confirms what readers already believe.
- No “turn” moment.

**Quick tests**
- Can you point to a sentence that begins with “But” or “What this misses…” and actually earns it?

---

### 5) Human anchor and concreteness (Weight: 10)

**Question:** Does the analysis land on real people, real places, real objects, or real constraints?

**5/5 signals**
- Includes at least one concrete anchor per major section (a place, a moment, an object, a specific stakeholder).
- “The common man” appears as a real person, not a generic victim.

**0/5 signals**
- Disembodied analysis.
- Emotional inflation with no sensory grounding.

**Quick tests**
- Circle every proper noun (person, place, team, institution). If there are none, the piece is probably floating.

---

### 6) Comparative structure and contrast (Weight: 10)

**Question:** Does it generate insight by placing two things side‑by‑side?

**5/5 signals**
- Uses contrast to unmask mechanism (X looks different next to Y).
- Comparisons are functional, not decorative.

**0/5 signals**
- No contrast, no alternatives, no counterfactual.
- Comparisons that are cliché (“like a chess match…”) rather than analytical.

**Quick tests**
- Does the piece contain at least one clean “X vs Y” frame that changes the conclusion?

---

### 7) Cadence and rhythm control (Weight: 10)

**Question:** Does sentence length vary intentionally, and does the paragraph move (Anchor → Expand → Drive)?

**5/5 signals**
- Most paragraphs contain visible sentence‑length contrast.
- Paragraphs feel like momentum, not a list of equal sentences.

**0/5 signals**
- 4+ same‑length sentences in a row.
- Back‑to‑back long sentences that fatigue the reader.
- Back‑to‑back short sentences that feel like bullet points without bullets.

**Quick tests**
- Pick any paragraph. Can you label sentences as A/E/D (Anchor/Expand/Drive)?
- If you can’t, rewrite the paragraph in that rhythm.

---

### 8) Compression and syntax as structure (Weight: 10)

**Question:** Is the writing dense in a controlled way (punctuation doing structural work), without turning into sludge?

**5/5 signals**
- Semicolons/colons/parentheticals clarify relationships.
- Lists are compressed when parallel logic is the point.
- Parenthetical nesting adds real secondary logic.

**0/5 signals**
- Over‑compressed sentences that collapse clarity.
- Under‑compressed writing that becomes generic and flat.

**Quick tests**
- Underline one sentence where punctuation is doing structural work.
- If every sentence is simple, add one controlled compressed sentence where it helps.

---

### 9) Conclusive reframe and next move (Weight: 10)

**Question:** Does the ending widen the lens and leave the reader with an implication or action?

**5/5 signals**
- The final paragraph reframes rather than summarizes.
- It points forward: what this changes, what to watch next, what to do.

**0/5 signals**
- “In conclusion…” recap.
- Ends where it began.

**Quick tests**
- Delete the last paragraph. Does anything meaningful change? If not, rewrite the ending.

---

## Anti‑pattern deductions (0 to –15)

Apply these after the core score.

- **Hedge stacking** (–3): multiple hedges in a single claim.
- **Passive sludge** (–3): “it was determined…” / actorless writing.
- **Hype language** (–2): revolutionary, game‑changing, best‑in‑class, etc.
- **Filler opener** (–2): “In today’s world…” throat‑clearing.
- **Summary ending** (–3): recap instead of reframe.
- **Bullet‑point prose** (–2): lists replacing reasoning.

Cap total deductions at **–15**.

---

## Fast audit mode (2 minutes)

If you don’t have time to score everything, answer these five questions:

1) What is the verdict sentence? (If none, rewrite.)
2) Where is the turn? (“But here’s the problem…”) (If none, add one.)
3) Where is the concrete anchor? (If none, ground it.)
4) Does the cadence move? (If not, rebuild Anchor → Expand → Drive.)
5) Does the ending push forward? (If not, reframe.)

If you can’t answer **three** of these, the draft is below 70.

---

## Drift report template

Paste this into an issue, PR, or editor note.

```markdown
### HWI Score
- Core score: __/100
- Deductions: __/15
- Final HWI: __/100

### Biggest strengths
1)
2)

### Biggest drift risks
1)
2)

### Two edits that would raise the score fastest
1)
2)

### Confidence notes
- What I’m certain about:
- What I’m assuming:
- What I don’t know yet:
```

---

## How to use HWI with AI

If AI is in the loop, run three passes:

1) **Structure pass:** ask for an outline that includes a clear claim, a turn, and a forward close.
2) **Cadence pass:** rewrite paragraphs into Anchor → Expand → Drive.
3) **Credibility pass:** flag any sentence that contains a number, quote, or strong claim and require sources or uncertainty labeling.

Then score the result with HWI.

---

## What “Austin” looks like on the page

When a draft scores high, it usually has:

- a clean early verdict
- a system model (incentives, constraints)
- one genuine counterintuitive turn
- evidence placed where it hits
- concrete grounding (place, object, person)
- controlled compression
- an ending that turns analysis into direction

That’s the instrument. HWI is how you keep it in tune.
