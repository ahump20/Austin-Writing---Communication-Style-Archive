# Snapchat Private-Register Voice Signals

[verified] Built from the Snapchat metadata export downloaded on 2026-07-06.
[verified] Raw ZIPs and raw message text stayed outside this repository. This file contains aggregate counts and derived language markers only.

## Source Boundary

- [verified] Chat rows parsed: 2,417. Text rows: 2,106. Sent rows: 1,139.
- [verified] Sent text rows: 1,052. Received text rows: 1,054.
- [verified] Chat date range: 2016-03-24T20:21:29Z to 2026-07-04T18:16:55Z.
- [verified] Conversations parsed: 208. Conversation-level labels, dates, and per-person tables stay local-only.
- [verified] Friends export sections: {"Blocked Users": 18, "Deleted Friends": 179, "Friend Requests Sent": 578, "Friends": 853, "Hidden Friend Suggestions": 163, "Ignored Snapchatters": 76, "Pending Requests": 0, "Shortcuts": 0}.
- [verified] Additional archive inspected: 622 entries and 0 JSON files. Media volume and filename are redacted.

## What This Adds To The Voice Model

[verified] Snapchat confirms the private register is shorter, more logistical, and more context-dependent than X. That matters because it stops the model from applying the public commentary voice to every room.

- [verified] Median sent private message length: 5 words. 75th percentile: 8 words. 90th percentile: 12 words.
- [verified] Logistics markers appear in 17.87 of every 100 sent text rows.
- [verified] Question/direct-ask markers appear in 34.41 of every 100 sent text rows.
- [verified] Laughter markers appear in 12.17 of every 100 sent text rows.
- [verified] Affection markers appear in 5.23 of every 100 sent text rows.
- [verified] Profanity markers appear in 2.47 of every 100 sent text rows.

## Private-Register Rules

1. [verified] Private chat defaults to quick coordination before performance: where, when, who is coming, what changed, and what needs to happen next.
2. [verified] Humor still exists, but it is more conversational than tweet-shaped. The private joke usually reacts to the shared situation instead of building a standalone public bit.
3. [reasoned] Warmth works best through specific attention and low-pressure play. The evidence supports a short-message private style; it does not support turning every warm note into polished romantic prose.
4. [verified] The AI voice should keep Austin's directness in private contexts but reduce the public-commentary escalation unless the room is clearly joking.

## Conversation Distribution Boundary

[verified] Conversation-level rows, dates, and labels are intentionally omitted from the public report. The public layer keeps aggregate counts, long-tail shape, year buckets, and marker rates only.

## Year Buckets

| Year | Rows | Sent Rows | Sent Text Rows | Median Sent Words |
|---|---:|---:|---:|---:|
| 2016 | 8 | 2 | 2 | 8 |
| 2017 | 23 | 0 | 0 |  |
| 2018 | 423 | 125 | 124 | 7 |
| 2019 | 447 | 219 | 215 | 5 |
| 2020 | 407 | 230 | 224 | 6 |
| 2021 | 210 | 107 | 99 | 5 |
| 2022 | 255 | 128 | 120 | 5 |
| 2023 | 160 | 78 | 72 | 5 |
| 2024 | 161 | 93 | 79 | 5 |
| 2025 | 174 | 97 | 88 | 5 |
| 2026 | 149 | 60 | 29 | 5 |

## Privacy Note

[verified] This parser intentionally does not write raw Snapchat message content, usernames, display names, email addresses, location rows, media URLs, media files, raw archive filenames, or per-conversation tables into the repository.
