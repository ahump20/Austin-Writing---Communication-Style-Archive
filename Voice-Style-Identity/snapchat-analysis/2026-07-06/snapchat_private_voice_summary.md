# Snapchat Private-Register Voice Signals

[verified] Built from the Snapchat metadata export downloaded on 2026-07-06.
[verified] Raw ZIPs and raw message text stayed outside this repository. This file contains counts, anonymized conversation labels, and derived language markers only.

## Source Boundary

- [verified] Chat rows parsed: 2,417. Text rows: 2,106. Sent rows: 1,139.
- [verified] Sent text rows: 1,052. Received text rows: 1,054.
- [verified] Chat date range: 2016-03-24T20:21:29Z to 2026-07-04T18:16:55Z.
- [verified] Conversations parsed: 208. Top conversation labels are anonymized as `contact_001`, `contact_002`, etc.
- [verified] Friends export sections: {"Blocked Users": 18, "Deleted Friends": 179, "Friend Requests Sent": 578, "Friends": 853, "Hidden Friend Suggestions": 163, "Ignored Snapchatters": 76, "Pending Requests": 0, "Shortcuts": 0}.
- [verified] Additional ZIP inspected: `mydata~1783376316584-2.zip` has 622 entries, 0 JSON files, and top-level sizes {"memories": 1472.17} MB.

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

## Anonymized Conversation Distribution

| Label | Rows | Sent Rows | Sent Text Rows | First UTC | Last UTC |
|---|---:|---:|---:|---|---|
| `contact_001` | 261 | 12 | 8 | 2017-11-07T19:02:38Z | 2023-11-03T20:43:03Z |
| `contact_002` | 126 | 72 | 72 | 2018-08-07T05:15:50Z | 2019-03-08T03:23:25Z |
| `contact_003` | 117 | 60 | 57 | 2025-11-06T09:50:49Z | 2025-11-07T04:17:08Z |
| `contact_004` | 113 | 2 | 1 | 2017-11-05T16:27:02Z | 2023-11-09T00:04:45Z |
| `contact_005` | 108 | 60 | 60 | 2019-03-07T11:20:59Z | 2019-04-26T14:51:38Z |
| `contact_006` | 88 | 51 | 51 | 2019-08-19T04:27:02Z | 2020-10-27T21:30:38Z |
| `contact_007` | 61 | 39 | 39 | 2018-10-20T04:26:01Z | 2021-07-18T15:01:42Z |
| `contact_008` | 53 | 31 | 31 | 2019-10-29T05:40:07Z | 2020-04-30T08:56:06Z |
| `contact_009` | 53 | 24 | 22 | 2023-06-15T03:06:33Z | 2023-09-09T09:10:29Z |
| `contact_010` | 51 | 34 | 34 | 2021-11-30T21:01:15Z | 2022-01-19T04:15:26Z |
| `contact_011` | 45 | 0 | 0 | 2019-12-26T00:46:03Z | 2024-03-26T01:23:29Z |
| `contact_012` | 45 | 21 | 5 | 2022-11-26T06:41:58Z | 2026-07-04T17:21:47Z |

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

[verified] This parser intentionally does not write raw Snapchat message content, usernames, display names, email addresses, location rows, media URLs, or media files into the repository. The raw export remains local in Downloads.
