# Live X Capture Method - 2026-07-05

[verified] Source was Austin's already-logged-in Chrome session on X, not a logged-out scrape.

[verified] Captured accounts:
- `TXTrickWhooper` / Stallion of the Steroid Era: live X user id `1542810769905139713`
- `a_hump20` / Austin Humphrey: live X user id `305387451`

[verified] Cleaned output files:
- `cleaned/combined_activity.jsonl`: 1,246 deduped activity rows from captured live feeds
- `cleaned/authored_voice_tweets.jsonl`: 679 authored, non-retweet rows used as voice evidence
- `cleaned/retweets_context.jsonl`: 453 repost/context rows saved but excluded from voice synthesis
- `cleaned/capture_summary.json`: counts, date ranges, and capture boundary
- `cleaned/analysis_data.json`: examples, phrase counts, theme tags, humor tags

[unknown/open] This is not the official X archive export. No ZIP or `tweets.js` file was present in the workspace. Live X feed pagination hit cursor limits, 404s, and one 429 during capture. Official completeness still requires the real account archive ZIP.

[reasoned] Reposts are saved as context but not treated as Austin's writing. Quote tweets and replies are included when the requested account authored the visible text.
