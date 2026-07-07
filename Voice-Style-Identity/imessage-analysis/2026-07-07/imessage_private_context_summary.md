# iMessage Private Context Metadata Summary

[verified] Generated from local macOS Messages database on 2026-07-07T02:15:34+00:00.

## Privacy Boundary

This file is privacy-safe by design. It contains aggregate metadata only. It does not include message bodies, contact names, handles, phone numbers, email addresses, group names, filenames, attachment contents, or media paths.

## Access Status

[verified] iMessage access is now working from Codex after Full Disk Access was enabled for Codex-related processes. Direct SQLite access to `~/Library/Messages/chat.db` succeeds, and the Apple Messages MCP can search the database.

## Coverage

- [verified] All `message` rows: 483,242.
- [verified] Base human-message rows, excluding tapbacks/associated rows and system items: 435,735.
- [verified] Sent base rows: 183,603.
- [verified] Received base rows: 252,132.
- [verified] Associated-message rows, mostly reactions/tapbacks and related records: 31,491.
- [verified] System-item rows: 16,016.
- [verified] Base date range: 2014-06-07 20:06:08 to 2026-07-06 18:18:48.
- [verified] Handles in database: 4,617.
- [verified] Chat records: 3,272.

## Conversation Shape

- [verified] Active group chats: 632.
- [verified] Active direct/low-member chats: 2,488.
- [verified] Largest observed member count in an active chat: 27.
- [verified] Base rows associated with group chats: 114,454 (26.27% of base rows).
- [verified] Base rows associated with direct or unjoined contexts: 321,281.
- [verified] Highest-volume year by base rows: 2017 (60,502 rows).

## Interaction Metadata

- [verified] Reactions/tapbacks: 30,469.
- [verified] Reaction distribution: love: 7177, like: 7666, dislike: 808, laugh: 7226, emphasize: 7246, question: 346.
- [verified] Edited-message rows: 82.
- [verified] Unsent/retracted-message rows: 0.
- [verified] Reply-thread rows: 3,311.
- [verified] Message-effect rows: 89.
- [verified] Attachments: 22,022 (image: 13460, unknown: 6748, video: 912, text: 789, application: 104).
- [verified] Sent-message peak slots: Thu 17:00 (2203), Wed 16:00 (2195), Wed 18:00 (2092), Tue 16:00 (2073), Tue 17:00 (2071).

## Voice-System Implication

[reasoned] iMessage moves the router from previously unverified private group-thread dynamics to verified private group/direct metadata. It does not replace Snapchat or X. It adds stronger evidence for group-chat density, long-running friend/family threads, tapback/laugh/emphasis behavior, reply-thread use, and attachment-heavy private communication.

[reasoned] Because this summary is metadata-only, it should refine the communication router at the level of context, cadence, interaction shape, and evidence confidence. It should not be used to quote private language or imitate specific private conversations.

## Canonical Use

- Use iMessage as verified evidence for private group/direct metadata coverage.
- Keep raw message text local-only unless Austin explicitly requests a separate private analysis pass.
- Do not commit raw private exports, names, handles, contact lists, filenames, or media.
- When writing public-facing content, do not leak private chat names or private text.

See `imessage_metadata_summary.json` for the machine-readable aggregate summary.
