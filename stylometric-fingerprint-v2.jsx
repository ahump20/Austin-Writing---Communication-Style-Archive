import React, { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

const FINGERPRINT_DATA = [
  { trait: 'Parenthetical Nesting', austin: 92, aiTypical: 35, academic: 55 },
  { trait: 'Embodied Language', austin: 88, aiTypical: 20, academic: 30 },
  { trait: 'Historical Framing', austin: 95, aiTypical: 45, academic: 60 },
  { trait: 'Position-Taking', austin: 90, aiTypical: 25, academic: 50 },
  { trait: 'Lexical Variety', austin: 85, aiTypical: 40, academic: 65 },
  { trait: 'Sentence Variance', austin: 82, aiTypical: 30, academic: 55 }
];

const ARGUMENT_PROGRESS = [
  { paper: 'Paine (2015)', level: 3.5, year: 2015 },
  { paper: 'V&R #12', level: 3.2, year: 2016 },
  { paper: 'IR Response', level: 3.8, year: 2017 },
  { paper: 'Econ Proposal', level: 4.2, year: 2018 }
];

const CONTRAST_MARKERS = {
  ai: [
    'Higher sentence-length uniformity',
    'More stock academic phrasing',
    'Higher hedge density',
    'Default topic-sentence scaffolding',
    'Lower personal position pressure',
    'Lower lexical spread in long passages'
  ],
  austin: [
    'Broad sentence-length distribution',
    'Direct position statements',
    'Nested qualification inside claims',
    'Embodied and concrete framing',
    'Domain-specific plus colloquial blend',
    'Causal language tied to historical sequencing'
  ]
};

const COLORS = {
  austin: '#3ea9ff',
  ai: '#f66f52',
  academic: '#aab3bf',
  accent: '#39c08d'
};

const VIEW_CONFIG = [
  { id: 'fingerprint', label: 'Voice Fingerprint' },
  { id: 'progression', label: 'Development Arc' },
  { id: 'contrast', label: 'Human vs AI' }
];

const StylometricFingerprintV2 = () => {
  const [activeView, setActiveView] = useState('fingerprint');

  const topSignal = useMemo(() => {
    return [...FINGERPRINT_DATA].sort((a, b) => b.austin - a.austin)[0];
  }, []);

  return (
    <div className="min-h-screen bg-[#080f18] px-4 py-8 text-[#f2ece3] sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl" aria-labelledby="stylometric-title">
        <header className="rounded-2xl border border-[#304357] bg-[linear-gradient(140deg,#0c1623_0%,#111f31_54%,#161b20_100%)] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.33)]">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#b6ab9f]">Writing Analysis / Stylometry</p>
          <h1 id="stylometric-title" className="mt-3 text-3xl font-semibold leading-tight text-[#fff7ed] sm:text-4xl">
            Stylometric Fingerprint
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#d8ccc0]">
            A comparative profile of your pre-AI writing corpus versus common AI and standard academic baselines.
            This is a diagnostic lens, not an identity verdict.
          </p>

          <div className="mt-5 rounded-lg border border-[#2e4256] bg-[#101c2b] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9cb3ca]">Strongest signal</p>
            <p className="mt-2 text-sm text-[#ddd1c5]">
              <span className="font-semibold text-[#b7e3ff]">{topSignal.trait}</span> scores highest in this corpus
              ({topSignal.austin}/100), reinforcing a style that argues while qualifying in the same breath.
            </p>
          </div>
        </header>

        <nav className="mt-6" aria-label="Analysis views">
          <div className="flex flex-wrap gap-2">
            {VIEW_CONFIG.map((view) => {
              const active = activeView === view.id;
              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-sm transition motion-reduce:transition-none ${
                    active
                      ? 'border-[#ff9f67] bg-[#3a2518] text-[#ffe1cc]'
                      : 'border-[#4a5e73] bg-[#101b29] text-[#c6b9ab] hover:border-[#7c8ea3] hover:text-[#efe3d5]'
                  }`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        </nav>

        {activeView === 'fingerprint' && (
          <section className="mt-6 rounded-2xl border border-[#34475b] bg-[#0f1722] p-6" aria-labelledby="fingerprint-heading">
            <h2 id="fingerprint-heading" className="text-2xl font-semibold text-[#fff7ed]">
              Trait Distribution Comparison
            </h2>
            <p className="mt-2 text-sm text-[#beaf9f]">
              Scores represent relative pattern frequency and intensity in this corpus window.
            </p>

            <div className="mt-4 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={FINGERPRINT_DATA}>
                  <PolarGrid stroke="#3e5268" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: '#c7baab', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8094aa', fontSize: 11 }} />
                  <Radar
                    name="Austin Corpus"
                    dataKey="austin"
                    stroke={COLORS.austin}
                    fill={COLORS.austin}
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="AI Typical"
                    dataKey="aiTypical"
                    stroke={COLORS.ai}
                    fill={COLORS.ai}
                    fillOpacity={0.28}
                  />
                  <Radar
                    name="Academic Baseline"
                    dataKey="academic"
                    stroke={COLORS.academic}
                    fill={COLORS.academic}
                    fillOpacity={0.18}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-[#2c4054] bg-[#101c2a] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.09em] text-[#b7e3ff]">Meaning</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d8ccc0]">
                  Higher values indicate stronger recurrence of that pattern in the corpus, not quality by default.
                </p>
              </article>
              <article className="rounded-lg border border-[#4f3a2b] bg-[#1c1712] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.09em] text-[#ffc49b]">Does Not Prove</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#e0d3c6]">
                  Stylometry does not prove authorship certainty, intent, or factual correctness. It is one analytic layer.
                </p>
              </article>
              <article className="rounded-lg border border-[#2f4b44] bg-[#11201d] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.09em] text-[#9de1c2]">Best Use</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d3c9be]">
                  Use this profile to calibrate drafting rhythm and claim pressure, then validate with evidence discipline.
                </p>
              </article>
            </div>
          </section>
        )}

        {activeView === 'progression' && (
          <section className="mt-6 rounded-2xl border border-[#34475b] bg-[#0f1722] p-6" aria-labelledby="progression-heading">
            <h2 id="progression-heading" className="text-2xl font-semibold text-[#fff7ed]">
              Argument Development Arc (2015-2018)
            </h2>
            <p className="mt-2 text-sm text-[#beaf9f]">
              Framework reference: Venville and Dawson (2010) levels for claim-evidence-backing complexity.
            </p>

            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ARGUMENT_PROGRESS}>
                  <XAxis dataKey="paper" tick={{ fill: '#c7baab', fontSize: 11 }} />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fill: '#8ca0b6', fontSize: 11 }}
                    label={{ value: 'Argument Level', angle: -90, position: 'insideLeft', fill: '#8ca0b6' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#182433', border: '1px solid #35506a', borderRadius: '10px' }}
                    labelStyle={{ color: '#f4ece3' }}
                  />
                  <Bar dataKey="level" radius={[6, 6, 0, 0]}>
                    {ARGUMENT_PROGRESS.map((entry, index) => (
                      <Cell
                        key={`${entry.paper}-${index}`}
                        fill={index === ARGUMENT_PROGRESS.length - 1 ? COLORS.accent : COLORS.austin}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-lg border border-[#2d4052] bg-[#101c2a] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#9cc4e6]">Interpretation</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d8ccc0]">
                  The corpus shows consistent voice identity with increasing argument scaffolding. The growth signal is
                  structural control, not personality drift.
                </p>
              </article>

              <article className="rounded-lg border border-[#4d3b2f] bg-[#1d1813] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#f3bc97]">Guardrail</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#e1d4c8]">
                  Rising scores do not imply universal superiority; they indicate stronger claim-evidence integration for
                  this sample window.
                </p>
              </article>
            </div>
          </section>
        )}

        {activeView === 'contrast' && (
          <section className="mt-6 rounded-2xl border border-[#34475b] bg-[#0f1722] p-6" aria-labelledby="contrast-heading">
            <h2 id="contrast-heading" className="text-2xl font-semibold text-[#fff7ed]">
              Human Pattern Contrast
            </h2>
            <p className="mt-2 text-sm text-[#beaf9f]">
              Contrast is expressed as pattern tendency, not absolute rule.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-[#59382d] bg-[#211712] p-4">
                <h3 className="text-lg font-semibold text-[#ffb48e]">AI-Typical Tendencies</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#eadccf]">
                  {CONTRAST_MARKERS.ai.map((marker) => (
                    <li key={marker} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#f66f52]" aria-hidden="true" />
                      <span>{marker}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-xl border border-[#2b4860] bg-[#111b28] p-4">
                <h3 className="text-lg font-semibold text-[#9fd8ff]">Austin Corpus Tendencies</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#dde0d6]">
                  {CONTRAST_MARKERS.austin.map((marker) => (
                    <li key={marker} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#3ea9ff]" aria-hidden="true" />
                      <span>{marker}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="mt-6 rounded-lg border-l-4 border-[#39c08d] bg-[#10221d] p-5">
              <h3 className="text-lg font-semibold text-[#9de1c2]">Bottom Line</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#d6cdc2]">
                AI text often performs informed neutrality. Your corpus pattern performs authored position under
                constraint. That distinction is useful for drafting and review, provided we keep evidence standards high.
              </p>
            </article>
          </section>
        )}

        <footer className="mt-8 border-t border-[#2d3d4f] pt-4 text-xs text-[#968675]">
          Corpus basis: undergraduate writing (2015-2018). Comparative baselines are heuristic references for editing,
          not forensic authorship claims.
        </footer>
      </main>
    </div>
  );
};

export default StylometricFingerprintV2;
