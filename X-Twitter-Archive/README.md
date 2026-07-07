# X/Twitter Archive Ingestion

This folder is the evidence lane for Austin's two-account X/Twitter voice analysis.

## Status

[verified] As of 2026-07-06, the repo contains parsed official X archive exports for both accounts and a React HTML analysis artifact rebuilt from the official metadata.

[verified] Official export totals:

- All official archive rows: 6,300.
- Authored voice rows: 5,437.
- Retweet/context rows: 863.
- Deleted tweet rows included: 4.

[verified] Account coverage:

- `@a_hump20`: 4,760 official rows, 4,033 authored voice rows, 727 retweet/context rows. Authored voice range: July 2, 2011 to October 18, 2025. Full official-row range including retweets/context: July 2, 2011 to December 15, 2025.
- `@TXTrickWhooper`: 1,540 official rows, 1,404 authored voice rows, 136 retweet/context rows. Authored voice range: July 1, 2022 to July 5, 2026. Full official-row range including retweets/context: July 1, 2022 to July 6, 2026.

[verified] The viewable artifact is `X-Twitter-Archive/x-twitter-archive-analysis-artifact.html`.

[verified] Detailed generated files live under `X-Twitter-Archive/official-analysis/2026-07-06/`.

## Parser

Run from the repo root:

```bash
python3 scripts/parse_x_archive.py /path/to/twitter-archive-1.zip /path/to/twitter-archive-2.zip
python3 scripts/build_x_voice_artifact.py
```

Or drop ZIPs in `X-Twitter-Archive/source/` and run:

```bash
./scripts/run_official_x_archive_pipeline.sh
```

The parser writes one folder per account under `X-Twitter-Archive/processed/`:

- `summary.json`: account identity, counts, date range, year buckets, common hashtags, common mentions.
- `tweets_cleaned.jsonl`: full cleaned tweet rows with raw archive JSON attached.
- `tweets_cleaned.csv`: flat sheet for quick review.
- `by_year/YYYY.jsonl`: chronological year buckets.
- `threads.jsonl`: self-thread and conversation groupings when IDs allow it.
- `duplicates_removed.jsonl`: discarded duplicate rows with the kept row.

The artifact builder writes:

- `official_analysis_data.json`
- `official_authored_voice_tweets.jsonl`
- `official_retweets_context.jsonl`
- `official_voice_synthesis.md`
- `austin-official-x-voice-style-guide.md`
- `x-twitter-archive-analysis-artifact.html`

## Source Boundary

[verified] Parsed source slices: `account.js`, `profile.js`, `tweets.js`, `community-tweet.js`, `note-tweet.js`, and `deleted-tweets.js`.

[verified] `tweet-headers.js` matched the main tweet counts for both accounts. `deleted-tweet-headers.js` matched the four deleted `@TXTrickWhooper` rows.

[verified] Retweets beginning with `RT @` are preserved as context but excluded from the authored voice model.

[verified] Direct messages, contacts, IP logs, device logs, ad files, and Grok chats are excluded from this voice corpus. DMs are a separate privacy surface and should only be analyzed after Austin explicitly asks for that pass.

## BirdClaw Notes Applied

BirdClaw treats `account.js` as the identity anchor, parses archive JS assignment files as JSON payloads, keys canonical tweets by tweet ID, preserves reply and quote IDs, and supports ZIPs with arbitrary root folders. This parser follows that shape, includes deleted tweets when X provides them, and keeps DMs out of the public voice corpus by default.
