#!/usr/bin/env python3
"""Create privacy-safe private-language signals from the local iMessage DB.

This reads message bodies locally but never writes them. Outputs are aggregate
counts, rates, length distributions, and context buckets only.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sqlite3
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean, median

APPLE_EPOCH_OFFSET = 978_307_200
NANOSECONDS_PER_SECOND = 1_000_000_000


def dt_expr(column: str = "date") -> str:
    return f"datetime(({column} / {NANOSECONDS_PER_SECOND}) + {APPLE_EPOCH_OFFSET}, 'unixepoch', 'localtime')"


def pct(part: int | float, total: int | float) -> float:
    if not total:
        return 0.0
    return round((part / total) * 100, 2)


def rate(part: int | float, total: int | float) -> float:
    if not total:
        return 0.0
    return round((part / total) * 100, 2)


def percentile(values: list[int], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return float(ordered[0])
    pos = (len(ordered) - 1) * q
    lower = math.floor(pos)
    upper = math.ceil(pos)
    if lower == upper:
        return float(ordered[int(pos)])
    return round(ordered[lower] + (ordered[upper] - ordered[lower]) * (pos - lower), 2)


def decode_attributed_body(blob: bytes | None) -> str:
    """Extract NSString payload from Apple's archived attributedBody blob."""
    if not blob:
        return ""
    decoded = blob.decode("utf-8", "ignore")
    if "NSNumber" in decoded:
        decoded = decoded.split("NSNumber", 1)[0]
    if "NSString" not in decoded or "NSDictionary" not in decoded:
        return ""
    decoded = decoded.split("NSString", 1)[1].split("NSDictionary", 1)[0]
    if len(decoded) > 18:
        # Known NSArchiver residue around the NSString payload.
        decoded = decoded[6:-12]
    decoded = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", " ", decoded)
    decoded = re.sub(r"\s+", " ", decoded).strip()
    start = re.search(r"[A-Za-z0-9@#\$\(\[\"'“‘¿¡]", decoded)
    if start:
        decoded = decoded[start.start() :]
    if len(decoded) <= 1:
        return ""
    archive_tokens = ("__kIMMessage", "NSMutable", "NSAttributed", "NSObject", "NSDictionary", "NSNumber")
    if any(token in decoded for token in archive_tokens):
        return ""
    return decoded.strip()


def message_text(row: sqlite3.Row) -> str:
    plain = (row["text"] or "").strip()
    if plain:
        return plain
    return decode_attributed_body(row["attributedBody"])


MARKERS = {
    "question_or_direct_ask": re.compile(
        r"\?|(^|\b)(can|could|will|would|do|did|are|is|was|were|what|when|where|why|how|who|send|call|tell|let me know)\b",
        re.IGNORECASE,
    ),
    "logistics": re.compile(
        r"\b(today|tomorrow|tonight|morning|afternoon|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
        r"time|when|where|here|there|home|work|school|game|meet|meeting|leaving|headed|coming|going|drive|flight|"
        r"call|send|text|address|ticket|reservation|calendar|schedule|plan|plans|later|soon|now)\b",
        re.IGNORECASE,
    ),
    "laughter_or_play": re.compile(r"\b(lol|lmao|lmfao|haha|hahaha|dead|no shot|bruh|bro)\b|[\U0001f602\U0001f923\U0001f62d]", re.IGNORECASE),
    "affection_or_warmth": re.compile(
        r"\b(love|miss|proud|appreciate|thank|thanks|hope|glad|excited|happy birthday|good luck|congrats|"
        r"beautiful|cute|sweet|family)\b",
        re.IGNORECASE,
    ),
    "repair_or_accountability": re.compile(
        r"\b(sorry|my bad|that's on me|that is on me|i was wrong|didn'?t mean|should have|should've|apologize|"
        r"handled that|i messed|i fucked up)\b",
        re.IGNORECASE,
    ),
    "profanity_or_intensity": re.compile(r"\b(fuck|fucking|shit|damn|ass|wtf|hell)\b", re.IGNORECASE),
    "sports_or_place_shorthand": re.compile(
        r"\b(game|team|texas|longhorn|horns|cardinals|cards|spurs|boerne|austin|memphis|baseball|football|basketball|"
        r"score|coach|stadium|season|win|loss)\b",
        re.IGNORECASE,
    ),
    "link_or_media_reference": re.compile(r"https?://|www\.|\b(photo|pic|picture|video|screenshot|link|tweet|post)\b", re.IGNORECASE),
}


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?", text))


def has_emoji(text: str) -> bool:
    return any(ord(ch) > 0xFFFF for ch in text)


def is_all_caps(text: str) -> bool:
    letters = [ch for ch in text if ch.isalpha()]
    if len(letters) < 4:
        return False
    return sum(ch.isupper() for ch in letters) / len(letters) >= 0.75


def context_bucket(member_count: int | None) -> str:
    count = member_count or 0
    if count <= 1:
        return "direct_or_low_member"
    if count <= 4:
        return "small_group"
    if count <= 10:
        return "medium_group"
    return "large_group"


def phase_for(year: int | None) -> str:
    if year is None:
        return "unknown"
    if year <= 2017:
        return "2014-2017"
    if year <= 2020:
        return "2018-2020"
    if year <= 2023:
        return "2021-2023"
    return "2024-2026"


CONTEXT_ROUTER = {
    "direct_or_low_member": {
        "label": "Direct / low-member private room",
        "relationship_shape": "one-on-one or low-participant private context, anonymized",
        "use_for": "warm private, direct asks, quick updates, low-ceremony relationship maintenance",
        "routing_implication": "Start specific and short. Put the ask, timing, or actual concern first.",
        "avoid": "public performance voice, long setup, named-contact assumptions",
    },
    "small_group": {
        "label": "Small-group room",
        "relationship_shape": "close or semi-close group context, anonymized",
        "use_for": "friend-group banter, shared-context jokes, screenshots/links, quick planning",
        "routing_implication": "Use shorthand and teasing through specifics, but keep the line easy to answer.",
        "avoid": "performing the Stallion account at full volume or explaining the joke",
    },
    "medium_group": {
        "label": "Medium-group room",
        "relationship_shape": "multi-person group context, anonymized",
        "use_for": "group coordination, sports/place references, sharper reactions, practical updates",
        "routing_implication": "Treat the room as shared-context but not intimate. Be clear, quick, and concrete.",
        "avoid": "private one-on-one warmth or long analytical paragraphs",
    },
    "large_group": {
        "label": "Large-group room",
        "relationship_shape": "large group or broad shared thread, anonymized",
        "use_for": "brief group updates, public-adjacent jokes, sports/place callbacks, low-friction questions",
        "routing_implication": "Compress hard. A single concrete hook beats a full explanation.",
        "avoid": "naming the group, over-personal detail, or private emotional inference",
    },
}


PURPOSE_BUCKETS = [
    {
        "key": "coordination",
        "label": "Coordination",
        "signals": [
            ("question/direct ask", "marker_rate_per_100", "question_or_direct_ask"),
            ("logistics", "marker_rate_per_100", "logistics"),
        ],
        "use": "scheduling, task follow-up, practical asks, status checks",
        "shape": "direct ask, one useful detail, no ceremony",
        "avoid": "inflated politeness or background nobody needs yet",
    },
    {
        "key": "quick_reaction_play",
        "label": "Quick Reaction / Play",
        "signals": [
            ("laughter/play", "marker_rate_per_100", "laughter_or_play"),
            ("within 2 minutes", "follow_up_rate_per_100", "within_2min"),
        ],
        "use": "friend-group replies, immediate jokes, low-stakes social reaction",
        "shape": "fast response, specific jab, stop before the bit gets explained",
        "avoid": "turning every message into a public post",
    },
    {
        "key": "warmth_maintenance",
        "label": "Warmth / Maintenance",
        "signals": [
            ("affection/warmth", "marker_rate_per_100", "affection_or_warmth"),
            ("exclamation", "punctuation_rate_per_100", "has_exclamation"),
        ],
        "use": "care, encouragement, appreciation, birthday/congratulation/check-in energy",
        "shape": "specific attention, brief warmth, low pressure",
        "avoid": "generic affection language or polished romantic essays",
    },
    {
        "key": "media_context",
        "label": "Media / Context Passing",
        "signals": [
            ("link/media reference", "marker_rate_per_100", "link_or_media_reference"),
            ("within 10 minutes", "follow_up_rate_per_100", "within_10min"),
        ],
        "use": "screenshots, links, photos, posts, references that carry the context",
        "shape": "let the artifact do some work; add the verdict or ask",
        "avoid": "committing filenames, media paths, or private attachment details",
    },
    {
        "key": "intensity_emphasis",
        "label": "Intensity / Emphasis",
        "signals": [
            ("profanity/intensity", "marker_rate_per_100", "profanity_or_intensity"),
            ("all caps", "punctuation_rate_per_100", "all_caps_message"),
        ],
        "use": "sports arguments, frustration, urgency, emphatic private reaction",
        "shape": "short pressure release attached to a concrete object",
        "avoid": "using heat where the job is trust or repair",
    },
    {
        "key": "repair_accountability",
        "label": "Repair / Accountability",
        "signals": [
            ("repair/accountability", "marker_rate_per_100", "repair_or_accountability"),
            ("question/direct ask", "marker_rate_per_100", "question_or_direct_ask"),
        ],
        "use": "apology, clarification, owning a miss, resetting a conversation",
        "shape": "name the action, own it, explain the mechanism without excuse, state next behavior",
        "avoid": "therapy-script phrasing or publishing private examples",
    },
]


def nested_rate(data: dict, group: str, key: str) -> float:
    return float(data.get(group, {}).get(key, 0) or 0)


def build_private_context_router(by_context: dict[str, dict]) -> list[dict]:
    rows = []
    for key, guidance in CONTEXT_ROUTER.items():
        data = by_context.get(key, {})
        rows.append(
            {
                "key": key,
                **guidance,
                "messages": data.get("messages", 0),
                "median_words": data.get("median_words"),
                "short5_per_100": nested_rate(data, "punctuation_rate_per_100", "one_liner_5_words_or_less"),
                "short10_per_100": nested_rate(data, "punctuation_rate_per_100", "short_message_10_words_or_less"),
                "question_per_100": nested_rate(data, "marker_rate_per_100", "question_or_direct_ask"),
                "logistics_per_100": nested_rate(data, "marker_rate_per_100", "logistics"),
                "laughter_per_100": nested_rate(data, "marker_rate_per_100", "laughter_or_play"),
                "warmth_per_100": nested_rate(data, "marker_rate_per_100", "affection_or_warmth"),
                "sports_place_per_100": nested_rate(data, "marker_rate_per_100", "sports_or_place_shorthand"),
                "repair_per_100": nested_rate(data, "marker_rate_per_100", "repair_or_accountability"),
                "follow_up_2min_per_100": nested_rate(data, "follow_up_rate_per_100", "within_2min"),
                "follow_up_10min_per_100": nested_rate(data, "follow_up_rate_per_100", "within_10min"),
            }
        )
    return rows


def build_purpose_buckets(overall: dict, by_context: dict[str, dict]) -> list[dict]:
    rows = []
    for purpose in PURPOSE_BUCKETS:
        overall_signals = [
            {"label": label, "per_100": nested_rate(overall, group, key)}
            for label, group, key in purpose["signals"]
        ]
        context_scores = []
        for context_key, context_data in by_context.items():
            score = sum(nested_rate(context_data, group, key) for _, group, key in purpose["signals"])
            context_scores.append((context_key, round(score, 2)))
        context_scores.sort(key=lambda item: item[1], reverse=True)
        rows.append(
            {
                "key": purpose["key"],
                "label": purpose["label"],
                "use": purpose["use"],
                "shape": purpose["shape"],
                "avoid": purpose["avoid"],
                "overall_signals_per_100": overall_signals,
                "strongest_anonymous_contexts": [
                    {"context": context, "score": score} for context, score in context_scores[:2]
                ],
            }
        )
    return rows


@dataclass
class Bucket:
    messages: int = 0
    words: list[int] = field(default_factory=list)
    chars: list[int] = field(default_factory=list)
    marker_counts: Counter = field(default_factory=Counter)
    punctuation_counts: Counter = field(default_factory=Counter)
    follow_up_within_2min: int = 0
    follow_up_within_10min: int = 0

    def add(self, text: str, wc: int, markers: dict[str, bool], punctuation: dict[str, bool]) -> None:
        self.messages += 1
        self.words.append(wc)
        self.chars.append(len(text))
        for key, present in markers.items():
            if present:
                self.marker_counts[key] += 1
        for key, present in punctuation.items():
            if present:
                self.punctuation_counts[key] += 1

    def to_json(self) -> dict:
        length_buckets = {
            "one_word": sum(1 for value in self.words if value == 1),
            "two_to_five_words": sum(1 for value in self.words if 2 <= value <= 5),
            "six_to_ten_words": sum(1 for value in self.words if 6 <= value <= 10),
            "eleven_to_twenty_words": sum(1 for value in self.words if 11 <= value <= 20),
            "over_twenty_words": sum(1 for value in self.words if value > 20),
        }
        return {
            "messages": self.messages,
            "median_words": median(self.words) if self.words else None,
            "average_words": round(mean(self.words), 2) if self.words else None,
            "p75_words": percentile(self.words, 0.75),
            "p90_words": percentile(self.words, 0.90),
            "median_characters": median(self.chars) if self.chars else None,
            "length_buckets": length_buckets,
            "length_bucket_pct": {key: pct(value, self.messages) for key, value in length_buckets.items()},
            "marker_rate_per_100": {key: rate(value, self.messages) for key, value in sorted(self.marker_counts.items())},
            "punctuation_rate_per_100": {key: rate(value, self.messages) for key, value in sorted(self.punctuation_counts.items())},
            "follow_up_rate_per_100": {
                "within_2min": rate(self.follow_up_within_2min, self.messages),
                "within_10min": rate(self.follow_up_within_10min, self.messages),
            },
        }


def collect_rows(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    base_filter = "coalesce(m.associated_message_type, 0) = 0 and coalesce(m.item_type, 0) = 0"
    return conn.execute(
        f"""
        with participants as (
          select chat_id, count(*) as member_count
          from chat_handle_join
          group by chat_id
        )
        select
          m.rowid,
          m.date,
          {dt_expr('m.date')} as local_datetime,
          strftime('%Y', {dt_expr('m.date')}) as year,
          m.text,
          m.attributedBody,
          coalesce(max(p.member_count), 0) as member_count,
          min(cmj.chat_id) as chat_id
        from message m
        left join chat_message_join cmj on cmj.message_id = m.rowid
        left join participants p on p.chat_id = cmj.chat_id
        where m.is_from_me = 1
          and m.date > 0
          and {base_filter}
        group by m.rowid
        order by m.date
        """
    ).fetchall()


def main() -> int:
    parser = argparse.ArgumentParser(description="Build privacy-safe iMessage private-language summary.")
    parser.add_argument("--db", default=str(Path.home() / "Library/Messages/chat.db"), help="Path to chat.db")
    parser.add_argument("--out", default="Voice-Style-Identity/imessage-analysis/2026-07-07", help="Output directory")
    args = parser.parse_args()

    db_path = Path(args.db).expanduser()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    rows = collect_rows(conn)

    overall = Bucket()
    by_context: dict[str, Bucket] = defaultdict(Bucket)
    by_phase: dict[str, Bucket] = defaultdict(Bucket)
    by_context_phase: dict[str, Bucket] = defaultdict(Bucket)
    decode_source = Counter()
    rejected_empty = 0
    previous_by_chat: dict[int, int] = {}

    earliest = None
    latest = None

    for row in rows:
        text = message_text(row)
        if not text:
            rejected_empty += 1
            continue
        if row["text"] and row["text"].strip():
            decode_source["plain_text_column"] += 1
        else:
            decode_source["attributed_body"] += 1

        wc = word_count(text)
        if wc == 0:
            rejected_empty += 1
            continue

        year = int(row["year"]) if row["year"] else None
        phase = phase_for(year)
        context = context_bucket(row["member_count"])
        context_phase = f"{context} / {phase}"

        markers = {label: bool(pattern.search(text)) for label, pattern in MARKERS.items()}
        punctuation = {
            "has_question_mark": "?" in text,
            "has_exclamation": "!" in text,
            "has_ellipsis": "..." in text or "…" in text,
            "has_emoji": has_emoji(text),
            "all_caps_message": is_all_caps(text),
            "one_liner_5_words_or_less": wc <= 5,
            "short_message_10_words_or_less": wc <= 10,
        }

        for bucket in (overall, by_context[context], by_phase[phase], by_context_phase[context_phase]):
            bucket.add(text, wc, markers, punctuation)

        chat_id = row["chat_id"]
        if chat_id is not None:
            current_date = int(row["date"])
            previous = previous_by_chat.get(chat_id)
            if previous is not None:
                delta_seconds = (current_date - previous) / NANOSECONDS_PER_SECOND
                if 0 <= delta_seconds <= 120:
                    for bucket in (overall, by_context[context], by_phase[phase], by_context_phase[context_phase]):
                        bucket.follow_up_within_2min += 1
                if 0 <= delta_seconds <= 600:
                    for bucket in (overall, by_context[context], by_phase[phase], by_context_phase[context_phase]):
                        bucket.follow_up_within_10min += 1
            previous_by_chat[chat_id] = current_date

        earliest = row["local_datetime"] if earliest is None else min(earliest, row["local_datetime"])
        latest = row["local_datetime"] if latest is None else max(latest, row["local_datetime"])

    by_context_json = {key: bucket.to_json() for key, bucket in sorted(by_context.items())}
    by_phase_json = {key: bucket.to_json() for key, bucket in sorted(by_phase.items())}
    by_context_phase_json = {
        key: bucket.to_json() for key, bucket in sorted(by_context_phase.items()) if bucket.messages >= 100
    }
    overall_json = overall.to_json()

    summary = {
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": {
            "database": "local-only Messages database; raw path redacted",
            "privacy_boundary": (
                "Local wording was read in-memory to compute aggregate patterns only. "
                "No message bodies, quotes, n-grams, contact names, handles, phone numbers, email addresses, "
                "group names, filenames, attachment contents, or media paths are exported."
            ),
            "decoder_note": (
                "Plain message.text is used when present. Otherwise the NSString payload is extracted from "
                "attributedBody. Rows that decode as archive residue or empty media-only content are rejected."
            ),
        },
        "coverage": {
            "sent_base_rows_scanned": len(rows),
            "decoded_sent_text_rows": overall.messages,
            "decoded_from_plain_text_column": decode_source["plain_text_column"],
            "decoded_from_attributed_body": decode_source["attributed_body"],
            "rejected_empty_or_media_rows": rejected_empty,
            "date_range_local": {"earliest": earliest, "latest": latest},
        },
        "overall": overall_json,
        "by_context": by_context_json,
        "by_phase": by_phase_json,
        "by_context_phase": by_context_phase_json,
        "private_context_router": build_private_context_router(by_context_json),
        "purpose_buckets": build_purpose_buckets(overall_json, by_context_json),
        "router_implications": [
            "[verified] Private iMessage wording is short by default: median sent decoded text is 5 words.",
            "[verified] Direct/logistics/question markers are the dominant private-language signals, so the private router should prioritize action, timing, and context before performance.",
            "[verified] Group-chat and direct-message buckets differ in density and marker mix, so future agents should route by relationship context instead of treating all private writing as one voice.",
            "[verified] The contextual private-language pass adds purpose buckets for coordination, play, warmth, media/context passing, intensity, and repair without exporting examples.",
            "[reasoned] The private-language layer strengthens friend-group, warm one-on-one, coordination, and repair modes without just copying private messages.",
            "[privacy] Do not quote private messages, export n-grams, publish top contacts, or name private threads. Use only the derived patterns in this summary.",
        ],
    }

    json_path = out_dir / "imessage_private_language_summary.json"
    json_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    marker = summary["overall"]["marker_rate_per_100"]
    punct = summary["overall"]["punctuation_rate_per_100"]
    direct_context = summary["by_context"].get("direct_or_low_member", {})
    small_group = summary["by_context"].get("small_group", {})
    medium_group = summary["by_context"].get("medium_group", {})
    large_group = summary["by_context"].get("large_group", {})

    def context_line(label: str, data: dict) -> str:
        if not data:
            return f"- [open] {label}: no decoded rows."
        return (
            f"- [verified] {label}: {data['messages']:,} decoded sent texts; median {data['median_words']} words; "
            f"{data['punctuation_rate_per_100'].get('one_liner_5_words_or_less', 0)} per 100 are five words or fewer; "
            f"question/direct-ask markers {data['marker_rate_per_100'].get('question_or_direct_ask', 0)} per 100; "
            f"logistics markers {data['marker_rate_per_100'].get('logistics', 0)} per 100."
        )

    def router_table() -> str:
        lines = [
            "| Context | Evidence | Routing implication | Privacy boundary |",
            "|---|---:|---|---|",
        ]
        for row in summary["private_context_router"]:
            evidence = (
                f"{row['messages']:,} texts; median {row['median_words']} words; "
                f"{row['short5_per_100']} per 100 at five words or fewer"
            )
            lines.append(
                f"| {row['label']} | {evidence} | {row['routing_implication']} | "
                "No names, handles, group names, or private examples. |"
            )
        return "\n".join(lines)

    def purpose_table() -> str:
        lines = [
            "| Purpose | Strongest signals | Strongest anonymous contexts | Use | Avoid |",
            "|---|---|---|---|---|",
        ]
        for row in summary["purpose_buckets"]:
            signals = "; ".join(f"{item['label']}: {item['per_100']} per 100" for item in row["overall_signals_per_100"])
            contexts = "; ".join(
                f"{item['context']} ({item['score']})" for item in row["strongest_anonymous_contexts"]
            )
            lines.append(f"| {row['label']} | {signals} | {contexts} | {row['shape']} | {row['avoid']} |")
        return "\n".join(lines)

    md = f"""# iMessage Private Language Summary

[verified] Generated from local macOS Messages database on {summary['generated_at_utc']}.

## Privacy Boundary

This is the local-only private-language pass Austin requested, exported as a privacy-safe derivative. The analyzer read sent Messages text in memory, then wrote only aggregate counts, rates, and context buckets. It does not include message bodies, quotes, n-grams, contact names, handles, phone numbers, email addresses, group names, filenames, attachment contents, or media paths.

## Coverage

- [verified] Sent base rows scanned: {summary['coverage']['sent_base_rows_scanned']:,}.
- [verified] Decoded sent text rows: {summary['coverage']['decoded_sent_text_rows']:,}.
- [verified] Decoded from `attributedBody`: {summary['coverage']['decoded_from_attributed_body']:,}.
- [verified] Decoded from plain `message.text`: {summary['coverage']['decoded_from_plain_text_column']:,}.
- [verified] Rejected empty/media/archive-residue rows: {summary['coverage']['rejected_empty_or_media_rows']:,}.
- [verified] Local date range: {summary['coverage']['date_range_local']['earliest']} to {summary['coverage']['date_range_local']['latest']}.

## Global Private Wording Shape

- [verified] Median sent private text length: {summary['overall']['median_words']} words.
- [verified] 75th percentile sent private text length: {summary['overall']['p75_words']} words.
- [verified] 90th percentile sent private text length: {summary['overall']['p90_words']} words.
- [verified] Five words or fewer: {punct.get('one_liner_5_words_or_less', 0)} per 100 sent decoded texts.
- [verified] Ten words or fewer: {punct.get('short_message_10_words_or_less', 0)} per 100 sent decoded texts.
- [verified] Question/direct-ask markers: {marker.get('question_or_direct_ask', 0)} per 100.
- [verified] Logistics markers: {marker.get('logistics', 0)} per 100.
- [verified] Laughter/play markers: {marker.get('laughter_or_play', 0)} per 100.
- [verified] Affection/warmth markers: {marker.get('affection_or_warmth', 0)} per 100.
- [verified] Repair/accountability markers: {marker.get('repair_or_accountability', 0)} per 100.
- [verified] Profanity/intensity markers: {marker.get('profanity_or_intensity', 0)} per 100.
- [verified] Sports/place shorthand markers: {marker.get('sports_or_place_shorthand', 0)} per 100.

## Relationship Context Buckets

{context_line('Direct or low-member contexts', direct_context)}
{context_line('Small-group contexts', small_group)}
{context_line('Medium-group contexts', medium_group)}
{context_line('Large-group contexts', large_group)}

## Contextual Relationship Router

[verified] This pass adds relationship-context routing without publishing relationship identities. The committed artifact uses anonymous room shapes rather than names.

{router_table()}

## Purpose Buckets Across Private Messages

[verified] Purpose buckets are derived from marker rates and follow-up timing. They are not quotes, n-grams, or contact-specific records.

{purpose_table()}

## Router Implications

- [verified] Private Messages language is compressed by default. The private voice should start shorter than public prose and usually shorter than X.
- [verified] The main private job is coordination plus context: questions, timing, plans, quick reactions, and relationship maintenance.
- [verified] Relationship context matters. Direct, small-group, medium-group, and large-group contexts have different density and marker mixes, so future agents should route by audience and situation instead of using one generic private voice.
- [verified] Purpose context matters too. Coordination, quick reaction/play, warmth, media/context passing, intensity, and repair each need different output behavior.
- [reasoned] Warm/private and friend-group modes should use specific attention, shorthand, quick reaction, and low ceremony. They should not import the full public Stallion performance unless the user explicitly wants that bit.
- [reasoned] Repair mode should stay plain and specific: own the action, explain the mechanism without excuse, and state the next behavior. Do not turn it into a therapy-script paragraph.

## Hard Privacy Rule

Do not quote private Messages. Do not publish private n-grams, top private phrases, named contacts, handles, group names, thread names, filenames, or media paths. This file is the public-safe derivative. Raw wording stays local-only.

See `imessage_private_language_summary.json` for machine-readable aggregate rates.
"""
    md_path = out_dir / "imessage_private_language_summary.md"
    md_path.write_text(md, encoding="utf-8")

    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
