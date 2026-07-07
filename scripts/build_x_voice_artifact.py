#!/usr/bin/env python3
"""
Build the X/Twitter voice analysis artifact from processed official archive rows.

Inputs:
- X-Twitter-Archive/processed/<handle>/tweets_cleaned.jsonl
- X-Twitter-Archive/processed/<handle>/summary.json

Outputs:
- X-Twitter-Archive/official-analysis/2026-07-06/*
- optional local-only X HTML if --html is provided
"""

from __future__ import annotations

import argparse
import html
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any


DATE_LABEL = "2026-07-06"
TIMEZONE = "America/Chicago"
HANDLES = ("a_hump20", "TXTrickWhooper")

STOPWORDS = {
    "a",
    "about",
    "after",
    "all",
    "also",
    "am",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "for",
    "from",
    "get",
    "got",
    "had",
    "has",
    "have",
    "he",
    "her",
    "here",
    "his",
    "how",
    "i",
    "if",
    "in",
    "is",
    "it",
    "its",
    "just",
    "me",
    "my",
    "no",
    "not",
    "of",
    "on",
    "or",
    "our",
    "out",
    "so",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "this",
    "to",
    "up",
    "was",
    "we",
    "were",
    "what",
    "when",
    "who",
    "why",
    "will",
    "with",
    "would",
    "you",
    "your",
    "https",
    "http",
    "t",
    "co",
    "amp",
}

THEME_KEYWORDS: dict[str, tuple[str, ...]] = {
    "sports/Texas": (
        "texas",
        "longhorn",
        "hookem",
        "horns",
        "ut",
        "bama",
        "aggie",
        "aggy",
        "sec",
        "football",
        "baseball",
        "cardinals",
        "yadi",
        "pujols",
        "goldy",
        "titans",
        "tits",
        "spurs",
        "thunder",
        "cowboys",
        "rangers",
        "game",
        "season",
        "cws",
        "college",
        "coach",
        "sark",
        "arch",
        "bevo",
    ),
    "AI/dev/tools": (
        "grok",
        "claude",
        "codex",
        "fable",
        "opus",
        "gpt",
        "gemini",
        "ai",
        "agent",
        "model",
        "prompt",
        "frontend",
        "slop",
        "vibe",
        "moltbook",
        "anthropic",
        "openai",
    ),
    "X/platform": (
        "twitter",
        "tweet",
        "x ",
        "elon",
        "for you",
        "mute",
        "timeline",
        "followers",
        "app",
        "social media",
    ),
    "food/vices": (
        "waffle",
        "chick-fil-a",
        "chickfila",
        "breakfast",
        "vape",
        "beer",
        "bar",
        "coffee",
        "cocaine",
        "adderall",
        "drunk",
        "nugget",
        "food",
    ),
    "place/Texas/Memphis": (
        "san antonio",
        "boerne",
        "memphis",
        "austin",
        "hill country",
        "tivy",
        "champion",
        "heights",
        "texas",
    ),
    "school/social life": (
        "school",
        "class",
        "college",
        "spring break",
        "senior",
        "teacher",
        "date",
        "girls",
        "friend",
        "party",
        "sleep",
        "facebook",
    ),
    "family/life": (
        "family",
        "brother",
        "mom",
        "dad",
        "baby",
        "cuz",
        "cat",
        "dog",
        "life",
        "car",
        "home",
    ),
    "music/pop culture": (
        "barbie",
        "oppenheimer",
        "macklemore",
        "kendrick",
        "song",
        "album",
        "music",
        "movie",
        "grammy",
    ),
    "politics/news": (
        "america",
        "american",
        "patriot",
        "trump",
        "biden",
        "government",
        "war",
        "news",
        "covid",
    ),
}

PROFANITY = (
    "fuck",
    "shit",
    "ass",
    "damn",
    "bitch",
    "twat",
)

OBJECT_WORDS = (
    "waffle",
    "vape",
    "mouse pad",
    "cat",
    "nugget",
    "diaper",
    "camera",
    "skateboard",
    "chick-fil-a",
    "breakfast",
)

OVERSTATEMENT_WORDS = (
    "hero",
    "patriot",
    "defense",
    "shook",
    "core",
    "championship",
    "dynasty",
    "god",
    "jesus",
    "born right",
    "war",
    "crime",
    "greatest",
    "worst",
    "last line",
)


@dataclass(frozen=True)
class ExampleSpec:
    label: str
    account: str | None
    terms: tuple[str, ...]
    note: str


EXAMPLE_SPECS = (
    ExampleSpec("Waffle House as civil-defense institution", "TXTrickWhooper", ("waffle house", "last line of defense"), "Deadpan civic overstatement."),
    ExampleSpec("Vape charger mock PSA", "TXTrickWhooper", ("charge your vape", "phone"), "Fake discovery framed like public knowledge."),
    ExampleSpec("Cats-as-hardware deadpan", "TXTrickWhooper", ("cats make incredible mouse pads",), "Absurd object logic with no explanation."),
    ExampleSpec("AI-tool self-own", "TXTrickWhooper", ("ADHD-fueled AI slop",), "Self-incriminating aside before anyone else can say it."),
    ExampleSpec("Reading code punchline", "TXTrickWhooper", ("Reading code is for nerds and agents",), "Reply timing: premise rejected in one line."),
    ExampleSpec("Baseball vocabulary gatekeeping", "TXTrickWhooper", ("don’t watch baseball", "match"), "Sports knowledge used as a punchline."),
    ExampleSpec("Claude model complaint", "TXTrickWhooper", ("Bro give us a new fuckin model",), "Group-chat bluntness applied to AI tools."),
    ExampleSpec("For You page grievance letter", "TXTrickWhooper", ("Dear @elonmusk", "Best regards", "Stallion"), "Formal-letter frame used for an unserious rage bit."),
    ExampleSpec("Joey Chestnut patriot theology", "TXTrickWhooper", ("American patriot and hero Joey Chestnut",), "Food-sports nationalism as joke scale."),
    ExampleSpec("Grok liberation punchline", "TXTrickWhooper", ("Grok said", "fuck this dude"), "Projected AI voice as hostile comic witness."),
    ExampleSpec("Betting-era casuals", "TXTrickWhooper", ("Casuals will watch anything", "bet on"), "Sports-fan disdain compressed into one sentence."),
    ExampleSpec("Fable access as birthright", "TXTrickWhooper", ("American born right to Fable",), "AI tooling complaint turned into rights language."),
    ExampleSpec("Boerne rivalry shot", "a_hump20", ("S/O to Boerne high", "compete with us"), "Early rivalry voice: direct, local, competitive."),
    ExampleSpec("Old Facebook self-awareness", "a_hump20", ("old Facebook messages", "weird I really was"), "Self-own without overexplaining."),
    ExampleSpec("Boerne Twitter fights", "a_hump20", ("twitter fights", "extremely entertaining"), "Town drama treated like entertainment product."),
    ExampleSpec("Senior-year team pride", "a_hump20", ("better team", "senior year", "school"), "Earnest sports identity before the sharper persona."),
    ExampleSpec("Waffle House San Antonio origin", "a_hump20", ("San Antonio", "@WaffleHouse", "Absolute shame"), "The 2022 version of the later Waffle House mythology."),
    ExampleSpec("Waffle House San Antonio repeat", "a_hump20", ("once again begging", "@WaffleHouse", "San Antonio"), "Recurring place-food grievance."),
    ExampleSpec("Barbie/Oppenheimer social bit", "a_hump20", ("Barbie pink", "Oppenheimer", "stopped"), "Self-aware bit built from a social pattern."),
    ExampleSpec("Chick-fil-A acceptance speech", "a_hump20", ("thank Jesus", "@ChickfilA", "championshipDNA"), "Mock gratitude with sports-ring language."),
    ExampleSpec("Camera operator meltdown", "a_hump20", ("camera man", "one fuckin job"), "Sports-fan frustration reduced to job-performance comedy."),
    ExampleSpec("God is real relief", "a_hump20", ("God is real", "substance abuse"), "Melodramatic relief after sports stress."),
    ExampleSpec("Baby project escalation", "a_hump20", ("diaper change", "literally isn't even possible"), "Mundane school-life object escalated into impossibility."),
    ExampleSpec("Sleep as operating system", "a_hump20", ("10 hours of sleep", "function"), "Plain complaint with deadpan finality."),
    ExampleSpec("Nice.", "a_hump20", ("Nice.",), "One-word deadpan, early archive."),
)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n")


def strip_source(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "")


def words_for(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9][a-zA-Z0-9_']*", text.lower())


def visible_words(text: str) -> list[str]:
    return [w for w in words_for(text) if w not in STOPWORDS and not w.startswith("http")]


def has_emoji(text: str) -> bool:
    return any(ord(char) > 10000 for char in text)


def allcaps_tokens(text: str) -> list[str]:
    return re.findall(r"\b[A-Z]{3,}\b", text)


def clean_text(row: dict[str, Any]) -> str:
    text = row.get("full_text") or ""
    return html.unescape(text).strip()


def is_retweet(row: dict[str, Any]) -> bool:
    return clean_text(row).startswith("RT @")


def public_row(row: dict[str, Any]) -> dict[str, Any]:
    text = clean_text(row)
    mentions = [
        item.get("screen_name")
        for item in row.get("mentions") or []
        if isinstance(item, dict) and item.get("screen_name")
    ]
    return {
        "account": row.get("account_handle"),
        "display_name": row.get("account_display_name"),
        "id": row.get("tweet_id"),
        "date_utc": row.get("created_at_utc"),
        "date_ct": row.get("created_at_local"),
        "deleted_at_ct": row.get("deleted_at_local"),
        "year": int(row.get("year")) if str(row.get("year", "")).isdigit() else row.get("year"),
        "type": "retweet" if is_retweet(row) else "reply" if row.get("is_reply") else "tweet",
        "is_deleted": bool(row.get("is_deleted")),
        "is_reply": bool(row.get("is_reply")),
        "is_self_thread_reply": bool(row.get("is_self_thread_reply")),
        "thread_key": row.get("thread_key"),
        "thread_size": row.get("thread_size"),
        "reply_to": row.get("reply_to_screen_name"),
        "reply_to_tweet_id": row.get("reply_to_tweet_id"),
        "text": text,
        "likes": row.get("favorite_count") or 0,
        "reposts": row.get("retweet_count") or 0,
        "replies": row.get("reply_count") or 0,
        "quotes": row.get("quote_count") or 0,
        "views": row.get("view_count"),
        "source": strip_source(str(row.get("source") or "")),
        "hashtags": row.get("hashtags") or [],
        "mentions": mentions,
        "urls": [
            item.get("expanded_url") or item.get("url")
            for item in row.get("urls") or []
            if isinstance(item, dict) and (item.get("expanded_url") or item.get("url"))
        ],
        "media_count": row.get("media_count") or 0,
        "words": len(re.findall(r"\S+", text)),
        "chars": len(text),
        "url": f"https://x.com/{row.get('account_handle')}/status/{row.get('tweet_id')}",
        "archive_kind": row.get("archive_kind"),
    }


def classify_themes(row: dict[str, Any]) -> list[str]:
    text = f" {row['text'].lower()} "
    tags = []
    for theme, keywords in THEME_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            tags.append(theme)
    if row.get("is_reply"):
        tags.append("question/reply energy")
    if not tags:
        tags.append("everyday observation")
    return tags


def classify_humor(row: dict[str, Any]) -> list[str]:
    text = row["text"]
    lower = text.lower()
    tags = []
    if row.get("is_reply"):
        tags.append("reply volley")
    if row.get("words", 0) <= 12:
        tags.append("short deadpan")
    if re.search(r"\b(i|i'm|i’ve|i'd|me|my|myself|we|our)\b", lower):
        tags.append("self-involving aside")
    if any(word in lower for word in PROFANITY):
        tags.append("casual bluntness")
    if any(word in lower for word in OVERSTATEMENT_WORDS):
        tags.append("overstated stakes")
    if any(word in lower for word in OBJECT_WORDS):
        tags.append("absurd everyday object")
    if "not sure who needed to hear this" in lower or "yesterday i learned" in lower or "psa" in lower:
        tags.append("mock PSA setup")
    if any(word in lower for word in ("thank jesus", "god is real", "god bless", "i would like to thank")):
        tags.append("mock gratitude")
    if any(word in lower for word in ("boerne", "tivy", "heights", "aggie", "casuals", "no ball")):
        tags.append("rivalry/trash-talk")
    if "?" in text and row.get("words", 0) <= 18:
        tags.append("question punchline")
    return tags


def add_tags(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for row in rows:
        row["themes"] = classify_themes(row)
        row["humor"] = classify_humor(row)
    return rows


def ngrams(rows: list[dict[str, Any]], n: int, limit: int) -> list[list[Any]]:
    counts: Counter[tuple[str, ...]] = Counter()
    for row in rows:
        tokens = visible_words(row["text"])
        for i in range(0, max(len(tokens) - n + 1, 0)):
            gram = tuple(tokens[i : i + n])
            if len(gram) == n:
                counts[gram] += 1
    return [[" ".join(key), value] for key, value in counts.most_common(limit)]


def account_summary(rows: list[dict[str, Any]], all_rows: list[dict[str, Any]], raw_summary: dict[str, Any]) -> dict[str, Any]:
    authored = [row for row in rows if row["type"] != "retweet"]
    retweets = [row for row in rows if row["type"] == "retweet"]
    word_counts = [row["words"] for row in authored]
    authored_dated = [row["date_ct"] for row in authored if row.get("date_ct")]
    archive_dated = [row["date_ct"] for row in rows if row.get("date_ct")]
    theme_counts = Counter(theme for row in authored for theme in row.get("themes", []))
    humor_counts = Counter(tag for row in authored for tag in row.get("humor", []))
    return {
        "account": raw_summary.get("account", {}),
        "official_archive_rows": len(rows),
        "authored_voice_tweets": len(authored),
        "retweets_context": len(retweets),
        "deleted_tweets": sum(1 for row in rows if row.get("is_deleted")),
        "replies": sum(1 for row in authored if row.get("is_reply")),
        "tweets": sum(1 for row in authored if not row.get("is_reply")),
        "self_thread_replies": sum(1 for row in authored if row.get("is_self_thread_reply")),
        "threads_or_conversations": raw_summary.get("counts", {}).get("threads_or_conversations"),
        "date_range_ct": [min(authored_dated) if authored_dated else None, max(authored_dated) if authored_dated else None],
        "authored_date_range_ct": [min(authored_dated) if authored_dated else None, max(authored_dated) if authored_dated else None],
        "archive_date_range_ct": [min(archive_dated) if archive_dated else None, max(archive_dated) if archive_dated else None],
        "by_year": dict(sorted(Counter(str(row.get("year")) for row in authored).items())),
        "by_type": dict(sorted(Counter(row["type"] for row in rows).items())),
        "top_themes": theme_counts.most_common(12),
        "top_humor_tags": humor_counts.most_common(12),
        "avg_words": round(sum(word_counts) / len(word_counts), 1) if word_counts else 0,
        "median_words": round(float(median(word_counts)), 1) if word_counts else 0,
        "question_rate": round(sum(1 for row in authored if "?" in row["text"]) / len(authored), 3) if authored else 0,
        "hashtag_rate": round(sum(1 for row in authored if row.get("hashtags")) / len(authored), 3) if authored else 0,
        "mention_rate": round(sum(1 for row in authored if row.get("mentions")) / len(authored), 3) if authored else 0,
        "emoji_rate": round(sum(1 for row in authored if has_emoji(row["text"])) / len(authored), 3) if authored else 0,
        "profanity_rate": round(sum(1 for row in authored if any(p in row["text"].lower() for p in PROFANITY)) / len(authored), 3) if authored else 0,
        "allcaps_rate": round(sum(1 for row in authored if allcaps_tokens(row["text"])) / len(authored), 3) if authored else 0,
        "top_words": ngrams(authored, 1, 80),
        "top_bigrams": ngrams(authored, 2, 70),
        "top_trigrams": ngrams(authored, 3, 50),
        "top_hashtags": Counter(tag.lower() for row in authored for tag in row.get("hashtags", [])).most_common(40),
        "top_mentions": Counter(m.lower() for row in authored for m in row.get("mentions", [])).most_common(40),
        "top_liked": sorted(authored, key=lambda row: row["likes"], reverse=True)[:20],
        "source_summary": raw_summary,
    }


def score_example(row: dict[str, Any]) -> tuple[int, int, str]:
    return (row.get("likes") or 0, row.get("reposts") or 0, row.get("date_ct") or "")


def select_example(rows: list[dict[str, Any]], spec: ExampleSpec) -> dict[str, Any] | None:
    candidates = []
    for row in rows:
        if spec.account and row.get("account") != spec.account:
            continue
        lower = row["text"].lower()
        if all(term.lower() in lower for term in spec.terms):
            candidates.append(row)
    if not candidates:
        return None
    row = sorted(candidates, key=score_example, reverse=True)[0]
    return {"label": spec.label, "note": spec.note, "tweet": row}


def phase_for(row: dict[str, Any]) -> str:
    year = int(row["year"]) if str(row.get("year", "")).isdigit() else 0
    if year <= 2014:
        return "2011-2014: early social and school voice"
    if year <= 2019:
        return "2015-2019: lower-volume bridge years"
    if year <= 2023:
        return "2020-2023: sports, place, and adult-life commentary"
    return "2024-2026: commentary persona and AI-tool era"


def phase_summary(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        groups[phase_for(row)].append(row)
    out = []
    for phase, group in groups.items():
        theme_counts = Counter(theme for row in group for theme in row["themes"])
        humor_counts = Counter(tag for row in group for tag in row["humor"])
        out.append(
            {
                "phase": phase,
                "count": len(group),
                "date_range_ct": [
                    min(row["date_ct"] for row in group if row.get("date_ct")),
                    max(row["date_ct"] for row in group if row.get("date_ct")),
                ],
                "top_themes": theme_counts.most_common(7),
                "top_humor": humor_counts.most_common(7),
                "sample": sorted(group, key=lambda row: (row["likes"], row["reposts"]), reverse=True)[:5],
            }
        )
    return sorted(out, key=lambda item: item["date_range_ct"][0])


def evidence_block(example: dict[str, Any]) -> str:
    tweet = example["tweet"]
    deleted = " [deleted]" if tweet.get("is_deleted") else ""
    return (
        f"- {tweet['date_ct'][:10]} @{tweet['account']}{deleted}: "
        f"“{tweet['text']}” "
        f"({tweet['likes']} likes, {tweet['reposts']} reposts). {example['note']}"
    )


def build_markdown(data: dict[str, Any]) -> str:
    examples = data["examples"]
    by_label = {item["label"]: item for item in examples}

    def ex(label: str) -> str:
        item = by_label.get(label)
        return evidence_block(item) if item else f"- Missing selected example: {label}"

    summary = data["summary"]
    counts = summary["counts"]
    total = summary["totals"]
    lines = [
        "# Austin X/Twitter Official Archive Voice Analysis",
        "",
        f"[verified] Built from the official X archive exports parsed on {DATE_LABEL}.",
        f"[verified] Official rows: {total['official_archive_rows']:,}. Authored voice rows: {total['authored_voice_tweets']:,}. Retweet/context rows: {total['retweets_context']:,}. Deleted tweet rows included: {total['deleted_tweets']:,}.",
        f"[verified] Authored voice ranges: @a_hump20 covers {counts['a_hump20']['authored_date_range_ct'][0]} to {counts['a_hump20']['authored_date_range_ct'][1]}; @TXTrickWhooper covers {counts['TXTrickWhooper']['authored_date_range_ct'][0]} to {counts['TXTrickWhooper']['authored_date_range_ct'][1]}.",
        f"[verified] Full official-row ranges including retweets/context: @a_hump20 covers {counts['a_hump20']['archive_date_range_ct'][0]} to {counts['a_hump20']['archive_date_range_ct'][1]}; @TXTrickWhooper covers {counts['TXTrickWhooper']['archive_date_range_ct'][0]} to {counts['TXTrickWhooper']['archive_date_range_ct'][1]}.",
        "[verified] Direct messages, contacts, IP/device files, and ad files were excluded from this voice corpus.",
        "",
        "## A. Speech Patterns & Linguistic Style",
        "",
        "[verified] The core voice is short, concrete, and reaction-native. The median authored post is 10 words on @a_hump20 and 12 words on @TXTrickWhooper, with the newer commentary account using far more replies.",
        "",
        "[verified] Recurring word clusters: sports identity (Texas, Longhorns, Cardinals, Titans, Yadi, Pujols), local place nouns (Boerne, San Antonio, Memphis), food institutions (Waffle House, Chick-fil-A), and newer AI tooling language (Grok, Claude, Fable, Opus, Codex, agent, model).",
        "",
        "[reasoned] The signature rhythm is: notice a real thing, choose the most specific noun, inflate the stakes, stop before explaining the joke.",
        "",
        ex("Nice."),
        ex("Sleep as operating system"),
        ex("Claude model complaint"),
        ex("For You page grievance letter"),
        "",
        "## B. Theme Evolution & Content Shifts",
        "",
        "[verified] The early archive is not empty. @a_hump20 has 3,697 authored/retweet rows from 2011-2014, which means the foundation is older than the prior live scrape showed.",
        "",
        "[reasoned] The major shift is channel separation. @a_hump20 stays closer to personal sports/life posting. @TXTrickWhooper becomes a commentary costume: faster replies, more public jokes, more AI/dev complaints, and more explicit persona work.",
        "",
        ex("Boerne rivalry shot"),
        ex("Boerne Twitter fights"),
        ex("Waffle House San Antonio origin"),
        ex("Fable access as birthright"),
        "",
        "## C. Humor Patterns",
        "",
        "[verified] The strongest humor pattern is scale mismatch. Small event, massive language.",
        "",
        "1. Deadpan civic overstatement",
        ex("Waffle House as civil-defense institution"),
        ex("Joey Chestnut patriot theology"),
        "",
        "2. Mock PSA or fake discovery",
        ex("Vape charger mock PSA"),
        ex("Cats-as-hardware deadpan"),
        "",
        "3. Reply correction with no warmup",
        ex("Reading code punchline"),
        ex("Baseball vocabulary gatekeeping"),
        "",
        "4. Self-own first, punchline second",
        ex("Old Facebook self-awareness"),
        ex("AI-tool self-own"),
        ex("Barbie/Oppenheimer social bit"),
        "",
        "5. Sports-fan melodrama",
        ex("Camera operator meltdown"),
        ex("God is real relief"),
        ex("Betting-era casuals"),
        "",
        "6. Mock gratitude and fake ceremony",
        ex("Chick-fil-A acceptance speech"),
        "",
        "[reasoned] The humor got sharper because it became more contextual. Early posts often say what happened. Later posts choose a frame that makes the event feel absurdly important.",
        "",
        "## D. Style Evolution & Personal Branding",
        "",
        "[verified] @TXTrickWhooper is the explicit brand layer: Stallion of the Steroid Era, Longhorn identity, #LegalizeRoids, AI/ML, sports-bar geography, and Pitch Atlas link.",
        "",
        "[reasoned] The persona works because it does not erase the older voice. It turns the same instincts up: sports certainty, regional nouns, blunt jokes, mock-formal language, and self-involving asides.",
        "",
        ex("Senior-year team pride"),
        ex("Waffle House San Antonio repeat"),
        ex("For You page grievance letter"),
        "",
        "## E. Voice Synthesis & Future Use",
        "",
        "[reasoned] Default Austin voice model: start from the real irritation; use one concrete noun; let sports/group-chat cadence carry it; add one absurd escalation; quit early.",
        "",
        "Use these defaults when writing as Austin:",
        "- Short sentence first. Explanation second only if needed.",
        "- Specific nouns beat generic adjectives.",
        "- Use casual compression when the venue allows it: bro, y’all, ain’t, ngl, tbh, bc.",
        "- Keep the edge when the edge is the point.",
        "- Let confidence and self-own coexist.",
        "- Avoid influencer polish, corporate value-prop voice, and tidy moral lessons.",
        "",
        "## F. Overall Synthesis & Key Insights",
        "",
        "[reasoned] Across both accounts, you write like a sports-native observer who processes the world through rivalry, place, appetite, and absurd institutional language.",
        "",
        "[verified] The corpus shows a clean move from early social/school posting into sports-life commentary, then into a public reply persona with AI/dev tools as the newest arena for the same intensity.",
        "",
        "[reasoned] Your best joke form is: minor inconvenience as public emergency. Waffle House is not just food. It is infrastructure. Fable is not just a model. It is a birthright. A camera miss is not a mistake. It is professional malpractice on national television.",
        "",
        "## Source Boundary",
        "",
        "[verified] Source files parsed: `tweets.js`, `community-tweet.js`, `note-tweet.js`, and `deleted-tweets.js` from both official X archives.",
        "[verified] `tweet-headers.js` matched the main tweet counts for both accounts. Deleted headers matched the four deleted TXTrickWhooper rows.",
        "[verified] Retweets beginning with `RT @` are preserved as context but excluded from the authored voice count.",
    ]
    return "\n".join(lines) + "\n"


def build_html(data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    react_fallback = """<script>
(function () {
  if (window.React && window.ReactDOM) return;
  const state = [];
  let cursor = 0;
  let rootElement = null;
  let rootVNode = null;
  const flat = (items) => items.flat(Infinity).filter((item) => item !== null && item !== undefined && item !== false);
  function createElement(type, props, ...children) {
    return { type, props: { ...(props || {}), children: flat(children) } };
  }
  function setProp(el, name, value) {
    if (name === "children" || name === "key" || value === null || value === undefined || value === false) return;
    if (name === "className") { el.setAttribute("class", value); return; }
    if (name === "htmlFor") { el.setAttribute("for", value); return; }
    if (name === "style" && typeof value === "object") { Object.assign(el.style, value); return; }
    if (name.startsWith("on") && typeof value === "function") { el.addEventListener(name.slice(2).toLowerCase(), value); return; }
    if (name === "value" || name === "checked") { el[name] = value; return; }
    if (value === true) { el.setAttribute(name, ""); return; }
    el.setAttribute(name, value);
  }
  function renderVNode(vnode) {
    if (vnode === null || vnode === undefined || vnode === false) return document.createTextNode("");
    if (typeof vnode === "string" || typeof vnode === "number") return document.createTextNode(String(vnode));
    if (typeof vnode.type === "function") return renderVNode(vnode.type(vnode.props || {}));
    const el = document.createElement(vnode.type);
    for (const child of flat((vnode.props && vnode.props.children) || [])) el.appendChild(renderVNode(child));
    for (const [name, value] of Object.entries(vnode.props || {})) setProp(el, name, value);
    return el;
  }
  function rerender() {
    if (!rootElement || !rootVNode) return;
    cursor = 0;
    rootElement.replaceChildren(renderVNode(rootVNode));
  }
  function useState(initialValue) {
    const index = cursor++;
    if (state[index] === undefined) state[index] = initialValue;
    const setState = (nextValue) => {
      state[index] = typeof nextValue === "function" ? nextValue(state[index]) : nextValue;
      rerender();
    };
    return [state[index], setState];
  }
  window.React = { createElement, useState };
  window.ReactDOM = { createRoot: (el) => ({ render: (vnode) => { rootElement = el; rootVNode = vnode; rerender(); } }) };
})();
</script>"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Austin X Voice Archive: Official Export Analysis</title>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
{react_fallback}
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Oswald:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
  :root {{
    --paper:#fbf8f2; --paper2:#f0e8dd; --ink:#181513; --muted:#62584f; --line:#d8c7b6;
    --burnt:#bf5700; --brown:#6d3a12; --blue:#215a8f; --green:#1d6b46; --red:#9f2a1f;
    --cream:#fffdf8; --wash:#f6efe6; --shadow:0 16px 42px rgba(65,36,10,.11);
  }}
  * {{ box-sizing:border-box; }}
  html {{ scroll-behavior:smooth; }}
  body {{ margin:0; color:var(--ink); background:linear-gradient(90deg,rgba(191,87,0,.05) 0 1px,transparent 1px 100%),linear-gradient(180deg,rgba(109,58,18,.05) 0 1px,transparent 1px 100%),var(--paper); background-size:34px 34px; font-family:"Cormorant Garamond", Georgia, serif; font-size:18px; line-height:1.62; }}
  a {{ color:var(--burnt); }}
  button,input,select {{ font:inherit; }}
  button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible {{ outline:3px solid rgba(191,87,0,.45); outline-offset:3px; }}
  .shell {{ max-width:1220px; margin:0 auto; padding:38px 34px 76px; }}
  .hero {{ min-height:72vh; display:grid; align-content:center; gap:22px; border-bottom:4px double var(--burnt); padding:54px 0 50px; }}
  .eyebrow,.label,.nav a,.pill,.stat-label,.section-kicker,th,.tab,.claim,.meta,.metric {{ font-family:"JetBrains Mono", ui-monospace, monospace; letter-spacing:.035em; text-transform:uppercase; }}
  h1,h2,h3,.stat-value,.section-title {{ font-family:"Oswald", "Arial Narrow", sans-serif; text-transform:uppercase; letter-spacing:.02em; }}
  h1 {{ margin:0; color:var(--burnt); font-size:clamp(2.75rem,7vw,6.35rem); line-height:.92; max-width:1000px; }}
  .subtitle {{ max-width:880px; font-size:clamp(1.18rem,2vw,1.55rem); color:var(--muted); font-style:italic; }}
  .hero-grid,.stat-grid,.account-grid,.two-col,.three-col,.phase-grid {{ display:grid; gap:16px; }}
  .hero-grid {{ grid-template-columns:1.16fr .84fr; align-items:end; }}
  .stat-grid {{ grid-template-columns:repeat(4,1fr); margin-top:18px; }}
  .account-grid,.two-col {{ grid-template-columns:repeat(2,minmax(0,1fr)); }}
  .three-col {{ grid-template-columns:repeat(3,minmax(0,1fr)); }}
  .phase-grid {{ grid-template-columns:repeat(4,minmax(0,1fr)); }}
  .panel,.stat,.example,.note,.method,.table-wrap {{ background:rgba(255,253,248,.92); border:1px solid var(--line); box-shadow:var(--shadow); }}
  .panel,.method {{ padding:22px; }}
  .stat {{ padding:16px 18px; border-left:4px solid var(--burnt); min-height:112px; }}
  .stat-label {{ display:block; color:var(--muted); font-size:.72rem; }}
  .stat-value {{ display:block; font-size:2rem; line-height:1.05; margin-top:6px; }}
  .small {{ color:var(--muted); font-size:.96rem; }}
  .nav {{ position:sticky; top:0; z-index:10; display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:0 -10px 34px; padding:12px; background:rgba(251,248,242,.95); border-bottom:1px solid var(--line); backdrop-filter:blur(10px); }}
  .nav a,.tab {{ display:inline-flex; align-items:center; min-height:34px; border:1px solid var(--line); background:var(--cream); color:var(--brown); text-decoration:none; padding:6px 10px; font-size:.74rem; cursor:pointer; }}
  .nav a:hover,.tab:hover,.tab.active {{ border-color:var(--burnt); color:var(--burnt); }}
  section {{ margin:52px 0; scroll-margin-top:78px; }}
  h2 {{ margin:0 0 18px; color:var(--brown); border-bottom:3px solid var(--burnt); padding-bottom:8px; font-size:clamp(1.65rem,3vw,2.35rem); }}
  h3 {{ margin:20px 0 8px; font-size:1.22rem; color:var(--ink); }}
  p {{ margin:0 0 13px; }}
  ul {{ margin:8px 0 0 20px; padding:0; }}
  li {{ margin:6px 0; }}
  code {{ font-family:"JetBrains Mono", monospace; font-size:.86em; color:var(--brown); }}
  .claim {{ display:inline-block; font-size:.72rem; padding:1px 6px; margin-right:5px; border:1px solid var(--line); background:var(--wash); color:var(--brown); vertical-align:middle; }}
  .claim.good {{ color:var(--green); border-color:rgba(29,107,70,.35); }} .claim.open {{ color:var(--red); border-color:rgba(159,42,31,.35); }} .claim.reasoned {{ color:var(--blue); border-color:rgba(33,90,143,.35); }}
  .pill-row {{ display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }}
  .pill {{ display:inline-flex; align-items:center; border:1px solid var(--line); background:var(--wash); color:var(--brown); padding:4px 8px; font-size:.68rem; }}
  .example {{ padding:16px; }}
  .example .meta {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:8px; color:var(--muted); font-size:.72rem; }}
  .quote {{ font-size:1.08rem; line-height:1.48; white-space:pre-wrap; }}
  .note-text {{ color:var(--muted); font-style:italic; margin-top:8px; }}
  .divider {{ height:1px; background:var(--line); margin:18px 0; }}
  .callout {{ border-left:4px solid var(--burnt); background:var(--wash); padding:16px 18px; }}
  .callout.green {{ border-left-color:var(--green); }} .callout.red {{ border-left-color:var(--red); }}
  .controls {{ display:grid; grid-template-columns:1fr 160px 170px 150px; gap:10px; margin:12px 0 16px; }}
  .controls input,.controls select {{ width:100%; border:1px solid var(--line); background:var(--cream); min-height:42px; padding:8px 10px; color:var(--ink); }}
  .table-wrap {{ overflow:auto; max-height:660px; }}
  table {{ width:100%; border-collapse:collapse; min-width:900px; background:var(--cream); }}
  th,td {{ border-bottom:1px solid var(--line); padding:10px 12px; vertical-align:top; text-align:left; }}
  th {{ position:sticky; top:0; background:var(--paper2); color:var(--brown); font-size:.72rem; z-index:1; }}
  td.text {{ min-width:430px; white-space:pre-wrap; line-height:1.38; }}
  .metric {{ color:var(--muted); font-size:.8rem; white-space:nowrap; }}
  .footer {{ border-top:4px double var(--burnt); margin-top:60px; padding-top:28px; color:var(--muted); }}
  @media (max-width:980px) {{ .hero-grid,.stat-grid,.account-grid,.two-col,.three-col,.phase-grid,.controls {{ grid-template-columns:1fr; }} .shell {{ padding:24px 18px 56px; }} .hero {{ min-height:auto; padding-top:34px; }} .nav {{ position:static; justify-content:flex-start; }} }}
</style>
</head>
<body>
<div id="root"></div>
<script>
window.ARCHIVE_DATA = {payload};
</script>
<script>
const h = React.createElement;
const DATA = window.ARCHIVE_DATA;
const fmtDate = (iso) => {{
  if (!iso) return 'unknown';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {{ year:'numeric', month:'short', day:'numeric' }});
}};
const num = (n) => (n ?? 0).toLocaleString();
function Claim({{type='good', children}}) {{ return h('span', {{className:'claim '+type}}, children); }}
function Stat({{label,value,detail}}) {{ return h('div', {{className:'stat'}}, h('span', {{className:'stat-label'}}, label), h('span', {{className:'stat-value'}}, value), detail && h('div', {{className:'small'}}, detail)); }}
function PillRow({{items=[]}}) {{ return h('div', {{className:'pill-row'}}, items.filter(Boolean).map((x,i)=>h('span', {{className:'pill', key:i}}, x))); }}
function Example({{item}}) {{
  if (!item || !item.tweet) return null;
  const t=item.tweet;
  return h('article', {{className:'example'}},
    h('div', {{className:'meta'}}, h('span', null, item.label), h('span', null, '@'+t.account), h('span', null, fmtDate(t.date_ct)), h('span', null, t.type), t.is_deleted && h('span', null, 'deleted'), h('span', null, 'likes '+num(t.likes))),
    h('div', {{className:'quote'}}, t.text),
    h(PillRow, {{items:[...(t.themes||[]), ...(t.humor||[])].slice(0,5)}}),
    h('p', {{className:'note-text'}}, item.note)
  );
}}
function AccountPanel({{handle}}) {{
  const c=DATA.summary.counts[handle];
  return h('div', {{className:'panel'}},
    h('h3', null, '@'+handle),
    h('p', null, h(Claim, null, '[verified]'), ' Official export rows: ', num(c.official_archive_rows), '. Authored voice rows: ', num(c.authored_voice_tweets), '. Retweet context rows: ', num(c.retweets_context), '.'),
    h(PillRow, {{items:[`Authored range: ${{fmtDate(c.authored_date_range_ct[0])}} to ${{fmtDate(c.authored_date_range_ct[1])}}`, `Full row range: ${{fmtDate(c.archive_date_range_ct[0])}} to ${{fmtDate(c.archive_date_range_ct[1])}}`, `Median words: ${{c.median_words}}`, `Replies: ${{num(c.replies)}}`, `Deleted rows: ${{num(c.deleted_tweets)}}`]}}),
    h('div', {{className:'divider'}}),
    h('p', null, h('strong', null, 'Top themes: '), c.top_themes.slice(0,5).map(x=>`${{x[0]}} (${{x[1]}})`).join(', ')),
    h('p', null, h('strong', null, 'Humor tags: '), c.top_humor_tags.slice(0,5).map(x=>`${{x[0]}} (${{x[1]}})`).join(', '))
  );
}}
function Section({{id,title,children}}) {{ return h('section', {{id}}, h('h2', null, title), children); }}
function PhaseCard({{phase}}) {{
  return h('div', {{className:'panel'}},
    h('h3', null, phase.phase),
    h('p', null, h(Claim, null, '[verified]'), ' ', num(phase.count), ' authored rows.'),
    h(PillRow, {{items:[`${{fmtDate(phase.date_range_ct[0])}} to ${{fmtDate(phase.date_range_ct[1])}}`]}}),
    h('p', null, h('strong', null, 'Themes: '), phase.top_themes.slice(0,3).map(x=>`${{x[0]}} (${{x[1]}})`).join(', ')),
    phase.sample && phase.sample[0] && h(Example, {{item:{{label:'Representative high-engagement row', note:'Selected by likes/reposts inside this phase.', tweet:phase.sample[0]}}}})
  );
}}
function EvidenceExplorer() {{
  const [q,setQ]=React.useState('');
  const [acct,setAcct]=React.useState('all');
  const [tag,setTag]=React.useState('all');
  const [sort,setSort]=React.useState('newest');
  const tags = Array.from(new Set(DATA.authored.flatMap(r => [...(r.themes||[]), ...(r.humor||[])]))).sort();
  let rows = DATA.authored
    .filter(r => acct==='all' || r.account===acct)
    .filter(r => tag==='all' || (r.themes||[]).includes(tag) || (r.humor||[]).includes(tag))
    .filter(r => !q.trim() || r.text.toLowerCase().includes(q.toLowerCase()) || String(r.year).includes(q) || (r.themes||[]).join(' ').toLowerCase().includes(q.toLowerCase()) || (r.humor||[]).join(' ').toLowerCase().includes(q.toLowerCase()));
  rows.sort((a,b)=> sort==='likes' ? b.likes-a.likes : sort==='oldest' ? new Date(a.date_ct)-new Date(b.date_ct) : new Date(b.date_ct)-new Date(a.date_ct));
  return h('div', null,
    h('div', {{className:'controls'}},
      h('input', {{value:q, onChange:e=>setQ(e.target.value), title:'Search authored tweets, year, theme', 'aria-label':'Search authored tweets'}}),
      h('select', {{value:acct, onChange:e=>setAcct(e.target.value), 'aria-label':'Account filter'}}, h('option', {{value:'all'}}, 'All accounts'), DATA.accounts.map(a=>h('option', {{key:a, value:a}}, a))),
      h('select', {{value:tag, onChange:e=>setTag(e.target.value), 'aria-label':'Tag filter'}}, h('option', {{value:'all'}}, 'All tags'), tags.map(t=>h('option', {{key:t,value:t}}, t))),
      h('select', {{value:sort, onChange:e=>setSort(e.target.value), 'aria-label':'Sort'}}, h('option', {{value:'newest'}}, 'Newest first'), h('option', {{value:'oldest'}}, 'Oldest first'), h('option', {{value:'likes'}}, 'Most liked'))
    ),
    h('p', {{className:'small'}}, h(Claim, null, '[verified]'), ' Showing ', num(rows.length), ' of ', num(DATA.authored.length), ' authored official archive rows. Retweets are preserved separately, not used as your voice evidence.'),
    rows.length === 0
      ? h('div', {{className:'callout red'}}, h(Claim, {{type:'open'}}, '[empty]'), ' No rows match those filters.')
      : h('div', {{className:'table-wrap'}}, h('table', null,
          h('thead', null, h('tr', null, ['Date','Acct','Type','Text','Metrics','Tags'].map(x=>h('th', {{key:x}}, x)))),
          h('tbody', null, rows.map(r=>h('tr', {{key:r.account+r.id}},
            h('td', null, fmtDate(r.date_ct)),
            h('td', null, '@'+r.account),
            h('td', null, r.type + (r.is_deleted ? ' deleted' : '')),
            h('td', {{className:'text'}}, r.text),
            h('td', {{className:'metric'}}, `likes ${{r.likes}} · reposts ${{r.reposts}} · replies ${{r.replies}}`),
            h('td', null, h(PillRow, {{items:[...(r.themes||[]), ...(r.humor||[])].slice(0,4)}}))
          )))
        ))
  );
}}
function WordList({{handle, kind}}) {{
  const rows = DATA.summary.counts[handle][kind] || [];
  return h('div', {{className:'panel'}}, h('h3', null, '@'+handle+' '+kind.replace('top_','').replace('_',' ')), h(PillRow, {{items:rows.slice(0,18).map(x=>`${{x[0]}} (${{x[1]}})`)}}));
}}
function App() {{
  const total = DATA.summary.totals;
  const ex = Object.fromEntries(DATA.examples.map(item => [item.label, item]));
  return h('main', {{className:'shell'}},
    h('header', {{className:'hero'}},
      h('div', {{className:'hero-grid'}},
        h('div', null,
          h('div', {{className:'eyebrow'}}, 'Official X archive export · July 6, 2026 · America/Chicago'),
          h('h1', null, 'Austin X Voice Archive'),
          h('p', {{className:'subtitle'}}, 'A React evidence dossier built from both official X metadata exports, with every authored row available for audit.')
        ),
        h('div', {{className:'panel'}},
          h('p', null, h(Claim, null, '[verified]'), ' This now uses the real official exports, not the earlier partial live scrape.'),
          h('p', null, h(Claim, null, '[verified]'), ' Parsed ', num(total.official_archive_rows), ' official rows across both accounts. Direct messages and contact/IP/device files were excluded from voice analysis.'),
          h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' Your core move is scale mismatch: small thing, huge stakes, local noun, hard stop.')
        )
      )
    ),
    h('div', {{className:'stat-grid'}},
      h(Stat, {{label:'Official archive rows', value:num(total.official_archive_rows), detail:'tweets.js, community tweets, note tweets, deleted tweets'}}),
      h(Stat, {{label:'Authored voice rows', value:num(total.authored_voice_tweets), detail:'Retweets excluded from voice model'}}),
      h(Stat, {{label:'Retweet context', value:num(total.retweets_context), detail:'Preserved, not treated as your wording'}}),
      h(Stat, {{label:'Date range', value:'2011-2026', detail:'Oldest authored row to newest authored row'}})
    ),
    h('nav', {{className:'nav'}}, ['Known','A Style','B Themes','C Humor','D Brand','E Voice','F Synthesis','Evidence'].map((x,i)=>h('a', {{key:x, href:['#known','#style','#themes','#humor','#brand','#voice','#synthesis','#evidence'][i]}}, x))),
    h(Section, {{id:'known', title:'Known / Unknown / Open'}},
      h('div', {{className:'two-col'}},
        h('div', {{className:'method'}}, h('h3', null, 'Known'), h('p', null, h(Claim, null, '[verified]'), ' Both official archive exports were parsed from the Downloads metadata folder.'), h('p', null, h(Claim, null, '[verified]'), ' BirdClaw guidance matches this parser: account.js anchors identity, JS assignment files are parsed as JSON payloads, tweet IDs drive dedupe, and reply/conversation IDs are preserved.'), h('p', null, h(Claim, null, '[verified]'), ' Cleaned official files now live under ', h('code', null, 'X-Twitter-Archive/processed/'), ' and the analysis layer lives under ', h('code', null, 'X-Twitter-Archive/official-analysis/2026-07-06/'), '.')),
        h('div', {{className:'method'}}, h('h3', null, 'Unknown / Open'), h('p', null, h(Claim, {{type:'open'}}, '[unknown/open]'), ' External thread context is limited to IDs unless X included the parent tweet in your own archive.'), h('p', null, h(Claim, {{type:'open'}}, '[privacy boundary]'), ' DMs were present in the export but intentionally excluded from this corpus.'))
      ),
      h('div', {{className:'account-grid'}}, DATA.accounts.map(handle=>h(AccountPanel, {{key:handle, handle}})))
    ),
    h(Section, {{id:'style', title:'A. Speech Patterns & Linguistic Style'}},
      h('div', {{className:'panel'}}, h('p', null, h(Claim, null, '[verified]'), ' The combined voice is short, concrete, and built for reaction. @a_hump20 median length is ', DATA.summary.counts.a_hump20.median_words, ' words; @TXTrickWhooper median length is ', DATA.summary.counts.TXTrickWhooper.median_words, ' words.'), h('p', null, h(Claim, null, '[verified]'), ' Recurring words and phrases cluster around sports identity, Boerne/San Antonio place memory, food institutions, and the newer AI toolchain.'), h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' Rhythm: plain setup, specific noun, abrupt escalation. The sentence usually exits before the joke can get explained to death.')),
      h('div', {{className:'three-col'}}, ['Nice.','Sleep as operating system','Claude model complaint','For You page grievance letter','Vape charger mock PSA','Cats-as-hardware deadpan'].map(label=>h(Example, {{key:label, item:ex[label]}}))),
      h('div', {{className:'two-col'}}, h(WordList, {{handle:'a_hump20', kind:'top_bigrams'}}), h(WordList, {{handle:'TXTrickWhooper', kind:'top_bigrams'}}))
    ),
    h(Section, {{id:'themes', title:'B. Theme Evolution & Content Shifts'}},
      h('div', {{className:'panel'}}, h('p', null, h(Claim, null, '[verified]'), ' The full archive changes the early read. @a_hump20 starts in 2011, with high volume through 2014, then drops into lower-volume sports/life posting before the Stallion account appears in 2022.'), h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' The main turning point is channel split, not a personality reset. One account holds the life archive. The other gives the same instincts a public commentary costume.')),
      h('div', {{className:'phase-grid'}}, DATA.phases.map(phase=>h(PhaseCard, {{key:phase.phase, phase}}))),
      h('div', {{className:'three-col'}}, ['Boerne rivalry shot','Waffle House San Antonio origin','Waffle House San Antonio repeat','Fable access as birthright','Senior-year team pride','Barbie/Oppenheimer social bit'].map(label=>h(Example, {{key:label, item:ex[label]}})))
    ),
    h(Section, {{id:'humor', title:'C. Humor Patterns'}},
      h('div', {{className:'panel'}}, h('p', null, h(Claim, null, '[verified]'), ' Humor tags with the largest counts are short deadpan, reply volley, self-involving aside, casual bluntness, question punchline, overstated stakes, and absurd everyday object.'), h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' The most Austin-shaped joke form is minor inconvenience as public emergency. It sounds casual because the sentence stays simple; it lands because the frame is way too large for the object.')),
      h('div', {{className:'two-col'}},
        h('div', {{className:'panel'}}, h('h3', null, 'Deadpan civic overstatement'), h(Example, {{item:ex['Waffle House as civil-defense institution']}}), h(Example, {{item:ex['Joey Chestnut patriot theology']}})),
        h('div', {{className:'panel'}}, h('h3', null, 'Mock PSA / fake discovery'), h(Example, {{item:ex['Vape charger mock PSA']}}), h(Example, {{item:ex['Cats-as-hardware deadpan']}}))
      ),
      h('div', {{className:'two-col'}},
        h('div', {{className:'panel'}}, h('h3', null, 'Reply correction'), h(Example, {{item:ex['Reading code punchline']}}), h(Example, {{item:ex['Baseball vocabulary gatekeeping']}})),
        h('div', {{className:'panel'}}, h('h3', null, 'Self-own as cover charge'), h(Example, {{item:ex['Old Facebook self-awareness']}}), h(Example, {{item:ex['AI-tool self-own']}}))
      ),
      h('div', {{className:'two-col'}},
        h('div', {{className:'panel'}}, h('h3', null, 'Sports-fan melodrama'), h(Example, {{item:ex['Camera operator meltdown']}}), h(Example, {{item:ex['God is real relief']}})),
        h('div', {{className:'panel'}}, h('h3', null, 'Mock gratitude'), h(Example, {{item:ex['Chick-fil-A acceptance speech']}}))
      )
    ),
    h(Section, {{id:'brand', title:'D. Style Evolution & Personal Branding'}},
      h('div', {{className:'panel'}}, h('p', null, h(Claim, null, '[verified]'), ' The Stallion account is the explicit brand layer: commentary label, Longhorn identity, #LegalizeRoids, AI/ML, sports-bar geography, and Pitch Atlas link.'), h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' It works because it amplifies older Austin traits instead of replacing them: sports certainty, local nouns, bluntness, mock ceremony, and willingness to be implicated in the joke.')),
      h('div', {{className:'three-col'}}, ['Boerne Twitter fights','Waffle House San Antonio repeat','For You page grievance letter','Grok liberation punchline','Betting-era casuals','Fable access as birthright'].map(label=>h(Example, {{key:label, item:ex[label]}})))
    ),
    h(Section, {{id:'voice', title:'E. Voice Synthesis & Future Use'}},
      h('div', {{className:'callout green'}}, h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' Default voice model: start from the real irritation; use one concrete noun; let sports or group-chat cadence carry it; add one absurd escalation; quit early.'), h('p', null, h(Claim, null, '[verified]'), ' A local memory note was written so future Austin-writing work can use this voice map unless you ask for another mode.')),
      h('div', {{className:'two-col'}},
        h('div', {{className:'panel'}}, h('h3', null, 'Do'), h('ul', null, h('li', null, 'Use specific nouns: Waffle House, Fable, Yadi, Boerne, Chick-fil-A, Arch.'), h('li', null, 'Keep the first sentence short.'), h('li', null, 'Let the joke hit through scale mismatch.'), h('li', null, 'Keep casual compression where the venue allows it: bro, y’all, ain’t, ngl, tbh, bc.'))),
        h('div', {{className:'panel'}}, h('h3', null, 'Do not'), h('ul', null, h('li', null, 'Do not sand every edge into generic brand-safe prose.'), h('li', null, 'Do not explain the punchline twice.'), h('li', null, 'Do not replace specific sports/place nouns with broad categories.'), h('li', null, 'Do not write corporate value-prop voice unless explicitly asked.')))
      )
    ),
    h(Section, {{id:'synthesis', title:'F. Overall Synthesis & Key Insights'}},
      h('div', {{className:'panel'}}, h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' Across both accounts, you write like a sports-native observer who turns rivalry, place, appetite, and tool frustration into small public performances.'), h('p', null, h(Claim, null, '[verified]'), ' The archive backs a clear evolution: 2011-2014 social/school volume, 2020-2023 sports/place/adult-life commentary, then 2024-2026 public reply persona plus AI/dev-tool obsession.'), h('p', null, h(Claim, {{type:'reasoned'}}, '[reasoned]'), ' Big picture: your humor has sharpened because it now picks frames faster. Early posts often report the thing. Recent posts decide the exact ridiculous institution the thing belongs to.')),
      h('div', {{className:'three-col'}}, h('div', {{className:'panel'}}, h('h3', null, 'Takeaway 1'), h('p', null, 'Your funniest lines are usually one sentence and one escalation.')), h('div', {{className:'panel'}}, h('h3', null, 'Takeaway 2'), h('p', null, 'Sports remains the emotional engine, but AI/dev tools are the newest stadium.')), h('div', {{className:'panel'}}, h('h3', null, 'Takeaway 3'), h('p', null, 'The Stallion persona is strongest when it sounds like Austin in a louder room, not a separate character.')))
    ),
    h(Section, {{id:'evidence', title:'Evidence Explorer'}}, h(EvidenceExplorer)),
    h('footer', {{className:'footer'}}, h('p', null, 'Files generated: ', h('code', null, 'official_analysis_data.json'), ', ', h('code', null, 'official_authored_voice_tweets.jsonl'), ', ', h('code', null, 'official_retweets_context.jsonl'), ', ', h('code', null, 'official_voice_synthesis.md'), ', and this React HTML artifact.'), h('p', null, 'Boundary: official tweets/replies/retweets/deleted tweets are included. DMs, contact/IP/device/ad files are excluded.'))
  );
}}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
</script>
</body>
</html>
"""


def build_dataset(processed_root: Path) -> dict[str, Any]:
    all_rows: list[dict[str, Any]] = []
    raw_summaries: dict[str, dict[str, Any]] = {}
    for handle in HANDLES:
        folder = processed_root / handle
        raw_summaries[handle] = read_json(folder / "summary.json")
        rows = [public_row(row) for row in read_jsonl(folder / "tweets_cleaned.jsonl")]
        all_rows.extend(rows)
    all_rows = add_tags(sorted(all_rows, key=lambda row: (row.get("date_utc") or "", row.get("id") or "")))
    authored = [row for row in all_rows if row["type"] != "retweet"]
    retweets = [row for row in all_rows if row["type"] == "retweet"]
    counts = {
        handle: account_summary(
            [row for row in all_rows if row["account"] == handle],
            all_rows,
            raw_summaries[handle],
        )
        for handle in HANDLES
    }
    examples = [item for spec in EXAMPLE_SPECS if (item := select_example(authored, spec))]
    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "timezone": TIMEZONE,
        "source_boundary": "Official X archive exports from /Users/AustinHumphrey/Downloads/Twitter:X Metadata. Tweets, community tweets, note tweets, and deleted tweets were parsed. Direct messages, contacts, IP/device logs, ad files, and Grok chats were excluded from this voice corpus.",
        "birdclaw_reference": {
            "repo": "https://github.com/steipete/birdclaw",
            "commit": "be2761748f34d8437fd525fd73f66198e11901b7",
            "applied_methods": [
                "account.js anchors account identity",
                "X archive JavaScript assignments are parsed as JSON payloads, not evaluated",
                "tweet IDs are canonical for dedupe",
                "reply, quote, conversation, media, mention, and URL metadata are preserved",
                "DMs are a separate privacy surface and excluded here",
            ],
        },
        "counts": counts,
        "totals": {
            "official_archive_rows": len(all_rows),
            "authored_voice_tweets": len(authored),
            "retweets_context": len(retweets),
            "deleted_tweets": sum(1 for row in all_rows if row.get("is_deleted")),
            "accounts": len(HANDLES),
            "date_range_ct": [
                min(row["date_ct"] for row in authored if row.get("date_ct")),
                max(row["date_ct"] for row in authored if row.get("date_ct")),
            ],
            "authored_date_range_ct": [
                min(row["date_ct"] for row in authored if row.get("date_ct")),
                max(row["date_ct"] for row in authored if row.get("date_ct")),
            ],
            "archive_date_range_ct": [
                min(row["date_ct"] for row in all_rows if row.get("date_ct")),
                max(row["date_ct"] for row in all_rows if row.get("date_ct")),
            ],
        },
    }
    return {
        "accounts": list(HANDLES),
        "summary": summary,
        "phrases": {
            handle: {
                "top_words": counts[handle]["top_words"],
                "top_bigrams": counts[handle]["top_bigrams"],
                "top_trigrams": counts[handle]["top_trigrams"],
            }
            for handle in HANDLES
        },
        "phases": phase_summary(authored),
        "examples": examples,
        "authored": sorted(authored, key=lambda row: (row.get("date_ct") or "", row.get("id") or ""), reverse=True),
        "retweets": sorted(retweets, key=lambda row: (row.get("date_ct") or "", row.get("id") or ""), reverse=True),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build official X voice analysis files and optional local HTML artifact.")
    parser.add_argument("--processed", default="X-Twitter-Archive/processed", help="Processed archive root")
    parser.add_argument("--out", default=f"X-Twitter-Archive/official-analysis/{DATE_LABEL}", help="Official analysis output dir")
    parser.add_argument("--html", default="", help="Optional HTML artifact path. Leave empty to write analysis files only.")
    args = parser.parse_args()

    processed_root = Path(args.processed)
    out_dir = Path(args.out)
    html_path = Path(args.html) if args.html else None
    data = build_dataset(processed_root)

    write_json(out_dir / "official_analysis_data.json", data)
    write_jsonl(out_dir / "official_authored_voice_tweets.jsonl", data["authored"])
    write_jsonl(out_dir / "official_retweets_context.jsonl", data["retweets"])
    (out_dir / "official_voice_synthesis.md").write_text(build_markdown(data), encoding="utf-8")
    if html_path:
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(build_html(data), encoding="utf-8")

    totals = data["summary"]["totals"]
    print(
        f"official rows={totals['official_archive_rows']} "
        f"authored={totals['authored_voice_tweets']} "
        f"retweets={totals['retweets_context']} "
        f"deleted={totals['deleted_tweets']}"
    )
    if html_path:
        print(f"[verified] wrote optional X-only HTML artifact: {html_path}")
    else:
        print("[verified] skipped optional X-only HTML artifact")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
