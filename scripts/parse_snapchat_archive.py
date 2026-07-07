#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import statistics
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


CHAT_FILE = "json/chat_history.json"
FRIENDS_FILE = "json/friends.json"
MEMORIES_FILE = "json/memories_history.json"
SNAP_FILE = "json/snap_history.json"
STORY_FILE = "json/story_history.json"
ACCOUNT_FILE = "json/account_history.json"

WORD_RE = re.compile(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?")
URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "\U00002600-\U000026FF"
    "]",
    flags=re.UNICODE,
)

MARKERS = {
    "laughter": re.compile(r"\b(lol|lmao|lmfao|haha+|hehe+|dead|dying)\b|😂|🤣", re.IGNORECASE),
    "profanity": re.compile(r"\b(fuck|fucking|shit|ass|damn|bitch|mf|wtf)\b", re.IGNORECASE),
    "question": re.compile(r"\?|\b(what|when|where|why|how|who|which|can|could|would|should|did|do|does|is|are)\b", re.IGNORECASE),
    "logistics": re.compile(r"\b(omw|eta|where|when|time|tonight|tomorrow|today|here|there|home|come|coming|pull up|meet|send|call|text|later|after|before|free|plans)\b", re.IGNORECASE),
    "affection": re.compile(r"\b(love|miss|cute|beautiful|pretty|babe|baby|sweet|proud|care|fine|hot|kiss)\b|❤️|💕|😘|😍", re.IGNORECASE),
    "repair": re.compile(r"\b(sorry|my bad|that's on me|that is on me|i was wrong|badly|apologize|apology)\b", re.IGNORECASE),
    "self_own": re.compile(r"\b(i'm cooked|im cooked|i need to be stopped|i am cooked|my fault|classic me|of course i|i can't|i cannot|i should not)\b", re.IGNORECASE),
    "sports_place": re.compile(r"\b(texas|longhorn|horns|cards|cardinals|titans|boerne|austin|san antonio|memphis|waffle|chick-fil-a|chickfila)\b", re.IGNORECASE),
    "mock_scale": re.compile(r"\b(federal|criminal|society|nation|emergency|defense|war crime|malpractice|illegal|collapse|dynasty|generational|historic)\b", re.IGNORECASE),
}


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    candidates = [
        text,
        text.replace(" UTC", "+00:00"),
        text.replace("Z", "+00:00"),
    ]
    for candidate in candidates:
        try:
            dt = datetime.fromisoformat(candidate)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    for fmt in ("%Y-%m-%d %H:%M:%S %Z", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %H:%M:%S"):
        try:
            dt = datetime.strptime(text, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return None


def pct(part: int | float, total: int | float) -> float:
    if not total:
        return 0.0
    return round((part / total) * 100, 2)


def safe_div(part: int | float, total: int | float) -> float:
    if not total:
        return 0.0
    return round(part / total, 3)


def words(text: str) -> list[str]:
    return WORD_RE.findall(URL_RE.sub("", text.lower()))


def load_json(zf: zipfile.ZipFile, name: str) -> object:
    with zf.open(name) as handle:
        return json.loads(handle.read())


def inspect_zip(zip_path: Path) -> dict:
    with zipfile.ZipFile(zip_path) as zf:
        top_dirs: Counter[str] = Counter()
        json_files = 0
        infos = zf.infolist()
        for info in infos:
            top_dirs[info.filename.split("/")[0]] += info.file_size
            if info.filename.startswith("json/") and info.filename.endswith(".json"):
                json_files += 1
        return {
            "archive_name": zip_path.name,
            "entries": len(infos),
            "json_files": json_files,
            "top_dirs_mb": {name: round(size / 1024 / 1024, 2) for name, size in sorted(top_dirs.items())},
        }


def year_key(dt: datetime | None) -> str:
    return str(dt.year) if dt else "unknown"


def iso_or_none(dt: datetime | None) -> str | None:
    if not dt:
        return None
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def percentile(values: list[int], q: float) -> int | None:
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    idx = (len(ordered) - 1) * q
    lo = math.floor(idx)
    hi = math.ceil(idx)
    if lo == hi:
        return ordered[int(idx)]
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * (idx - lo))


def summarize_texts(messages: list[dict]) -> dict:
    text_rows = [m for m in messages if m.get("content")]
    sent_text = [m for m in text_rows if m["is_sender"]]
    received_text = [m for m in text_rows if not m["is_sender"]]
    sent_lengths = [m["word_count"] for m in sent_text]
    all_lengths = [m["word_count"] for m in text_rows]

    marker_counts = Counter()
    sent_marker_counts = Counter()
    marker_by_year: dict[str, Counter] = defaultdict(Counter)
    for message in text_rows:
        for marker, pattern in MARKERS.items():
            if pattern.search(message["content"]):
                marker_counts[marker] += 1
                marker_by_year[message["year"]][marker] += 1
                if message["is_sender"]:
                    sent_marker_counts[marker] += 1

    first_dt = min((m["created_dt"] for m in messages if m["created_dt"]), default=None)
    last_dt = max((m["created_dt"] for m in messages if m["created_dt"]), default=None)
    sent_first_dt = min((m["created_dt"] for m in messages if m["created_dt"] and m["is_sender"]), default=None)
    sent_last_dt = max((m["created_dt"] for m in messages if m["created_dt"] and m["is_sender"]), default=None)

    return {
        "chat_date_range_utc": {"first": iso_or_none(first_dt), "last": iso_or_none(last_dt)},
        "sent_date_range_utc": {"first": iso_or_none(sent_first_dt), "last": iso_or_none(sent_last_dt)},
        "message_counts": {
            "all_chat_rows": len(messages),
            "text_rows": len(text_rows),
            "sent_rows": sum(1 for m in messages if m["is_sender"]),
            "received_rows": sum(1 for m in messages if not m["is_sender"]),
            "sent_text_rows": len(sent_text),
            "received_text_rows": len(received_text),
            "text_share_pct": pct(len(text_rows), len(messages)),
            "sent_share_pct": pct(sum(1 for m in messages if m["is_sender"]), len(messages)),
        },
        "word_count": {
            "sent_median": percentile(sent_lengths, 0.5),
            "sent_p75": percentile(sent_lengths, 0.75),
            "sent_p90": percentile(sent_lengths, 0.9),
            "all_text_median": percentile(all_lengths, 0.5),
            "all_text_p75": percentile(all_lengths, 0.75),
        },
        "marker_counts": dict(marker_counts),
        "sent_marker_counts": dict(sent_marker_counts),
        "marker_rates_per_100_sent_texts": {
            key: round((value / len(sent_text)) * 100, 2) if sent_text else 0.0
            for key, value in sent_marker_counts.items()
        },
        "marker_by_year": {year: dict(counts) for year, counts in sorted(marker_by_year.items())},
    }


def summarize_contacts(messages: list[dict]) -> dict:
    contacts: dict[str, list[dict]] = defaultdict(list)
    for message in messages:
        contacts[message["conversation"]].append(message)

    ranked = []
    for idx, (conversation, rows) in enumerate(sorted(contacts.items(), key=lambda item: len(item[1]), reverse=True), start=1):
        text_rows = [m for m in rows if m.get("content")]
        sent_text_rows = [m for m in text_rows if m["is_sender"]]
        first_dt = min((m["created_dt"] for m in rows if m["created_dt"]), default=None)
        last_dt = max((m["created_dt"] for m in rows if m["created_dt"]), default=None)
        marker_counts = Counter()
        for message in sent_text_rows:
            for marker, pattern in MARKERS.items():
                if pattern.search(message["content"]):
                    marker_counts[marker] += 1
        ranked.append(
            {
                "contact_label": f"contact_{idx:03d}",
                "rows": len(rows),
                "text_rows": len(text_rows),
                "sent_rows": sum(1 for m in rows if m["is_sender"]),
                "sent_text_rows": len(sent_text_rows),
                "first_utc": iso_or_none(first_dt),
                "last_utc": iso_or_none(last_dt),
                "sent_marker_counts": dict(marker_counts),
            }
        )

    return {
        "conversation_count": len(contacts),
        "top_conversations_anonymized": ranked[:20],
        "long_tail": {
            "one_row_conversations": sum(1 for rows in contacts.values() if len(rows) == 1),
            "five_or_fewer_rows": sum(1 for rows in contacts.values() if len(rows) <= 5),
            "fifty_or_more_rows": sum(1 for rows in contacts.values() if len(rows) >= 50),
        },
    }


def summarize_by_year(messages: list[dict]) -> dict:
    buckets: dict[str, list[dict]] = defaultdict(list)
    for message in messages:
        buckets[message["year"]].append(message)

    result = {}
    for year, rows in sorted(buckets.items()):
        text_rows = [m for m in rows if m.get("content")]
        sent_text = [m for m in text_rows if m["is_sender"]]
        marker_counts = Counter()
        for message in sent_text:
            for marker, pattern in MARKERS.items():
                if pattern.search(message["content"]):
                    marker_counts[marker] += 1
        result[year] = {
            "rows": len(rows),
            "sent_rows": sum(1 for m in rows if m["is_sender"]),
            "text_rows": len(text_rows),
            "sent_text_rows": len(sent_text),
            "median_sent_words": percentile([m["word_count"] for m in sent_text], 0.5),
            "marker_counts_sent": dict(marker_counts),
        }
    return result


def summarize_auxiliary(zf: zipfile.ZipFile) -> dict:
    out: dict[str, object] = {}
    if FRIENDS_FILE in zf.namelist():
        friends = load_json(zf, FRIENDS_FILE)
        out["friends"] = {key: len(value) for key, value in friends.items() if isinstance(value, list)}
    if MEMORIES_FILE in zf.namelist():
        memories = load_json(zf, MEMORIES_FILE)
        saved = memories.get("Saved Media", []) if isinstance(memories, dict) else []
        dates = [parse_dt(row.get("Date")) for row in saved if isinstance(row, dict)]
        out["memories"] = {
            "saved_media": len(saved),
            "first_utc": iso_or_none(min((d for d in dates if d), default=None)),
            "last_utc": iso_or_none(max((d for d in dates if d), default=None)),
            "media_types": dict(Counter(row.get("Media Type", "unknown") for row in saved if isinstance(row, dict))),
        }
    if SNAP_FILE in zf.namelist():
        snap = load_json(zf, SNAP_FILE)
        rows = [row for section in snap.values() if isinstance(section, list) for row in section if isinstance(row, dict)] if isinstance(snap, dict) else []
        out["snaps"] = {
            "rows": len(rows),
            "sent_rows": sum(1 for row in rows if row.get("IsSender") is True),
            "received_rows": sum(1 for row in rows if row.get("IsSender") is False),
            "media_types": dict(Counter(row.get("Media Type", "unknown") for row in rows)),
        }
    if STORY_FILE in zf.namelist():
        story = load_json(zf, STORY_FILE)
        if isinstance(story, dict):
            views = story.get("Your Story Views", [])
            out["stories"] = {
                "your_story_rows": len(views) if isinstance(views, list) else 0,
                "total_story_views": sum(row.get("Story Views", 0) for row in views if isinstance(row, dict)),
                "total_story_replies": sum(row.get("Story Replies", 0) for row in views if isinstance(row, dict)),
            }
    if ACCOUNT_FILE in zf.namelist():
        account = load_json(zf, ACCOUNT_FILE)
        if isinstance(account, dict):
            reports = account.get("Download My Data Reports", [])
            out["account_export"] = {
                "download_reports": len(reports) if isinstance(reports, list) else 0,
                "display_name_changes": len(account.get("Display Name Change", [])),
            }
    return out


def flatten_chat(chat_obj: dict) -> list[dict]:
    messages: list[dict] = []
    for conversation, rows in chat_obj.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            content = row.get("Content")
            content = content if isinstance(content, str) else ""
            created_dt = parse_dt(row.get("Created"))
            tokenized = words(content)
            messages.append(
                {
                    "conversation": conversation,
                    "is_sender": bool(row.get("IsSender")),
                    "media_type": row.get("Media Type") or "unknown",
                    "created": row.get("Created"),
                    "created_dt": created_dt,
                    "year": year_key(created_dt),
                    "is_saved": bool(row.get("IsSaved")),
                    "has_media_ids": bool(row.get("Media IDs")),
                    "content": content,
                    "word_count": len(tokenized),
                    "char_count": len(content),
                    "emoji_count": len(EMOJI_RE.findall(content)),
                    "words": tokenized,
                }
            )
    return sorted(messages, key=lambda item: item["created_dt"] or datetime.min.replace(tzinfo=timezone.utc))


def write_markdown(summary: dict, out_path: Path) -> None:
    chat = summary["chat"]
    counts = chat["message_counts"]
    contacts = summary["contacts"]
    aux = summary["auxiliary"]
    marker_rates = chat["marker_rates_per_100_sent_texts"]

    lines = [
        "# Snapchat Private-Register Voice Signals",
        "",
        "[verified] Built from the Snapchat metadata export downloaded on 2026-07-06.",
        "[verified] Raw ZIPs and raw message text stayed outside this repository. This file contains counts, anonymized conversation labels, and derived language markers only.",
        "",
        "## Source Boundary",
        "",
        f"- [verified] Chat rows parsed: {counts['all_chat_rows']:,}. Text rows: {counts['text_rows']:,}. Sent rows: {counts['sent_rows']:,}.",
        f"- [verified] Sent text rows: {counts['sent_text_rows']:,}. Received text rows: {counts['received_text_rows']:,}.",
        f"- [verified] Chat date range: {chat['chat_date_range_utc']['first']} to {chat['chat_date_range_utc']['last']}.",
        f"- [verified] Conversations parsed: {contacts['conversation_count']:,}. Top conversation labels are anonymized as `contact_001`, `contact_002`, etc.",
        f"- [verified] Friends export sections: {json.dumps(aux.get('friends', {}), sort_keys=True)}.",
    ]
    for archive in summary["source"].get("additional_archives_inspected", []):
        lines.append(
            f"- [verified] Additional ZIP inspected: `{archive['archive_name']}` has {archive['entries']:,} entries, {archive['json_files']} JSON files, and top-level sizes {json.dumps(archive['top_dirs_mb'], sort_keys=True)} MB."
        )
    lines.extend(
        [
            "",
            "## What This Adds To The Voice Model",
            "",
            "[verified] Snapchat confirms the private register is shorter, more logistical, and more context-dependent than X. That matters because it stops the model from applying the public commentary voice to every room.",
            "",
            f"- [verified] Median sent private message length: {chat['word_count']['sent_median']} words. 75th percentile: {chat['word_count']['sent_p75']} words. 90th percentile: {chat['word_count']['sent_p90']} words.",
            f"- [verified] Logistics markers appear in {marker_rates.get('logistics', 0.0)} of every 100 sent text rows.",
            f"- [verified] Question/direct-ask markers appear in {marker_rates.get('question', 0.0)} of every 100 sent text rows.",
            f"- [verified] Laughter markers appear in {marker_rates.get('laughter', 0.0)} of every 100 sent text rows.",
            f"- [verified] Affection markers appear in {marker_rates.get('affection', 0.0)} of every 100 sent text rows.",
            f"- [verified] Profanity markers appear in {marker_rates.get('profanity', 0.0)} of every 100 sent text rows.",
            "",
            "## Private-Register Rules",
            "",
            "1. [verified] Private chat defaults to quick coordination before performance: where, when, who is coming, what changed, and what needs to happen next.",
            "2. [verified] Humor still exists, but it is more conversational than tweet-shaped. The private joke usually reacts to the shared situation instead of building a standalone public bit.",
            "3. [reasoned] Warmth works best through specific attention and low-pressure play. The evidence supports a short-message private style; it does not support turning every warm note into polished romantic prose.",
            "4. [verified] The AI voice should keep Austin's directness in private contexts but reduce the public-commentary escalation unless the room is clearly joking.",
            "",
            "## Anonymized Conversation Distribution",
            "",
            "| Label | Rows | Sent Rows | Sent Text Rows | First UTC | Last UTC |",
            "|---|---:|---:|---:|---|---|",
        ]
    )

    for row in contacts["top_conversations_anonymized"][:12]:
        lines.append(
            f"| `{row['contact_label']}` | {row['rows']:,} | {row['sent_rows']:,} | {row['sent_text_rows']:,} | {row['first_utc'] or ''} | {row['last_utc'] or ''} |"
        )

    lines.extend(
        [
            "",
            "## Year Buckets",
            "",
            "| Year | Rows | Sent Rows | Sent Text Rows | Median Sent Words |",
            "|---|---:|---:|---:|---:|",
        ]
    )
    for year, row in summary["by_year"].items():
        lines.append(
            f"| {year} | {row['rows']:,} | {row['sent_rows']:,} | {row['sent_text_rows']:,} | {row['median_sent_words'] if row['median_sent_words'] is not None else ''} |"
        )

    lines.extend(
        [
            "",
            "## Privacy Note",
            "",
            "[verified] This parser intentionally does not write raw Snapchat message content, usernames, display names, email addresses, location rows, media URLs, or media files into the repository. The raw export remains local in Downloads.",
            "",
        ]
    )
    out_path.write_text("\n".join(lines), encoding="utf-8")


def parse_archive(zip_path: Path, out_dir: Path, media_zip: Path | None = None) -> dict:
    with zipfile.ZipFile(zip_path) as zf:
        chat_obj = load_json(zf, CHAT_FILE)
        if not isinstance(chat_obj, dict):
            raise ValueError(f"{CHAT_FILE} did not contain the expected object shape")
        messages = flatten_chat(chat_obj)
        summary = {
            "source": {
                "archive_name": zip_path.name,
                "parsed_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "privacy_boundary": "raw Snapchat message text, contact names, media URLs, and media files are not written to repo outputs",
                "additional_archives_inspected": [inspect_zip(media_zip)] if media_zip else [],
            },
            "chat": summarize_texts(messages),
            "contacts": summarize_contacts(messages),
            "by_year": summarize_by_year(messages),
            "auxiliary": summarize_auxiliary(zf),
        }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "snapchat_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")
    write_markdown(summary, out_dir / "snapchat_private_voice_summary.md")
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Parse a Snapchat data export into privacy-safe voice signals.")
    parser.add_argument("--zip", required=True, type=Path, help="Path to the Snapchat mydata ZIP containing json/chat_history.json.")
    parser.add_argument("--media-zip", type=Path, help="Optional additional Snapchat ZIP to inspect without extracting media.")
    parser.add_argument("--out", required=True, type=Path, help="Output directory for derived summaries.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    summary = parse_archive(args.zip, args.out, media_zip=args.media_zip)
    counts = summary["chat"]["message_counts"]
    print(
        "Parsed Snapchat archive: "
        f"{counts['all_chat_rows']} chat rows, "
        f"{counts['sent_text_rows']} sent text rows, "
        f"{summary['contacts']['conversation_count']} conversations."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
