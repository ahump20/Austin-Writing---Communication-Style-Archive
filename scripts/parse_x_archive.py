#!/usr/bin/env python3
"""
Parse X/Twitter archive ZIPs or extracted archive folders into analysis-ready files.

The parser is intentionally local and boring:
- no JavaScript eval
- no network calls
- no fake freshness
- tweet IDs drive dedupe
- raw source JSON stays attached to each cleaned row
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


CENTRAL_TZ = ZoneInfo("America/Chicago")


ACCOUNT_RE = re.compile(r"(?:^|/)data/account\.js$", re.I)
PROFILE_RE = re.compile(r"(?:^|/)data/profile\.js$", re.I)
TWEET_RE = re.compile(
    r"(?:^|/)data/(?:tweets?|community-tweet)(?:-part\d+)?\.js$", re.I
)
NOTE_TWEET_RE = re.compile(r"(?:^|/)data/note-tweet(?:-part\d+)?\.js$", re.I)
LIKE_RE = re.compile(r"(?:^|/)data/likes?(?:-part\d+)?\.js$", re.I)
DM_RE = re.compile(r"(?:^|/)data/direct[-_]messages(?:-group)?(?:-part\d+)?\.js$", re.I)


@dataclass(frozen=True)
class ArchiveSource:
    path: Path
    entries: tuple[str, ...]
    is_zip: bool

    def read_text(self, entry: str) -> str:
        if self.is_zip:
            with zipfile.ZipFile(self.path) as archive:
                return archive.read(entry).decode("utf-8", errors="replace")
        return (self.path / entry).read_text(encoding="utf-8", errors="replace")


def normalize_entry(path: str) -> str:
    return path.replace("\\", "/").lstrip("/")


def load_source(path: Path) -> ArchiveSource:
    if path.is_file() and zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            entries = tuple(normalize_entry(name) for name in archive.namelist())
        return ArchiveSource(path=path, entries=entries, is_zip=True)
    if path.is_dir():
        entries = tuple(
            normalize_entry(str(item.relative_to(path)))
            for item in path.rglob("*")
            if item.is_file()
        )
        return ArchiveSource(path=path, entries=entries, is_zip=False)
    raise ValueError(f"Not a ZIP or extracted archive directory: {path}")


def matching(entries: tuple[str, ...], pattern: re.Pattern[str]) -> list[str]:
    return sorted(entry for entry in entries if pattern.search(entry))


def parse_assignment_payload(text: str) -> Any:
    """Parse the JSON payload inside X archive JS assignment files."""
    equals_index = text.find("=")
    search_from = equals_index + 1 if equals_index >= 0 else 0
    starts = [idx for idx in (text.find("[", search_from), text.find("{", search_from)) if idx >= 0]
    if not starts:
        return []
    start = min(starts)
    decoder = json.JSONDecoder()
    payload, _ = decoder.raw_decode(text[start:])
    return payload


def parse_array(text: str) -> list[dict[str, Any]]:
    payload = parse_assignment_payload(text)
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        return [payload]
    return []


def parse_datetime(value: Any) -> tuple[str | None, str | None]:
    if not isinstance(value, str) or not value.strip():
        return None, None
    parsed: datetime | None = None
    for fmt in ("%a %b %d %H:%M:%S %z %Y", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            parsed = datetime.strptime(value, fmt)
            break
        except ValueError:
            continue
    if parsed is None:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None, None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    utc = parsed.astimezone(timezone.utc)
    local = parsed.astimezone(CENTRAL_TZ)
    return utc.isoformat().replace("+00:00", "Z"), local.isoformat()


def int_or_none(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def compact_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def entity_summary(tweet: dict[str, Any]) -> dict[str, Any]:
    entities = as_dict(tweet.get("entities"))
    extended = as_dict(tweet.get("extended_entities"))
    media = as_list(extended.get("media")) + as_list(entities.get("media"))
    seen_media: set[str] = set()
    clean_media = []
    for item in media:
        entry = as_dict(item)
        key = str(entry.get("media_url_https") or entry.get("media_url") or entry.get("url") or "")
        if not key or key in seen_media:
            continue
        seen_media.add(key)
        video_info = as_dict(entry.get("video_info"))
        clean_media.append(
            {
                "type": entry.get("type"),
                "url": key,
                "expanded_url": entry.get("expanded_url"),
                "alt_text": entry.get("ext_alt_text"),
                "duration_millis": video_info.get("duration_millis"),
                "variants": as_list(video_info.get("variants")),
            }
        )

    urls = []
    for item in as_list(entities.get("urls")):
        entry = as_dict(item)
        urls.append(
            {
                "url": entry.get("url"),
                "expanded_url": entry.get("expanded_url") or entry.get("expandedUrl"),
                "display_url": entry.get("display_url") or entry.get("displayUrl"),
            }
        )

    mentions = []
    for item in as_list(entities.get("user_mentions")):
        entry = as_dict(item)
        mentions.append(
            {
                "screen_name": entry.get("screen_name"),
                "name": entry.get("name"),
                "id": entry.get("id_str") or entry.get("id"),
            }
        )

    hashtags = []
    for item in as_list(entities.get("hashtags")):
        entry = as_dict(item)
        if entry.get("text"):
            hashtags.append(str(entry["text"]))

    return {
        "hashtags": hashtags,
        "mentions": mentions,
        "urls": urls,
        "media": clean_media,
    }


def account_payload(source: ArchiveSource) -> dict[str, Any]:
    account_entries = matching(source.entries, ACCOUNT_RE)
    profile_entries = matching(source.entries, PROFILE_RE)
    account = {}
    profile = {}
    if account_entries:
        rows = parse_array(source.read_text(account_entries[0]))
        account = as_dict(as_dict(rows[0]).get("account")) if rows else {}
    if profile_entries:
        rows = parse_array(source.read_text(profile_entries[0]))
        profile = as_dict(as_dict(rows[0]).get("profile")) if rows else {}
    created_utc, created_local = parse_datetime(account.get("createdAt"))
    return {
        "account_id": str(account.get("accountId") or ""),
        "handle": str(account.get("username") or ""),
        "display_name": str(
            account.get("accountDisplayName") or account.get("name") or account.get("username") or ""
        ),
        "created_at_utc": created_utc,
        "created_at_local": created_local,
        "bio": str(as_dict(profile.get("description")).get("bio") or ""),
        "has_account_js": bool(account_entries),
        "has_profile_js": bool(profile_entries),
        "account_entry": account_entries[0] if account_entries else None,
        "profile_entry": profile_entries[0] if profile_entries else None,
    }


def normalize_tweet(
    wrapper: dict[str, Any],
    source_path: str,
    account: dict[str, Any],
    kind: str,
) -> dict[str, Any] | None:
    tweet = as_dict(wrapper.get("tweet"))
    if not tweet:
        return None
    tweet_id = str(tweet.get("id_str") or tweet.get("id") or "")
    if not tweet_id:
        return None
    full_text = str(tweet.get("full_text") or tweet.get("text") or "")
    created_utc, created_local = parse_datetime(tweet.get("created_at"))
    entities = entity_summary(tweet)
    reply_to_id = tweet.get("in_reply_to_status_id_str") or tweet.get("in_reply_to_status_id")
    quote_id = tweet.get("quoted_status_id_str") or tweet.get("quoted_status_id")
    return {
        "tweet_id": tweet_id,
        "account_handle": account.get("handle") or "",
        "account_display_name": account.get("display_name") or "",
        "account_id": account.get("account_id") or "",
        "archive_source": source_path,
        "archive_kind": kind,
        "created_at_utc": created_utc,
        "created_at_local": created_local,
        "year": created_utc[:4] if created_utc else "unknown",
        "full_text": full_text,
        "text_hash": text_hash(full_text),
        "char_count": len(full_text),
        "word_count": len(re.findall(r"\S+", full_text)),
        "favorite_count": int_or_none(tweet.get("favorite_count")),
        "retweet_count": int_or_none(tweet.get("retweet_count")),
        "reply_count": int_or_none(tweet.get("reply_count")),
        "quote_count": int_or_none(tweet.get("quote_count")),
        "view_count": int_or_none(tweet.get("view_count") or tweet.get("views_count")),
        "lang": tweet.get("lang"),
        "source": tweet.get("source"),
        "truncated": tweet.get("truncated"),
        "is_reply": bool(reply_to_id),
        "reply_to_tweet_id": str(reply_to_id) if reply_to_id else None,
        "reply_to_user_id": str(tweet.get("in_reply_to_user_id_str") or tweet.get("in_reply_to_user_id") or "")
        or None,
        "reply_to_screen_name": tweet.get("in_reply_to_screen_name"),
        "conversation_id": tweet.get("conversation_id_str") or tweet.get("conversation_id"),
        "quoted_tweet_id": str(quote_id) if quote_id else None,
        "hashtags": entities["hashtags"],
        "mentions": entities["mentions"],
        "urls": entities["urls"],
        "media": entities["media"],
        "media_count": len(entities["media"]),
        "raw_json": wrapper,
    }


def normalize_note_tweet(wrapper: dict[str, Any], source_path: str, account: dict[str, Any]) -> dict[str, Any] | None:
    note = as_dict(wrapper.get("noteTweet"))
    if not note:
        return None
    core = as_dict(note.get("core"))
    tweet_id = str(note.get("noteTweetId") or note.get("id") or "")
    if not tweet_id:
        return None
    full_text = str(core.get("text") or "")
    created_utc, created_local = parse_datetime(note.get("createdAt"))
    return {
        "tweet_id": tweet_id,
        "account_handle": account.get("handle") or "",
        "account_display_name": account.get("display_name") or "",
        "account_id": account.get("account_id") or "",
        "archive_source": source_path,
        "archive_kind": "noteTweet",
        "created_at_utc": created_utc,
        "created_at_local": created_local,
        "year": created_utc[:4] if created_utc else "unknown",
        "full_text": full_text,
        "text_hash": text_hash(full_text),
        "char_count": len(full_text),
        "word_count": len(re.findall(r"\S+", full_text)),
        "favorite_count": None,
        "retweet_count": None,
        "reply_count": None,
        "quote_count": None,
        "view_count": None,
        "lang": None,
        "source": None,
        "truncated": None,
        "is_reply": False,
        "reply_to_tweet_id": None,
        "reply_to_user_id": None,
        "reply_to_screen_name": None,
        "conversation_id": None,
        "quoted_tweet_id": None,
        "hashtags": [],
        "mentions": [],
        "urls": [],
        "media": [],
        "media_count": 0,
        "raw_json": wrapper,
    }


def richer_score(row: dict[str, Any]) -> int:
    return sum(
        [
            len(row.get("full_text") or ""),
            20 if row.get("created_at_utc") else 0,
            5 * len(row.get("media") or []),
            2 * len(row.get("urls") or []),
            2 * len(row.get("mentions") or []),
            1 if row.get("favorite_count") is not None else 0,
            1 if row.get("retweet_count") is not None else 0,
        ]
    )


def dedupe(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    by_id: dict[str, dict[str, Any]] = {}
    duplicates: list[dict[str, Any]] = []
    for row in rows:
        tweet_id = row["tweet_id"]
        existing = by_id.get(tweet_id)
        if existing is None:
            row["duplicate_count"] = 0
            by_id[tweet_id] = row
            continue
        duplicates.append({"kept": existing, "discarded": row})
        existing["duplicate_count"] = int(existing.get("duplicate_count") or 0) + 1
        if richer_score(row) > richer_score(existing):
            row["duplicate_count"] = existing["duplicate_count"]
            by_id[tweet_id] = row
    return sorted(by_id.values(), key=lambda item: (item.get("created_at_utc") or "", item["tweet_id"])), duplicates


def add_thread_fields(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    own_ids = {row["tweet_id"] for row in rows}
    by_id = {row["tweet_id"]: row for row in rows}

    def root_for(row: dict[str, Any]) -> str:
        seen: set[str] = set()
        current = row
        while current.get("reply_to_tweet_id") in own_ids:
            parent_id = str(current["reply_to_tweet_id"])
            if parent_id in seen:
                break
            seen.add(parent_id)
            current = by_id[parent_id]
        return current["tweet_id"]

    thread_counts: Counter[str] = Counter()
    for row in rows:
        root = root_for(row)
        row["thread_root_id"] = root
        row["is_self_thread_reply"] = bool(row.get("reply_to_tweet_id") in own_ids)
        row["thread_key"] = str(row.get("conversation_id") or root)
        thread_counts[row["thread_key"]] += 1

    for row in rows:
        row["thread_size"] = thread_counts[row["thread_key"]]
    return rows


def load_tweets(source: ArchiveSource) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, list[str]]]:
    account = account_payload(source)
    files = {
        "account": matching(source.entries, ACCOUNT_RE),
        "profile": matching(source.entries, PROFILE_RE),
        "tweets": matching(source.entries, TWEET_RE),
        "noteTweets": matching(source.entries, NOTE_TWEET_RE),
        "likes": matching(source.entries, LIKE_RE),
        "directMessages": matching(source.entries, DM_RE),
    }
    rows: list[dict[str, Any]] = []
    for entry in files["tweets"]:
        for wrapper in parse_array(source.read_text(entry)):
            row = normalize_tweet(wrapper, entry, account, "tweet")
            if row:
                rows.append(row)
    for entry in files["noteTweets"]:
        for wrapper in parse_array(source.read_text(entry)):
            row = normalize_note_tweet(wrapper, entry, account)
            if row:
                rows.append(row)
    return account, rows, files


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(compact_json(row) + "\n")


def csv_row(row: dict[str, Any]) -> dict[str, Any]:
    keep = [
        "tweet_id",
        "account_handle",
        "created_at_utc",
        "created_at_local",
        "year",
        "full_text",
        "favorite_count",
        "retweet_count",
        "reply_count",
        "quote_count",
        "view_count",
        "is_reply",
        "is_self_thread_reply",
        "reply_to_tweet_id",
        "reply_to_screen_name",
        "quoted_tweet_id",
        "thread_key",
        "thread_root_id",
        "thread_size",
        "char_count",
        "word_count",
        "media_count",
        "archive_source",
    ]
    out = {key: row.get(key) for key in keep}
    out["hashtags"] = ",".join(row.get("hashtags") or [])
    out["mentions"] = ",".join(
        item.get("screen_name", "") for item in row.get("mentions") or [] if isinstance(item, dict)
    )
    out["urls"] = ",".join(
        item.get("expanded_url") or item.get("url") or "" for item in row.get("urls") or [] if isinstance(item, dict)
    )
    return out


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    flat_rows = [csv_row(row) for row in rows]
    fieldnames = list(flat_rows[0].keys()) if flat_rows else list(csv_row({}).keys())
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flat_rows)


def summarize(
    source_path: Path,
    account: dict[str, Any],
    rows: list[dict[str, Any]],
    duplicates: list[dict[str, Any]],
    files: dict[str, list[str]],
) -> dict[str, Any]:
    years = Counter(row.get("year") or "unknown" for row in rows)
    originals = sum(1 for row in rows if not row.get("is_reply"))
    replies = sum(1 for row in rows if row.get("is_reply"))
    self_thread_replies = sum(1 for row in rows if row.get("is_self_thread_reply"))
    dated = [row["created_at_utc"] for row in rows if row.get("created_at_utc")]
    top_hashtags = Counter(tag.lower() for row in rows for tag in row.get("hashtags", []))
    top_mentions = Counter(
        str(item.get("screen_name", "")).lower()
        for row in rows
        for item in row.get("mentions", [])
        if isinstance(item, dict) and item.get("screen_name")
    )
    return {
        "source_path": str(source_path),
        "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "timezone": "America/Chicago",
        "account": account,
        "counts": {
            "tweets_cleaned": len(rows),
            "duplicates_removed": len(duplicates),
            "originals_or_quote_posts": originals,
            "replies": replies,
            "self_thread_replies": self_thread_replies,
            "threads_or_conversations": len({row.get("thread_key") for row in rows}),
        },
        "date_range": {
            "first_utc": min(dated) if dated else None,
            "last_utc": max(dated) if dated else None,
        },
        "files_found": files,
        "years": dict(sorted(years.items())),
        "top_hashtags": top_hashtags.most_common(50),
        "top_mentions": top_mentions.most_common(50),
        "known_limits": [
            "X archives usually omit full public engagement history after export time.",
            "Replies are preserved by IDs, but full external thread context requires live lookup or another archive row.",
            "Deleted tweets only appear if X included them in the archive slice.",
        ],
    }


def safe_slug(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip("@ ") or "unknown")
    return cleaned.strip("-") or "unknown"


def process_archive(input_path: Path, out_root: Path) -> dict[str, Any]:
    source = load_source(input_path)
    account, raw_rows, files = load_tweets(source)
    rows, duplicates = dedupe(raw_rows)
    rows = add_thread_fields(rows)
    handle = account.get("handle") or input_path.stem
    out_dir = out_root / safe_slug(str(handle))

    by_year: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_year[str(row.get("year") or "unknown")].append(row)

    write_jsonl(out_dir / "tweets_cleaned.jsonl", rows)
    write_csv(out_dir / "tweets_cleaned.csv", rows)
    write_jsonl(out_dir / "duplicates_removed.jsonl", duplicates)
    for year, year_rows in sorted(by_year.items()):
        write_jsonl(out_dir / "by_year" / f"{year}.jsonl", year_rows)
    thread_rows = [
        {
            "thread_key": key,
            "thread_root_id": group[0].get("thread_root_id"),
            "account_handle": group[0].get("account_handle"),
            "tweet_count": len(group),
            "first_utc": group[0].get("created_at_utc"),
            "last_utc": group[-1].get("created_at_utc"),
            "tweet_ids": [row["tweet_id"] for row in group],
            "texts": [row["full_text"] for row in group],
        }
        for key, group in sorted(
            groupby_thread(rows).items(), key=lambda item: (item[1][0].get("created_at_utc") or "", item[0])
        )
        if len(group) > 1
    ]
    write_jsonl(out_dir / "threads.jsonl", thread_rows)
    summary = summarize(input_path, account, rows, duplicates, files)
    write_json(out_dir / "summary.json", summary)
    return summary


def groupby_thread(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        groups[str(row.get("thread_key") or row["tweet_id"])].append(row)
    for group in groups.values():
        group.sort(key=lambda row: (row.get("created_at_utc") or "", row["tweet_id"]))
    return groups


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse X/Twitter archive ZIPs into clean tweet datasets.")
    parser.add_argument("archives", nargs="+", help="Archive ZIPs or extracted archive directories")
    parser.add_argument(
        "--out",
        default="X-Twitter-Archive/processed",
        help="Output directory. Default: X-Twitter-Archive/processed",
    )
    args = parser.parse_args()

    out_root = Path(args.out)
    summaries = []
    for item in args.archives:
        try:
            summaries.append(process_archive(Path(item).expanduser().resolve(), out_root))
        except Exception as exc:
            print(f"error: {item}: {exc}", file=sys.stderr)
            return 1

    write_json(out_root / "run_summary.json", {"archives": summaries})
    for summary in summaries:
        account = summary["account"].get("handle") or "unknown"
        counts = summary["counts"]
        dates = summary["date_range"]
        print(
            f"{account}: {counts['tweets_cleaned']} tweets, "
            f"{counts['duplicates_removed']} duplicates removed, "
            f"{dates['first_utc']} to {dates['last_utc']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
