# 2026-07-05 Step 1 Status

## Goal

Parse the official X/Twitter archives for:

- `@TXTrickWhooper` / Stallion of the Steroid Era
- `@a_hump20` / Austin Humphrey

Then use the cleaned corpus for long-form voice, theme, humor, and style analysis.

## Known

- [verified] The uploaded Codex attachment directory contained two profile screenshots, not official archive ZIP files.
- [verified] No `tweets.js`, `tweet.js`, `twitter-archive*.zip`, or X archive ZIP was found in the workspace, Downloads, Desktop, Documents, or the iCloud `Cowork Analysis` folder within the searched depth.
- [verified] BirdClaw was checked at `steipete/birdclaw` HEAD `66523e1dcb323fd0b02490c5813fb5e5b277aa8e`.
- [verified] BirdClaw's archive importer expects `data/account.js`, parses JS assignment payloads without evaluating JavaScript, supports ZIP roots, and dedupes canonical tweets by tweet ID.
- [verified] The local parser follows that model and writes cleaned JSONL, CSV, per-year buckets, thread groupings, duplicate reports, and account summaries.
- [verified] A live logged-in X capture was completed through Chrome after the archive ZIPs were not present.
- [verified] The live capture extracted 1,246 unique activity rows, including 679 authored voice tweets/replies and 453 retweet/context rows.
- [verified] `@TXTrickWhooper` live capture: 173 authored rows, July 8, 2022 to July 5, 2026.
- [verified] `@a_hump20` live capture: 506 authored rows, January 22, 2014 to October 18, 2025.
- [verified] The React HTML artifact at `X-Twitter-Archive/x-twitter-archive-analysis-artifact.html` is built from real captured tweets and labels the source boundary.
- [verified] X's official archive route is reachable after switching out of delegated `@TXTrickWhooper` mode and back to `@a_hump20`.
- [verified] Opening `Download an archive of your data` led to X's password re-verification flow at `https://x.com/i/flow/verify_account_ownership`.

## Unknown

- [unknown/open] Whether X has already prepared an archive ZIP for either account.
- [unknown/open] Whether the delegated `@TXTrickWhooper` account can export its own archive from the same owner login or needs a separate account/password path.
- [unknown/open] Exact official archive tweet counts and date ranges for both accounts.
- [unknown/open] Whether the official export includes rows missing from the live feed capture because of cursor limits, rate limits, deletion state, or account export boundaries.

## Current Blocker

- [verified] X requires the account password before showing the archive request/download controls.
- [reasoned] The useful next move is to type the password directly into the live Chrome tab, then continue the same flow. The password should not be pasted into chat or stored in this repo.

## Ready Pipeline

Drop official archive ZIPs here:

```text
X-Twitter-Archive/source/
```

Run from the repo root:

```bash
./scripts/run_official_x_archive_pipeline.sh
```

The runner calls:

```bash
python3 scripts/parse_x_archive.py X-Twitter-Archive/source/*.zip --out X-Twitter-Archive/processed
```

## Parser Output Contract

When the ZIPs are present, the parser writes:

- `X-Twitter-Archive/processed/<account>/summary.json`
- `X-Twitter-Archive/processed/<account>/tweets_cleaned.jsonl`
- `X-Twitter-Archive/processed/<account>/tweets_cleaned.csv`
- `X-Twitter-Archive/processed/<account>/by_year/*.jsonl`
- `X-Twitter-Archive/processed/<account>/threads.jsonl`
- `X-Twitter-Archive/processed/<account>/duplicates_removed.jsonl`

The summary includes exact tweet count, duplicate count, first and last tweet timestamps, reply count, self-thread reply count, year buckets, common hashtags, common mentions, and files found in the archive.

## Step 1 Completion State

[verified] Step 1 is complete for the live X capture dataset.

[unknown/open] Step 1 is not complete for the official X archive export because X is waiting on password re-verification before archive request/download controls appear.
