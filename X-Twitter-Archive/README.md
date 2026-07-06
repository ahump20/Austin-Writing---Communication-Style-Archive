# X/Twitter Archive Ingestion

This folder is the evidence lane for Austin's two-account X/Twitter voice analysis.

## Status

[verified] As of 2026-07-05, the repo contains a live logged-in X capture and React analysis artifact built from real tweets exposed by X through Chrome.

[verified] The live capture includes 1,246 unique activity rows, 679 authored voice tweets/replies, and 453 retweet/context rows:

- `@TXTrickWhooper`: 173 authored rows, July 8, 2022 to July 5, 2026.
- `@a_hump20`: 506 authored rows, January 22, 2014 to October 18, 2025.

[verified] No official X archive ZIP, extracted `data/tweets.js`, or equivalent archive export is currently present locally. The official export path is reachable through X settings, but X requires password re-verification before it shows the request/download controls.

[open] The next upgrade is to download the official archive ZIPs, drop them in `X-Twitter-Archive/source/`, parse them, and rebuild the artifact from the full export.

## Parser

Run from the repo root:

```bash
python3 scripts/parse_x_archive.py /path/to/twitter-archive-1.zip /path/to/twitter-archive-2.zip
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

## Source Boundary

The parser handles authored tweets and note tweets. It detects likes and direct message files but does not include them in the public voice corpus by default. DMs are a different privacy surface and should only be analyzed after Austin explicitly asks for that pass.

## BirdClaw Notes Applied

BirdClaw treats `account.js` as the identity anchor, parses archive JS assignment files as JSON payloads, keys canonical tweets by tweet ID, preserves reply and quote IDs, and supports ZIPs with arbitrary root folders. This parser follows that same shape and adds support for both `direct-messages.js` and `direct_messages.js` filename styles.

## Current Official-Archive Blocker

[verified] The correct X route is visible while logged into `@a_hump20`:

`Settings and privacy` -> `Your account` -> `Download an archive of your data`

[verified] Opening that route on 2026-07-05 led to `https://x.com/i/flow/verify_account_ownership` with the prompt: `Verify your password. Re-enter your X password to continue.`

[open] After that password gate is cleared in Chrome, either request the archive or download the prepared ZIP. Then run the pipeline above.
