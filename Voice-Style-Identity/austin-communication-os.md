# Austin Communication OS

[verified] Created July 7, 2026 to reduce local skill sprawl and stale identity drift across Codex, Claude, Austin voice work, and living-brain routing.

## Purpose

This file explains the live operating shape. The repo remains the human-readable source. The local plugin is the active trigger surface.

The goal is not to create another identity document. It is to keep future agents from loading five overlapping ideas before producing one usable sentence.

North Star: the best communication changes the doorway, not the truth.

## Live Shape

| Surface | Role |
|---|---|
| `Voice-Style-Identity/SKILL.md` | Canonical full skill and human-readable source. |
| `Voice-Style-Identity/cross-context-communication-system.md` | Full room router and source-grounded synthesis. |
| `Voice-Style-Identity/austin-voice-consolidated-harness.md` | Top-level instruction pack for writing and communication. |
| `Voice-Style-Identity/codex-self-persona-harness.md` | Codex behavior, repair, load order, and self/persona boundary. |
| `Voice-Style-Identity/claude-self-persona-harness.md` | Claude behavior and cross-agent lane discipline. |
| Local plugin `austin-communication-os` | Compact active router for Codex/plugin routing. |
| Local `austin-voice` skill | Compatibility shim for voice/writing triggers. |
| Local `codex-self-persona-harness` skill | Compatibility shim for Codex behavior and repair triggers. |
| Codex subagent aliases | Optional workers for context, voice, and muzzle checks. They route through the OS and do not own identity. |
| Living-brain skills | Private recall/sync boundary. They are routed to, not merged into voice. |
| Record & Replay workflow reference | Optional workflow-observation layer for repeatable tool choreography. Stored in the private brain, not the public repo. |

## Why This Reduces Drift

Before this cleanup, the same work could trigger Austin voice, Codex self-persona, normal-human reporting, communication polish, living-brain, Claude mirror notes, and subagent aliases. Most of those files were useful, but they could compete for first position.

The corrected rule is load order:

1. Current ask, newest correction, repo/live truth, and privacy constraints.
2. Austin Communication OS router.
3. Only the specific lane needed for the next output: writing, behavior/repair, recall, sync, reporting, or editing.
4. Heavy source docs only when they change the answer.

Newest correction: private intonation is now a first-class lane. When Austin asks about interpersonal writing, humor in Messages, private-style replies, warmth, repair, or how his informal tone lands, route through the private intonation section in `cross-context-communication-system.md`. The operative move is scene-setting when useful and plain compression when not: decide what the other person should see, hear, or remember, then write the shortest line that keeps the feeling and timing intact. If the room is only logistics, stay plain. The system exists to deliver the line, not to display the machinery. Do not publish or store raw private Messages.

## Privacy Boundary

The OS can use privacy-safe derived evidence from Snapchat, iMessage, and living-brain context. It must not publish or commit raw private messages, private names, handles, group names, media paths, filenames, private phrase lists, burner metadata, DMs, or relationship maps.

Generated Austin-style prose is output. It is not source evidence.

## Workflow Capture Boundary

Record & Replay can improve cross-tool understanding when it is enabled, but it should capture workflow shape rather than private material. Use it for GitHub, Cloudflare, Supabase, Obsidian, Austin Communication OS, and similar repeatable workflows when the useful lesson is sequence, visual checkpoint, decision point, failure recovery, or visible proof.

Do not capture or store secrets, tokens, raw Messages, private DMs, raw exports, private tabs, personal identifiers, media paths, or private relationship context. Store the reusable summary in the living brain. Public repo docs should receive only the safe workflow lesson.

## Subagent Rule

Subagents are workers, not truth owners.

The local Codex aliases `austin-context`, `austin-voice`, and `muzzle-detector` should load Austin Communication OS first, then perform their narrow job: context scouting, voice drafting/auditing, or muzzle detection. They should not claim to be Austin, replace the repo reference, or store generated Austin-style prose as source material.

Codex subagents must use explicit supported model settings in this account. Inherited-model subagents fail to spawn and should be treated as stale until fixed.

## Current Local Paths

- Plugin root: `/Users/AustinHumphrey/plugins/austin-communication-os`
- Plugin router skill: `/Users/AustinHumphrey/plugins/austin-communication-os/skills/austin-communication-router/SKILL.md`
- Plugin source map: `/Users/AustinHumphrey/plugins/austin-communication-os/references/source-map.md`
- Sprawl audit: `/Users/AustinHumphrey/plugins/austin-communication-os/scripts/audit_sprawl.py`
- Austin subagents: `/Users/AustinHumphrey/.codex/agents/austin-context.toml`, `/Users/AustinHumphrey/.codex/agents/austin-voice.toml`, `/Users/AustinHumphrey/.codex/agents/muzzle-detector.toml`

These paths are local runtime infrastructure. The public repo documents their role without copying private raw data into the archive.

## Maintenance Rule

Update in this order when doctrine changes:

1. Repo canonical docs.
2. Local plugin router.
3. Local compatibility shims.
4. Living-brain bridge only when recall/sync routing changes.
5. Memory note only when the change is durable and privacy-safe.
