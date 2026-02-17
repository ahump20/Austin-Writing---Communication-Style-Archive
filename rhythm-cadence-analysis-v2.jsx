import React, { useMemo, useState } from 'react';

const RHYTHM_EXAMPLES = [
  {
    id: 'econ-2018',
    title: 'Economic History Proposal (2018)',
    source: 'Academic paper excerpt',
    sentences: [
      {
        text: 'Marijuana legalization has made great strides in the past decade.',
        words: 9,
        phase: 'anchor',
        label: 'Anchor'
      },
      {
        text: 'While the basic side effects of marijuana differ in that the user is placed in a more passive state opposed to a combative, the market effects of outlawing the drug do mirror those created by alcohol prohibition.',
        words: 38,
        phase: 'expand',
        label: 'Expand'
      },
      {
        text: "Unfortunately, the changes required for marijuana to follow alcohol's path to legalization are difficult to achieve.",
        words: 16,
        phase: 'drive',
        label: 'Drive'
      }
    ]
  },
  {
    id: 'paine-2015',
    title: 'Thomas Paine Review (2015)',
    source: 'Primary-source analysis',
    sentences: [
      {
        text: 'Common Sense was revolutionary.',
        words: 4,
        phase: 'anchor',
        label: 'Anchor'
      },
      {
        text: "Thomas Paine's unique ability of communicating these complex issues to the general public in a way that fired them up changed the course of history.",
        words: 26,
        phase: 'expand',
        label: 'Expand'
      },
      {
        text: 'Without it, we may very well still be British subjects.',
        words: 10,
        phase: 'drive',
        label: 'Drive'
      }
    ]
  },
  {
    id: 'ir-2017',
    title: 'IR Response - US-China (2017)',
    source: 'International relations response',
    sentences: [
      {
        text: 'The question is simple.',
        words: 4,
        phase: 'anchor',
        label: 'Anchor'
      },
      {
        text: 'A Harvard study showed that in fifteen cases in history where a rising and an established power interacted, ten ended in war.',
        words: 22,
        phase: 'expand',
        label: 'Expand'
      },
      {
        text: "China's rise demands our attention.",
        words: 5,
        phase: 'drive',
        label: 'Drive'
      }
    ]
  }
];

const PHASE_META = {
  anchor: {
    heading: 'Anchor',
    summary: 'Short claim that plants position and context.',
    words: '4-10 words',
    panelClass: 'border-[#7ec5ff]/40 bg-[#0f2436]/80',
    chipClass: 'border-[#7ec5ff]/40 bg-[#11314a] text-[#b9e5ff]',
    barClass: 'bg-gradient-to-r from-[#3ea9ff] to-[#2f7cc8]'
  },
  expand: {
    heading: 'Expand',
    summary: 'Long sentence that carries evidence and qualification.',
    words: '20-40+ words',
    panelClass: 'border-[#79d8b2]/40 bg-[#0f2a24]/80',
    chipClass: 'border-[#79d8b2]/40 bg-[#14372d] text-[#bdf2df]',
    barClass: 'bg-gradient-to-r from-[#39c08d] to-[#2f946f]'
  },
  drive: {
    heading: 'Drive',
    summary: 'Medium sentence that converts analysis into direction.',
    words: '10-18 words',
    panelClass: 'border-[#ffb88a]/40 bg-[#2b1f16]/80',
    chipClass: 'border-[#ffb88a]/40 bg-[#3d2819] text-[#ffd8be]',
    barClass: 'bg-gradient-to-r from-[#ff8f4d] to-[#d96a2f]'
  }
};

const WORD_SCALE_MAX = 40;

const getBarWidth = (wordCount) => `${Math.min((wordCount / WORD_SCALE_MAX) * 100, 100)}%`;

const RhythmCadenceAnalysisV2 = () => {
  const [selectedId, setSelectedId] = useState(RHYTHM_EXAMPLES[0].id);

  const activeExample = useMemo(
    () => RHYTHM_EXAMPLES.find((example) => example.id === selectedId) || RHYTHM_EXAMPLES[0],
    [selectedId]
  );

  const phaseTotals = useMemo(() => {
    return activeExample.sentences.reduce(
      (acc, sentence) => {
        acc[sentence.phase].count += 1;
        acc[sentence.phase].words += sentence.words;
        return acc;
      },
      {
        anchor: { count: 0, words: 0 },
        expand: { count: 0, words: 0 },
        drive: { count: 0, words: 0 }
      }
    );
  }, [activeExample]);

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f4efe8]">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="rhythm-cadence-title">
        <header className="rounded-2xl border border-[#344558] bg-[linear-gradient(135deg,#0b141f_0%,#111e2d_50%,#151a1f_100%)] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#b6a99a]">Writing Analysis / Cadence</p>
          <h1 id="rhythm-cadence-title" className="mt-3 text-3xl font-semibold leading-tight text-[#fff8ef] sm:text-4xl">
            Rhythm and Cadence Architecture
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#d8ccc0]">
            This view tracks how sentence length shifts across your core pattern: short claim, long complication,
            medium forward push. The goal is not decoration. The goal is control.
          </p>
        </header>

        <section className="mt-6" aria-labelledby="signature-pattern-heading">
          <h2 id="signature-pattern-heading" className="sr-only">
            Signature pattern overview
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(PHASE_META).map(([phase, meta]) => {
              const totals = phaseTotals[phase];
              const avgWords = totals.count > 0 ? (totals.words / totals.count).toFixed(1) : '0.0';

              return (
                <article
                  key={phase}
                  className={`rounded-xl border p-4 shadow-[0_10px_25px_rgba(0,0,0,0.2)] ${meta.panelClass}`}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#f2e5d7]/80">Phase</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#fff7eb]">{meta.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#d9cdc0]">{meta.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#d6c8b8]">
                    <div className="rounded-md border border-white/15 bg-black/10 p-2">
                      <p className="font-mono uppercase tracking-[0.12em]">Target</p>
                      <p className="mt-1 text-sm text-[#fff4e8]">{meta.words}</p>
                    </div>
                    <div className="rounded-md border border-white/15 bg-black/10 p-2">
                      <p className="font-mono uppercase tracking-[0.12em]">Example Avg</p>
                      <p className="mt-1 text-sm text-[#fff4e8]">{avgWords} words</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="example-selector-heading">
          <h2 id="example-selector-heading" className="text-lg font-semibold text-[#fff6eb]">
            Source Samples
          </h2>
          <p className="mt-1 text-sm text-[#bcae9d]">Select a sample to inspect sentence pressure and movement.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RHYTHM_EXAMPLES.map((example) => {
              const isActive = example.id === activeExample.id;
              return (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => setSelectedId(example.id)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-4 py-2 text-sm transition motion-reduce:transition-none ${
                    isActive
                      ? 'border-[#ff9f67] bg-[#3a2418] text-[#ffe0cc]'
                      : 'border-[#4f5f71] bg-[#121c28] text-[#c8bbad] hover:border-[#7e8fa3] hover:text-[#efe3d5]'
                  }`}
                >
                  {example.title}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#364758] bg-[#0f1722] p-6" aria-labelledby="cadence-breakdown-heading">
          <h2 id="cadence-breakdown-heading" className="text-2xl font-semibold text-[#fff6eb]">
            {activeExample.title}
          </h2>
          <p className="mt-1 text-sm font-medium tracking-wide text-[#b9aa9a]">{activeExample.source}</p>

          <div className="mt-6 space-y-6">
            {activeExample.sentences.map((sentence, index) => {
              const meta = PHASE_META[sentence.phase];
              return (
                <article
                  key={`${sentence.phase}-${index}`}
                  className="rounded-xl border border-[#2f3f4f] bg-[#121d2a] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${meta.chipClass}`}>
                      {sentence.label}
                    </span>
                    <span className="font-mono text-xs text-[#b4a594]">{sentence.words} words</span>
                  </div>

                  <div className="mt-3 h-9 overflow-hidden rounded-md border border-[#243243] bg-[#0d1520]">
                    <div
                      className={`h-full ${meta.barClass} px-3 py-2 text-xs font-medium text-[#f8f2ea] transition-all duration-500 motion-reduce:transition-none`}
                      style={{ width: getBarWidth(sentence.words) }}
                    >
                      {sentence.words <= 12 ? sentence.text : `${sentence.text.slice(0, 70)}...`}
                    </div>
                  </div>

                  <blockquote className="mt-3 border-l-2 border-[#556779] pl-3 text-sm leading-relaxed text-[#e1d6cb]">
                    {sentence.text}
                  </blockquote>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-[#2f4257] bg-[#101d2b] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9eb5cc]">Word scale</p>
            <div className="mt-2 flex justify-between text-xs text-[#a89785]" aria-hidden="true">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40+</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[linear-gradient(90deg,#3ea9ff_0%,#39c08d_55%,#ff8f4d_100%)] opacity-60" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-labelledby="interpretation-heading">
          <h2 id="interpretation-heading" className="sr-only">
            Interpretation notes
          </h2>
          <article className="rounded-xl border border-[#2d4257] bg-[#101b29] p-5">
            <h3 className="text-lg font-semibold text-[#9ed2ff]">Interpretation</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#d5cabd]">
              Sentence variance is a strong marker of authored rhythm. It signals active thought shifts rather than
              template generation. Here, the range repeatedly moves from short precision to long synthesis.
            </p>
          </article>

          <article className="rounded-xl border border-[#4a3a2c] bg-[#1d1712] p-5">
            <h3 className="text-lg font-semibold text-[#ffc49b]">Guardrail</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#e0d2c4]">
              Cadence alone does not prove intent, quality, or truth. Use rhythm as one signal among evidence quality,
              claim integrity, and structural coherence.
            </p>
          </article>
        </section>

        <footer className="mt-8 border-t border-[#2b3a49] pt-4 text-xs text-[#948372]">
          Corpus window: 2015-2018 academic writing samples. View optimized for desktop and mobile with reduced-motion
          compatibility.
        </footer>
      </main>
    </div>
  );
};

export default RhythmCadenceAnalysisV2;
