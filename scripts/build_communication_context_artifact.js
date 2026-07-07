#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const xData = JSON.parse(fs.readFileSync(path.join(ROOT, "X-Twitter-Archive/official-analysis/2026-07-06/official_analysis_data.json"), "utf8"));
const snapchat = JSON.parse(fs.readFileSync(path.join(ROOT, "Voice-Style-Identity/snapchat-analysis/2026-07-06/snapchat_summary.json"), "utf8"));
const imessage = JSON.parse(fs.readFileSync(path.join(ROOT, "Voice-Style-Identity/imessage-analysis/2026-07-07/imessage_metadata_summary.json"), "utf8"));
const imessageLanguage = JSON.parse(fs.readFileSync(path.join(ROOT, "Voice-Style-Identity/imessage-analysis/2026-07-07/imessage_private_language_summary.json"), "utf8"));

const outPath = path.join(ROOT, "Voice-Style-Identity/austin-communication-context-map.html");

const xCounts = xData.summary.counts;
const totalOfficialX = xCounts.a_hump20.official_archive_rows + xCounts.TXTrickWhooper.official_archive_rows;
const totalAuthoredX = xCounts.a_hump20.authored_voice_tweets + xCounts.TXTrickWhooper.authored_voice_tweets;
const totalXReplies = xCounts.a_hump20.replies + xCounts.TXTrickWhooper.replies;

function pct(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function combinePairs(pairs) {
  const map = new Map();
  for (const list of pairs) {
    for (const [label, value] of list) map.set(label, (map.get(label) || 0) + value);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

const combinedThemes = combinePairs([xCounts.a_hump20.top_themes, xCounts.TXTrickWhooper.top_themes]).slice(0, 10);
const combinedHumor = combinePairs([xCounts.a_hump20.top_humor_tags, xCounts.TXTrickWhooper.top_humor_tags]).slice(0, 10);

const markerRows = [
  {
    label: "question/direct ask",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.question,
    imessage: imessageLanguage.overall.marker_rate_per_100.question_or_direct_ask,
  },
  {
    label: "logistics",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.logistics,
    imessage: imessageLanguage.overall.marker_rate_per_100.logistics,
  },
  {
    label: "laughter/play",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.laughter,
    imessage: imessageLanguage.overall.marker_rate_per_100.laughter_or_play,
  },
  {
    label: "affection/warmth",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.affection,
    imessage: imessageLanguage.overall.marker_rate_per_100.affection_or_warmth,
  },
  {
    label: "sports/place",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.sports_place,
    imessage: imessageLanguage.overall.marker_rate_per_100.sports_or_place_shorthand,
  },
  {
    label: "repair/accountability",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.repair,
    imessage: imessageLanguage.overall.marker_rate_per_100.repair_or_accountability,
  },
];

const privateContextRows = imessageLanguage.private_context_router;
const purposeRows = imessageLanguage.purpose_buckets;

const sourceRows = [
  {
    label: "Official X archive",
    kind: "public",
    rows: totalOfficialX,
    usable: totalAuthoredX,
    note: "public social voice, replies, humor, sports/fan identity",
    privacy: "public quotes allowed with context",
  },
  {
    label: "Snapchat derived",
    kind: "private derived",
    rows: snapchat.chat.message_counts.all_chat_rows,
    usable: snapchat.chat.message_counts.sent_text_rows,
    note: "private compression, asks, logistics, warmth markers",
    privacy: "derived only; no raw private text",
  },
  {
    label: "iMessage metadata",
    kind: "private derived",
    rows: imessage.coverage.all_message_rows,
    usable: imessage.coverage.base_message_rows,
    note: "group/direct shape, tapbacks, replies, attachments",
    privacy: "aggregate metadata only",
  },
  {
    label: "iMessage language",
    kind: "private derived",
    rows: imessage.coverage.sent_base_rows,
    usable: imessageLanguage.coverage.decoded_sent_text_rows,
    note: "sent-text length, marker rates, context router, purpose buckets",
    privacy: "rates only; no phrases or quotes",
  },
  {
    label: "Long-form writing",
    kind: "authored archive",
    rows: 50,
    usable: 50,
    note: "systemic lens, public prose, philosophical structure",
    privacy: "source-linked archive",
    suffix: "+",
  },
  {
    label: "Living brain / instructions",
    kind: "routing context",
    rows: 1,
    usable: 1,
    note: "agent behavior, partnership expectations, guardrails",
    privacy: "resurface, never generate raw private source",
  },
];

const filterFamilies = [
  {
    family: "Source & Provenance",
    claim: "Where did this signal come from, and can it be quoted?",
    filters: ["platform", "account/source lane", "authored vs context", "public vs private-derived", "evidence status", "source date range"],
    evidence: "X rows, Snapchat summaries, iMessage summaries, writing archive, living-brain routing.",
    use: "Prevents a future agent from treating a private derived signal like a public quote.",
  },
  {
    family: "Time & Evolution",
    claim: "Which era or pressure stage produced the voice?",
    filters: ["year", "phase", "life stage", "pre/post commentary account", "recent vs historical", "platform era"],
    evidence: "X phase rows, iMessage date range, Snapchat year buckets, writing-development files.",
    use: "Separates early social voice from current AI/tooling and commentary voice.",
  },
  {
    family: "Audience & Relationship",
    claim: "Who is in the room?",
    filters: ["public follower", "reply target", "direct private", "small group", "medium group", "large group", "AI partner", "professional reader"],
    evidence: "iMessage anonymous context buckets, X reply rates, Codex instructions, writing archive.",
    use: "Stops the system from dragging public Stallion energy into a private or professional context.",
  },
  {
    family: "Communication Function",
    claim: "What job is the message doing?",
    filters: ["analysis", "humor", "coordination", "repair", "warmth", "brand/platform", "sports/fan identity", "tool/debug execution"],
    evidence: "Marker rates, theme tags, long-form structures, direct user instructions.",
    use: "Tells the agent whether to be funny, useful, accountable, analytical, or quiet.",
  },
  {
    family: "Style Mechanics",
    claim: "How does the language move?",
    filters: ["median length", "shortness threshold", "question markers", "logistics markers", "punctuation", "emoji", "profanity/intensity", "cadence", "sentence structure"],
    evidence: "iMessage private-language rates, Snapchat marker rates, X stylometry, long-form voice docs.",
    use: "Turns fuzzy voice claims into reusable drafting constraints.",
  },
  {
    family: "Humor Mechanics",
    claim: "What makes the joke sound like Austin instead of generic internet voice?",
    filters: ["deadpan", "self-own", "reply volley", "casual bluntness", "question punchline", "overstated stakes", "rivalry/trash-talk", "mock ceremony"],
    evidence: "Official X archive humor tags and public examples.",
    use: "Keeps the joke short enough to land and prevents overexplaining the bit.",
  },
  {
    family: "Soft Context",
    claim: "What does the communication reveal about thinking and relationship posture?",
    filters: ["system lens", "specific object anchor", "affection plus critique", "pressure valve", "relationship maintenance", "ordinary-person stake", "hidden mechanism", "blunt verdict"],
    evidence: "Long-form writing, X themes, private marker rates, current collaboration rules.",
    use: "Maps psychology and philosophy without pretending private messages are public evidence.",
  },
  {
    family: "Privacy & Consent",
    claim: "What is allowed to leave the machine?",
    filters: ["public quote allowed", "derived-only", "local-only", "no names/handles", "no private phrases", "no burner metadata", "no raw exports"],
    evidence: "Repo guardrails, .gitignore, secret guard, source manifest.",
    use: "Protects Austin and everyone else while keeping the model useful.",
  },
  {
    family: "Output Routing",
    claim: "What should the assistant produce?",
    filters: ["speak with Austin", "public long-form", "brand/platform", "X/social", "friend group", "warm one-on-one", "coordination", "repair"],
    evidence: "Consolidated harness, skill, source manifest, rendered artifacts.",
    use: "Converts evidence into the right voice for the room.",
  },
];

const routerModes = [
  {
    mode: "With Austin",
    evidence: "instructions + living brain + execution history",
    shape: "outcome first, known/unknown/open, direct warmth, push back with evidence",
    avoid: "generic assistant politeness and process theater",
    score: 5,
  },
  {
    mode: "Public long-form",
    evidence: "50+ writing files",
    shape: "claim, system, evidence, implication",
    avoid: "neutrality theater and inflated conclusions",
    score: 5,
  },
  {
    mode: "Brand/platform",
    evidence: "professional docs + current doctrine",
    shape: "vision over grievance, concrete proof, current BSI guardrails",
    avoid: "stale multi-sport or Blaze Intelligence framing",
    score: 4,
  },
  {
    mode: "X/social",
    evidence: `${totalAuthoredX.toLocaleString()} authored public rows`,
    shape: "concrete noun, blunt verdict, absurd escalation, stop",
    avoid: "explaining the punchline",
    score: 5,
  },
  {
    mode: "Friend group",
    evidence: "iMessage context buckets + Snapchat compression",
    shape: "short, teasing through specifics, shared shorthand, self-own if needed",
    avoid: "public persona overkill",
    score: 4,
  },
  {
    mode: "Warm private",
    evidence: "Snapchat + iMessage derived markers",
    shape: "specific attention, playful challenge, low pressure, brief",
    avoid: "generic romantic essay voice",
    score: 3,
  },
  {
    mode: "Coordination",
    evidence: "30.0 per 100 iMessage ask markers; 17.87 logistics",
    shape: "direct ask, one useful detail, no ceremony",
    avoid: "inflated politeness",
    score: 5,
  },
  {
    mode: "Repair",
    evidence: "voice system + sparse private markers",
    shape: "own the action, explain mechanism without excuse, next behavior",
    avoid: "therapy-script language",
    score: 3,
  },
];

const matrixColumns = ["public", "private", "humor", "coordination", "analysis", "warmth", "repair"];
const matrixRows = [
  { label: "X personal", values: [5, 1, 4, 2, 2, 2, 1] },
  { label: "Stallion", values: [5, 1, 5, 1, 2, 1, 1] },
  { label: "Snapchat", values: [1, 4, 2, 5, 1, 4, 2] },
  { label: "iMessage", values: [1, 5, 2, 5, 1, 4, 3] },
  { label: "Long-form", values: [3, 1, 1, 1, 5, 2, 3] },
  { label: "Instructions", values: [2, 3, 2, 5, 4, 3, 4] },
];

const compressionRows = [
  { label: "iMessage private", value: imessageLanguage.overall.median_words, note: "decoded sent texts" },
  { label: "Snapchat private", value: snapchat.chat.word_count.sent_median, note: "sent text rows" },
  { label: "@a_hump20", value: xCounts.a_hump20.median_words, note: "authored public" },
  { label: "Stallion", value: xCounts.TXTrickWhooper.median_words, note: "authored public" },
];

const phaseRows = [
  ...xData.phases.map((phase) => ({
    label: phase.phase,
    value: phase.count,
    lane: "X/social",
    note: phase.top_themes.slice(0, 2).map(([label]) => label).join(" + "),
  })),
  ...Object.entries(imessageLanguage.by_phase).map(([label, row]) => ({
    label,
    value: row.messages,
    lane: "private language",
    note: `${row.median_words} word median`,
  })),
];

const data = {
  generatedAt: "2026-07-07",
  filterCount: filterFamilies.reduce((sum, family) => sum + family.filters.length, 0),
  filterFamilies,
  sourceRows,
  routerModes,
  matrixColumns,
  matrixRows,
  compressionRows,
  markerRows,
  privateContextRows,
  purposeRows,
  combinedThemes,
  combinedHumor,
  phaseRows,
  totals: {
    officialX: totalOfficialX,
    authoredX: totalAuthoredX,
    xReplies: totalXReplies,
    xReplyShare: pct((totalXReplies / totalAuthoredX) * 100),
    snapchatChats: snapchat.chat.message_counts.all_chat_rows,
    snapchatSentTexts: snapchat.chat.message_counts.sent_text_rows,
    imessageRows: imessage.coverage.all_message_rows,
    imessageBaseRows: imessage.coverage.base_message_rows,
    decodedMessages: imessageLanguage.coverage.decoded_sent_text_rows,
    writingFiles: "50+",
    sourceLanes: sourceRows.length,
    filterFamilies: filterFamilies.length,
  },
  privateLanguage: {
    median: imessageLanguage.overall.median_words,
    p75: imessageLanguage.overall.p75_words,
    p90: imessageLanguage.overall.p90_words,
    short5: imessageLanguage.overall.punctuation_rate_per_100.one_liner_5_words_or_less,
    short10: imessageLanguage.overall.punctuation_rate_per_100.short_message_10_words_or_less,
    ask: imessageLanguage.overall.marker_rate_per_100.question_or_direct_ask,
    logistics: imessageLanguage.overall.marker_rate_per_100.logistics,
  },
  answer: [
    {
      label: "Helpful for me",
      status: "verified",
      body: "Yes. The source work gives future runs a reusable map instead of asking an agent to infer Austin from one chat, one tweet style, or one polished writing sample.",
    },
    {
      label: "Helpful for writing as Austin",
      status: "verified",
      body: "The system now distinguishes public social, long-form, brand, direct private, group, coordination, repair, and AI-partner contexts before choosing tone.",
    },
    {
      label: "Helpful without leaking",
      status: "verified",
      body: "Private sources are reduced to counts, marker rates, anonymous relationship buckets, purpose buckets, and guardrails. The model learns shape without exporting private wording.",
    },
  ],
  softAxes: [
    ["psychological", "specific object first, self-awareness as pressure valve, strong preference for directness under stress"],
    ["interpersonal", "relationship context before tone; private language compresses into asks, timing, warmth, quick reaction, media/context passing, and plain repair"],
    ["philosophical", "surface event points at system; who benefits, who pays, what mechanism is hiding underneath"],
    ["humor", "minor inconvenience becomes civic emergency, mock ceremony, reply correction, self-incriminating aside"],
    ["agent partnership", "execution partner over note-taker; evidence tags; challenge weak premises; preserve continuity"],
  ],
};

const dataJSON = JSON.stringify(data).replace(/</g, "\\u003c");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Austin Communication Context Map</title>
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
      --paper:#f6f1e8;
      --ink:#171412;
      --muted:#655d52;
      --line:#d6c9b9;
      --panel:#fffaf1;
      --panel2:#ebe0cf;
      --burnt:#bf5700;
      --green:#2e6b5d;
      --blue:#245f86;
      --gold:#aa7a22;
      --red:#99402f;
      --dark:#171512;
      --shadow:0 18px 42px rgba(29,22,12,.12);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--paper); color:var(--ink); line-height:1.5; }
    a { color:inherit; }
    button { font:inherit; }
    .shell { display:grid; grid-template-columns: 300px minmax(0,1fr); min-height:100vh; }
    aside {
      position:sticky; top:0; height:100vh; padding:28px 24px;
      background:var(--dark); color:#fff7e8; display:flex; flex-direction:column; gap:22px;
    }
    aside h1 { margin:0; font-size:28px; line-height:1.02; letter-spacing:0; }
    aside p { margin:0; color:#cbbda7; font-size:14px; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:11px; font-weight:800; color:var(--burnt); }
    aside .eyebrow { color:#dca160; }
    nav { display:grid; gap:8px; }
    nav a { text-decoration:none; border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:9px 10px; color:#f8eddc; font-size:13px; }
    nav a:hover, nav a:focus-visible { outline:2px solid #dca160; outline-offset:2px; }
    main { padding:34px clamp(18px,4vw,58px) 64px; max-width:1560px; }
    section { margin-bottom:44px; scroll-margin-top:24px; }
    .hero { min-height:calc(100vh - 68px); display:grid; grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr); gap:24px; align-items:stretch; }
    .hero-copy, .panel, .answer-card, .filter-detail, .mode-card {
      border:1px solid var(--line); border-radius:8px; background:var(--panel); box-shadow:var(--shadow);
    }
    .hero-copy { padding:clamp(28px,5vw,62px); display:flex; flex-direction:column; justify-content:center; }
    .hero h2 { font-size:clamp(42px,7vw,82px); line-height:.96; letter-spacing:0; margin:10px 0 18px; max-width:940px; }
    .thesis { max-width:840px; color:#383229; font-size:clamp(17px,2vw,22px); margin:0 0 24px; }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
    .metric { border:1px solid var(--line); background:#fffdf8; border-radius:8px; padding:15px; }
    .metric b { display:block; font-size:clamp(26px,3vw,42px); line-height:1; color:var(--burnt); margin-bottom:6px; }
    .metric span { display:block; color:var(--muted); font-size:12px; }
    .answer-stack { display:grid; gap:12px; }
    .answer-card { padding:16px; border-left:7px solid var(--green); }
    .answer-card h3 { display:flex; justify-content:space-between; gap:12px; margin:0 0 8px; font-size:16px; }
    .answer-card h3 span:last-child { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.1em; white-space:nowrap; }
    .answer-card p { margin:0; color:var(--muted); font-size:14px; }
    .section-head { display:flex; justify-content:space-between; align-items:end; gap:20px; margin-bottom:18px; }
    .section-head h2 { margin:0; font-size:clamp(28px,4vw,48px); line-height:1.02; letter-spacing:0; }
    .section-head p { margin:0; max-width:650px; color:var(--muted); }
    .grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; }
    .panel { padding:18px; }
    .panel h3 { margin:0 0 12px; font-size:17px; }
    .caption { color:var(--muted); font-size:13px; margin:12px 0 0; }
    .bar-list { display:grid; gap:10px; }
    .bar-row { display:grid; grid-template-columns:minmax(128px,.9fr) minmax(120px,2fr) 76px; gap:10px; align-items:center; }
    .bar-label { font-size:13px; color:#2b2721; }
    .track { height:12px; border-radius:999px; background:#eadfce; overflow:hidden; }
    .fill { height:100%; border-radius:999px; background:var(--burnt); }
    .fill.green { background:var(--green); }
    .fill.blue { background:var(--blue); }
    .fill.gold { background:var(--gold); }
    .bar-value { text-align:right; color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }
    .dual-row { display:grid; grid-template-columns:minmax(140px,1fr) 1.2fr 1.2fr; gap:10px; align-items:center; margin-bottom:10px; }
    .dual-track { height:12px; border-radius:999px; background:#eadfce; position:relative; overflow:hidden; }
    .dual-track span { position:absolute; inset:0 auto 0 0; border-radius:999px; background:var(--green); }
    .dual-track.im span { background:var(--blue); }
    .small-label { font-size:12px; color:var(--muted); }
    .filter-layout { display:grid; grid-template-columns:minmax(240px,.9fr) minmax(0,1.3fr); gap:18px; align-items:start; }
    .filter-buttons { display:grid; gap:8px; }
    .filter-buttons button {
      text-align:left; border:1px solid var(--line); background:var(--panel); border-radius:8px; padding:11px 12px; cursor:pointer;
      display:flex; justify-content:space-between; gap:12px; color:var(--ink);
    }
    .filter-buttons button.active { background:var(--dark); color:#fff7e8; border-color:var(--dark); }
    .filter-buttons button:focus-visible { outline:2px solid var(--burnt); outline-offset:2px; }
    .filter-detail { padding:20px; }
    .filter-detail h3 { margin:0 0 6px; font-size:24px; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }
    .chip { border:1px solid var(--line); background:#fffdf8; border-radius:999px; padding:7px 10px; font-size:12px; color:#383129; }
    .matrix { overflow:auto; }
    .matrix table, .context-table { width:100%; border-collapse:collapse; min-width:650px; }
    th, td { border-bottom:1px solid var(--line); padding:9px 10px; font-size:13px; text-align:left; }
    th { color:#4d463d; background:#f3eadc; position:sticky; top:0; }
    .heat { text-align:center; color:#fff; font-weight:800; border-radius:6px; min-width:44px; }
    .heat[data-v="1"] { background:#c9bca8; color:#261f18; }
    .heat[data-v="2"] { background:#b99a72; }
    .heat[data-v="3"] { background:#a8783f; }
    .heat[data-v="4"] { background:#80683e; }
    .heat[data-v="5"] { background:#2f6b5f; }
    .mode-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .mode-card { padding:15px; box-shadow:none; }
    .mode-card h3 { margin:0 0 8px; font-size:16px; }
    .mode-card p { margin:0 0 8px; color:var(--muted); font-size:13px; }
    .dots { display:flex; gap:4px; margin-top:10px; }
    .dots span { width:10px; height:10px; border-radius:999px; background:#d4c8b8; }
    .dots span.on { background:var(--burnt); }
    .soft-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
    .soft-card { border:1px solid var(--line); border-radius:8px; padding:15px; background:#fffdf8; }
    .soft-card h3 { margin:0 0 8px; font-size:14px; color:var(--burnt); text-transform:capitalize; }
    .soft-card p { margin:0; color:var(--muted); font-size:13px; }
    .timeline { display:grid; gap:10px; }
    .phase-row { display:grid; grid-template-columns:130px minmax(180px,1fr) 90px; gap:10px; align-items:center; }
    .phase-row strong { font-size:12px; color:var(--muted); }
    .source-card { display:grid; gap:10px; border:1px solid var(--line); border-radius:8px; padding:15px; background:#fffdf8; }
    .source-card h3 { margin:0; display:flex; justify-content:space-between; gap:12px; font-size:16px; }
    .source-card h3 span:last-child { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
    .privacy { border-left:7px solid var(--blue); }
    .context-table-wrap { overflow:auto; }
    .purpose-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .purpose-card { border:1px solid var(--line); border-radius:8px; padding:15px; background:#fffdf8; }
    .purpose-card h3 { margin:0 0 8px; font-size:16px; }
    .purpose-card p { margin:0 0 8px; color:var(--muted); font-size:13px; }
    .purpose-card ul { margin:8px 0 0; padding-left:18px; color:#383129; font-size:13px; }
    .purpose-card li { margin:3px 0; }
    .footer { margin-top:28px; color:var(--muted); font-size:13px; }
    @media (max-width: 1050px) {
      .shell { grid-template-columns:1fr; }
      aside { position:relative; height:auto; }
      .hero { grid-template-columns:1fr; min-height:auto; }
      .mode-grid, .soft-grid, .purpose-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 720px) {
      main { padding:22px 14px 44px; }
      .hero-copy { padding:24px; }
      .section-head { display:block; }
      .section-head p { margin-top:8px; }
      .grid-2, .grid-3, .filter-layout, .mode-grid, .soft-grid, .purpose-grid { grid-template-columns:1fr; }
      .bar-row, .dual-row, .phase-row { grid-template-columns:1fr; gap:6px; }
      .bar-value { text-align:left; }
      .matrix table, .context-table { min-width:540px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior:auto; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const DATA = ${dataJSON};
    const h = React.createElement;
    const fmt = new Intl.NumberFormat("en-US");

    function Metric({ value, label }) {
      return h("div", { className:"metric" }, h("b", null, value), h("span", null, label));
    }
    function BarList({ rows, color = "burnt", suffix = "", maxValue }) {
      const max = maxValue || Math.max(...rows.map((row) => row.value), 1);
      const colorClass = color === "green" ? " green" : color === "blue" ? " blue" : color === "gold" ? " gold" : "";
      return h("div", { className:"bar-list" }, rows.map((row) =>
        h("div", { className:"bar-row", key:row.label },
          h("div", { className:"bar-label" }, row.label),
          h("div", { className:"track" }, h("div", { className:"fill" + colorClass, style:{ width: Math.max(2, (row.value / max) * 100) + "%" } })),
          h("div", { className:"bar-value" }, typeof row.value === "number" ? fmt.format(row.value) + suffix : row.value)
        )
      ));
    }
    function DualBars({ rows }) {
      const max = Math.max(...rows.flatMap((row) => [row.snapchat, row.imessage]), 1);
      return h("div", null,
        h("div", { className:"dual-row small-label" }, h("strong", null, "marker"), h("strong", null, "Snapchat"), h("strong", null, "iMessage")),
        rows.map((row) =>
          h("div", { className:"dual-row", key:row.label },
            h("div", { className:"bar-label" }, row.label),
            h("div", null, h("div", { className:"dual-track" }, h("span", { style:{ width: (row.snapchat / max) * 100 + "%" } })), h("div", { className:"small-label" }, row.snapchat + " / 100")),
            h("div", null, h("div", { className:"dual-track im" }, h("span", { style:{ width: (row.imessage / max) * 100 + "%" } })), h("div", { className:"small-label" }, row.imessage + " / 100"))
          )
        )
      );
    }
    function FilterAtlas() {
      const [selected, setSelected] = React.useState(0);
      const item = DATA.filterFamilies[selected];
      return h("div", { className:"filter-layout" },
        h("div", { className:"filter-buttons" }, DATA.filterFamilies.map((family, index) =>
          h("button", { className:index === selected ? "active" : "", onClick:() => setSelected(index), key:family.family },
            h("span", null, family.family),
            h("strong", null, family.filters.length)
          )
        )),
        h("div", { className:"filter-detail" },
          h("p", { className:"eyebrow" }, "Filter family"),
          h("h3", null, item.family),
          h("p", null, item.claim),
          h("div", { className:"chips" }, item.filters.map((filter) => h("span", { className:"chip", key:filter }, filter))),
          h("p", { className:"caption" }, h("strong", null, "Evidence: "), item.evidence),
          h("p", { className:"caption" }, h("strong", null, "Why it helps: "), item.use)
        )
      );
    }
    function Matrix() {
      return h("div", { className:"matrix panel" },
        h("h3", null, "Source Strength Matrix"),
        h("table", null,
          h("thead", null, h("tr", null, h("th", null, "source"), DATA.matrixColumns.map((col) => h("th", { key:col }, col)))),
          h("tbody", null, DATA.matrixRows.map((row) =>
            h("tr", { key:row.label }, h("td", null, row.label), row.values.map((value, index) =>
              h("td", { key:index }, h("div", { className:"heat", "data-v":String(value) }, value))
            ))
          ))
        ),
        h("p", { className:"caption" }, "Scores are a router-strength map, not a psychological diagnosis: 1 means weak evidence for that mode, 5 means strong source support.")
      );
    }
    function PrivateContextRouter() {
      return h("div", { className:"panel context-table-wrap" },
        h("h3", null, "Anonymous Private Room Router"),
        h("table", { className:"context-table" },
          h("thead", null, h("tr", null,
            ["context","texts","median","<=5 words","ask","logistics","routing"].map((head) => h("th", { key:head }, head))
          )),
          h("tbody", null, DATA.privateContextRows.map((row) =>
            h("tr", { key:row.key },
              h("td", null, row.label),
              h("td", null, fmt.format(row.messages)),
              h("td", null, row.median_words + " words"),
              h("td", null, row.short5_per_100 + " / 100"),
              h("td", null, row.question_per_100 + " / 100"),
              h("td", null, row.logistics_per_100 + " / 100"),
              h("td", null, row.routing_implication)
            )
          ))
        ),
        h("p", { className:"caption" }, "This is the new local-only Messages layer in public-safe form: relationship shape without relationship identity.")
      );
    }
    function PurposeBuckets() {
      return h("div", { className:"purpose-grid" }, DATA.purposeRows.map((row) =>
        h("article", { className:"purpose-card", key:row.key },
          h("h3", null, row.label),
          h("p", null, row.shape),
          h("p", null, h("strong", null, "Use: "), row.use),
          h("p", null, h("strong", null, "Avoid: "), row.avoid),
          h("ul", null, row.overall_signals_per_100.map((signal) =>
            h("li", { key:signal.label }, signal.label + ": " + signal.per_100 + " per 100")
          ))
        )
      ));
    }
    function SourceCards() {
      return h("div", { className:"grid-3" }, DATA.sourceRows.map((row) =>
        h("article", { className:"source-card privacy", key:row.label },
          h("h3", null, h("span", null, row.label), h("span", null, row.kind)),
          h("div", { className:"metrics" },
            h(Metric, { value: fmt.format(row.rows) + (row.suffix || ""), label:"source rows/items" }),
            h(Metric, { value: fmt.format(row.usable) + (row.suffix || ""), label:"usable signal" })
          ),
          h("p", { className:"caption" }, row.note),
          h("p", { className:"caption" }, h("strong", null, "Privacy: "), row.privacy)
        )
      ));
    }
    function RouterModes() {
      return h("div", { className:"mode-grid" }, DATA.routerModes.map((mode) =>
        h("article", { className:"mode-card", key:mode.mode },
          h("h3", null, mode.mode),
          h("p", null, mode.shape),
          h("p", null, h("strong", null, "Evidence: "), mode.evidence),
          h("p", null, h("strong", null, "Avoid: "), mode.avoid),
          h("div", { className:"dots", "aria-label":"Evidence strength " + mode.score + " out of 5" },
            [1,2,3,4,5].map((n) => h("span", { className:n <= mode.score ? "on" : "", key:n }))
          )
        )
      ));
    }
    function Timeline() {
      const max = Math.max(...DATA.phaseRows.map((row) => row.value), 1);
      return h("div", { className:"timeline" }, DATA.phaseRows.map((row) =>
        h("div", { className:"phase-row", key:row.lane + row.label },
          h("strong", null, row.lane),
          h("div", null,
            h("div", { className:"bar-label" }, row.label),
            h("div", { className:"track" }, h("div", { className:"fill " + (row.lane === "private language" ? "green" : "blue"), style:{ width: Math.max(2, row.value / max * 100) + "%" } }))
          ),
          h("div", { className:"bar-value" }, fmt.format(row.value))
        )
      ));
    }
    function App() {
      return h("div", { className:"shell" },
        h("aside", null,
          h("p", { className:"eyebrow" }, "Austin Voice System"),
          h("h1", null, "Communication Context Map"),
          h("p", null, "A visual answer to whether the archive work helps, and which filters now exist across platforms."),
          h("nav", { "aria-label":"Artifact sections" }, [
            ["answer","Answer"],
            ["sources","Sources"],
            ["filters","Filters"],
            ["signals","Signals"],
            ["private-router","Private Router"],
            ["matrix","Matrix"],
            ["router","Room Router"],
            ["soft","Soft Layer"],
            ["privacy","Privacy"]
          ].map(([id,label]) =>
            h("a", { href:"#"+id, key:id }, label)
          )),
          h("p", null, "Generated " + DATA.generatedAt + ". Private sources are derived-only.")
        ),
        h("main", null,
          h("section", { className:"hero", id:"answer" },
            h("div", { className:"hero-copy" },
              h("p", { className:"eyebrow" }, "Short answer"),
              h("h2", null, "Yes. This is now useful as a map, not just a memory."),
              h("p", { className:"thesis" }, "The work turns platform archives into " + DATA.filterFamilies.length + " category families and " + DATA.filterCount + " reusable filters for choosing audience, privacy, purpose, tone, evidence, and output mode."),
              h("div", { className:"metrics" },
                h(Metric, { value:fmt.format(DATA.totals.officialX), label:"official X rows parsed" }),
                h(Metric, { value:fmt.format(DATA.totals.authoredX), label:"authored public rows" }),
                h(Metric, { value:fmt.format(DATA.totals.decodedMessages), label:"decoded private sent texts" }),
                h(Metric, { value:DATA.filterCount, label:"usable filters identified" })
              )
            ),
            h("div", { className:"answer-stack" }, DATA.answer.map((item) =>
              h("article", { className:"answer-card", key:item.label },
                h("h3", null, h("span", null, item.label), h("span", null, item.status)),
                h("p", null, item.body)
              )
            ))
          ),
          h("section", { id:"sources" },
            h("div", { className:"section-head" }, h("h2", null, "Evidence Universe"), h("p", null, "The old X artifact was one lane. This view shows the broader source map and what each lane is allowed to contribute.")),
            h(SourceCards, null)
          ),
          h("section", { id:"filters" },
            h("div", { className:"section-head" }, h("h2", null, "Category And Filter Atlas"), h("p", null, "These are the practical lenses that now exist for future writing, replies, analysis, and agent behavior.")),
            h(FilterAtlas, null)
          ),
          h("section", { id:"signals" },
            h("div", { className:"section-head" }, h("h2", null, "Signal Charts"), h("p", null, "Hard numbers behind the soft read: compression, reply gravity, marker rates, topics, and joke mechanics.")),
            h("div", { className:"grid-2" },
              h("div", { className:"panel" }, h("h3", null, "Compression Ladder"), h(BarList, { rows:DATA.compressionRows, color:"green", suffix:" words" }), h("p", { className:"caption" }, "Private language compresses hard: both Snapchat and iMessage land at a 5-word median. Public social is still short, but it has more stage lighting.")),
              h("div", { className:"panel" }, h("h3", null, "Private Marker Rates"), h(DualBars, { rows:DATA.markerRows }), h("p", { className:"caption" }, "Questions and logistics dominate private communication. Warmth exists, but it usually rides inside practical context instead of announcing itself."))
            ),
            h("div", { className:"grid-2", style:{ marginTop:"18px" } },
              h("div", { className:"panel" }, h("h3", null, "Combined X Themes"), h(BarList, { rows:DATA.combinedThemes, color:"blue" }), h("p", { className:"caption" }, "Public gravity clusters around replies, sports/Texas, everyday observation, tools, family/life, and platform context.")),
              h("div", { className:"panel" }, h("h3", null, "Combined X Humor Mechanics"), h(BarList, { rows:DATA.combinedHumor, color:"gold" }), h("p", { className:"caption" }, "Humor is most often deadpan, self-involving, reply-native, and built from overstated stakes. The bit ends before it explains itself."))
            ),
            h("div", { className:"panel", style:{ marginTop:"18px" } }, h("h3", null, "Phase Volume Map"), h(Timeline, null), h("p", { className:"caption" }, "The public record shows persona evolution. The private record shows long-run compression and relationship-context density. They answer different questions."))
          ),
          h("section", { id:"private-router" },
            h("div", { className:"section-head" }, h("h2", null, "Private Context Router"), h("p", null, "This is the executed Messages wording pass: anonymous relationship-room signals and purpose buckets, not private examples.")),
            h(PrivateContextRouter, null),
            h("div", { className:"panel", style:{ marginTop:"18px" } },
              h("h3", null, "Purpose Buckets"),
              h("p", { className:"caption" }, "These buckets tell future agents what job the private message is doing before choosing tone."),
              h("div", { style:{ marginTop:"14px" } }, h(PurposeBuckets, null))
            )
          ),
          h("section", { id:"matrix" },
            h("div", { className:"section-head" }, h("h2", null, "What Each Source Proves"), h("p", null, "A compact source-by-context heatmap for deciding which evidence to trust for which communication mode.")),
            h(Matrix, null)
          ),
          h("section", { id:"router" },
            h("div", { className:"section-head" }, h("h2", null, "Room Router"), h("p", null, "This is the actual payoff: choose the room before choosing the voice.")),
            h(RouterModes, null)
          ),
          h("section", { id:"soft" },
            h("div", { className:"section-head" }, h("h2", null, "Soft Context Layer"), h("p", null, "The numbers are the guardrail. The soft layer is the interpretation that makes the system feel like Austin instead of a spreadsheet wearing boots.")),
            h("div", { className:"soft-grid" }, DATA.softAxes.map(([label, body]) =>
              h("article", { className:"soft-card", key:label }, h("h3", null, label), h("p", null, body))
            ))
          ),
          h("section", { id:"privacy" },
            h("div", { className:"section-head" }, h("h2", null, "Privacy Boundary"), h("p", null, "The model can get smarter without making private people or private accounts part of the public artifact.")),
            h("div", { className:"grid-3" },
              h("div", { className:"panel" }, h("h3", null, "Public"), h("p", null, "Official X posts and long-form writing can be used as public evidence when context is preserved.")),
              h("div", { className:"panel" }, h("h3", null, "Derived"), h("p", null, "Snapchat and iMessage contribute counts, rates, buckets, and router corrections. No raw text or private names.")),
              h("div", { className:"panel" }, h("h3", null, "Local-only"), h("p", null, "Raw Messages, DMs, private phrases, contact identities, burner metadata, filenames, and media paths stay off GitHub."))
            )
          ),
          h("p", { className:"footer" }, "This artifact expands the X-only view into a cross-platform communication map. It is meant to help future agents choose context before voice, and to keep privacy boundaries visible while still preserving the useful signal.")
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
