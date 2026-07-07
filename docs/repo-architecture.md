# Repo Architecture

This repo has two jobs that need to stay separate:

1. Preserve Austin's actual written record.
2. Turn that record into a usable communication router for agents and people.

When those jobs collapse into one README, the repo reads like a dump. The architecture below keeps the archive intact while making the reusable system easy to find.

## Canonical Layer

`Voice-Style-Identity/` is the control room.

Use these files first:

- `SKILL.md`: local reusable skill entry point.
- `austin-voice-consolidated-harness.md`: top-level instruction file.
- `austin-communication-os.md`: live local plugin/router architecture and compatibility map.
- `cross-context-communication-system.md`: canonical room/router model.
- `codex-self-persona-harness.md`: Codex partner behavior layer for working-memory routing, persona boundary, mixed initiative, error recovery, golden responses, and durable continuity with Austin.
- `claude-self-persona-harness.md`: Claude partner behavior layer for proof-over-process, lane discipline, repair, and cross-agent continuity.
- `cross-context-source-manifest.md`: source coverage, exclusions, and open gaps.
- `visual-delivery-layer.md`: doorway, error-recovery, video-evidence, and system-behavior translation rules.
- `visual-delivery-assets/`: privacy-safe SVG diagrams for doorway translation and error recovery.
- `austin-communication-context-map.html`: canonical viewable React translation system, usable voice examples, source receipts, private-room shape, purpose buckets, system-behavior layer, and privacy boundary brief.

If these files conflict with older archive documents, the canonical layer wins for current behavior.

## Local Runtime Layer

The public repo is the durable source. The local runtime layer is intentionally smaller.

- Plugin root: `/Users/AustinHumphrey/plugins/austin-communication-os`
- Active plugin skill: `skills/austin-communication-router/SKILL.md`
- Local `austin-voice` skill: compatibility shim for voice and writing triggers.
- Local `codex-self-persona-harness` skills: compatibility shims for Codex/agent behavior and repair triggers.
- Living-brain skills: private recall/sync boundary. Route to them when needed; do not merge their private write rules into voice/persona files.

The local trigger files should stay compact. If they grow into another dossier, move details back into the repo canonical layer or plugin references.

## Evidence Lanes

`X-Twitter-Archive/` holds public/social evidence.

- `processed/`: cleaned tweet rows by account and year.
- `official-analysis/`: generated summaries and X-specific style guides.
- `README.md`: parser status, counts, and source boundary.

`Voice-Style-Identity/snapchat-analysis/` holds privacy-safe derived Snapchat summaries. Raw private text, names, media URLs, locations, and media files stay out of git.

`Voice-Style-Identity/imessage-analysis/` holds privacy-safe derived iMessage summaries. The committed files may include aggregate counts, marker rates, decoded sent-text length distributions, and anonymous relationship-context buckets. They must not include raw Messages text, contact names, handles, group names, filenames, attachment contents, media paths, transcript exports, or top private phrases.

`Writing-Record/`, `UT-Austin-Coursework/`, `Full-Sail-Coursework/`, `Sports-Writing/`, and `Research/` hold the long-form record. These are source evidence, not current instruction files.

## Historical Material

Some archived documents contain outdated positioning, especially around BSI scope and the older `Blaze Intelligence` language. Do not rewrite historical documents just to make them current. Instead:

- keep them as historical evidence;
- mark stale claims in the canonical layer;
- avoid using stale language in README, GitHub About, skills, and current public copy.

Current public doctrine:

- Blaze Sports Intel is the public brand.
- Austin is Owner/Founder when a title is needed.
- BSI is NCAA Division I college baseball only.
- `Blaze Intelligence` is retired as public parent-brand language.
- Multi-sport and five-league framing is historical/resume-era context, not current public positioning.

## Generated Artifacts

Generated artifacts stay only when they serve a distinct job.

- The communication translation system is the canonical dossier for usable voice outputs, truth-transfer doctrine, doorway plays, source lanes, category/filter families, anonymous private-room shape, purpose buckets, visual-delivery rules, system behavior, and privacy boundaries.
- The visual-delivery assets are privacy-safe SVG diagrams for doorway translation, semantic portability, and error recovery. They store reusable flow, not raw private screenshots or video stills.
- The zip in `dist/` is the portable canonical pack. It should contain only privacy-safe current references, not raw exports or duplicate proof images.
- Older generated HTML viewers and proof screenshots are removable once the canonical dossier replaces their job.
- iMessage metadata and language summaries are retained only as privacy-safe derived source evidence. They may contain anonymous room categories and purpose buckets. They must not contain private people, handles, group names, private examples, phrase lists, or media paths.
- Empty duplicate-removal files in `processed/` are retained because they prove the parser found zero duplicate tweet IDs.

## Duplicate Policy

Delete or move files when they are pure copies, stale generated output with no separate role, or scratch output that can be regenerated and is not evidence.

Keep files when they are:

- source documents;
- generated proof of a parser/build;
- historical records with stale language but archival value;
- current router/skill files;
- privacy-safe derived summaries that update the canonical voice model.

## Update Flow

When a new archive or platform export lands:

1. Parse it into a source-specific lane.
2. Produce a privacy-safe summary if the source is private.
3. Update `cross-context-source-manifest.md`.
4. Update `cross-context-communication-system.md` only with durable changes.
5. Rebuild the viewable artifacts when the canonical communication model changes.
6. Sync the durable instruction into local skills and living-brain bridge notes.

Do not file generated Austin-style output as source evidence. It can be a useful draft. It is not Austin's record.

For private communications, never commit raw message bodies, transcripts, handles, chat titles, thread names, filenames, media paths, private relationship maps, burner/account metadata, DM exports, or phrase lists. Commit derived patterns only.
