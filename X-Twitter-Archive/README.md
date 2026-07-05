# X/Twitter Archive Ingestion

This folder is the evidence lane for Austin's two-account X/Twitter voice analysis.

## Status

As of 2026-07-05, only account screenshots were present in the Codex attachment directory. No archive ZIP, extracted `data/tweets.js`, or equivalent tweet data file was available locally. The parser and status note are saved here so the full analysis can start the moment the archive files are present.

## Parser

Run from the repo root:

```bash
python3 scripts/parse_x_archive.py /path/to/twitter-archive-1.zip /path/to/twitter-archive-2.zip
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
