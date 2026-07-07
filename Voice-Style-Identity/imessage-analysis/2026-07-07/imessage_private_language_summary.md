# iMessage Private Language Summary

[verified] Generated from local macOS Messages database on 2026-07-07T03:05:26+00:00.

## Privacy Boundary

This is the local-only private-language pass Austin requested, exported as a privacy-safe derivative. The analyzer read sent Messages text in memory, then wrote only aggregate counts, rates, and context buckets. It does not include message bodies, quotes, n-grams, contact names, handles, phone numbers, email addresses, group names, filenames, attachment contents, or media paths.

## Coverage

- [verified] Sent base rows scanned: 183,603.
- [verified] Decoded sent text rows: 179,882.
- [verified] Decoded from `attributedBody`: 179,804.
- [verified] Decoded from plain `message.text`: 234.
- [verified] Rejected empty/media/archive-residue rows: 3,721.
- [verified] Local date range: 2014-06-07 20:44:32 to 2026-07-06 02:50:18.

## Global Private Wording Shape

- [verified] Median sent private text length: 5.0 words.
- [verified] 75th percentile sent private text length: 10.0 words.
- [verified] 90th percentile sent private text length: 17.0 words.
- [verified] Five words or fewer: 50.04 per 100 sent decoded texts.
- [verified] Ten words or fewer: 75.45 per 100 sent decoded texts.
- [verified] Question/direct-ask markers: 30.0 per 100.
- [verified] Logistics markers: 17.87 per 100.
- [verified] Laughter/play markers: 5.24 per 100.
- [verified] Affection/warmth markers: 3.38 per 100.
- [verified] Repair/accountability markers: 0.85 per 100.
- [verified] Profanity/intensity markers: 1.99 per 100.
- [verified] Sports/place shorthand markers: 3.38 per 100.

## Relationship Context Buckets

- [verified] Direct or low-member contexts: 161,446 decoded sent texts; median 5.0 words; 50.57 per 100 are five words or fewer; question/direct-ask markers 30.07 per 100; logistics markers 18.33 per 100.
- [verified] Small-group contexts: 9,979 decoded sent texts; median 6 words; 46.31 per 100 are five words or fewer; question/direct-ask markers 29.33 per 100; logistics markers 14.04 per 100.
- [verified] Medium-group contexts: 4,000 decoded sent texts; median 7.0 words; 40.98 per 100 are five words or fewer; question/direct-ask markers 30.98 per 100; logistics markers 15.45 per 100.
- [verified] Large-group contexts: 4,457 decoded sent texts; median 6 words; 47.52 per 100 are five words or fewer; question/direct-ask markers 27.93 per 100; logistics markers 11.76 per 100.

## Router Implications

- [verified] Private Messages language is compressed by default. The private voice should start shorter than public prose and usually shorter than X.
- [verified] The main private job is coordination plus context: questions, timing, plans, quick reactions, and relationship maintenance.
- [verified] Relationship context matters. Direct, small-group, medium-group, and large-group contexts have different density and marker mixes, so future agents should route by audience and situation instead of using one generic private voice.
- [reasoned] Warm/private and friend-group modes should use specific attention, shorthand, quick reaction, and low ceremony. They should not import the full public Stallion performance unless the user explicitly wants that bit.
- [reasoned] Repair mode should stay plain and specific: own the action, explain the mechanism without excuse, and state the next behavior. Do not turn it into a therapy-script paragraph.

## Hard Privacy Rule

Do not quote private Messages. Do not publish private n-grams, top private phrases, named contacts, handles, group names, thread names, filenames, or media paths. This file is the public-safe derivative. Raw wording stays local-only.

See `imessage_private_language_summary.json` for machine-readable aggregate rates.
