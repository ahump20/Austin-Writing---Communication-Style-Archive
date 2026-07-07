#!/usr/bin/env python3
"""Create privacy-safe aggregate metadata from the local iMessage database.

This script intentionally does not export message bodies, handles, contact names,
phone numbers, email addresses, group names, or attachment filenames.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

APPLE_EPOCH_OFFSET = 978_307_200


def dt_expr(column: str = "date") -> str:
    return f"datetime(({column} / 1000000000) + {APPLE_EPOCH_OFFSET}, 'unixepoch', 'localtime')"


def fetch_one(conn: sqlite3.Connection, sql: str, args: tuple = ()):
    return conn.execute(sql, args).fetchone()


def fetch_all(conn: sqlite3.Connection, sql: str, args: tuple = ()):
    return conn.execute(sql, args).fetchall()


def scalar(conn: sqlite3.Connection, sql: str, args: tuple = ()):
    row = fetch_one(conn, sql, args)
    return row[0] if row else None


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def pct(part: int, total: int) -> float:
    if not total:
        return 0.0
    return round((part / total) * 100, 2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build privacy-safe iMessage metadata summary.")
    parser.add_argument(
        "--db",
        default=str(Path.home() / "Library/Messages/chat.db"),
        help="Path to chat.db",
    )
    parser.add_argument(
        "--out",
        default="Voice-Style-Identity/imessage-analysis/2026-07-07",
        help="Output directory",
    )
    args = parser.parse_args()

    db_path = Path(args.db).expanduser()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    base_filter = "coalesce(associated_message_type, 0) = 0 and coalesce(item_type, 0) = 0"

    total_rows = scalar(conn, "select count(*) from message")
    base_rows = scalar(conn, f"select count(*) from message where {base_filter}")
    sent_base = scalar(conn, f"select count(*) from message where is_from_me = 1 and {base_filter}")
    received_base = scalar(conn, f"select count(*) from message where is_from_me = 0 and {base_filter}")
    associated_rows = scalar(conn, "select count(*) from message where coalesce(associated_message_type, 0) != 0")
    system_rows = scalar(conn, "select count(*) from message where coalesce(item_type, 0) != 0")

    date_row = fetch_one(
        conn,
        f"""
        select min({dt_expr('date')}) as earliest, max({dt_expr('date')}) as latest
        from message
        where date > 0 and {base_filter}
        """,
    )

    all_date_row = fetch_one(
        conn,
        f"""
        select min({dt_expr('date')}) as earliest, max({dt_expr('date')}) as latest
        from message
        where date > 0
        """,
    )

    by_year = [
        dict(row)
        for row in fetch_all(
            conn,
            f"""
            select
              strftime('%Y', {dt_expr('date')}) as year,
              count(*) as total,
              sum(case when is_from_me = 1 then 1 else 0 end) as sent,
              sum(case when is_from_me = 0 then 1 else 0 end) as received
            from message
            where date > 0 and {base_filter}
            group by year
            order by year
            """,
        )
    ]

    chat_count = scalar(conn, "select count(*) from chat")
    handle_count = scalar(conn, "select count(*) from handle")
    chat_join_count = scalar(conn, "select count(*) from chat_message_join")

    conversation_row = fetch_one(
        conn,
        """
        with participants as (
          select chat_id, count(*) as member_count
          from chat_handle_join
          group by chat_id
        ),
        chat_counts as (
          select
            c.rowid as chat_id,
            coalesce(p.member_count, 0) as member_count,
            count(distinct cmj.message_id) as message_count
          from chat c
          left join participants p on p.chat_id = c.rowid
          left join chat_message_join cmj on cmj.chat_id = c.rowid
          group by c.rowid
        )
        select
          sum(case when member_count > 1 and message_count > 0 then 1 else 0 end) as active_group_chats,
          sum(case when member_count <= 1 and message_count > 0 then 1 else 0 end) as active_direct_chats,
          max(member_count) as largest_member_count
        from chat_counts
        """,
    )

    message_context_row = fetch_one(
        conn,
        f"""
        with participants as (
          select chat_id, count(*) as member_count
          from chat_handle_join
          group by chat_id
        ),
        message_context as (
          select
            m.rowid as message_id,
            max(case when coalesce(p.member_count, 0) > 1 then 1 else 0 end) as in_group
          from message m
          left join chat_message_join cmj on cmj.message_id = m.rowid
          left join participants p on p.chat_id = cmj.chat_id
          where {base_filter}
          group by m.rowid
        )
        select
          count(*) as joined_or_unjoined_base_rows,
          sum(case when in_group = 1 then 1 else 0 end) as group_message_rows,
          sum(case when in_group = 0 then 1 else 0 end) as direct_or_unjoined_message_rows
        from message_context
        """,
    )

    top_groups = [
        {
            "rank": idx + 1,
            "member_count": row["member_count"],
            "message_count": row["message_count"],
            "first_message": row["first_message"],
            "last_message": row["last_message"],
        }
        for idx, row in enumerate(
            fetch_all(
                conn,
                f"""
                with participants as (
                  select chat_id, count(*) as member_count
                  from chat_handle_join
                  group by chat_id
                ),
                chat_counts as (
                  select
                    c.rowid as chat_id,
                    coalesce(p.member_count, 0) as member_count,
                    count(distinct cmj.message_id) as message_count,
                    min({dt_expr('m.date')}) as first_message,
                    max({dt_expr('m.date')}) as last_message
                  from chat c
                  left join participants p on p.chat_id = c.rowid
                  left join chat_message_join cmj on cmj.chat_id = c.rowid
                  left join message m on m.rowid = cmj.message_id
                  group by c.rowid
                )
                select member_count, message_count, first_message, last_message
                from chat_counts
                where member_count > 1 and message_count > 0
                order by message_count desc
                limit 10
                """,
            )
        )
    ]

    reaction_map = {
        2000: "love",
        2001: "like",
        2002: "dislike",
        2003: "laugh",
        2004: "emphasize",
        2005: "question",
    }
    reaction_rows = fetch_all(
        conn,
        """
        select associated_message_type as type, count(*) as count,
          sum(case when is_from_me = 1 then 1 else 0 end) as sent,
          sum(case when is_from_me = 0 then 1 else 0 end) as received
        from message
        where associated_message_type between 2000 and 2005
        group by associated_message_type
        order by associated_message_type
        """,
    )
    reactions = {
        reaction_map.get(row["type"], str(row["type"])): {
            "total": row["count"],
            "sent": row["sent"],
            "received": row["received"],
        }
        for row in reaction_rows
    }

    attachments_by_type = [
        {"type": row["kind"], "count": row["count"]}
        for row in fetch_all(
            conn,
            """
            select
              case
                when mime_type is null or mime_type = '' then 'unknown'
                when instr(mime_type, '/') > 0 then substr(mime_type, 1, instr(mime_type, '/') - 1)
                else mime_type
              end as kind,
              count(*) as count
            from attachment
            group by kind
            order by count desc
            """
        )
    ]

    effects = [
        {"effect_id": row["effect"], "count": row["count"]}
        for row in fetch_all(
            conn,
            """
            select expressive_send_style_id as effect, count(*) as count
            from message
            where expressive_send_style_id is not null and expressive_send_style_id != ''
            group by expressive_send_style_id
            order by count desc
            """
        )
    ]

    peak_slots = [
        {"day": row["dow"], "hour": int(row["hour"]), "count": row["count"]}
        for row in fetch_all(
            conn,
            f"""
            select
              case strftime('%w', {dt_expr('date')})
                when '0' then 'Sun'
                when '1' then 'Mon'
                when '2' then 'Tue'
                when '3' then 'Wed'
                when '4' then 'Thu'
                when '5' then 'Fri'
                when '6' then 'Sat'
              end as dow,
              strftime('%H', {dt_expr('date')}) as hour,
              count(*) as count
            from message
            where is_from_me = 1 and date > 0 and {base_filter}
            group by dow, hour
            order by count desc
            limit 8
            """
        )
    ]

    metadata = {
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": {
            "database": "local-only Messages database; raw path redacted",
            "privacy_boundary": "Aggregate metadata only. No message text, contact names, handles, phone numbers, email addresses, group names, filenames, or media exported.",
            "date_conversion": "Apple nanosecond timestamp converted from 2001-01-01 epoch to local time.",
        },
        "coverage": {
            "all_message_rows": total_rows,
            "base_message_rows": base_rows,
            "sent_base_rows": sent_base,
            "received_base_rows": received_base,
            "associated_message_rows": associated_rows,
            "system_item_rows": system_rows,
            "date_range_base_local": {
                "earliest": date_row["earliest"],
                "latest": date_row["latest"],
            },
            "date_range_all_rows_local": {
                "earliest": all_date_row["earliest"],
                "latest": all_date_row["latest"],
            },
            "handles": handle_count,
            "chats": chat_count,
            "chat_message_join_rows": chat_join_count,
        },
        "yearly_base_messages": by_year,
        "conversation_shape": {
            **dict(conversation_row),
            **dict(message_context_row),
            "group_message_row_share_pct": pct(message_context_row["group_message_rows"], message_context_row["joined_or_unjoined_base_rows"]),
        },
        "top_group_chats_anonymized": top_groups,
        "interaction_metadata": {
            "reaction_total": sum(value["total"] for value in reactions.values()),
            "reactions_by_type": reactions,
            "edited_total": scalar(conn, "select count(*) from message where date_edited is not null and date_edited > 0"),
            "unsent_total": scalar(conn, "select count(*) from message where date_retracted is not null and date_retracted > 0"),
            "reply_thread_rows": scalar(conn, "select count(*) from message where thread_originator_guid is not null and thread_originator_guid != ''"),
            "effect_rows": sum(item["count"] for item in effects),
            "effects_by_id": effects[:12],
        },
        "attachments": {
            "total": scalar(conn, "select count(*) from attachment"),
            "by_type": attachments_by_type,
        },
        "sent_temporal_peaks": peak_slots,
    }

    json_path = out_dir / "imessage_metadata_summary.json"
    md_path = out_dir / "imessage_private_context_summary.md"
    write_json(json_path, metadata)

    top_year = max(by_year, key=lambda row: row["total"])
    reaction_summary = ", ".join(
        f"{kind}: {value['total']}" for kind, value in metadata["interaction_metadata"]["reactions_by_type"].items()
    )
    attachment_summary = ", ".join(
        f"{item['type']}: {item['count']}" for item in metadata["attachments"]["by_type"][:5]
    )
    peak_summary = ", ".join(
        f"{item['day']} {item['hour']:02d}:00 ({item['count']})" for item in peak_slots[:5]
    )

    md = f"""# iMessage Private Context Metadata Summary

[verified] Generated from local macOS Messages database on {metadata['generated_at_utc']}.

## Privacy Boundary

This file is privacy-safe by design. It contains aggregate metadata only. It does not include message bodies, contact names, handles, phone numbers, email addresses, group names, filenames, attachment contents, or media paths.

## Access Status

[verified] iMessage access is now working from Codex after Full Disk Access was enabled for Codex-related processes. Direct local database access succeeds, and the Apple Messages MCP can search the database.

## Coverage

- [verified] All `message` rows: {total_rows:,}.
- [verified] Base human-message rows, excluding tapbacks/associated rows and system items: {base_rows:,}.
- [verified] Sent base rows: {sent_base:,}.
- [verified] Received base rows: {received_base:,}.
- [verified] Associated-message rows, mostly reactions/tapbacks and related records: {associated_rows:,}.
- [verified] System-item rows: {system_rows:,}.
- [verified] Base date range: {date_row['earliest']} to {date_row['latest']}.
- [verified] Handles in database: {handle_count:,}.
- [verified] Chat records: {chat_count:,}.

## Conversation Shape

- [verified] Active group chats: {conversation_row['active_group_chats']:,}.
- [verified] Active direct/low-member chats: {conversation_row['active_direct_chats']:,}.
- [verified] Largest observed member count in an active chat: {conversation_row['largest_member_count']:,}.
- [verified] Base rows associated with group chats: {message_context_row['group_message_rows']:,} ({metadata['conversation_shape']['group_message_row_share_pct']}% of base rows).
- [verified] Base rows associated with direct or unjoined contexts: {message_context_row['direct_or_unjoined_message_rows']:,}.
- [verified] Highest-volume year by base rows: {top_year['year']} ({top_year['total']:,} rows).

## Interaction Metadata

- [verified] Reactions/tapbacks: {metadata['interaction_metadata']['reaction_total']:,}.
- [verified] Reaction distribution: {reaction_summary}.
- [verified] Edited-message rows: {metadata['interaction_metadata']['edited_total']:,}.
- [verified] Unsent/retracted-message rows: {metadata['interaction_metadata']['unsent_total']:,}.
- [verified] Reply-thread rows: {metadata['interaction_metadata']['reply_thread_rows']:,}.
- [verified] Message-effect rows: {metadata['interaction_metadata']['effect_rows']:,}.
- [verified] Attachments: {metadata['attachments']['total']:,} ({attachment_summary}).
- [verified] Sent-message peak slots: {peak_summary}.

## Voice-System Implication

[reasoned] iMessage moves the router from previously unverified private group-thread dynamics to verified private group/direct metadata. It does not replace Snapchat or X. It adds stronger evidence for group-chat density, long-running friend/family threads, tapback/laugh/emphasis behavior, reply-thread use, and attachment-heavy private communication.

[reasoned] Because this summary is metadata-only, it should refine the communication router at the level of context, cadence, interaction shape, and evidence confidence. It should not be used to quote private language or imitate specific private conversations.

## Canonical Use

- Use iMessage as verified evidence for private group/direct metadata coverage.
- Keep raw message text local-only unless Austin explicitly requests a separate private analysis pass.
- Do not commit raw private exports, names, handles, contact lists, filenames, or media.
- When writing public-facing content, do not leak private chat names or private text.

See `imessage_metadata_summary.json` for the machine-readable aggregate summary.
"""
    md_path.write_text(md, encoding="utf-8")

    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
