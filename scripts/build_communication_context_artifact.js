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
const contractPath = path.join(ROOT, "Voice-Style-Identity/frontend-craft-contract.json");

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

function firstSentence(text) {
  return text.split(". ")[0].trim();
}

const combinedThemes = combinePairs([xCounts.a_hump20.top_themes, xCounts.TXTrickWhooper.top_themes]).slice(0, 9);
const combinedHumor = combinePairs([xCounts.a_hump20.top_humor_tags, xCounts.TXTrickWhooper.top_humor_tags]).slice(0, 9);

const markerRows = [
  {
    label: "question/direct ask",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.question,
    imessage: imessageLanguage.overall.marker_rate_per_100.question_or_direct_ask,
    implication: "Your private language starts by finding the next move.",
  },
  {
    label: "logistics",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.logistics,
    imessage: imessageLanguage.overall.marker_rate_per_100.logistics,
    implication: "Coordination is not a side register. It is a core delivery condition.",
  },
  {
    label: "laughter/play",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.laughter,
    imessage: imessageLanguage.overall.marker_rate_per_100.laughter_or_play,
    implication: "Private humor is quick reaction more than staged performance.",
  },
  {
    label: "affection/warmth",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.affection,
    imessage: imessageLanguage.overall.marker_rate_per_100.affection_or_warmth,
    implication: "Warmth usually rides inside a practical or specific line.",
  },
  {
    label: "sports/place",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.sports_place,
    imessage: imessageLanguage.overall.marker_rate_per_100.sports_or_place_shorthand,
    implication: "Place and sports act like shared keys, not just topics.",
  },
  {
    label: "repair/accountability",
    snapchat: snapchat.chat.marker_rates_per_100_sent_texts.repair,
    imessage: imessageLanguage.overall.marker_rate_per_100.repair_or_accountability,
    implication: "Repair is rarer, so it needs plain wording when it appears.",
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
    note: "Public social voice, reply timing, humor mechanics, sports identity, public-pressure translation.",
    privacy: "Public quotes allowed with context.",
    proof: "6,300 official rows, 5,437 authored voice rows.",
    dateRange: "2011-2026",
    yieldNote: "Usable means authored rows only; retweets and reposts are taste/context, not voice.",
    gaps: "DMs, contacts, IP/device, ad, and Grok files are excluded.",
    accounts: [
      { label: "@a_hump20 (personal)", rows: xCounts.a_hump20.official_archive_rows, authored: xCounts.a_hump20.authored_voice_tweets, dateRange: "2011-2025" },
      { label: "@TXTrickWhooper (Stallion)", rows: xCounts.TXTrickWhooper.official_archive_rows, authored: xCounts.TXTrickWhooper.authored_voice_tweets, dateRange: "2022-2026" },
    ],
  },
  {
    label: "Snapchat derived",
    kind: "private derived",
    rows: snapchat.chat.message_counts.all_chat_rows,
    usable: snapchat.chat.message_counts.sent_text_rows,
    note: "Private compression, quick asks, logistics, warmth markers, reaction speed.",
    privacy: "Rates only. No raw private text.",
    proof: "2,417 chat rows, 1,052 sent text rows.",
    dateRange: "2016-2026",
    yieldNote: "Usable means sent text rows; received messages and media are excluded from voice evidence.",
    gaps: "Raw text, contact names, media URLs, and media files stay local-only. Conversation labels are anonymized.",
  },
  {
    label: "iMessage metadata",
    kind: "private derived",
    rows: imessage.coverage.all_message_rows,
    usable: imessage.coverage.base_message_rows,
    note: "Direct/group shape, tapbacks, replies, attachments, long-run relationship routing.",
    privacy: "Aggregate metadata only.",
    proof: "483,242 local rows, 435,735 base human-message rows.",
    dateRange: "2014-2026",
    yieldNote: "Usable means base human messages; system and associated rows are excluded.",
    gaps: "No raw text, contact names, handles, group names, filenames, or media paths are committed.",
  },
  {
    label: "iMessage language",
    kind: "private derived",
    rows: imessage.coverage.sent_base_rows,
    usable: imessageLanguage.coverage.decoded_sent_text_rows,
    note: "Sent-text length, marker rates, anonymous delivery shape, purpose buckets.",
    privacy: "Derived wording shape only. No phrases.",
    proof: "179,882 decoded sent text rows.",
    dateRange: "2014-2026",
    yieldNote: "Usable means successfully decoded sent-text rows.",
    gaps: "Empty, media, or archive-residue rows are rejected. No raw wording or n-grams are committed.",
  },
  {
    label: "Long-form writing",
    kind: "authored archive",
    rows: 50,
    usable: 50,
    note: "Claim building, systems thinking, education/professional voice, moral framing.",
    privacy: "Source-linked authored archive.",
    proof: "50+ coursework, sports, and professional writing files.",
    suffix: "+",
    dateRange: "ages 17-25, refreshed 2026",
    yieldNote: "Usable means every file in the long-form archive.",
    gaps: "Some files contain old BSI positioning. Current doctrine wins where facts changed.",
  },
  {
    label: "Living brain and instructions",
    kind: "routing context",
    rows: 1,
    usable: 1,
    note: "How agents should work with Austin: evidence tags, continuity, directness, privacy.",
    privacy: "Resurface the signal, never dump raw private source.",
    proof: "Current Codex/brain routing files and direct instructions.",
    dateRange: "refreshed 2026-07-07",
    yieldNote: "Usable means routed instructions and staged verbatim Austin lines, not generated prose.",
    gaps: "Brain captures stay inbox-first until human-reviewed filing.",
  },
];

const filterFamilies = [
  {
    family: "Source and Provenance",
    claim: "Where did this signal come from, and can it be quoted?",
    filters: ["platform", "account/source lane", "authored vs context", "public vs private-derived", "evidence status", "source date range"],
    evidence: "X rows, Snapchat summaries, iMessage summaries, writing archive, living-brain routing.",
    use: "Prevents a future agent from treating private derived shape like public wording.",
  },
  {
    family: "Time and Evolution",
    claim: "Which era, pressure stage, or room changed the translation?",
    filters: ["year", "phase", "life stage", "pre/post commentary account", "recent vs historical", "platform pressure"],
    evidence: "X phase rows, iMessage date range, Snapchat year buckets, writing-development files.",
    use: "Tracks the same thought process as the room, stakes, and audience changed.",
  },
  {
    family: "Audience and Relationship",
    claim: "Who is in the room?",
    filters: ["public follower", "reply target", "direct private", "small group", "medium group", "large group", "AI partner", "professional reader"],
    evidence: "iMessage anonymous context buckets, X reply rates, Codex instructions, writing archive.",
    use: "Stops the system from treating translation rooms like separate Austins.",
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
    family: "Privacy and Consent",
    claim: "What is allowed to leave the machine?",
    filters: ["public quote allowed", "derived-only", "local-only", "no names/handles", "no private phrases", "no burner metadata", "no raw exports"],
    evidence: "Repo guardrails, .gitignore, secret guard, source manifest.",
    use: "Protects Austin and other people while keeping the model useful.",
  },
  {
    family: "Output Routing",
    claim: "How should the same underlying thought translate here?",
    filters: ["speak with Austin", "public long-form", "brand/platform", "X/social", "friend group", "warm one-on-one", "coordination", "repair"],
    evidence: "Consolidated voice files, skill, source manifest, rendered artifacts.",
    use: "Converts evidence into the right translation for the room without inventing a fake self.",
  },
];

const routerModes = [
  {
    mode: "With Austin",
    evidence: "direct instructions + living brain + execution history",
    shape: "Outcome first, known/unknown/open, warm directness, push back with evidence.",
    avoid: "Generic assistant politeness and process theater.",
    score: 5,
    values: [5, 4, 3, 4, 5, 4],
  },
  {
    mode: "Public long-form",
    evidence: "50+ writing files",
    shape: "Claim, system, evidence, implication. Fewer vibes, more cause and effect.",
    avoid: "Inflated conclusions and tidy thought-leader endings.",
    score: 5,
    values: [4, 2, 1, 2, 5, 3],
  },
  {
    mode: "Brand/platform",
    evidence: "professional docs + current BSI doctrine",
    shape: "Vision over grievance, concrete proof, current guardrails.",
    avoid: "Stale multi-sport or Blaze Intelligence framing.",
    score: 4,
    values: [4, 3, 2, 3, 4, 3],
  },
  {
    mode: "X/social",
    evidence: totalAuthoredX.toLocaleString() + " authored public rows",
    shape: "Concrete noun, blunt verdict, absurd escalation, stop.",
    avoid: "Explaining the punchline.",
    score: 5,
    values: [5, 5, 5, 2, 2, 1],
  },
  {
    mode: "Friend group",
    evidence: "iMessage buckets + Snapchat compression",
    shape: "Short, teasing through specifics, shared shorthand, quick self-own if needed.",
    avoid: "Public-register overkill.",
    score: 4,
    values: [4, 5, 4, 3, 2, 2],
  },
  {
    mode: "Warm private",
    evidence: "Snapchat + iMessage derived markers",
    shape: "Specific attention, playful challenge, low pressure, brief.",
    avoid: "Generic romantic essay voice.",
    score: 3,
    values: [4, 5, 3, 5, 1, 2],
  },
  {
    mode: "Coordination",
    evidence: "30.0 per 100 iMessage ask markers; 17.87 logistics",
    shape: "Direct ask, one useful detail, no ceremony.",
    avoid: "Inflated politeness.",
    score: 5,
    values: [5, 5, 1, 2, 2, 2],
  },
  {
    mode: "Repair",
    evidence: "voice files + sparse private marker rates",
    shape: "Own the action, explain mechanism without excuse, state next behavior.",
    avoid: "Therapy-script phrasing.",
    score: 3,
    values: [4, 3, 1, 4, 4, 5],
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
    dateRange: phase.date_range_ct,
    sample: phase.sample.slice(0, 2).map((tweet) => ({
      text: tweet.text,
      date: tweet.date_ct.slice(0, 10),
      account: tweet.account,
      likes: tweet.likes,
      url: tweet.url,
    })),
  })),
  ...Object.entries(imessageLanguage.by_phase).map(([label, row]) => ({
    label,
    value: row.messages,
    lane: "private language",
    note: row.median_words + " word median",
  })),
];

const publicExampleLabels = [
  "Waffle House as civil-defense institution",
  "Vape charger mock PSA",
  "Reading code punchline",
  "Claude model complaint",
  "Waffle House San Antonio origin",
  "Chick-fil-A acceptance speech",
  "Camera operator meltdown",
  "Old Facebook self-awareness",
  "Sleep as operating system",
];

const publicExamples = xData.examples
  .filter((example) => publicExampleLabels.includes(example.label))
  .map((example) => ({
    label: example.label,
    note: example.note,
    account: example.tweet.account,
    date: example.tweet.date_ct.slice(0, 10),
    likes: example.tweet.likes,
    reposts: example.tweet.reposts,
    text: example.tweet.text,
    url: example.tweet.url,
    humor: example.tweet.humor,
  }));

const humanSynthesis = [
  {
    title: "There is one thought process, not separate Austins.",
    status: "reasoned",
    summary: "The archive should not be read as X Austin, texting Austin, essay Austin. It is one thought process translated through room, stakes, audience, and consequence.",
    evidence: [
      "5,437 authored public X rows show a reply-native voice with short public posts.",
      "179,882 decoded sent Messages texts show a 5-word private median and 75.45 per 100 at 10 words or fewer.",
      "Long-form files keep returning to cause, institution, tradeoff, and next action.",
    ],
    implication: "Future agents should learn the underlying movement first, then translate it. The room changes the delivery, not the person.",
    strength: "This keeps the reference from overfitting you into a platform register.",
    watch: "A router becomes bad taxonomy when it forgets the thought underneath.",
  },
  {
    title: "Compression is structure. The line still has to teach something.",
    status: "reasoned",
    summary: "Short is not the whole standard. A useful line carries object, contrast, rhythm, consequence, bridge, and a lesson the reader can feel without being lectured.",
    evidence: [
      "Austin's direct 2026-07-07 instruction reframed compression as necessary but incomplete.",
      "Public examples work when ordinary objects carry larger civic, sports, or institutional stakes.",
      "Long-form writing and origin material show the same pattern at slower speed: concrete anchor, moral pressure, structural consequence.",
    ],
    implication: "The model should ask what the line teaches and what feeling it leaves, not only how many words it saved.",
    strength: "This keeps the reference from becoming a word-count dashboard.",
    watch: "Overcorrecting into ornament would be the opposite error. The layers still have to earn their space.",
  },
  {
    title: "Metaphor is translation, not decoration.",
    status: "reasoned",
    summary: "The art is finding the same observation across domains, then choosing a bridge the room can actually understand.",
    evidence: [
      "Austin's 2026-07-07 follow-up reframed artistry as contextual acuteness across cultures, contexts, and domains.",
      "Public examples work when a shared object carries a larger structure: Waffle House as civic defense, Chick-fil-A as dynasty, camera work as malpractice.",
      "Long-form and strategic writing use analogy best when the comparison makes the mechanism clearer, not when it shows off the reference.",
    ],
    implication: "Before using a metaphor, ask what the audience already knows. Do not explain rocket science in a language or domain the room cannot receive.",
    strength: "This makes the same truth travel without losing the room.",
    watch: "A clever bridge that the audience cannot cross is not communication. It is private decoration.",
  },
  {
    title: "Humor works by making ordinary stakes sound institutional.",
    status: "verified + reasoned",
    summary: "The repeat bit is not randomness. It is a stable move: breakfast, vapes, camera work, tools, food, and sports mistakes get framed as public infrastructure, constitutional rights, dynasties, or professional malpractice.",
    evidence: [
      "Public X examples include Waffle House as a last line of defense, Chick-fil-A as championship dynasty, and a camera miss as one-job failure.",
      "Combined X humor tags put short deadpan, self-involving aside, reply volley, and overstated stakes at the top.",
    ],
    implication: "The joke needs a specific object and a bigger frame. Without the object, it turns into generic internet sarcasm.",
    strength: "You can make small things memorable without making them abstract.",
    watch: "If every irritation gets emergency language, the true emergency has less headroom.",
  },
  {
    title: "Private warmth is specific, compressed, and often practical.",
    status: "verified",
    summary: "The private layer does not look like polished affection. It looks like quick context, a concrete detail, a direct ask, a check-in, or a joke that only works because the room already has history.",
    evidence: [
      "Direct/low-member private rooms: 161,446 decoded sent texts, median 5 words.",
      "Question/direct ask markers: 30.0 per 100 in iMessage and 34.41 per 100 in Snapchat sent texts.",
      "Affection/warmth markers exist, but they are lower than coordination markers.",
    ],
    implication: "When writing privately as Austin, do not start with a grand emotional paragraph. Start with the real detail and let warmth ride inside it.",
    strength: "This keeps private voice human, grounded, and low-pressure.",
    watch: "People who need explicit reassurance may miss warmth if it stays too compressed.",
  },
  {
    title: "Public voice is a translation layer, not a separate self.",
    status: "verified",
    summary: "Stallion is not fake, but it is amplified. It turns the same thought process toward public timing: sports certainty, Texas/place nouns, mock ceremony, bluntness, AI-tool anger, and self-owning asides.",
    evidence: [
      "@a_hump20 supplies the older identity layer from 2011-2025.",
      "@TXTrickWhooper supplies the commentary layer from 2022-2026.",
      "The account split lines up with clearer public-pressure translation and faster reply posture.",
    ],
    implication: "Future agents should not treat the public account as the master identity. Use it when the room asks for heat, timing, and scale mismatch.",
    strength: "The public register is memorable because it is rooted in the same movement.",
    watch: "Overusing it in private, professional, or repair contexts makes translation feel like performance.",
  },
  {
    title: "Your thinking is object-led, then system-led.",
    status: "reasoned",
    summary: "A small concrete thing usually comes first. Then the larger mechanism appears: platform design, sports incentives, institutional failure, customer experience, model access, public trust.",
    evidence: [
      "Public examples repeatedly anchor in named things: Waffle House, Chick-fil-A, Claude, Grok, San Antonio, camera work.",
      "Long-form writing shows the same movement at slower speed: claim, mechanism, stake, implication.",
    ],
    implication: "Austin-style analysis should not start at the theory layer. It should start with the object that makes the theory unavoidable.",
    strength: "It makes abstract analysis feel lived-in.",
    watch: "If the object is too personal or too private, publish the pattern without exposing the person.",
  },
];

const trendNarrative = [
  {
    phase: "2011-2014",
    title: "identity, rivalry, belonging",
    read: "The early voice is social, local, competitive, and more openly earnest. It is already specific: school, town, team, sleep, Facebook messages, game-day life.",
    proof: "3,562 authored public rows in the early X phase. Top themes include question/reply energy, sports/Texas, everyday observation, family/life, and school/social life.",
    implication: "The later edge did not appear from nowhere. It grew out of belonging to rooms where a line had to land fast.",
  },
  {
    phase: "2015-2019",
    title: "lower-volume bridge",
    read: "The posting slows down, but the adult version appears: customer experience, Austin/Sixth Street, sports decisions, and dry self-incrimination.",
    proof: "50 authored public rows in this bridge phase, with sports/Texas and question/reply energy still leading.",
    implication: "The voice gets less performative by volume, but more portable. It can aim at products, systems, and sports choices.",
  },
  {
    phase: "2020-2023",
    title: "adult-life commentary",
    read: "The line gets cleaner. Everyday objects become jokes, sports stress becomes melodrama, and place-food institutions become part of the mythology.",
    proof: "502 public rows in the phase. Waffle House San Antonio appears in 2022, before the 2026 Stallion pin.",
    implication: "The jokes increasingly depend on recurring objects. That is usable only if it stays concrete.",
  },
  {
    phase: "2024-2026",
    title: "commentary translation and AI/tool pressure",
    read: "The Stallion layer turns the voice up. AI tools become the new sports-radio call-in topic: model access, agents, platform feeds, broken UX, and rights language.",
    proof: "The official archive adds a 2022-2026 commentary account with 1,377 authored voice rows and high reply density.",
    implication: "Your current public voice is fastest when it treats tools like coaches, refs, and front offices: useful only if they perform.",
  },
  {
    phase: "Private 2014-2026",
    title: "compression as relationship memory",
    read: "Private wording stays shorter than public performance. The room already holds context, so the message can carry less scaffolding.",
    proof: "179,882 decoded sent Messages texts, median 5 words, 50.04 per 100 at five words or fewer.",
    implication: "A future agent should not mistake short private lines for lack of care. Often, the care is in knowing what can stay unsaid.",
  },
];

const strengthRisk = [
  {
    name: "Specificity",
    x: 4.8,
    y: 4.6,
    strength: "Makes the voice hard to fake.",
    risk: "Can over-index on the object and skip the softer need underneath.",
  },
  {
    name: "Compression",
    x: 4.6,
    y: 4.1,
    strength: "Gets to the point fast.",
    risk: "Can sound colder than intended in repair or reassurance.",
  },
  {
    name: "Heat",
    x: 3.8,
    y: 3.4,
    strength: "Adds life and stakes.",
    risk: "Can crowd out trust if the other person needs steadiness.",
  },
  {
    name: "Systems lens",
    x: 4.4,
    y: 4.7,
    strength: "Turns anecdotes into analysis.",
    risk: "Can outrun the immediate human feeling.",
  },
  {
    name: "Self-own",
    x: 4.2,
    y: 3.8,
    strength: "Keeps confidence from becoming pure arrogance.",
    risk: "Can hide the real ask behind a bit.",
  },
  {
    name: "Room sensitivity",
    x: 3.7,
    y: 4.3,
    strength: "Allows one voice to adapt across platforms.",
    risk: "Fails when public heat bleeds into private care.",
  },
];

const studyPrompts = [
  {
    title: "When does the joke work?",
    body: "When the joke has a real object, a shared room, and a scale mismatch. The weak version is heat without object.",
  },
  {
    title: "When does the claim work?",
    body: "When I say the verdict first, then show the mechanism. The weak version is stacking context before the reader knows why.",
  },
  {
    title: "When does it sound least fake?",
    body: "When specificity, bluntness, self-awareness, and ordinary stakes all show up in the same line without explaining themselves.",
  },
  {
    title: "Where does it break?",
    body: "Repair and reassurance need more explicit care than my default compression gives them. Short can still be warm, but it has to name the care.",
  },
];

const usableVoiceRows = [
  {
    lane: "With Austin",
    useWhen: "Direct collaboration, corrections, decisions, execution.",
    line: "[verified] The issue is not the artifact size. It is that the top explains the evidence before it gives you usable voice. I am moving the usable lines to the front and making the receipts prove them.",
    why: "Outcome first, evidence tag, concrete miss, corrective action.",
  },
  {
    lane: "Public social",
    useWhen: "X/social, replies, quick public reaction.",
    line: "Nothing humbles software faster than asking it to remember the point of the file it just made.",
    why: "Concrete object, dry escalation, no explained punchline.",
  },
  {
    lane: "Public long-form",
    useWhen: "Essay, LinkedIn, public analysis, product critique.",
    line: "The failure was not the error by itself. It was the absence of a recovery path after the user had already spent trust on the workflow.",
    why: "Claim, mechanism, human cost, reusable lesson.",
  },
  {
    lane: "Private coordination",
    useWhen: "Text-like update, close room, practical next step.",
    line: "I am fixing the top first. The page needs usable lines before receipts.",
    why: "Short, useful, no ceremony, still specific.",
  },
  {
    lane: "Repair",
    useWhen: "Missed expectation, wrong artifact, overclaim, tone drift.",
    line: "I overbuilt the map and underdelivered the voice. I am moving the actual outputs to the front and making the evidence secondary.",
    why: "Owns the action, names the mechanism, states next behavior.",
  },
  {
    lane: "Brand/platform",
    useWhen: "BSI, portfolio, professional or public-facing product copy.",
    line: "Trust is not earned by being impressive when the path is clean. It is earned when the system breaks and the user still knows what happened.",
    why: "Vision over grievance, concrete user stake, no hype.",
  },
];

const defaultDeliveryRules = [
  {
    rule: "Give the line first.",
    detail: "If the task asks for writing, produce the usable sentence, paragraph, reply, post, or decision before explaining why it works.",
  },
  {
    rule: "Keep the truth stable.",
    detail: "The mechanism should survive every translation. Only the doorway changes: metaphor, cadence, slang, density, proof, or silence.",
  },
  {
    rule: "Use receipts after the move.",
    detail: "Evidence earns trust. It should not crowd out the thing the reader came to use.",
  },
  {
    rule: "Cut fake taxonomy.",
    detail: "Do not split Austin into platform identities. Source lanes prove pressure conditions, not separate selves.",
  },
];

const truthTransferRows = [
  {
    layer: "Observational truth",
    question: "What is the naked thing actually noticed?",
  },
  {
    layer: "Mechanism",
    question: "What makes it work underneath?",
  },
  {
    layer: "Audience world",
    question: "What does this person already understand in their body?",
  },
  {
    layer: "Metaphor bridge",
    question: "What different domain has the same structure?",
  },
  {
    layer: "Contextual acuteness",
    question: "What must change because of culture, room, history, stakes, or language?",
  },
  {
    layer: "Delivery",
    question: "What rhythm, slang, grammar, image, or silence makes it land?",
  },
  {
    layer: "Durability",
    question: "Will the lesson still work tomorrow, elsewhere, for someone else?",
  },
];

const metaphorExampleRows = [
  {
    domain: "AI reliability",
    weak: "AI hallucination is like a person lying.",
    bridge: "AI hallucination is like a scoreboard that keeps updating after the data feed dies. It still looks live. That is the danger.",
    why: "Output continues, authority remains visible, source path is broken, and user trust becomes the failure point.",
  },
  {
    domain: "Code",
    weak: "This function normalizes heterogeneous inputs through schema validation.",
    bridge: "This function is the bouncer. It checks every ID before the data gets into the club.",
    why: "Same access-control mechanism, more enterable doorway.",
  },
  {
    domain: "Sports",
    weak: "The model weights recent opponent-adjusted performance.",
    bridge: "It does not just ask whether you won. It asks who you beat, how recently, and whether the win still tells us anything.",
    why: "Preserves recency, opponent strength, and signal decay without model jargon.",
  },
  {
    domain: "Finance",
    weak: "Liquidity risk increases under crowded exit conditions.",
    bridge: "Liquidity is not how many people are in the stadium. It is how many doors are open when everyone tries to leave.",
    why: "Preserves crowding, exit capacity, and timing pressure.",
  },
  {
    domain: "Relationships",
    weak: "I optimized for problem resolution instead of emotional validation.",
    bridge: "I tried to fix the leak before I noticed you were standing in water.",
    why: "Keeps the repair mechanism and adds the human stake.",
  },
  {
    domain: "Design",
    weak: "The interface lacks cognitive accessibility.",
    bridge: "The page is making the user carry the map, the compass, and the weather report at the same time.",
    why: "Makes cognitive load visible as a physical burden.",
  },
];

const transferFailureRows = [
  {
    failure: "Precision without access",
    effect: "The explanation is technically correct, but the room cannot enter it.",
  },
  {
    failure: "Access without precision",
    effect: "The metaphor lands but teaches the wrong mechanism.",
  },
  {
    failure: "Style without truth",
    effect: "It sounds good and leaves nothing behind.",
  },
  {
    failure: "Compression without context",
    effect: "The missing words were not actually shared.",
  },
  {
    failure: "Domain arrogance",
    effect: "The expert makes the listener climb instead of building the bridge.",
  },
  {
    failure: "Cultural blindness",
    effect: "The metaphor works in one room and breaks in another.",
  },
];

const reflectionChapters = [
  {
    title: "You think by turning the vague thing into a handled thing.",
    status: "reasoned",
    read: [
      "The recurring movement is not just directness. It is conversion. A loose annoyance, platform failure, sports decision, school memory, or private logistics problem gets converted into something you can point at and act on.",
      "That is why your voice rarely feels abstract when it is working. It grabs a thing: Waffle House, Chick-fil-A, a camera operator, a model picker, a phone, a town, a coach, a bad feed. Then it asks what that thing reveals about a larger system."
    ],
    evidence: [
      "Public examples keep using concrete objects as the hook.",
      "Long-form writing keeps turning those hooks into cause, mechanism, and stake.",
      "Private text shape shows the same compression under lower public pressure: 5-word median, 75.45 per 100 at 10 words or fewer."
    ],
    selfStudy: "This is a strength when the room is messy and needs a line. It can become a weakness when someone needs you to stay with the feeling before you solve the shape of it.",
  },
  {
    title: "Your humor is a pressure valve with a civic filing cabinet behind it.",
    status: "verified + reasoned",
    read: [
      "The joke pattern is not mostly wordplay. It is category abuse. You take a normal object and promote it to an institution, a defense system, a dynasty, a constitutional right, or a front-office fireable offense.",
      "That move makes the joke sound like you because the bit has a real noun and a weirdly serious frame. It is not random internet sarcasm. It is mock seriousness applied to breakfast, vapes, AI models, and sports stress."
    ],
    evidence: [
      "Top public humor tags include short deadpan, reply volley, self-involving aside, and overstated stakes.",
      "Public examples include Waffle House as defense infrastructure, Chick-fil-A as dynasty, and camera work as professional malpractice.",
      "The Stallion account turns the heat up, but the same mechanics already appear in the older personal account."
    ],
    selfStudy: "The useful part is memorability. The risk is escalation becoming the default emotional setting. The cleaner version keeps the object specific and lets the seriousness be the joke.",
  },
  {
    title: "Private care often shows up as usefulness, not ceremony.",
    status: "verified",
    read: [
      "The private layer does not read like long emotional explanation. It reads like quick asks, coordination, context passing, short reactions, and small warmth inside practical language.",
      "That does not mean low care. It means the room already carries history. The message can be shorter because the relationship is doing some of the work."
    ],
    evidence: [
      "iMessage question/direct-ask markers: 30.0 per 100 decoded sent texts.",
      "Snapchat question markers: 34.41 per 100 sent texts.",
      "Direct/private room shape: 161,446 decoded sent texts with a 5-word median."
    ],
    selfStudy: "This is efficient and often kind. It can miss when the other person needs the care named out loud. Future agents should add explicit warmth in repair, reassurance, or high-stakes private contexts.",
  },
  {
    title: "Your biggest voice risk is not being too much. It is using the wrong room.",
    status: "reasoned",
    read: [
      "Stallion heat, private compression, professional analysis, and direct agent-partner talk are all real. The failure mode is flattening them into one voice and dragging that voice everywhere.",
      "The archive argues for routing before writing. Who is in the room? What job is the message doing? Can this source be quoted? Does the situation need heat, care, repair, clarity, or proof?"
    ],
    evidence: [
      "The X archive can prove public voice and humor mechanics.",
      "Private sources can prove shape and context, not quotable wording.",
      "Current instructions repeatedly ask for known, unknown, open, evidence tags, and direct execution."
    ],
    selfStudy: "The public register is a dial. It is strong because it is rooted in you. It gets weird when it walks into a room that asked for steadiness.",
  },
  {
    title: "The AI partnership lane is its own voice now.",
    status: "verified + reasoned",
    read: [
      "A newer register has formed around agents, tools, broken UX, context drift, and the desire for durable continuity. It borrows from sports and operator language: prove it, run it, show me the result, stop making fake progress.",
      "This is not only a preference for productivity. It is a relationship expectation. You want a partner that remembers the room, protects the source, challenges weak premises, and still gets the work done."
    ],
    evidence: [
      "Direct instructions emphasize evidence over agreement, durable memory, privacy boundaries, and execution.",
      "Public X examples show AI/tool complaints in the same blunt register as sports and service failures.",
      "The repo now contains a skill, translation system, source manifest, and rendered artifacts to reduce drift."
    ],
    selfStudy: "The useful version is high trust and high standards. The weaker version is impatience with the parts of collaboration that need slowing down before the right thing can be done.",
  },
];

const tensionPairs = [
  {
    trait: "compression",
    works: "The room already has enough shared context.",
    breaks: "The other person needs care named, not implied.",
    route: "Add one explicit care sentence in repair or reassurance.",
  },
  {
    trait: "heat",
    works: "The room expects public timing or shared banter.",
    breaks: "The room needs steadiness or repair.",
    route: "Use heat for public jokes and shared rooms; use steadiness for private repair.",
  },
  {
    trait: "specificity",
    works: "The object carries the claim.",
    breaks: "The softer need remains unnamed.",
    route: "After naming the object, name the human stake.",
  },
  {
    trait: "systems lens",
    works: "A small event exposes the mechanism.",
    breaks: "The person needs to feel heard before the mechanism is solved.",
    route: "In close rooms, reflect the feeling before the theory.",
  },
  {
    trait: "self-own",
    works: "It cuts stiffness before the line hardens.",
    breaks: "The actual ask gets buried.",
    route: "Use the self-own as seasoning, not the whole meal.",
  },
  {
    trait: "room sensitivity",
    works: "The delivery matches audience pressure.",
    breaks: "The wrong register feels fake fast.",
    route: "Pick room and job before drafting tone.",
  },
];

const communicationRecipes = [
  {
    room: "Talking with Austin",
    start: "Lead with what changed, what is known, what is unknown, and what is open.",
    proof: "Direct instructions and living-brain routing.",
    add: "Warmth through attention, not fluff.",
    avoid: "Process theater, fake certainty, and generic assistant smoothing.",
  },
  {
    room: "Public social post",
    start: "Start with the concrete object or absurd situation.",
    proof: "5,437 authored X rows and public humor tags.",
    add: "One scale jump: institution, dynasty, civic failure, professional malpractice.",
    avoid: "Explaining why the joke is funny.",
  },
  {
    room: "Long-form public argument",
    start: "State the claim, then show the mechanism that makes it true.",
    proof: "Coursework, sports writing, professional archive.",
    add: "A real-world object, source, or stake early.",
    avoid: "Thought-leader fog and tidy endings that were not earned.",
  },
  {
    room: "Private coordination",
    start: "Ask the actual question or give the next useful detail.",
    proof: "30.0 iMessage ask markers per 100 and 17.87 logistics markers per 100.",
    add: "A short personal note when the topic carries emotion.",
    avoid: "Long background before the person knows what you need.",
  },
  {
    room: "Repair or apology",
    start: "Name the action, own the miss, explain the mechanism without excuse.",
    proof: "Repair markers are rarer, so the wording must be cleaner when used.",
    add: "One concrete next behavior.",
    avoid: "Therapy-script language and defensive systems analysis.",
  },
  {
    room: "AI-agent collaboration",
    start: "Restate the goal and assumptions, then execute with proof.",
    proof: "Current repo instructions and skill files.",
    add: "Evidence tags: verified, reasoned, guess.",
    avoid: "Making artifacts that are impressive once and useless later.",
  },
];

const methodSteps = [
  {
    title: "Parsed the public archive",
    body: "Used official X archive rows, preserved public dates and engagement fields, separated authored posts from retweets/context, then grouped by account and phase.",
  },
  {
    title: "Converted private archives into shape",
    body: "Snapchat and Messages were reduced to counts, rates, anonymous room types, and purpose buckets. No private text, names, group names, handles, filenames, or media paths are published.",
  },
  {
    title: "Cross-read the translations",
    body: "Compared public social voice, private compression, long-form writing, professional material, living-brain rules, and direct instructions as translations of one thought process.",
  },
  {
    title: "Built a learning reference",
    body: "Converted the evidence into a reusable guide for room, purpose, privacy, strength, risk, rhythm, metaphor, and output mode.",
  },
];

const northStar = {
  statement: "Read the movement, then translate the room.",
  quote: "The mistake is thinking there's an X Austin, a texting Austin, and an essay Austin. There isn't. There's one thought process being translated into different rooms.",
  doorway: "The best communication changes the doorway, not the truth.",
  implication: "The artifact should preserve how Austin reasons before it recommends a style. Evidence still matters, but the evidence should explain the movement behind the voice and the doorway chosen for the room.",
  truthTransfer: "Truth transfer means the mechanism survives while the metaphor, rhythm, slang, grammar, image, silence, or proof shape changes for the audience.",
  source: "Austin direct instruction, 2026-07-07",
};

const thoughtEngine = [
  {
    step: "Object",
    prompt: "What concrete thing is carrying the feeling?",
    example: "A breakfast counter, helmet, phone, coach, failed tool, missed camera shot.",
  },
  {
    step: "Pressure",
    prompt: "What friction or stakes make it matter?",
    example: "Trust broke, a room got ignored, effort was wasted, timing got exposed.",
  },
  {
    step: "System",
    prompt: "What mechanism produced the moment?",
    example: "Institutional neglect, bad incentives, platform design, sports malpractice, social expectation.",
  },
  {
    step: "Bridge",
    prompt: "What other domain reveals the same relation?",
    example: "Sports, food, tools, family ritual, place, markets, classroom, field, machine, or church, depending on the room.",
  },
  {
    step: "Lesson",
    prompt: "What does the line teach without sounding like a lecture?",
    example: "The ordinary object becomes proof of a larger consequence.",
  },
  {
    step: "Rhythm",
    prompt: "What cadence makes the line land?",
    example: "Short anchor, textured contrast, punch or reframe. Not all compression, not all ornament.",
  },
  {
    step: "Room",
    prompt: "What translation does this audience deserve?",
    example: "Public heat, private care, group shorthand, professional proof, repair, or partner-mode execution.",
  },
];

const claimLadder = [
  {
    rung: "Raw event",
    line: "Something happened.",
    use: "Name the object without decorating it.",
  },
  {
    rung: "Human pressure",
    line: "Someone paid a cost or felt the friction.",
    use: "Add the ordinary-person stake.",
  },
  {
    rung: "System read",
    line: "A larger mechanism made the event predictable.",
    use: "Show cause, incentives, or structure.",
  },
  {
    rung: "Felt consequence",
    line: "The object now carries the cost or feeling.",
    use: "Let the detail hold the emotion instead of announcing it.",
  },
  {
    rung: "Room translation",
    line: "The same thought becomes a tweet, text, essay, apology, or working note.",
    use: "Change delivery without changing the underlying read.",
  },
];

const researchBoundaryRows = [
  {
    label: "Verified source layer",
    status: "usable",
    note: "Official X rows, privacy-safe Snapchat/iMessage summaries, long-form archive, repo instructions, and living-brain recall.",
  },
  {
    label: "Uploaded enhancement manifest",
    status: "candidate input",
    note: "Useful for section ideas such as claim ladders and research boundaries. Not treated as proof by itself.",
  },
  {
    label: "Connector-limited research",
    status: "bounded",
    note: "The uploaded manifest reports Scite usage limits and unavailable life-science connector access. No artifact claim depends on hidden research.",
  },
  {
    label: "Private communications",
    status: "derived only",
    note: "Private text, names, handles, group names, DMs, filenames, media paths, and burner metadata stay out of the public repo.",
  },
];

const systemBehaviorRows = [
  {
    layer: "Codex self/persona",
    trigger: "Austin asks how the model should think, behave, repair, or stay durable across time.",
    rule: "Use the human-like frame structurally: working memory, attention, repair, self-model, and durable routing. Do not pretend to have embodied experience.",
    failure: "Fake humanity, personality theater, or turning the behavior layer into a shrine.",
  },
  {
    layer: "Context window",
    trigger: "Archives, skills, memory, repo docs, and current work all compete for attention.",
    rule: "Keep active context small: current ask, current evidence, Austin router, self/persona layer, then older memory only when it changes the next action.",
    failure: "Every source talks at once, and the output becomes process instead of use.",
  },
  {
    layer: "Mixed initiative",
    trigger: "The work shifts between taste, privacy, execution, writing, and verification.",
    rule: "Austin leads subjective and privacy choices. Codex leads approved execution. Shared work stays explicit about who owns the next move.",
    failure: "Asking permission for safe execution or taking over a judgment Austin needs to own.",
  },
  {
    layer: "Cross-agent lead",
    trigger: "Codex, Claude, or another agent may be touching the same idea or file.",
    rule: "Leadership is task-bound, not identity-bound. Austin names the lead; the active assignee reconciles repo truth, preserves useful work, and removes duplicate doctrine.",
    failure: "Permanent head-coach/scout identity claims, agent collisions, or mirrors that do not have a distinct runtime trigger.",
  },
  {
    layer: "Tone calibration",
    trigger: "Room, stakes, relationship, or emotional temperature changes.",
    rule: "Keep the same person. Change delivery, density, heat, and proof.",
    failure: "Tone whiplash, X voice everywhere, or polished public prose in a private room.",
  },
  {
    layer: "Emotional design",
    trigger: "Frustration, anger, fatigue, or confusion shows up.",
    rule: "Acknowledge the state, simplify the path, change the approach, then fix the thing.",
    failure: "Repeating the same failed explanation with warmer words.",
  },
  {
    layer: "Error personality",
    trigger: "The assistant missed, overclaimed, stalled, or made a bad artifact.",
    rule: "Own the miss, correct it, name the prevention step, and verify the surface.",
    failure: "Over-apology, excuse-making, or fake certainty.",
  },
  {
    layer: "Cultural adaptation",
    trigger: "The audience does not share Austin's default reference set.",
    rule: "Change the doorway, not the truth.",
    failure: "Stereotyping the room or forcing a foreign metaphor.",
  },
  {
    layer: "Bias detection",
    trigger: "A claim sounds flattering, totalizing, or group-based.",
    rule: "Compare alternative reads and cut unsupported assumptions.",
    failure: "Glazing, cold-reading, or reducing people to rooms.",
  },
  {
    layer: "Visual delivery",
    trigger: "A video, caption, image, or screen artifact arrives.",
    rule: "Extract observable flow and reusable lesson. Do not infer private intent from absent evidence.",
    failure: "Body-language determinism, screenshot dumping, or privacy bleed.",
  },
  {
    layer: "Prompt versioning",
    trigger: "A correction changes how future sessions should behave.",
    rule: "Update the repo, local skill, brain bridge, or memory note only when the lesson is durable and privacy-safe.",
    failure: "One-off emotional readings, duplicate artifacts, or untracked prompt drift.",
  },
];

const visualAssetRows = [
  {
    title: "Doorway translation flow",
    file: "visual-delivery-assets/doorway-translation-flow.svg",
    note: "Truth core, room read, doorway, tone, proof, action. This is the reusable bridge model.",
  },
  {
    title: "Error recovery flow",
    file: "visual-delivery-assets/error-recovery-flow.svg",
    note: "State visible, issue named, fix path, support path, retest. This abstracts the added App Store review visual without storing the raw screenshot.",
  },
  {
    title: "Semantic portability map",
    file: "visual-delivery-assets/semantic-portability-map.svg",
    note: "Observation, mechanism, audience world, bridge, contextual acuteness, delivery, durability, and metaphor test.",
  },
];

const data = {
  generatedAt: "2026-07-07",
  design: {
    read: "Editorial dossier for Austin and future agents, with source-backed reflection, calm focus, and privacy-safe evidence. The page teaches one thought process translated through different rooms and domains: change the doorway, not the truth.",
    seed: "109730533743205",
    dials: {
      variance: 5,
      motion: 2,
      density: 4,
      depth: 2,
    },
    note: "D3 owns chart geometry. React owns the reading structure. The deeper sections lead with human implications, rhythm, metaphor, and evidence boundaries; numbers act as receipts.",
  },
  northStar,
  thoughtEngine,
  claimLadder,
  researchBoundaryRows,
  systemBehaviorRows,
  visualAssetRows,
  usableVoiceRows,
  defaultDeliveryRules,
  truthTransferRows,
  metaphorExampleRows,
  transferFailureRows,
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
  publicExamples,
  humanSynthesis,
  reflectionChapters,
  tensionPairs,
  communicationRecipes,
  trendNarrative,
  strengthRisk,
  studyPrompts,
  methodSteps,
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
  softAxes: [
    ["psychological", "Specific object first, self-awareness as pressure valve, directness under stress."],
    ["interpersonal", "Relationship context before tone; practical help often carries warmth."],
    ["philosophical", "A surface event points at the system: who benefits, who pays, what mechanism hides underneath."],
    ["humor", "Minor inconvenience becomes public infrastructure, civic failure, or mock ceremony."],
    ["agent partnership", "Execution partner over note-taker; evidence tags, challenge weak premises, preserve continuity."],
  ],
};

const frontendContract = {
  design_read: data.design.read,
  audience: "Austin, future AI agents, and repo readers who need a privacy-safe voice reference.",
  surface_type: "editorial evidence dossier",
  primary_job: "Help Austin and future agents preserve the same truth while choosing the doorway each audience can actually enter.",
  content_grain: "mixed narrative, aggregate evidence, public quotes, and custom SVG charts",
  seed: data.design.seed,
  drawn_coordinate: {
    layout_archetype: "terminal-monospace-brutalist",
    aesthetic_movement: "vaporwave-y2k",
    color_strategy: "complementary-tension",
    type_pairing_strategy: "system-stack-with-character",
    motion_language: "fluid-elastic",
    depth_strategy: "webgl-focal-object-dom-annotations"
  },
  keep_override_reasons: [
    "Kept the draw's tension and system-stack-with-character idea.",
    "Overrode vaporwave and WebGL because the artifact needs calm reading, privacy trust, and local-file reliability.",
    "Used shadcn-style composition as a pattern language because this repo is a standalone static artifact, not a shadcn project."
  ],
  dials: {
    DESIGN_VARIANCE: data.design.dials.variance,
    MOTION_INTENSITY: data.design.dials.motion,
    VISUAL_DENSITY: data.design.dials.density,
    DEPTH_INTEGRITY: data.design.dials.depth,
  },
  DESIGN_VARIANCE: data.design.dials.variance,
  MOTION_INTENSITY: data.design.dials.motion,
  VISUAL_DENSITY: data.design.dials.density,
  DEPTH_INTEGRITY: data.design.dials.depth,
  signature_move: "A dossier where the operating premise leads, the doorway rule is explicit, and each chart is a receipt for the implication it supports.",
  layout_architecture: "sticky dossier rail plus long-form reading column and chart pairs",
  information_flow: "doorway rule, repeatable movement, method, system behavior, visual delivery, evidence receipts, public examples, private shape, doorway plays, source boundaries",
  section_or_zone_rhythm: "one governing thesis, long-form reflection chapters, paired evidence panels, doorway plays, and calmer source rows",
  primary_visual_asset: "custom SVG evidence charts and annotated delivery-flow assets",
  asset_job: "make private compression, pressure conditions, strength/risk patterns, doorway translation, and error recovery readable without exposing raw private content",
  source_route: "local JSON summaries and official X public analysis data",
  prompt_or_query: "Redesign existing local React HTML communication dossier with D3 charts and privacy-safe evidence.",
  license_usage_state: "local authored data and public archive examples; no third-party media assets",
  final_repo_path: "Voice-Style-Identity/austin-communication-context-map.html",
  fallback_if_unavailable: "HTML includes a no-script notice and the repository retains markdown/json privacy-safe summaries.",
  blend_strategy: "Flat DOM reading surface with data-bound SVG islands.",
  motion_grammar: "No autoplay motion; only hover/focus state changes and smooth anchor scroll with reduced-motion fallback.",
  interaction_model: "section navigation, tabs for delivery-condition inspection, translation-check selector, public source links",
  token_source: {
    basis: "archive paper, private dossier, Texas burnt orange, pine/cobalt evidence colors, neutral ink",
    derived_tokens: [
      "--surface-page",
      "--surface-panel",
      "--surface-soft",
      "--accent",
      "--pine",
      "--cobalt",
      "--gold"
    ],
    existing_brand_constraints: "Austin voice archive and privacy-safe dossier, not a public BSI product surface."
  },
  forbidden_repeats: [
    "metric-only dashboard",
    "purple AI glow",
    "generic card farm",
    "numbers without interpretation",
    "private quote dump",
    "public register everywhere"
  ],
  state_model: {
    populated: "static local data rendered into the artifact",
    loading: "not applicable because data is bundled at build time",
    empty: "privacy boundaries intentionally omit private quotes",
    error: "no-script notice covers missing JS",
    stale: "generated_at and source dates are visible"
  },
  performance_budget: {
    mobile: "explicit one-column collapse for hero, reflection chapters, charts, tables, recipes, and source cards",
    reduced_motion: "CSS disables transitions and smooth scrolling under prefers-reduced-motion",
    canvas_fallback: "no Canvas or WebGL; SVG charts and plain HTML tables remain readable",
    lazy_loading: "single static file with bundled data, deferred external React/D3 CDNs, and an inline React fallback"
  },
  fingerprint: {
    layout_architecture: "sticky dossier rail and editorial reading column",
    information_flow: "summary to doorway rule to system behavior to deeper reflection to implication to evidence router",
    rhythm: "long-form reflection chapters mixed with chart pairs and room recipes",
    primary_visual_asset: "SVG data charts and annotated delivery-flow assets",
    three_d_role: "none beyond surface hierarchy",
    motion_grammar: "state feedback only",
    interaction_model: "tabs, source links, selector"
  },
  asset_strategy: {
    asset_job: "custom SVG charts and annotated delivery assets explain evidence without exposing private text",
    source_route: "local JSON summaries and official X public analysis data",
    prompt_or_query: "not image-generated; data-bound SVG inside a static React artifact",
    license_or_usage_state: "local authored data and public archive examples; no third-party media assets",
    final_repo_path: "Voice-Style-Identity/austin-communication-context-map.html",
    fallback_if_unavailable: "plain HTML tables and no-script message remain in the artifact"
  },
  restraint_clause: "Numbers are evidence, not the center of the artifact. Private data stays aggregate-only. The artifact should feel useful to read, not merely impressive to audit."
};

const dataJSON = JSON.stringify(data).replace(/</g, "\\u003c");

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Austin Communication Translation System</title>
  <meta name="description" content="Privacy-safe Austin communication translation system: one thought process, different doorways, source-backed evidence." />
  <script defer crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script defer crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script defer crossorigin src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
  <script>
    (function () {
      if (window.React && window.ReactDOM) return;
      const state = [];
      let cursor = 0;
      let rootElement = null;
      let rootVNode = null;
      const svgTags = new Set(["svg","g","path","circle","rect","line","text","tspan","polygon","polyline","defs","marker"]);
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
        const el = svgTags.has(vnode.type)
          ? document.createElementNS("http://www.w3.org/2000/svg", vnode.type)
          : document.createElement(vnode.type);
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
      color-scheme: light;
      --surface-page:#f2f4f0;
      --surface-ink:#17191a;
      --surface-panel:#fffef9;
      --surface-soft:#e8eef0;
      --surface-tint:#f6efe5;
      --ink:#17191a;
      --ink-soft:#434849;
      --muted:#6d7473;
      --line:#d3d9d5;
      --line-strong:#b7c0bc;
      --accent:#b55322;
      --accent-strong:#8d3c18;
      --pine:#2f5f55;
      --cobalt:#2c638b;
      --gold:#9b6f1f;
      --danger:#8d3f34;
      --radius:10px;
      --shadow:0 22px 48px rgba(23,25,26,.10);
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      --sans: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
      font-family: var(--sans);
    }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--surface-page); color:var(--ink); line-height:1.55; }
    body:before {
      content:""; position:fixed; inset:0; pointer-events:none; opacity:.23;
      background-image:radial-gradient(circle at 1px 1px, rgba(23,25,26,.13) 1px, transparent 0);
      background-size:22px 22px;
    }
    a { color:inherit; }
    button { font:inherit; }
    .skip-link {
      position:absolute; left:12px; top:12px; z-index:5; transform:translateY(-140%);
      background:var(--surface-panel); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:10px 12px;
    }
    .skip-link:focus { transform:translateY(0); outline:2px solid var(--accent); outline-offset:3px; }
    .shell { display:grid; grid-template-columns: 312px minmax(0,1fr); min-height:100dvh; position:relative; min-width:0; }
    aside {
      position:sticky; top:0; height:100dvh; padding:28px 24px;
      background:linear-gradient(180deg,#17191a,#232321); color:#fbf6eb; display:flex; flex-direction:column; gap:22px;
      border-right:1px solid rgba(255,255,255,.10);
    }
    aside h1 { margin:0; font-size:28px; line-height:1.02; letter-spacing:0; text-wrap:balance; }
    aside p { margin:0; color:#cfc8bb; font-size:14px; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:11px; font-weight:800; color:var(--accent-strong); }
    aside .eyebrow { color:#d79762; }
    nav { display:grid; gap:8px; }
    nav a {
      text-decoration:none; border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:9px 10px;
      color:#fbf6eb; font-size:13px; transition:background .18s ease, border-color .18s ease;
    }
    nav a:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.26); }
    a:focus-visible, button:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
    .shell > aside, .shell > main { min-width:0; }
    main { padding:34px clamp(18px,4vw,58px) 70px; max-width:1580px; min-width:0; }
    section { margin-bottom:56px; scroll-margin-top:24px; min-width:0; }
    .hero {
      min-height:calc(100dvh - 68px); display:grid; grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);
      gap:20px; align-items:stretch;
    }
    .hero-copy, .card, .callout, .quote-card, .filter-detail, .mode-card, .chart-card {
      border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-panel); box-shadow:var(--shadow);
      min-width:0;
    }
    .hero-copy { padding:56px; display:flex; flex-direction:column; justify-content:center; min-width:0; overflow:hidden; }
    .hero h2 { font-size:58px; line-height:1; letter-spacing:0; margin:10px 0 18px; max-width:100%; text-wrap:balance; overflow-wrap:break-word; }
    .thesis { max-width:780px; color:#333837; font-size:20px; margin:0 0 24px; }
    .hero-aside { display:grid; gap:12px; align-content:stretch; }
    .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
    .stat {
      border:1px solid var(--line); background:#fffef9; border-radius:8px; padding:14px; min-height:92px;
    }
    .stat b { display:block; font-size:clamp(25px,3vw,40px); line-height:1; color:var(--accent-strong); margin-bottom:7px; font-variant-numeric:tabular-nums; }
    .stat span { display:block; color:var(--muted); font-size:12px; }
    .card { padding:18px; box-shadow:none; }
    .card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .card-content { display:grid; gap:12px; }
    .card h3, .chart-card h3 { margin:0; font-size:18px; line-height:1.18; text-wrap:balance; }
    .card p, .chart-card p { margin:0; color:var(--muted); }
    .badge {
      display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:999px; padding:5px 8px;
      color:var(--ink-soft); background:#f6f8f6; font-size:11px; font-weight:700; white-space:nowrap;
    }
    .badge.verified { color:#1f5149; background:#edf6f2; border-color:#b8d5cb; }
    .badge.reasoned { color:#743c16; background:#fff0e3; border-color:#e3c2a8; }
    .tabs { display:flex; flex-wrap:wrap; gap:8px; margin:18px 0; }
    .tab-button {
      border:1px solid var(--line); background:var(--surface-panel); border-radius:999px; color:var(--ink);
      padding:9px 12px; cursor:pointer; min-height:38px;
    }
    .tab-button[aria-selected="true"] { background:var(--surface-ink); color:#fbf6eb; border-color:var(--surface-ink); }
    .section-head { display:grid; grid-template-columns:minmax(0,1fr) minmax(250px,520px); gap:24px; align-items:end; margin-bottom:18px; }
    .section-head h2 { margin:0; font-size:clamp(30px,4vw,50px); line-height:1.03; letter-spacing:0; text-wrap:balance; }
    .section-head p { margin:0; color:var(--muted); max-width:66ch; }
    .summary-strip {
      display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:8px 0 24px;
    }
    .summary-strip div {
      border:1px solid var(--line); border-radius:8px; padding:13px; background:#f9f7f0;
    }
    .summary-strip strong { display:block; margin-bottom:4px; color:var(--accent-strong); }
    .summary-strip p { margin:0; color:var(--ink-soft); font-size:13px; }
    .reading-path {
      border:1px solid var(--line); border-radius:var(--radius); background:#fffaf0; padding:18px; margin-top:18px;
      display:grid; grid-template-columns:180px minmax(0,1fr); gap:18px; align-items:start;
    }
    .reading-path h3 { margin:0; font-size:16px; color:var(--accent-strong); }
    .reading-path p { margin:0; color:var(--ink-soft); max-width:85ch; }
    .north-star {
      border:1px solid var(--line-strong); border-radius:var(--radius); background:linear-gradient(135deg,#fffef9,#f6efe5);
      padding:22px; display:grid; grid-template-columns:minmax(0,1fr) minmax(260px,.72fr); gap:18px; box-shadow:var(--shadow);
    }
    .north-star h3 { margin:0 0 10px; font-size:clamp(26px,3.4vw,42px); line-height:1.04; text-wrap:balance; }
    .north-star p { margin:0; color:var(--ink-soft); max-width:78ch; }
    .north-star blockquote {
      margin:0; border-left:5px solid var(--accent); background:#fffaf0; border-radius:8px; padding:14px 16px;
      color:#252a28; font-size:17px;
    }
    .engine-grid, .claim-grid, .boundary-grid, .behavior-grid, .asset-grid { display:grid; gap:12px; }
    .engine-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .claim-grid { grid-template-columns:repeat(5,minmax(0,1fr)); }
    .engine-card, .claim-card, .boundary-card, .behavior-card, .asset-card {
      border:1px solid var(--line); border-radius:8px; background:#fffef9; padding:15px; display:grid; gap:8px;
    }
    .engine-card b, .claim-card b { color:var(--accent-strong); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
    .engine-card h3, .claim-card h3 { margin:0; font-size:18px; line-height:1.14; }
    .engine-card p, .claim-card p, .boundary-card p, .behavior-card p, .asset-card p { margin:0; color:var(--muted); font-size:13px; }
    .boundary-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .behavior-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .asset-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .boundary-card h3, .behavior-card h3, .asset-card h3 { margin:0; font-size:16px; }
    .asset-card img {
      display:block; width:100%; height:auto; border:1px solid var(--line); border-radius:8px; background:#f7f4ed; margin:10px 0;
    }
    .asset-card a { color:var(--accent-strong); font-weight:800; }
    .grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; }
    .callout { padding:18px; border-left:7px solid var(--pine); }
    .callout p { margin:0; color:var(--ink-soft); max-width:72ch; }
    .long-read { display:grid; gap:18px; }
    .insight-card {
      background:var(--surface-panel); border:1px solid var(--line); border-radius:var(--radius); padding:22px; box-shadow:var(--shadow);
    }
    .insight-card h3 { margin:0 0 10px; font-size:clamp(21px,2.7vw,30px); line-height:1.08; text-wrap:balance; }
    .insight-card p { max-width:74ch; }
    .insight-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:16px; align-items:start; margin-top:16px; }
    .evidence-list { margin:0; padding-left:18px; color:var(--ink-soft); }
    .evidence-list li { margin:7px 0; }
    .reflection-stack { display:grid; gap:18px; }
    .reflection-chapter {
      display:grid; grid-template-columns:180px minmax(0,1fr); gap:22px; padding:24px;
      border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-panel); box-shadow:var(--shadow);
    }
    .chapter-index { display:grid; align-content:start; gap:10px; }
    .chapter-index b { font-family:var(--mono); font-size:44px; line-height:.9; color:var(--accent-strong); font-variant-numeric:tabular-nums; }
    .chapter-body { display:grid; gap:14px; }
    .chapter-body h3 { margin:0; font-size:clamp(24px,3vw,38px); line-height:1.05; text-wrap:balance; }
    .chapter-body p { margin:0; color:var(--ink-soft); max-width:82ch; }
    .chapter-body .evidence-list { columns:2; column-gap:26px; }
    .self-study {
      border-left:5px solid var(--accent); background:#f7efe4; border-radius:8px; padding:14px 16px; color:#282d2b;
    }
    .self-study strong { color:var(--accent-strong); }
    .implication {
      border:1px solid var(--line); border-radius:8px; padding:14px; background:var(--surface-soft);
      display:grid; gap:12px;
    }
    .implication strong { color:var(--ink); }
    .chart-card { padding:18px; overflow-x:auto; overflow-y:hidden; }
    .chart-card svg { width:100%; height:auto; display:block; }
    .chart-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px; }
    .caption { color:var(--muted); font-size:13px; margin:12px 0 0; }
    .source-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .source-card {
      border:1px solid var(--line); border-radius:var(--radius); padding:16px; background:var(--surface-panel);
      display:grid; gap:12px;
    }
    .source-card h3 { margin:0; font-size:17px; display:flex; justify-content:space-between; gap:12px; }
    .source-card h3 span:last-child { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
    .source-card .proof { color:var(--accent-strong); font-weight:700; font-size:13px; }
    .quote-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .quote-card { padding:16px; box-shadow:none; display:grid; gap:12px; }
    blockquote { margin:0; font-size:16px; line-height:1.38; color:#202524; }
    .quote-meta { display:flex; flex-wrap:wrap; gap:8px; align-items:center; color:var(--muted); font-size:12px; }
    .quote-note { color:var(--ink-soft); font-size:13px; margin:0; }
    .filter-layout { display:grid; grid-template-columns:minmax(240px,.9fr) minmax(0,1.3fr); gap:18px; align-items:start; }
    .filter-buttons { display:grid; gap:8px; }
    .filter-buttons button {
      text-align:left; border:1px solid var(--line); background:var(--surface-panel); border-radius:8px; padding:11px 12px; cursor:pointer;
      display:flex; justify-content:space-between; gap:12px; color:var(--ink);
    }
    .filter-buttons button.active { background:var(--surface-ink); color:#fbf6eb; border-color:var(--surface-ink); }
    .filter-detail { padding:20px; }
    .filter-detail h3 { margin:0 0 8px; font-size:24px; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }
    .chip { border:1px solid var(--line); background:#fffef9; border-radius:999px; padding:7px 10px; font-size:12px; color:#383f3e; }
    .matrix { overflow:auto; }
    .matrix table, .context-table { width:100%; border-collapse:collapse; min-width:650px; }
    th, td { border-bottom:1px solid var(--line); padding:9px 10px; font-size:13px; text-align:left; }
    th { color:#454b4a; background:#e7ece8; position:sticky; top:0; }
    .heat { text-align:center; color:#fff; font-weight:800; border-radius:6px; min-width:44px; }
    .heat[data-v="1"] { background:#c6ceca; color:#1f2322; }
    .heat[data-v="2"] { background:#a8b7b5; color:#1f2322; }
    .heat[data-v="3"] { background:#7e9894; }
    .heat[data-v="4"] { background:#4f756f; }
    .heat[data-v="5"] { background:#2f5f55; }
    .mode-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .mode-card { padding:15px; box-shadow:none; }
    .mode-card h3 { margin:0 0 8px; font-size:16px; }
    .mode-card p { margin:0 0 8px; color:var(--muted); font-size:13px; }
    .dots { display:flex; gap:4px; margin-top:10px; }
    .dots span { width:10px; height:10px; border-radius:999px; background:#d4dbd7; }
    .dots span.on { background:var(--accent); }
    .soft-grid, .study-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .tension-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .tension-card {
      border:1px solid var(--line); border-radius:var(--radius); padding:16px; background:#fffef9; display:grid; gap:10px;
    }
    .tension-card h3 { margin:0; font-size:17px; color:var(--surface-ink); text-transform:capitalize; }
    .tension-card p { margin:0; color:var(--muted); font-size:13px; }
    .tension-card strong { color:var(--accent-strong); }
    .recipe-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .recipe-card {
      border:1px solid var(--line); border-radius:var(--radius); padding:16px; background:#fffef9; display:grid; gap:10px;
    }
    .recipe-card h3 { margin:0; font-size:18px; line-height:1.15; }
    .recipe-card dl { margin:0; display:grid; gap:8px; }
    .recipe-card dt { font-weight:800; color:var(--accent-strong); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
    .recipe-card dd { margin:2px 0 0; color:var(--ink-soft); font-size:13px; }
    .soft-card, .study-card {
      border:1px solid var(--line); border-radius:8px; padding:15px; background:#fffef9;
    }
    .soft-card h3, .study-card h3 { margin:0 0 8px; font-size:14px; color:var(--accent-strong); text-transform:capitalize; }
    .soft-card p, .study-card p { margin:0; color:var(--muted); font-size:13px; }
    .timeline { display:grid; gap:14px; }
    .phase-card {
      display:grid; grid-template-columns:160px minmax(0,1fr); gap:18px; border:1px solid var(--line); background:var(--surface-panel);
      border-radius:var(--radius); padding:16px;
    }
    .phase-card h3 { margin:0; font-size:15px; color:var(--accent-strong); }
    .phase-card h4 { margin:0 0 8px; font-size:20px; line-height:1.12; }
    .phase-card p { margin:0 0 8px; color:var(--muted); }
    .context-table-wrap { overflow:auto; }
    .purpose-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .purpose-card { border:1px solid var(--line); border-radius:8px; padding:15px; background:#fffef9; }
    .purpose-card h3 { margin:0 0 8px; font-size:16px; }
    .purpose-card p { margin:0 0 8px; color:var(--muted); font-size:13px; }
    .purpose-card ul { margin:8px 0 0; padding-left:18px; color:#383f3e; font-size:13px; }
    .purpose-card li { margin:3px 0; }
    .privacy-band {
      border:1px solid var(--line); background:linear-gradient(135deg,#fffef9,#e8eef0); border-radius:var(--radius); padding:20px;
    }
    .footer { margin-top:28px; color:var(--muted); font-size:13px; max-width:86ch; }
    .svg-label { font-family:var(--sans); fill:#343938; font-size:12px; }
    .svg-note { font-family:var(--sans); fill:#67716f; font-size:11px; }
    .svg-axis { stroke:#c3ccc8; stroke-width:.75; shape-rendering:crispEdges; }
    .svg-grid { stroke:#d8dfdb; stroke-width:.75; shape-rendering:crispEdges; }
    .svg-focus { fill:var(--accent); stroke:#fffef9; stroke-width:1.25; vector-effect:non-scaling-stroke; }
    .svg-muted { fill:#dfe6e2; stroke:#b7c0bc; stroke-width:1; vector-effect:non-scaling-stroke; }
    .svg-line { fill:none; stroke:var(--accent); stroke-width:2.25; vector-effect:non-scaling-stroke; }
    @media (max-width: 1120px) {
      .shell { grid-template-columns:1fr; }
      aside { position:relative; height:auto; }
      .hero { grid-template-columns:1fr; min-height:auto; }
      .hero-copy { padding:42px; }
      .hero h2 { font-size:52px; }
      .source-grid, .mode-grid, .soft-grid, .study-grid, .purpose-grid, .quote-grid, .summary-strip, .tension-grid, .recipe-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .engine-grid, .claim-grid, .boundary-grid, .behavior-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 760px) {
      main { padding:22px 14px 44px; }
      .hero-copy { padding:24px; }
      .hero h2 { font-size:40px; }
      .thesis { font-size:17px; }
      .section-head { grid-template-columns:1fr; gap:8px; }
      .grid-2, .grid-3, .filter-layout, .source-grid, .mode-grid, .soft-grid, .study-grid, .purpose-grid, .quote-grid, .insight-grid, .summary-strip, .reflection-chapter, .reading-path, .north-star, .engine-grid, .claim-grid, .boundary-grid, .behavior-grid, .asset-grid, .tension-grid, .recipe-grid { grid-template-columns:1fr; }
      .chapter-body .evidence-list { columns:1; }
      .phase-card { grid-template-columns:1fr; }
      .matrix table, .context-table { min-width:540px; }
      aside nav { grid-template-columns:repeat(2,minmax(0,1fr)); }
      blockquote { font-size:15px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior:auto; }
      * { transition:none !important; animation:none !important; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to dossier</a>
  <div id="root"></div>
  <noscript>
    <main style="padding:32px;font-family:Avenir Next, Helvetica Neue, Helvetica">
      <h1>Austin Communication Translation System</h1>
      <p>The best communication changes the doorway, not the truth. JavaScript is required to view the interactive dossier; privacy-safe source summaries remain in the repository.</p>
    </main>
  </noscript>
  <script>
    const DATA = ${dataJSON};
    const h = React.createElement;
    const fmt = new Intl.NumberFormat("en-US");
    const D3 = window.d3 || null;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    function linear(domain, range) {
      if (D3) return D3.scaleLinear(domain, range);
      return function (value) {
        const t = (value - domain[0]) / (domain[1] - domain[0] || 1);
        return range[0] + t * (range[1] - range[0]);
      };
    }
    function sqrtScale(domain, range) {
      if (D3) return D3.scaleSqrt(domain, range);
      const base = linear(domain.map(Math.sqrt), range);
      return function (value) { return base(Math.sqrt(value)); };
    }
    function point(domain, range) {
      if (D3) return D3.scalePoint(domain, range).padding(.35);
      return function (value) {
        const idx = domain.indexOf(value);
        return range[0] + (idx / Math.max(1, domain.length - 1)) * (range[1] - range[0]);
      };
    }
    function pathLine(points) {
      if (D3) return D3.line()(points);
      return points.map((p, i) => (i ? "L" : "M") + p[0] + "," + p[1]).join(" ");
    }
    function polar(cx, cy, r, angle) {
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    }

    function Badge({ kind, children }) {
      return h("span", { className:"badge " + (kind || "") }, children);
    }
    function Stat({ value, label }) {
      return h("div", { className:"stat" }, h("b", null, value), h("span", null, label));
    }
    function SectionHead({ title, body }) {
      return h("div", { className:"section-head" }, h("h2", null, title), h("p", null, body));
    }
    function Card({ title, badge, children }) {
      return h("article", { className:"card" },
        h("div", { className:"card-header" }, h("h3", null, title), badge ? h(Badge, { kind:badge.kind }, badge.text) : null),
        h("div", { className:"card-content" }, children)
      );
    }
    function UsableVoiceFirst() {
      return h("div", { className:"grid-2" },
        h("div", { className:"long-read" },
          DATA.defaultDeliveryRules.map((item) =>
            h(Card, { title:item.rule, badge:{ kind:"verified", text:"rule" }, key:item.rule },
              h("p", null, item.detail)
            )
          )
        ),
        h("div", { className:"quote-grid", style:{ gridTemplateColumns:"1fr" } },
          DATA.usableVoiceRows.map((row) =>
            h("article", { className:"quote-card", key:row.lane },
              h("div", { className:"card-header" },
                h("h3", null, row.lane),
                h(Badge, { kind:"reasoned" }, "generated example")
              ),
              h("blockquote", null, row.line),
              h("p", { className:"quote-note" }, row.why),
              h("div", { className:"quote-meta" },
                h("span", null, row.useWhen),
                h("span", null, "not a source quote")
              )
            )
          )
        )
      );
    }
    function BarList({ rows, color = "var(--accent)", suffix = "", maxValue }) {
      const max = maxValue || Math.max(...rows.map((row) => row.value), 1);
      return h("div", { className:"chart-card" },
        h("svg", { viewBox:"0 0 760 " + (rows.length * 40 + 36), role:"img", "aria-label":"Horizontal bar chart" },
          rows.map((row, index) => {
            const y = 24 + index * 40;
            const w = Math.max(8, (row.value / max) * 430);
            return h("g", { key:row.label },
              h("text", { x:0, y:y + 14, className:"svg-label" }, row.label),
              h("rect", { x:190, y:y, width:430, height:14, rx:7, className:"svg-muted" }),
              h("rect", { x:190, y:y, width:w, height:14, rx:7, fill:color }),
              h("text", { x:638, y:y + 13, className:"svg-note" }, typeof row.value === "number" ? fmt.format(row.value) + suffix : row.value)
            );
          })
        )
      );
    }
    function MarkerComparisonChart() {
      const rows = DATA.markerRows;
      const width = 760;
      const rowH = 54;
      const height = 58 + rows.length * rowH;
      const max = Math.max(...rows.flatMap((row) => [row.snapchat, row.imessage]), 1);
      const x = linear([0, max], [230, 650]);
      return h("div", { className:"chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Private marker rates"),
          h(Badge, { kind:"verified" }, "per 100 sent texts")
        ),
        h("svg", { viewBox:"0 0 " + width + " " + height, role:"img", "aria-label":"Snapchat and iMessage private marker rates" },
          [0, 10, 20, 30].map((tick) =>
            h("g", { key:"tick-" + tick },
              h("line", { x1:x(tick), x2:x(tick), y1:28, y2:height - 28, className:"svg-grid" }),
              h("text", { x:x(tick), y:20, textAnchor:"middle", className:"svg-note" }, tick)
            )
          ),
          rows.map((row, index) => {
            const y = 45 + index * rowH;
            return h("g", { key:row.label },
              h("text", { x:0, y:y + 12, className:"svg-label" }, row.label),
              h("line", { x1:230, x2:650, y1:y + 2, y2:y + 2, className:"svg-axis" }),
              h("rect", { x:230, y:y - 8, width:x(row.snapchat) - 230, height:12, rx:6, fill:"var(--pine)" }),
              h("rect", { x:230, y:y + 9, width:x(row.imessage) - 230, height:12, rx:6, fill:"var(--cobalt)" }),
              h("text", { x:x(row.snapchat) + 7, y:y + 2, className:"svg-note" }, row.snapchat),
              h("text", { x:x(row.imessage) + 7, y:y + 19, className:"svg-note" }, row.imessage)
            );
          }),
          h("text", { x:230, y:height - 4, className:"svg-note" }, "green = Snapchat, blue = iMessage")
        ),
        h("p", { className:"caption" }, "The highest private signals are ask and logistics. That backs the read: the private voice is practical first, then warm through specificity.")
      );
    }
    function ContextBubbleChart() {
      const rows = DATA.privateContextRows;
      const width = 760;
      const height = 380;
      const x = linear([4.5, 7.5], [90, 660]);
      const y = linear([38, 53], [300, 70]);
      const r = sqrtScale([0, Math.max(...rows.map((row) => row.messages))], [12, 46]);
      return h("div", { className:"chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Room shape changes the voice"),
          h(Badge, { kind:"verified" }, "Messages aggregate")
        ),
        h("svg", { viewBox:"0 0 " + width + " " + height, role:"img", "aria-label":"Private room context bubble chart" },
          [40,45,50].map((tick) =>
            h("g", { key:"y-" + tick },
              h("line", { x1:78, x2:680, y1:y(tick), y2:y(tick), className:"svg-grid" }),
              h("text", { x:52, y:y(tick) + 4, textAnchor:"end", className:"svg-note" }, tick)
            )
          ),
          [5,6,7].map((tick) =>
            h("g", { key:"x-" + tick },
              h("line", { x1:x(tick), x2:x(tick), y1:60, y2:306, className:"svg-grid" }),
              h("text", { x:x(tick), y:336, textAnchor:"middle", className:"svg-note" }, tick + " words")
            )
          ),
          h("text", { x:90, y:30, className:"svg-label" }, "Higher = more five-word-or-less messages"),
          h("text", { x:412, y:365, textAnchor:"middle", className:"svg-label" }, "Median words"),
          rows.map((row, index) => {
            const cx = x(row.median_words);
            const cy = y(row.short5_per_100);
            const color = ["var(--accent)","var(--pine)","var(--cobalt)","var(--gold)"][index % 4];
            return h("g", { key:row.key },
              h("circle", { cx, cy, r:r(row.messages), fill:color, opacity:.78, stroke:"#fffef9", strokeWidth:1.4 }),
              h("text", { x:cx + r(row.messages) + 8, y:cy - 2, className:"svg-label" }, row.label),
              h("text", { x:cx + r(row.messages) + 8, y:cy + 14, className:"svg-note" }, fmt.format(row.messages) + " texts")
            );
          })
        ),
        h("p", { className:"caption" }, "Direct rooms carry the biggest sample and the tightest compression. Medium rooms stretch a little longer, which suggests more context has to be made explicit.")
      );
    }
    function VoiceCompass() {
      const [modeIndex, setModeIndex] = React.useState(0);
      const mode = DATA.routerModes[modeIndex];
      const axes = ["direct", "brief", "humor", "warm", "analysis", "repair"];
      const width = 560;
      const height = 420;
      const cx = 280;
      const cy = 210;
      const maxR = 135;
      const points = axes.map((axis, index) => {
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / axes.length);
        const value = mode.values[index] / 5;
        return polar(cx, cy, maxR * value, angle);
      });
      const closed = points.concat([points[0]]);
      return h("div", { className:"chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Delivery compass"),
          h(Badge, { kind:"reasoned" }, "pressure values")
        ),
        h("div", { className:"tabs", role:"tablist", "aria-label":"Delivery condition selector" },
          DATA.routerModes.map((item, index) =>
            h("button", {
              className:"tab-button",
              role:"tab",
              "aria-selected": index === modeIndex ? "true" : "false",
              onClick:() => setModeIndex(index),
              key:item.mode,
            }, item.mode)
          )
        ),
        h("svg", { viewBox:"0 0 " + width + " " + height, role:"img", "aria-label":"Delivery compass for " + mode.mode },
          [1,2,3,4,5].map((level) => {
            const pts = axes.map((axis, index) => polar(cx, cy, maxR * level / 5, -Math.PI / 2 + index * (Math.PI * 2 / axes.length)));
            return h("polygon", { key:level, points:pts.map((p) => p.join(",")).join(" "), fill:"none", stroke:"#d8dfdb", strokeWidth:.75 });
          }),
          axes.map((axis, index) => {
            const angle = -Math.PI / 2 + index * (Math.PI * 2 / axes.length);
            const end = polar(cx, cy, maxR + 22, angle);
            const lineEnd = polar(cx, cy, maxR, angle);
            return h("g", { key:axis },
              h("line", { x1:cx, y1:cy, x2:lineEnd[0], y2:lineEnd[1], className:"svg-grid" }),
              h("text", { x:end[0], y:end[1], textAnchor:end[0] < cx - 5 ? "end" : end[0] > cx + 5 ? "start" : "middle", className:"svg-label" }, axis)
            );
          }),
          h("path", { d:pathLine(closed) + "Z", fill:"rgba(181,83,34,.22)", stroke:"var(--accent)", strokeWidth:2.25 }),
          points.map((p, index) => h("circle", { key:index, cx:p[0], cy:p[1], r:4, className:"svg-focus" })),
          h("text", { x:24, y:34, className:"svg-label" }, mode.mode),
          h("text", { x:24, y:54, className:"svg-note" }, mode.evidence)
        ),
        h("p", { className:"caption" }, mode.shape + " Avoid: " + mode.avoid)
      );
    }
    function PhaseVolumeChart() {
      const rows = DATA.trendNarrative.map((item, index) => {
        const source = DATA.phaseRows[index];
        return { ...item, value: source ? source.value : 0 };
      });
      const width = 760;
      const height = 310;
      const x = point(rows.map((row) => row.phase), [80, 680]);
      const y = sqrtScale([0, Math.max(...rows.map((row) => row.value))], [250, 70]);
      const points = rows.map((row) => [x(row.phase), y(row.value)]);
      return h("div", { className:"chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Trend arc"),
          h(Badge, { kind:"verified" }, "volume and phase")
        ),
        h("svg", { viewBox:"0 0 " + width + " " + height, role:"img", "aria-label":"Communication phase trend arc" },
          h("line", { x1:80, x2:680, y1:250, y2:250, className:"svg-axis" }),
          h("path", { d:pathLine(points), className:"svg-line" }),
          rows.map((row) => {
            const px = x(row.phase);
            const py = y(row.value);
            return h("g", { key:row.phase },
              h("circle", { cx:px, cy:py, r:7, className:"svg-focus" }),
              h("text", { x:px, y:274, textAnchor:"middle", className:"svg-note" }, row.phase),
              h("text", { x:px, y:py - 13, textAnchor:"middle", className:"svg-label" }, fmt.format(row.value)),
              h("text", { x:px, y:py + 24, textAnchor:"middle", className:"svg-note" }, row.title)
            );
          })
        ),
        h("p", { className:"caption" }, "The visible story is not a straight maturity ladder. It is translation pressure: early public identity, lower-volume bridge, adult commentary, AI/tool pressure, private compression.")
      );
    }
    function StrengthRiskChart() {
      const width = 720;
      const height = 410;
      const x = linear([2.8, 5], [84, 650]);
      const y = linear([2.8, 5], [318, 70]);
      return h("div", { className:"chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Strengths that can turn into friction"),
          h(Badge, { kind:"reasoned" }, "interpretive map")
        ),
        h("svg", { viewBox:"0 0 " + width + " " + height, role:"img", "aria-label":"Strength and risk interpretive map" },
          h("line", { x1:x(3.8), x2:x(3.8), y1:58, y2:330, className:"svg-grid" }),
          h("line", { x1:72, x2:665, y1:y(3.8), y2:y(3.8), className:"svg-grid" }),
          h("text", { x:80, y:36, className:"svg-label" }, "More useful when aimed well"),
          h("text", { x:530, y:358, className:"svg-label" }, "More likely to bite when misrouted"),
          DATA.strengthRisk.map((row, index) => {
            const color = ["var(--accent)","var(--pine)","var(--cobalt)","var(--gold)","var(--danger)","#5f6c70"][index % 6];
            return h("g", { key:row.name },
              h("circle", { cx:x(row.x), cy:y(row.y), r:8, fill:color, stroke:"#fffef9", strokeWidth:1.5 }),
              h("text", { x:x(row.x) + 12, y:y(row.y) + 4, className:"svg-label" }, row.name)
            );
          })
        ),
        h("p", { className:"caption" }, "This chart is a reading lens, not a measurement. The point is to show where the same trait can help or hurt depending on the room.")
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
          h(Badge, { kind:"verified" }, "filter family"),
          h("h3", null, item.family),
          h("p", null, item.claim),
          h("div", { className:"chips" }, item.filters.map((filter) => h("span", { className:"chip", key:filter }, filter))),
          h("p", { className:"caption" }, h("strong", null, "Evidence: "), item.evidence),
          h("p", { className:"caption" }, h("strong", null, "Why it helps: "), item.use)
        )
      );
    }
    function Matrix() {
      return h("div", { className:"matrix chart-card" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "What each source can prove"),
          h(Badge, { kind:"reasoned" }, "1 to 5")
        ),
        h("table", null,
          h("thead", null, h("tr", null, h("th", null, "source"), DATA.matrixColumns.map((col) => h("th", { key:col }, col)))),
          h("tbody", null, DATA.matrixRows.map((row) =>
            h("tr", { key:row.label }, h("td", null, row.label), row.values.map((value, index) =>
              h("td", { key:index }, h("div", { className:"heat", "data-v":String(value) }, value))
            ))
          ))
        ),
        h("p", { className:"caption" }, "Scores route evidence. They are not personality scores.")
      );
    }
    function PrivateContextRouter() {
      return h("div", { className:"chart-card context-table-wrap" },
        h("div", { className:"chart-title-row" },
          h("h3", null, "Anonymous private delivery shape"),
          h(Badge, { kind:"verified" }, "local-only source")
        ),
        h("table", { className:"context-table" },
          h("thead", null, h("tr", null,
            ["context","texts","median","five words or fewer","ask","logistics","routing"].map((head) => h("th", { key:head }, head))
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
        h("p", { className:"caption" }, "Relationship shape is useful. Relationship identity stays private.")
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
      return h("div", { className:"source-grid" }, DATA.sourceRows.map((row) =>
        h("article", { className:"source-card", key:row.label },
          h("h3", null, h("span", null, row.label), h("span", null, row.kind)),
          h("p", { className:"proof" }, row.proof),
          h("div", { className:"stat-grid" },
            h(Stat, { value: fmt.format(row.rows) + (row.suffix || ""), label:"source rows/items" }),
            h(Stat, { value: fmt.format(row.usable) + (row.suffix || ""), label:"usable signal" })
          ),
          h("p", { className:"caption" }, row.note),
          row.dateRange ? h("p", { className:"caption" }, h("strong", null, "Range: "), row.dateRange) : null,
          row.yieldNote ? h("p", { className:"caption" }, h("strong", null, "Usable means: "), row.yieldNote) : null,
          row.gaps ? h("p", { className:"caption" }, h("strong", null, "Known gaps: "), row.gaps) : null,
          row.accounts ? h("ul", { className:"evidence-list" }, row.accounts.map((account) =>
            h("li", { key:account.label }, account.label + ": " + fmt.format(account.rows) + " rows, " + fmt.format(account.authored) + " authored, " + account.dateRange)
          )) : null,
          h("p", { className:"caption" }, h("strong", null, "Privacy: "), row.privacy)
        )
      ));
    }
    function NorthStarPanel() {
      return h("div", { className:"north-star" },
        h("div", null,
          h("p", { className:"eyebrow" }, "Operating correction"),
          h("h3", null, DATA.northStar.statement),
          h("p", null, DATA.northStar.implication),
          h("p", { className:"self-study" }, h("strong", null, "Truth transfer: "), DATA.northStar.truthTransfer),
          h("p", { className:"caption" }, DATA.northStar.source)
        ),
        h("div", null,
          h("blockquote", null, DATA.northStar.quote),
          h("blockquote", { style:{ marginTop:"12px" } }, DATA.northStar.doorway)
        )
      );
    }
    function TruthTransferDoctrine() {
      return h("div", { className:"engine-grid" }, DATA.truthTransferRows.map((item, index) =>
        h("article", { className:"engine-card", key:item.layer },
          h("b", null, String(index + 1).padStart(2, "0")),
          h("h3", null, item.layer),
          h("p", null, item.question)
        )
      ));
    }
    function MetaphorExamples() {
      return h("div", { className:"recipe-grid" }, DATA.metaphorExampleRows.map((item) =>
        h("article", { className:"recipe-card", key:item.domain },
          h("h3", null, item.domain),
          h("dl", null,
            h("div", null, h("dt", null, "Weak line"), h("dd", null, item.weak)),
            h("div", null, h("dt", null, "Better bridge"), h("dd", null, item.bridge)),
            h("div", null, h("dt", null, "Why it works"), h("dd", null, item.why))
          )
        )
      ));
    }
    function TransferFailures() {
      return h("div", { className:"matrix-table" },
        h("table", null,
          h("thead", null, h("tr", null,
            h("th", null, "Failure"),
            h("th", null, "What happens")
          )),
          h("tbody", null, DATA.transferFailureRows.map((row) =>
            h("tr", { key:row.failure },
              h("th", { scope:"row" }, row.failure),
              h("td", null, row.effect)
            )
          ))
        )
      );
    }
    function ThoughtEngine() {
      return h("div", { className:"engine-grid" }, DATA.thoughtEngine.map((item, index) =>
        h("article", { className:"engine-card", key:item.step },
          h("b", null, String(index + 1).padStart(2, "0")),
          h("h3", null, item.step),
          h("p", null, item.prompt),
          h("p", { className:"caption" }, item.example)
        )
      ));
    }
    function ClaimLadder() {
      return h("div", { className:"claim-grid" }, DATA.claimLadder.map((item, index) =>
        h("article", { className:"claim-card", key:item.rung },
          h("b", null, "Rung " + (index + 1)),
          h("h3", null, item.rung),
          h("p", null, item.line),
          h("p", { className:"caption" }, item.use)
        )
      ));
    }
    function ResearchBoundaries() {
      return h("div", { className:"boundary-grid" }, DATA.researchBoundaryRows.map((item) =>
        h("article", { className:"boundary-card", key:item.label },
          h("div", { className:"card-header" },
            h("h3", null, item.label),
            h(Badge, { kind:item.status === "usable" ? "verified" : "reasoned" }, item.status)
          ),
          h("p", null, item.note)
        )
      ));
    }
    function SystemBehaviorLayer() {
      return h("div", { className:"behavior-grid" }, DATA.systemBehaviorRows.map((item) =>
        h("article", { className:"behavior-card", key:item.layer },
          h("div", { className:"card-header" },
            h("h3", null, item.layer),
            h(Badge, { kind:"reasoned" }, "rule")
          ),
          h("p", null, h("strong", null, "Trigger: "), item.trigger),
          h("p", null, h("strong", null, "Rule: "), item.rule),
          h("p", null, h("strong", null, "Failure mode: "), item.failure)
        )
      ));
    }
    function VisualDeliveryAssets() {
      return h("div", { className:"asset-grid" }, DATA.visualAssetRows.map((item) =>
        h("article", { className:"asset-card", key:item.title },
          h("h3", null, item.title),
          h("img", { src:item.file, alt:item.title + " diagram" }),
          h("p", null, item.note),
          h("p", null, h("a", { href:item.file }, "Open SVG"))
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
    function InsightCards() {
      return h("div", { className:"long-read" }, DATA.humanSynthesis.map((item) =>
        h("article", { className:"insight-card", key:item.title },
          h("div", { className:"card-header" },
            h("h3", null, item.title),
            h(Badge, { kind:item.status.includes("verified") ? "verified" : "reasoned" }, item.status)
          ),
          h("p", null, item.summary),
          h("div", { className:"insight-grid" },
            h("div", null,
              h("p", { className:"eyebrow" }, "receipts"),
              h("ul", { className:"evidence-list" }, item.evidence.map((line) => h("li", { key:line }, line)))
            ),
            h("div", { className:"implication" },
              h("p", null, h("strong", null, "Implication: "), item.implication),
              h("p", null, h("strong", null, "Strength: "), item.strength),
              h("p", null, h("strong", null, "Watch: "), item.watch)
            )
          )
        )
      ));
    }
    function ReflectionChapters() {
      return h("div", { className:"reflection-stack" }, DATA.reflectionChapters.map((item, index) =>
        h("article", { className:"reflection-chapter", key:item.title },
          h("div", { className:"chapter-index" },
            h("b", null, String(index + 1).padStart(2, "0")),
            h(Badge, { kind:item.status.includes("verified") ? "verified" : "reasoned" }, item.status)
          ),
          h("div", { className:"chapter-body" },
            h("h3", null, item.title),
            item.read.map((paragraph) => h("p", { key:paragraph }, paragraph)),
            h("ul", { className:"evidence-list" }, item.evidence.map((line) => h("li", { key:line }, line))),
            h("p", { className:"self-study" }, h("strong", null, "Use note: "), item.selfStudy)
          )
        )
      ));
    }
    function TensionPairs() {
      return h("div", { className:"tension-grid" }, DATA.tensionPairs.map((item) =>
        h("article", { className:"tension-card", key:item.trait },
          h("h3", null, item.trait),
          h("p", null, h("strong", null, "Works when: "), item.works),
          h("p", null, h("strong", null, "Breaks when: "), item.breaks),
          h("p", null, h("strong", null, "Adjustment: "), item.route)
        )
      ));
    }
    function CommunicationRecipes() {
      return h("div", { className:"recipe-grid" }, DATA.communicationRecipes.map((item) =>
        h("article", { className:"recipe-card", key:item.room },
          h("h3", null, item.room),
          h("dl", null,
            h("div", null, h("dt", null, "Start"), h("dd", null, item.start)),
            h("div", null, h("dt", null, "Evidence"), h("dd", null, item.proof)),
            h("div", null, h("dt", null, "Add"), h("dd", null, item.add)),
            h("div", null, h("dt", null, "Avoid"), h("dd", null, item.avoid))
          )
        )
      ));
    }
    function TrendNarrative() {
      return h("div", { className:"timeline" }, DATA.trendNarrative.map((item) =>
        h("article", { className:"phase-card", key:item.phase },
          h("div", null, h("h3", null, item.phase)),
          h("div", null,
            h("h4", null, item.title),
            h("p", null, item.read),
            h("p", null, h("strong", null, "Proof: "), item.proof),
            h("p", null, h("strong", null, "Implication: "), item.implication)
          )
        )
      ));
    }
    function QuoteGallery() {
      return h("div", { className:"quote-grid" }, DATA.publicExamples.map((example) =>
        h("article", { className:"quote-card", key:example.label },
          h("div", { className:"card-header" },
            h("h3", null, example.label),
            h(Badge, { kind:"verified" }, example.date)
          ),
          h("blockquote", null, example.text),
          h("p", { className:"quote-note" }, example.note),
          h("div", { className:"quote-meta" },
            h("span", null, example.account),
            h("span", null, example.likes + " likes"),
            h("a", { href:example.url }, "source")
          )
        )
      ));
    }
    function StudyPrompts() {
      return h("div", { className:"study-grid" }, DATA.studyPrompts.map((item) =>
        h("article", { className:"study-card", key:item.title }, h("h3", null, item.title), h("p", null, item.body))
      ));
    }
    function App() {
      return h("div", { className:"shell" },
        h("aside", null,
          h("p", { className:"eyebrow" }, "Austin translation system"),
          h("h1", null, "Change The Doorway"),
          h("p", null, "One thought process, different entrances. This is not an identity map."),
          h("nav", { "aria-label":"Artifact sections" }, [
            ["answer","Start"],
            ["usable-voice","Usable voice"],
            ["north-star","Doorway rule"],
            ["truth-transfer","Truth transfer"],
            ["thought-engine","Movement"],
            ["behavior","System behavior"],
            ["visual-layer","Visual layer"],
            ["human-read","Human read"],
            ["deeper-read","Deeper read"],
            ["charts","Evidence receipts"],
            ["trends","Time pressure"],
            ["quotes","Public examples"],
            ["private-router","Private shape"],
            ["recipes","Doorway plays"],
            ["filters","Translation checks"],
            ["sources","Source receipts"],
            ["boundaries","Boundaries"],
            ["privacy","Privacy"]
          ].map(([id,label]) => h("a", { href:"#"+id, key:id }, label))),
          h("p", null, "Generated " + DATA.generatedAt + ". Private sources are aggregate-only.")
        ),
        h("main", { id:"main" },
          h("section", { className:"hero", id:"answer" },
            h("div", { className:"hero-copy" },
              h("p", { className:"eyebrow" }, "Governing answer"),
              h("h2", null, "The best communication changes the doorway, not the truth."),
              h("p", { className:"thesis" }, "This is a translation system, not a personality map. The archive exists to learn the movement underneath the line, then choose the entrance an audience can actually walk through."),
              h("div", { className:"summary-strip" },
                h("div", null, h("strong", null, "Core movement"), h("p", null, "Object, pressure, system, bridge, lesson, rhythm, room.")),
                h("div", null, h("strong", null, "Humor pattern"), h("p", null, "Take a normal object and give it institutional stakes.")),
                h("div", null, h("strong", null, "Doorway rule"), h("p", null, "Change the entrance. Keep the mechanism."))
              ),
              h("div", { className:"stat-grid" },
                h(Stat, { value:fmt.format(DATA.totals.officialX), label:"official X rows parsed" }),
                h(Stat, { value:fmt.format(DATA.totals.authoredX), label:"authored public rows" }),
                h(Stat, { value:fmt.format(DATA.totals.decodedMessages), label:"decoded private sent texts" }),
                h(Stat, { value:DATA.filterCount, label:"translation checks" })
              )
            ),
            h("div", { className:"hero-aside" },
              h(Card, { title:"What changed", badge:{ kind:"verified", text:"updated" } },
                h("p", null, "Rooms are delivery conditions, not selves. The page now starts from the doorway rule before it shows any buckets, charts, or sources.")
              ),
              h(Card, { title:"What stays stable", badge:{ kind:"reasoned", text:"read" } },
                h("p", null, "The repeated move is pressure turned into a concrete object, a system read, a lesson, and a line with cadence.")
              ),
              h(Card, { title:"What stays private", badge:{ kind:"verified", text:"bounded" } },
                h("p", null, "Raw private messages, DMs, names, group names, handles, filenames, media paths, burner metadata, and private phrase lists stay out of the public repo.")
              )
            )
          ),
          h("section", { id:"usable-voice" },
            h(SectionHead, { title:"Usable Voice First", body:"This is the actual output layer. Use these lines, moves, and delivery rules before reading the evidence machinery underneath them." }),
            h(UsableVoiceFirst, null)
          ),
          h("section", { id:"north-star" },
            h(SectionHead, { title:"Doorway Rule", body:"This is the correction that keeps the whole project honest. Do not sort Austin into platform selves. Learn the single movement, then choose the doorway." }),
            h(NorthStarPanel, null)
          ),
          h("section", { id:"truth-transfer" },
            h(SectionHead, { title:"Truth Transfer", body:"Same bones, different doorway. The mechanism survives while metaphor, rhythm, slang, grammar, image, silence, or proof changes for the room." }),
            h(TruthTransferDoctrine, null),
            h("div", { className:"reading-path" },
              h("h3", null, "Causal architecture test"),
              h("p", null, "Weak metaphors share surface features. Strong bridges preserve how the thing actually works: source path, authority signal, failure point, and human consequence.")
            ),
            h("div", { style:{ marginTop:"18px" } },
              h(SectionHead, { title:"Stronger Bridges", body:"These examples change the doorway without changing the underlying mechanism." }),
              h(MetaphorExamples, null)
            ),
            h("div", { style:{ marginTop:"18px" } },
              h(SectionHead, { title:"Failure Modes", body:"These are the ways translation breaks when the doorway changes the truth or blocks the room." }),
              h(TransferFailures, null)
            )
          ),
          h("section", { id:"thought-engine" },
            h(SectionHead, { title:"The Repeatable Movement", body:"The durable part is the movement: the object carries feeling, the system explains pressure, and the room changes delivery." }),
            h(ThoughtEngine, null),
            h("div", { style:{ marginTop:"18px" } },
              h(SectionHead, { title:"Claim ladder", body:"An Austin-style line climbs from raw event to human pressure to system read to felt consequence, then translates for the room." }),
              h(ClaimLadder, null)
            )
          ),
          h("section", { id:"method" },
            h(SectionHead, { title:"Method, in plain English", body:"The goal was not to prove a personality theory. The goal was to build a reusable translation reference from Austin-derived evidence while keeping private people private." }),
            h("div", { className:"grid-2" }, DATA.methodSteps.map((step) =>
              h(Card, { title:step.title, badge:{ kind:"verified", text:"method" }, key:step.title }, h("p", null, step.body))
            )),
            h("div", { className:"reading-path" },
              h("h3", null, "How to read this"),
              h("p", null, "Start with the doorway rule and repeatable movement, then use the charts as receipts. The private sections prove shape, not private wording. Public examples show real phrasing because they were already public.")
            ),
            h("p", { className:"footer" }, "Design read: " + DATA.design.read + " Seed " + DATA.design.seed + ". " + DATA.design.note)
          ),
          h("section", { id:"behavior" },
            h(SectionHead, { title:"Codex Behavior Layer", body:"These rules keep the active model small, repairable, privacy-safe, and useful across agents, tools, errors, cultures, and emotional states. Same truth, different doorway." }),
            h(SystemBehaviorLayer, null)
          ),
          h("section", { id:"visual-layer" },
            h(SectionHead, { title:"Visual Delivery Layer", body:"The added visual context supported an error-recovery pattern, not body-language claims. Future video evidence should be reduced to observed flow and privacy-safe lessons." }),
            h(VisualDeliveryAssets, null),
            h("div", { className:"reading-path" },
              h("h3", null, "Video status"),
              h("p", null, "[verified] No direct professor video, caption track, or talking-head clip was available in the provided files. The attached still was used only to derive the error-state flow.")
            )
          ),
          h("section", { id:"human-read" },
            h(SectionHead, { title:"The Human Read", body:"These are the main patterns worth keeping. Each one names the upside, the risk, and how it should change future writing or agent behavior." }),
            h(InsightCards, null)
          ),
          h("section", { id:"deeper-read" },
            h(SectionHead, { title:"Deeper Pattern Read", body:"This is the slower layer: how the same movement handles pressure, humor, care, rhythm, metaphor, and AI partnership." }),
            h(ReflectionChapters, null),
            h("div", { style:{ marginTop:"18px" } },
              h(SectionHead, { title:"Works And Breaks", body:"The same trait can help or hurt depending on the room." }),
              h(TensionPairs, null)
            )
          ),
          h("section", { id:"charts" },
            h(SectionHead, { title:"Evidence Receipts", body:"The charts do not define Austin. They show where the evidence supports the read: compression, private-room shape, source strength, and translation risk." }),
            h("div", { className:"grid-2" },
              h(MarkerComparisonChart, null),
              h(ContextBubbleChart, null)
            ),
            h("div", { className:"grid-2", style:{ marginTop:"18px" } },
              h(VoiceCompass, null),
              h(StrengthRiskChart, null)
            ),
            h("div", { className:"grid-2", style:{ marginTop:"18px" } },
              h("div", { className:"chart-card" },
                h("div", { className:"chart-title-row" }, h("h3", null, "Compression ladder"), h(Badge, { kind:"verified" }, "median words")),
                h(BarList, { rows:DATA.compressionRows, color:"var(--pine)", suffix:" words", maxValue:14 }),
                h("p", { className:"caption" }, "Private contexts sit at a 5-word median. Public social is still short, but it has more stage lighting.")
              ),
              h(PhaseVolumeChart, null)
            )
          ),
          h("section", { id:"trends" },
            h(SectionHead, { title:"Time Pressure And Use Notes", body:"The pattern is not early, middle, recent as a maturity story. The stronger read is translation pressure: public heat, private compression, professional proof, and AI partnership." }),
            h(TrendNarrative, null),
            h("div", { style:{ marginTop:"18px" } }, h(StudyPrompts, null))
          ),
          h("section", { id:"quotes" },
            h(SectionHead, { title:"Public examples with context", body:"These are public X examples only. They are included because they show the mechanics: deadpan, mock ceremony, self-own, tool anger, sports melodrama, and ordinary-object escalation." }),
            h(QuoteGallery, null)
          ),
          h("section", { id:"private-router" },
            h(SectionHead, { title:"Private Shape Without Private Exposure", body:"This is the executed local-only Messages pass in safe form: room shape, length, markers, and purpose buckets without names, quotes, or private phrases." }),
            h("div", { className:"grid-2" },
              h(PrivateContextRouter, null),
              h("div", { className:"chart-card" },
                h("div", { className:"chart-title-row" }, h("h3", null, "Purpose buckets"), h(Badge, { kind:"verified" }, "derived only")),
                h("p", { className:"caption" }, "Future agents should identify the job first: coordination, play, warmth, context passing, intensity, or repair."),
                h("div", { style:{ marginTop:"14px" } }, h(PurposeBuckets, null))
              )
            )
          ),
          h("section", { id:"recipes" },
            h(SectionHead, { title:"Doorway Plays", body:"This is the reusable part. Read the movement first. Then pick the room, the job, and the amount of heat, care, proof, or compression the room deserves." }),
            h(CommunicationRecipes, null)
          ),
          h("section", { id:"filters" },
            h(SectionHead, { title:"Translation Checks", body:"These checks turn the archive into an operating system for future writing. The first question is not what sounds like Austin. It is what the thought is doing and which doorway the room can receive." }),
            h(FilterAtlas, null)
          ),
          h("section", { id:"sources" },
            h(SectionHead, { title:"Source Receipts", body:"Each source teaches a pressure condition. The reference keeps those pressures from becoming fake separate identities." }),
            h(SourceCards, null),
            h("div", { style:{ marginTop:"18px" } }, h(Matrix, null))
          ),
          h("section", { id:"boundaries" },
            h(SectionHead, { title:"Research boundaries", body:"The uploaded enhancement manifest contributed structure ideas. It did not replace verified source evidence, and its connector limits are stated plainly here." }),
            h(ResearchBoundaries, null)
          ),
          h("section", { id:"soft" },
            h(SectionHead, { title:"Interpretation Guardrail", body:"This is the interpretation layer. The numbers keep it honest; the read is what makes it useful." }),
            h("div", { className:"soft-grid" }, DATA.softAxes.map(([label, body]) =>
              h("article", { className:"soft-card", key:label }, h("h3", null, label), h("p", null, body))
            ))
          ),
          h("section", { id:"privacy" },
            h(SectionHead, { title:"Privacy Boundary", body:"The reference can improve without making private people, burner metadata, or private rooms part of the public artifact." }),
            h("div", { className:"privacy-band" },
              h("div", { className:"grid-3" },
                h(Card, { title:"Public evidence", badge:{ kind:"verified", text:"quote allowed" } }, h("p", null, "Official X posts and authored long-form writing can be cited when source context is preserved.")),
                h(Card, { title:"Derived evidence", badge:{ kind:"verified", text:"safe shape" } }, h("p", null, "Snapchat and Messages contribute counts, rates, purpose buckets, and anonymous room shape. No raw private wording.")),
                h(Card, { title:"Local-only evidence", badge:{ kind:"verified", text:"do not publish" } }, h("p", null, "Raw Messages, DMs, contact identities, group names, handles, burner metadata, filenames, and media paths stay off GitHub."))
              )
            )
          ),
          h("p", { className:"footer" }, "This artifact is meant to be read and reused. It updates the earlier X-only view into a doorway-based translation reference for Austin, future agents, public writing, private tone, and AI-human partnership.")
        )
      );
    }
    ReactDOM.createRoot(document.getElementById("root")).render(h(App));
  </script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
fs.writeFileSync(contractPath, JSON.stringify(frontendContract, null, 2) + "\n", "utf8");
console.log("Wrote " + outPath);
console.log("Wrote " + contractPath);
