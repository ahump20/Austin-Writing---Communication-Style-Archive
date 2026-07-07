#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const xDataPath = path.join(ROOT, "X-Twitter-Archive/official-analysis/2026-07-06/official_analysis_data.json");
const snapchatPath = path.join(ROOT, "Voice-Style-Identity/snapchat-analysis/2026-07-06/snapchat_summary.json");
const imessagePath = path.join(ROOT, "Voice-Style-Identity/imessage-analysis/2026-07-07/imessage_metadata_summary.json");
const imessageLanguagePath = path.join(ROOT, "Voice-Style-Identity/imessage-analysis/2026-07-07/imessage_private_language_summary.json");
const outPath = path.join(ROOT, "Voice-Style-Identity/cross-context-voice-system-artifact.html");

const xData = JSON.parse(fs.readFileSync(xDataPath, "utf8"));
const snapchat = JSON.parse(fs.readFileSync(snapchatPath, "utf8"));
const imessage = JSON.parse(fs.readFileSync(imessagePath, "utf8"));
const imessageLanguage = JSON.parse(fs.readFileSync(imessageLanguagePath, "utf8"));

const accountOrder = ["a_hump20", "TXTrickWhooper"];
const accountLabels = {
  a_hump20: "Austin Humphrey",
  TXTrickWhooper: "Stallion account",
};

function pct(value) {
  return Number((value * 100).toFixed(1));
}

function accountCard(handle) {
  const counts = xData.summary.counts[handle];
  return {
    handle,
    label: accountLabels[handle],
    officialRows: counts.official_archive_rows,
    authoredRows: counts.authored_voice_tweets,
    retweets: counts.retweets_context,
    replies: counts.replies,
    originalTweets: counts.tweets,
    medianWords: counts.median_words,
    averageWords: counts.avg_words,
    replyRate: pct(counts.replies / counts.authored_voice_tweets),
    mentionRate: pct(counts.mention_rate),
    hashtagRate: pct(counts.hashtag_rate),
    emojiRate: pct(counts.emoji_rate),
    profanityRate: pct(counts.profanity_rate),
    allcapsRate: pct(counts.allcaps_rate),
    range: counts.authored_date_range_ct,
    topThemes: counts.top_themes.slice(0, 8).map(([label, value]) => ({ label, value })),
    topHumor: counts.top_humor_tags.slice(0, 8).map(([label, value]) => ({ label, value })),
  };
}

const accounts = accountOrder.map(accountCard);
const countsByHandle = Object.fromEntries(accountOrder.map((handle) => [handle, xData.summary.counts[handle]]));
const years = Array.from(
  new Set(accountOrder.flatMap((handle) => Object.keys(countsByHandle[handle].by_year).map(Number)))
).sort((a, b) => a - b);

const xYearRows = years.map((year) => ({
  year,
  a_hump20: countsByHandle.a_hump20.by_year[String(year)] || 0,
  TXTrickWhooper: countsByHandle.TXTrickWhooper.by_year[String(year)] || 0,
}));

const phaseRows = xData.phases.map((phase) => ({
  phase: phase.phase,
  count: phase.count,
  range: phase.date_range_ct,
  topThemes: phase.top_themes.slice(0, 4).map(([label, value]) => ({ label, value })),
  topHumor: phase.top_humor.slice(0, 4).map(([label, value]) => ({ label, value })),
}));

const privateYearRows = Object.entries(snapchat.by_year).map(([year, row]) => ({
  year,
  rows: row.rows,
  sentRows: row.sent_rows,
  sentTextRows: row.sent_text_rows,
  medianSentWords: row.median_sent_words,
})).sort((a, b) => Number(a.year) - Number(b.year));

const privateMarkerRates = Object.entries(snapchat.chat.marker_rates_per_100_sent_texts)
  .map(([label, value]) => ({ label, value }))
  .sort((a, b) => b.value - a.value);

const topConversations = snapchat.contacts.top_conversations_anonymized.slice(0, 10).map((row) => ({
  label: row.contact_label,
  rows: row.rows,
  sentRows: row.sent_rows,
  sentTextRows: row.sent_text_rows,
}));

const imessageReactions = Object.entries(imessage.interaction_metadata.reactions_by_type)
  .map(([label, row]) => ({ label, value: row.total }))
  .sort((a, b) => b.value - a.value);

const imessageAttachments = imessage.attachments.by_type
  .filter((row) => row.count > 0)
  .map((row) => ({ label: row.type, value: row.count }));

const privateLanguageMarkers = Object.entries(imessageLanguage.overall.marker_rate_per_100)
  .map(([label, value]) => ({ label: label.replaceAll("_", " "), value }))
  .sort((a, b) => b.value - a.value);

const privateLanguageContexts = Object.entries(imessageLanguage.by_context)
  .map(([label, row]) => ({
    label: label.replaceAll("_", " "),
    value: row.messages,
    medianWords: row.median_words,
    shortRate: row.punctuation_rate_per_100.one_liner_5_words_or_less,
    askRate: row.marker_rate_per_100.question_or_direct_ask || 0,
    logisticsRate: row.marker_rate_per_100.logistics || 0,
  }))
  .sort((a, b) => b.value - a.value);

const privateLanguagePurposes = imessageLanguage.purpose_buckets.map((row) => ({
  label: row.label,
  shape: row.shape,
  use: row.use,
  avoid: row.avoid,
  signals: row.overall_signals_per_100.map((signal) => `${signal.label}: ${signal.per_100}`).join("; "),
}));

const quoteLabels = [
  "Waffle House as civil-defense institution",
  "Vape charger mock PSA",
  "For You page grievance letter",
  "Reading code punchline",
  "Fable access as birthright",
  "Boerne rivalry shot",
  "Old Facebook self-awareness",
  "Barbie/Oppenheimer social bit",
  "Chick-fil-A acceptance speech",
  "Camera operator meltdown",
  "God is real relief",
  "Nice.",
];
const examplesByLabel = new Map(xData.examples.map((example) => [example.label, example]));
const sourceQuotes = quoteLabels
  .map((label) => examplesByLabel.get(label))
  .filter(Boolean)
  .map((example) => ({
    label: example.label,
    note: example.note,
    account: example.tweet.account,
    date: example.tweet.date_ct.slice(0, 10),
    text: example.tweet.text,
    likes: example.tweet.likes,
    reposts: example.tweet.reposts,
    url: example.tweet.url,
    themes: example.tweet.themes,
    humor: example.tweet.humor,
  }));

const longFormQuotes = [
  {
    source: "Freshman IR writing, 2015",
    quote: "In the globalized capitalist world system of today, every country plays their own small but crucial role in assisting the economy to function at its maximum efficiency; although no country more so than the United States...",
    implication: "The system lens starts early: one actor is almost always interpreted through the larger machine around it.",
  },
  {
    source: "International Relations reading response, 2016",
    quote: "Capitalism didn't eliminate oppressive upper classes. It just changed the basis upon which they stood.",
    implication: "The mature move is already present: surface change, same underlying function.",
  },
  {
    source: "Germany-Greece trade paper, 2017",
    quote: "Greece's wrecked economy bogs down the value of the euro. For an export-driven economy like Germany this is ideal.",
    implication: "Austin looks for the hidden beneficiary instead of stopping at the obvious victim.",
  },
  {
    source: "Geographies of Globalization, 2018",
    quote: "Just because the rich are getting richer doesn't mean the rest of us are.",
    implication: "The abstract system gets pulled back to a blunt human stake.",
  },
  {
    source: "Texas covenant note",
    quote: "A home, a family, a philosophy.",
    implication: "Identity writing works when it stays specific and physical first, then widens into values.",
  },
];

const methodSteps = [
  {
    label: "1. Parse X archives",
    detail: "Read tweets.js plus community, note, and deleted tweet files from both official exports. Direct messages, contacts, IP/device logs, ad files, and Grok chats were excluded.",
  },
  {
    label: "2. Apply BirdClaw archive discipline",
    detail: "Used BirdClaw's archive-handling pattern as a reference: account identity from account.js, JavaScript assignment payloads parsed as data, tweet IDs as canonical dedupe keys, and reply/thread/media metadata preserved.",
  },
  {
    label: "3. Separate authored voice from context",
    detail: "Retweets and context rows were preserved but kept out of the authored voice count. Replies stayed in because reply timing is central to the public voice.",
  },
  {
    label: "4. Derive private-register signals",
    detail: "Parsed Snapchat metadata into counts, marker rates, word lengths, year buckets, and anonymized conversation shape. Raw private text, names, media URLs, locations, and media files stayed local-only.",
  },
  {
    label: "5. Derive iMessage metadata signals",
    detail: "Read the local Messages database after Full Disk Access was fixed, then exported only aggregate metadata: group/direct shape, sent/received counts, tapbacks, reply threads, edits, effects, and attachment types. Raw message text, names, handles, group names, filenames, and media paths stayed local-only.",
  },
  {
    label: "6. Derive private-language signals",
    detail: "Decoded sent Messages text in memory to compute length distributions, marker rates, anonymous relationship buckets, private-room routing, and purpose buckets. The analyzer writes no quotes, n-grams, handles, names, chat titles, filenames, media paths, burner/account metadata, DM exports, or transcript samples.",
  },
  {
    label: "7. Reconcile with long-form writing",
    detail: "Compared X and Snapchat signals against the writing archive: source passages, voice DNA, origin story, professional context, and existing writing-system rules.",
  },
  {
    label: "8. Route into one canonical model",
    detail: "X, Snapchat, iMessage metadata, and iMessage private-language rates are treated as extension layers for one Austin reference, not separate personas. The output is a room router: public social, long-form, brand, anonymous private rooms, coordination, repair, and partner interaction.",
  },
];

const dossier = {
  generatedAt: "2026-07-07",
  accounts,
  xYearRows,
  phaseRows,
  privateYearRows,
  privateMarkerRates,
  topConversations,
  sourceQuotes,
  longFormQuotes,
  methodSteps,
  totals: {
    officialXRows: xData.summary.counts.a_hump20.official_archive_rows + xData.summary.counts.TXTrickWhooper.official_archive_rows,
    authoredXRows: xData.summary.counts.a_hump20.authored_voice_tweets + xData.summary.counts.TXTrickWhooper.authored_voice_tweets,
    retweetContextRows: xData.summary.counts.a_hump20.retweets_context + xData.summary.counts.TXTrickWhooper.retweets_context,
    deletedTweetRows: 4,
    snapchatChatRows: snapchat.chat.message_counts.all_chat_rows,
    snapchatSentTextRows: snapchat.chat.message_counts.sent_text_rows,
    snapchatConversations: snapchat.contacts.conversation_count,
    imessageRows: imessage.coverage.all_message_rows,
    imessageBaseRows: imessage.coverage.base_message_rows,
    imessageGroupChats: imessage.conversation_shape.active_group_chats,
    imessageReactions: imessage.interaction_metadata.reaction_total,
    imessageReplyThreads: imessage.interaction_metadata.reply_thread_rows,
    imessageAttachments: imessage.attachments.total,
    imessageDecodedSentTexts: imessageLanguage.coverage.decoded_sent_text_rows,
    writingFiles: "50+",
  },
  imessage: {
    allRows: imessage.coverage.all_message_rows,
    baseRows: imessage.coverage.base_message_rows,
    sentBaseRows: imessage.coverage.sent_base_rows,
    receivedBaseRows: imessage.coverage.received_base_rows,
    activeGroupChats: imessage.conversation_shape.active_group_chats,
    activeDirectChats: imessage.conversation_shape.active_direct_chats,
    groupSharePct: imessage.conversation_shape.group_message_row_share_pct,
    largestMemberCount: imessage.conversation_shape.largest_member_count,
    reactions: imessage.interaction_metadata.reaction_total,
    reactionRows: imessageReactions,
    replyThreads: imessage.interaction_metadata.reply_thread_rows,
    editedRows: imessage.interaction_metadata.edited_total,
    unsentRows: imessage.interaction_metadata.unsent_total,
    attachments: imessage.attachments.total,
    attachmentRows: imessageAttachments,
    range: [
      imessage.coverage.date_range_base_local.earliest,
      imessage.coverage.date_range_base_local.latest,
    ],
  },
  privateLanguage: {
    decodedSentTexts: imessageLanguage.coverage.decoded_sent_text_rows,
    medianWords: imessageLanguage.overall.median_words,
    p75Words: imessageLanguage.overall.p75_words,
    p90Words: imessageLanguage.overall.p90_words,
    fiveWordsOrFewerRate: imessageLanguage.overall.punctuation_rate_per_100.one_liner_5_words_or_less,
    tenWordsOrFewerRate: imessageLanguage.overall.punctuation_rate_per_100.short_message_10_words_or_less,
    questionAskRate: imessageLanguage.overall.marker_rate_per_100.question_or_direct_ask,
    logisticsRate: imessageLanguage.overall.marker_rate_per_100.logistics,
    laughterRate: imessageLanguage.overall.marker_rate_per_100.laughter_or_play,
    repairRate: imessageLanguage.overall.marker_rate_per_100.repair_or_accountability,
    markerRows: privateLanguageMarkers,
    contextRows: privateLanguageContexts,
    purposeRows: privateLanguagePurposes,
  },
  sourceStatus: [
    { label: "X/Twitter", status: "verified", detail: "Official archive exports parsed and deduped. Public quotes are allowed in this artifact." },
    { label: "Snapchat", status: "verified/private", detail: "Parsed into privacy-safe derived markers. No raw private messages are quoted." },
    { label: "Long-form writing", status: "verified", detail: "Source passages and existing voice files used for thinking style, structure, and public prose." },
    { label: "Living brain", status: "verified bridge", detail: "Neutral routing note points future agents back to this canonical system." },
    { label: "iMessage", status: "verified/private derived", detail: "Local Messages metadata and sent-text language parsed into aggregate group/direct, reaction, reply-thread, attachment, length, marker-rate, anonymous room, and purpose-bucket shape. No raw private text, names, handles, group names, filenames, phrases, burner/account metadata, DM exports, or media paths are quoted." },
  ],
  synthesisRules: [
    ["Specific first", "Name the object, place, team, person, tool, or failure before making the claim."],
    ["System behind event", "Treat the surface thing as evidence of a larger mechanism."],
    ["Verdict early", "Give the read first. Explain after the reader has something to hold."],
    ["Affection plus critique", "Love and roasting can sit in the same sentence without cancelling each other out."],
    ["Scale mismatch", "Small inconvenience becomes civic infrastructure, malpractice, birthright, or sports theology."],
    ["Self-own valve", "Confidence lands better when Austin gets the first joke at his own expense."],
    ["Private contraction", "In private contexts, the same mind gets shorter, more logistical, warmer, and less performed."],
    ["Private context shape", "Snapchat gives wording/cadence markers; iMessage gives anonymous room categories, purpose buckets, group/direct distribution, tapbacks, reply threads, attachments, and sent-text compression without exposing raw private text."],
  ],
};

const dataJSON = JSON.stringify(dossier).replace(/</g, "\\u003c");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Austin Communication Dossier</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>
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
  </script>
  <style>
    :root {
      --paper: #f4f1e9;
      --ink: #161412;
      --muted: #625d54;
      --line: #d8d0c2;
      --panel: #fffaf0;
      --panel-2: #ebe3d4;
      --dark: #161514;
      --burnt: #bf5700;
      --blue: #1c5f89;
      --green: #2f6b5f;
      --gold: #b88931;
      --red: #a53f32;
      --shadow: 0 18px 45px rgba(26, 20, 12, 0.13);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      line-height: 1.5;
    }
    a { color: inherit; }
    button { font: inherit; }
    .layout {
      display: grid;
      grid-template-columns: 310px minmax(0, 1fr);
      min-height: 100vh;
    }
    aside {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 28px 22px;
      background: var(--dark);
      color: #fff7ea;
      overflow: auto;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .eyebrow {
      margin: 0 0 12px;
      font-size: 12px;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: #d8a15f;
      font-weight: 800;
    }
    h1, h2, h3, h4, p { margin-top: 0; }
    h1 {
      margin-bottom: 12px;
      font-size: 32px;
      line-height: 1.02;
      letter-spacing: 0;
    }
    aside p {
      color: #d9ccb7;
      font-size: 14px;
      margin-bottom: 22px;
    }
    .nav {
      display: grid;
      gap: 8px;
      margin: 22px 0;
    }
    .nav a {
      display: block;
      padding: 10px 12px;
      border: 1px solid rgba(255,255,255,0.11);
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      text-decoration: none;
      color: #fff7ea;
      font-size: 14px;
    }
    .nav a:hover, .nav a:focus-visible {
      outline: 2px solid #d8a15f;
      outline-offset: 2px;
    }
    .side-note {
      border-top: 1px solid rgba(255,255,255,0.12);
      padding-top: 18px;
      color: #bcae98;
      font-size: 13px;
    }
    main {
      padding: 34px clamp(18px, 4vw, 58px) 60px;
      max-width: 1500px;
      width: 100%;
    }
    section {
      margin-bottom: 44px;
      scroll-margin-top: 28px;
    }
    .hero {
      min-height: calc(100vh - 68px);
      display: grid;
      grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
      gap: 28px;
      align-items: stretch;
    }
    .hero-copy {
      padding: clamp(28px, 5vw, 64px);
      border: 1px solid var(--line);
      background: var(--panel);
      box-shadow: var(--shadow);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .hero h2 {
      font-size: clamp(42px, 7vw, 84px);
      line-height: 0.96;
      margin-bottom: 18px;
      letter-spacing: 0;
      max-width: 900px;
    }
    .hero .thesis {
      max-width: 820px;
      font-size: clamp(17px, 2vw, 22px);
      color: #39342d;
      margin-bottom: 24px;
    }
    .status-stack {
      display: grid;
      gap: 12px;
    }
    .status-card {
      background: #fffdf7;
      border: 1px solid var(--line);
      border-left: 7px solid var(--burnt);
      border-radius: 8px;
      padding: 17px;
    }
    .status-card.private { border-left-color: var(--green); }
    .status-card h3 {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 6px;
      font-size: 16px;
    }
    .status-card h3 span:last-child {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      white-space: nowrap;
    }
    .status-card p { margin: 0; color: var(--muted); font-size: 14px; }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 18px;
      margin-bottom: 18px;
    }
    .section-head h2 {
      font-size: clamp(28px, 4vw, 46px);
      line-height: 1.03;
      margin: 0;
      letter-spacing: 0;
    }
    .section-head p {
      color: var(--muted);
      max-width: 640px;
      margin: 0;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
      gap: 14px;
    }
    .metric {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 18px;
    }
    .metric b {
      display: block;
      font-size: clamp(28px, 4vw, 46px);
      line-height: 1;
      margin-bottom: 8px;
      color: var(--burnt);
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 22px;
      box-shadow: 0 10px 28px rgba(28, 20, 12, 0.07);
    }
    .panel h3 { margin-bottom: 8px; font-size: 22px; }
    .caption {
      margin: 14px 0 0;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 14px;
    }
    .caption strong { color: var(--ink); }
    .bar-chart {
      display: grid;
      gap: 11px;
      margin-top: 16px;
    }
    .bar-row {
      display: grid;
      grid-template-columns: minmax(124px, 0.58fr) minmax(120px, 1.8fr) 72px;
      gap: 12px;
      align-items: center;
      font-size: 13px;
    }
    .bar-label { color: #332d25; overflow-wrap: anywhere; }
    .bar-track {
      height: 13px;
      border-radius: 999px;
      background: #e5dbc9;
      overflow: hidden;
      position: relative;
    }
    .bar-fill {
      min-width: 2px;
      height: 100%;
      border-radius: inherit;
      background: var(--burnt);
    }
    .bar-fill.blue { background: var(--blue); }
    .bar-fill.green { background: var(--green); }
    .bar-fill.gold { background: var(--gold); }
    .bar-value {
      text-align: right;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .year-chart {
      display: grid;
      grid-template-columns: repeat(16, minmax(22px, 1fr));
      gap: 7px;
      align-items: end;
      min-height: 240px;
      padding-top: 16px;
    }
    .year-col {
      display: grid;
      align-content: end;
      gap: 4px;
      min-height: 210px;
    }
    .stack {
      display: flex;
      flex-direction: column-reverse;
      justify-content: flex-start;
      height: 178px;
      border-radius: 5px 5px 2px 2px;
      overflow: hidden;
      background: #e7ddcd;
      border: 1px solid #d8cfbf;
    }
    .seg-a { background: var(--burnt); }
    .seg-b { background: var(--blue); }
    .year-label {
      font-size: 11px;
      text-align: center;
      color: var(--muted);
      transform: rotate(-45deg);
      height: 24px;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .legend span::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      margin-right: 6px;
      background: var(--burnt);
    }
    .legend .blue::before { background: var(--blue); }
    .phase-list {
      display: grid;
      gap: 12px;
    }
    .phase {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 16px;
      padding: 14px;
      background: #fffdf7;
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .phase strong {
      display: block;
      font-size: 24px;
      color: var(--burnt);
      line-height: 1;
      margin-bottom: 6px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 10px;
    }
    .chip {
      border: 1px solid var(--line);
      background: var(--panel-2);
      color: #3f382f;
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 12px;
    }
    .method {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      counter-reset: method;
    }
    .method-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 18px;
    }
    .method-card h3 {
      margin-bottom: 8px;
      font-size: 17px;
    }
    .method-card p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .quote-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .quote {
      background: #fffdf8;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
      min-height: 220px;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }
    .quote blockquote {
      margin: 0;
      font-size: 16px;
      line-height: 1.38;
      white-space: pre-wrap;
    }
    .quote-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
      margin-top: auto;
    }
    .quote-note {
      color: var(--muted);
      font-size: 13px;
      margin: 0;
    }
    .router {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .rule {
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }
    .rule h3 {
      margin-bottom: 8px;
      font-size: 17px;
    }
    .rule p { margin: 0; color: var(--muted); font-size: 14px; }
    .private-note {
      background: #f4fbf7;
      border-color: #bdd7cb;
    }
    .open-gate {
      border: 1px solid #d9b8af;
      background: #fff6f2;
      border-radius: 8px;
      padding: 18px;
    }
    .open-gate h3 { color: #7c2e23; }
    .small-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    .small-table th, .small-table td {
      border-bottom: 1px solid var(--line);
      padding: 8px 6px;
      text-align: left;
    }
    .small-table th {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .footer {
      border-top: 1px solid var(--line);
      padding-top: 22px;
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 1120px) {
      .layout { grid-template-columns: 1fr; }
      aside {
        position: relative;
        height: auto;
      }
      .hero { grid-template-columns: 1fr; min-height: auto; }
      .metric-grid, .grid-3, .method, .quote-grid, .router { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      main { padding: 22px 14px 42px; }
      .hero-copy { padding: 24px; }
      .section-head { display: block; }
      .section-head p { margin-top: 10px; }
      .metric-grid, .grid-2, .grid-3, .method, .quote-grid, .router { grid-template-columns: 1fr; }
      .bar-row { grid-template-columns: 1fr; gap: 6px; }
      .bar-value { text-align: left; }
      .year-chart { grid-template-columns: repeat(8, minmax(22px, 1fr)); }
      .phase { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const DATA = ${dataJSON};
    const h = React.createElement;
    const fmt = new Intl.NumberFormat("en-US");
    const pctLabel = (value) => String(value.toFixed ? value.toFixed(1) : value) + "%";
    function Metric({ value, label }) {
      return h("div", { className: "metric" }, h("b", null, value), h("span", null, label));
    }
    function BarChart({ rows, color = "burnt", valueSuffix = "", maxValue }) {
      const max = maxValue || Math.max(...rows.map((row) => row.value), 1);
      const colorClass = color === "blue" ? " blue" : color === "green" ? " green" : color === "gold" ? " gold" : "";
      return h("div", { className: "bar-chart" }, rows.map((row) =>
        h("div", { className: "bar-row", key: row.label },
          h("div", { className: "bar-label" }, row.label),
          h("div", { className: "bar-track" }, h("div", { className: "bar-fill" + colorClass, style: { width: Math.max(2, (row.value / max) * 100) + "%" } })),
          h("div", { className: "bar-value" }, typeof row.value === "number" ? fmt.format(row.value) + valueSuffix : row.value)
        )
      ));
    }
    function YearChart({ rows }) {
      const max = Math.max(...rows.map((row) => row.a_hump20 + row.TXTrickWhooper), 1);
      return h("div", null,
        h("div", { className: "year-chart", "aria-label": "Stacked bar chart of authored X rows by year and account" }, rows.map((row) => {
          const total = row.a_hump20 + row.TXTrickWhooper;
          const height = Math.max(2, (total / max) * 178);
          const aHeight = total ? Math.max(row.a_hump20 ? 2 : 0, (row.a_hump20 / total) * height) : 0;
          const bHeight = total ? Math.max(row.TXTrickWhooper ? 2 : 0, (row.TXTrickWhooper / total) * height) : 0;
          return h("div", { className: "year-col", key: row.year, title: row.year + ": " + total + " authored rows" },
            h("div", { className: "stack", style: { height: height + "px" } },
              h("div", { className: "seg-a", style: { height: aHeight + "px" } }),
              h("div", { className: "seg-b", style: { height: bHeight + "px" } })
            ),
            h("div", { className: "year-label" }, row.year)
          );
        })),
        h("div", { className: "legend" }, h("span", null, "@a_hump20"), h("span", { className: "blue" }, "@TXTrickWhooper"))
      );
    }
    function PhaseList() {
      return h("div", { className: "phase-list" }, DATA.phaseRows.map((phase) =>
        h("div", { className: "phase", key: phase.phase },
          h("div", null, h("strong", null, fmt.format(phase.count)), h("span", null, phase.phase.split(":")[0])),
          h("div", null,
            h("h3", null, phase.phase),
            h("p", null, "Top signals: " + phase.topThemes.map((item) => item.label).join(", ") + "."),
            h("div", { className: "chips" }, phase.topHumor.map((item) => h("span", { className: "chip", key: item.label }, item.label + " " + fmt.format(item.value))))
          )
        )
      ));
    }
    function QuoteCard({ quote }) {
      return h("article", { className: "quote" },
        h("div", null, h("h3", null, quote.label), h("p", { className: "quote-note" }, quote.note)),
        h("blockquote", null, quote.text),
        h("div", { className: "quote-meta" },
          h("span", null, quote.date + " / " + quote.account),
          h("span", null, fmt.format(quote.likes) + " likes")
        )
      );
    }
    function LongQuote({ row }) {
      return h("article", { className: "quote" },
        h("div", null, h("h3", null, row.source), h("p", { className: "quote-note" }, row.implication)),
        h("blockquote", null, row.quote)
      );
    }
    function MethodCard({ step }) {
      return h("div", { className: "method-card" }, h("h3", null, step.label), h("p", null, step.detail));
    }
    function RuleCard({ rule }) {
      return h("div", { className: "rule" }, h("h3", null, rule[0]), h("p", null, rule[1]));
    }
    function AccountComparison() {
      const authored = DATA.accounts.map((account) => ({ label: account.label, value: account.authoredRows }));
      const replies = DATA.accounts.map((account) => ({ label: account.label + " reply share", value: account.replyRate }));
      const median = DATA.accounts.map((account) => ({ label: account.label + " median words", value: account.medianWords }));
      return h("div", { className: "grid-3" },
        h("div", { className: "panel" }, h("h3", null, "Authored X Corpus"), h(BarChart, { rows: authored, color: "burnt" }), h("p", { className: "caption" }, h("strong", null, "Implication: "), "The personal account supplies the long baseline. The Stallion account supplies the current public-performance edge.")),
        h("div", { className: "panel" }, h("h3", null, "Reply Gravity"), h(BarChart, { rows: replies, color: "blue", valueSuffix: "%", maxValue: 100 }), h("p", { className: "caption" }, h("strong", null, "Implication: "), "The newer account is reply-native. That is why its humor depends so much on timing, premise rejection, and one-line correction.")),
        h("div", { className: "panel" }, h("h3", null, "Compression"), h(BarChart, { rows: median, color: "green", valueSuffix: " words" }), h("p", { className: "caption" }, h("strong", null, "Implication: "), "Both accounts stay short. The public joke usually lands before the second paragraph can ruin it."))
      );
    }
    function PrivateYearChart() {
      const rows = DATA.privateYearRows.map((row) => ({ label: row.year, value: row.sentTextRows }));
      return h("div", { className: "panel private-note" },
        h("h3", null, "Snapchat Sent Text Rows By Year"),
        h(BarChart, { rows, color: "green" }),
        h("p", { className: "caption" }, h("strong", null, "Implication: "), "Private evidence is not one stray export row. It spans 2016-2026, with enough density in 2018-2022 to prove the private baseline: short, direct, logistical, and context-heavy.")
      );
    }
    function ImessageMetadataPanel() {
      return h("div", { className: "panel private-note", style: { marginTop: "18px" } },
        h("h3", null, "iMessage Metadata Layer"),
        h("div", { className: "metric-grid", style: { margin: "14px 0 18px" } },
          h(Metric, { value: fmt.format(DATA.imessage.baseRows), label: "base human-message rows" }),
          h(Metric, { value: fmt.format(DATA.imessage.activeGroupChats), label: "active group chats" }),
          h(Metric, { value: fmt.format(DATA.imessage.reactions), label: "reactions and tapbacks" }),
          h(Metric, { value: fmt.format(DATA.imessage.replyThreads), label: "reply-thread rows" })
        ),
        h("div", { className: "grid-2" },
          h("div", null,
            h("h3", null, "Reaction Distribution"),
            h(BarChart, { rows: DATA.imessage.reactionRows, color: "green" })
          ),
          h("div", null,
            h("h3", null, "Attachment Shape"),
            h(BarChart, { rows: DATA.imessage.attachmentRows, color: "gold" })
          )
        ),
        h("p", { className: "caption" }, h("strong", null, "Implication: "), "Messages access is fixed. iMessage now supports the router at the metadata level: group/direct density, reaction behavior, replies, edits, effects, and attachment-heavy private communication. It does not expose private wording.")
      );
    }
    function PrivateLanguagePanel() {
      return h("div", { className: "panel private-note", style: { marginTop: "18px" } },
        h("h3", null, "Private Language Signals"),
        h("div", { className: "metric-grid", style: { margin: "14px 0 18px" } },
          h(Metric, { value: fmt.format(DATA.privateLanguage.decodedSentTexts), label: "decoded sent text rows" }),
          h(Metric, { value: DATA.privateLanguage.medianWords + " words", label: "median sent private text" }),
          h(Metric, { value: DATA.privateLanguage.fiveWordsOrFewerRate + "%", label: "five words or fewer" }),
          h(Metric, { value: DATA.privateLanguage.questionAskRate + "%", label: "question/direct-ask markers" })
        ),
        h("div", { className: "grid-2" },
          h("div", null,
            h("h3", null, "Marker Rates Per 100 Sent Texts"),
            h(BarChart, { rows: DATA.privateLanguage.markerRows, color: "green", valueSuffix: "%" })
          ),
          h("div", null,
            h("h3", null, "Relationship Context Buckets"),
            h("table", { className: "small-table" },
              h("thead", null, h("tr", null, h("th", null, "Bucket"), h("th", null, "Rows"), h("th", null, "Median"), h("th", null, "Ask rate"))),
              h("tbody", null, DATA.privateLanguage.contextRows.map((row) =>
                h("tr", { key: row.label },
                  h("td", null, row.label),
                  h("td", null, fmt.format(row.value)),
                  h("td", null, row.medianWords + "w"),
                  h("td", null, row.askRate + "%")
                )
              ))
            )
          )
        ),
        h("div", { style: { marginTop: "18px" } },
          h("h3", null, "Purpose Buckets"),
          h("table", { className: "small-table" },
            h("thead", null, h("tr", null, h("th", null, "Purpose"), h("th", null, "Signals"), h("th", null, "Shape"))),
            h("tbody", null, DATA.privateLanguage.purposeRows.map((row) =>
              h("tr", { key: row.label },
                h("td", null, row.label),
                h("td", null, row.signals),
                h("td", null, row.shape)
              )
            ))
          )
        ),
        h("p", { className: "caption" }, h("strong", null, "Implication: "), "The private-language pass proves the compression without exposing the wording: half of decoded sent texts are five words or fewer, and the dominant private jobs are questions, logistics, quick reactions, context passing, and relationship maintenance.")
      );
    }
    function App() {
      return h("div", { className: "layout" },
        h("aside", null,
          h("p", { className: "eyebrow" }, "Austin Voice System"),
          h("h1", null, "Communication Dossier"),
          h("p", null, "A durable brief built from real X/Twitter, Snapchat, iMessage metadata, writing, instructions, and living-brain routing evidence."),
          h("nav", { className: "nav", "aria-label": "Dossier sections" },
            ["overview","method","coverage","evolution","themes","private","quotes","synthesis","open"].map((id) =>
              h("a", { href: "#" + id, key: id }, id[0].toUpperCase() + id.slice(1))
            )
          ),
          h("div", { className: "side-note" }, "Generated " + DATA.generatedAt + ". Raw private Snapchat and iMessage text are not included.")
        ),
        h("main", null,
          h("section", { className: "hero", id: "overview" },
            h("div", { className: "hero-copy" },
              h("p", { className: "eyebrow" }, "North Star"),
              h("h2", null, "One Austin reference. Different rooms."),
              h("p", { className: "thesis" }, "The point is reusable understanding: how Austin thinks, talks, jokes, synthesizes, coordinates, repairs, and presents himself across platforms without AI tells or context drift."),
              h("div", { className: "metric-grid" },
                h(Metric, { value: fmt.format(DATA.totals.officialXRows), label: "official X rows parsed" }),
                h(Metric, { value: fmt.format(DATA.totals.authoredXRows), label: "authored public voice rows" }),
                h(Metric, { value: fmt.format(DATA.totals.snapchatSentTextRows), label: "sent private text rows summarized" }),
                h(Metric, { value: fmt.format(DATA.totals.imessageBaseRows), label: "iMessage base rows summarized" }),
                h(Metric, { value: fmt.format(DATA.totals.imessageDecodedSentTexts), label: "decoded private sent texts" }),
                h(Metric, { value: DATA.totals.writingFiles, label: "long-form writing files referenced" })
              )
            ),
            h("div", { className: "status-stack" }, DATA.sourceStatus.map((row) =>
              h("div", { className: "status-card " + (row.status.includes("private") ? "private" : ""), key: row.label },
                h("h3", null, h("span", null, row.label), h("span", null, row.status)),
                h("p", null, row.detail)
              )
            ))
          ),
          h("section", { id: "method" },
            h("div", { className: "section-head" }, h("h2", null, "Method"), h("p", null, "What I did to get from raw exports to a usable communication model.")),
            h("div", { className: "method" }, DATA.methodSteps.map((step) => h(MethodCard, { step, key: step.label })))
          ),
          h("section", { id: "coverage" },
            h("div", { className: "section-head" }, h("h2", null, "Corpus Coverage"), h("p", null, "These charts show what each account contributes. The counts are from the parsed official archive, not screenshots or live scrape guesses.")),
            h(AccountComparison, null),
            h("div", { className: "panel", style: { marginTop: "18px" } },
              h("h3", null, "Authored X Rows By Year"),
              h(YearChart, { rows: DATA.xYearRows }),
              h("p", { className: "caption" }, h("strong", null, "Implication: "), "The early account carries the origin layer: school, local rivalry, sports identity, everyday observation. The newer account turns the same instincts into a public commentary costume with reply timing and AI-tool grievances.")
            )
          ),
          h("section", { id: "evolution" },
            h("div", { className: "section-head" }, h("h2", null, "Phase Evolution"), h("p", null, "The voice does not change into a different person. It changes rooms and pressure levels.")),
            h("div", { className: "panel" },
              h(PhaseList, null),
              h("p", { className: "caption" }, h("strong", null, "Implication: "), "The stable core is sports-native specificity plus direct judgment. The later shift is sharper context use: more replies, more tools, more absurd institutional language.")
            )
          ),
          h("section", { id: "themes" },
            h("div", { className: "section-head" }, h("h2", null, "Themes And Humor Mechanics"), h("p", null, "Theme counts identify subject gravity. Humor tags identify the joke engine.")),
            h("div", { className: "grid-2" },
              DATA.accounts.map((account) =>
                h("div", { className: "panel", key: account.handle + "-themes" },
                  h("h3", null, account.label + " themes"),
                  h(BarChart, { rows: account.topThemes, color: account.handle === "TXTrickWhooper" ? "blue" : "burnt" }),
                  h("p", { className: "caption" }, h("strong", null, "Implication: "), account.handle === "TXTrickWhooper" ? "The Stallion account is built around replies, sports, AI/dev tools, and platform irritation." : "The personal account proves the older base: sports, replies, everyday observation, family/life, and local place nouns.")
                )
              )
            ),
            h("div", { className: "grid-2", style: { marginTop: "18px" } },
              DATA.accounts.map((account) =>
                h("div", { className: "panel", key: account.handle + "-humor" },
                  h("h3", null, account.label + " humor tags"),
                  h(BarChart, { rows: account.topHumor, color: account.handle === "TXTrickWhooper" ? "blue" : "gold" }),
                  h("p", { className: "caption" }, h("strong", null, "Implication: "), "The strongest comic tools are deadpan, self-involving aside, reply volley, bluntness, and overstated stakes. That is the shape future Austin-style humor should preserve.")
                )
              )
            )
          ),
          h("section", { id: "private" },
            h("div", { className: "section-head" }, h("h2", null, "Private Register"), h("p", null, "Snapchat and iMessage are included as privacy-safe derived layers. They correct the model without exporting raw private messages.")),
            h("div", { className: "grid-2" },
              h("div", { className: "panel private-note" },
                h("h3", null, "Marker Rates Per 100 Sent Texts"),
                h(BarChart, { rows: DATA.privateMarkerRates, color: "green" }),
                h("p", { className: "caption" }, h("strong", null, "Implication: "), "Private speech is more ask-and-coordinate than perform-and-broadcast. The AI should get shorter and more useful in that room, not drag the X persona into a text thread.")
              ),
              h(PrivateYearChart, null)
            ),
            h("div", { className: "panel", style: { marginTop: "18px" } },
              h("h3", null, "Anonymized Conversation Shape"),
              h("table", { className: "small-table" },
                h("thead", null, h("tr", null, h("th", null, "Label"), h("th", null, "Rows"), h("th", null, "Sent rows"), h("th", null, "Sent text"))),
                h("tbody", null, DATA.topConversations.map((row) => h("tr", { key: row.label }, h("td", null, row.label), h("td", null, fmt.format(row.rows)), h("td", null, fmt.format(row.sentRows)), h("td", null, fmt.format(row.sentTextRows)))))
              ),
              h("p", { className: "caption" }, h("strong", null, "Implication: "), "The private corpus has a long tail: many small threads and a few dense ones. That supports a room-sensitive model, not one generic private voice.")
            ),
            h(ImessageMetadataPanel, null),
            h(PrivateLanguagePanel, null)
          ),
          h("section", { id: "quotes" },
            h("div", { className: "section-head" }, h("h2", null, "Source Quotes"), h("p", null, "Direct public X quotes and long-form writing excerpts used as evidence. Raw private Snapchat and iMessage text is intentionally excluded.")),
            h("h3", null, "Public X Evidence"),
            h("div", { className: "quote-grid" }, DATA.sourceQuotes.map((quote) => h(QuoteCard, { quote, key: quote.label }))),
            h("h3", { style: { marginTop: "26px" } }, "Long-Form Evidence"),
            h("div", { className: "quote-grid" }, DATA.longFormQuotes.map((row) => h(LongQuote, { row, key: row.source })))
          ),
          h("section", { id: "synthesis" },
            h("div", { className: "section-head" }, h("h2", null, "Synthesis Rules"), h("p", null, "These are the rules future agents should use before writing with Austin or writing as Austin.")),
            h("div", { className: "router" }, DATA.synthesisRules.map((rule) => h(RuleCard, { rule, key: rule[0] }))),
            h("div", { className: "panel", style: { marginTop: "18px" } },
              h("h3", null, "Room Router"),
              h("p", null, "With Austin: outcome first, known/unknown/open when stakes justify it, warmth without suck-up. Public long-form: claim, system, evidence, implication. X/social: concrete noun, blunt verdict, absurd escalation, stop. Private: short asks, logistics, quick reactions, specific warmth. Repair: name the issue, own the action, state next behavior.")
            )
          ),
          h("section", { id: "open" },
            h("div", { className: "section-head" }, h("h2", null, "Known, Unknown, Open"), h("p", null, "This is where the dossier protects itself from fake certainty.")),
            h("div", { className: "grid-2" },
              h("div", { className: "panel" },
                h("h3", null, "Known"),
                h("p", null, "X/Twitter public voice, Snapchat private compression, iMessage private metadata, long-form systemic writing, and current partner-mode instructions are all backed by parsed or source-linked evidence.")
              ),
              h("div", { className: "open-gate" },
                h("h3", null, "Open: Named Private Maps"),
                h("p", null, "Messages access is fixed, the private-language pass is complete, and anonymous relationship-room routing is now included. What remains intentionally open is any named relationship map, which is not committed by design."),
                h("p", null, "Current boundary: public repo gets aggregate metadata, anonymous rooms, purpose buckets, and derived synthesis only. Raw private Messages text, names, handles, group names, filenames, attachment contents, burner/account metadata, DM exports, and media paths stay local.")
              )
            )
          ),
          h("div", { className: "footer" }, "Durable purpose: this artifact is a reference and refresher for future AI work with Austin. It should reduce AI tells, preserve Austin-derived language and thought patterns, and prevent platform-specific context drift.")
        )
      );
    }
    ReactDOM.createRoot(document.getElementById("root")).render(h(App));
  </script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath}`);
