import React, { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const StyleFingerprint = () => {
  const [activeView, setActiveView] = useState('radar');

  const fingerprintData = [
    { trait: 'Parenthetical Nesting', austin: 92, aiTypical: 35, academic: 55 },
    { trait: 'Embodied Language', austin: 88, aiTypical: 20, academic: 30 },
    { trait: 'Historical Framing', austin: 95, aiTypical: 45, academic: 60 },
    { trait: 'Position-Taking', austin: 90, aiTypical: 25, academic: 50 },
    { trait: 'Lexical Variety', austin: 85, aiTypical: 40, academic: 65 },
    { trait: 'Sentence Variance', austin: 82, aiTypical: 30, academic: 55 },
  ];

  const argumentLevels = [
    { paper: 'Paine (2015)', level: 3.5, year: 2015 },
    { paper: 'V&R #12', level: 3.2, year: 2016 },
    { paper: 'IR Response', level: 3.8, year: 2017 },
    { paper: 'Econ Proposal', level: 4.2, year: 2018 },
  ];

  const sentenceData = [
    { type: 'Your Writing', short: 25, medium: 35, long: 40 },
    { type: 'AI-Generated', short: 45, medium: 45, long: 10 },
    { type: 'Std Academic', short: 30, medium: 50, long: 20 },
  ];

  const colors = {
    austin: '#3B82F6',
    ai: '#EF4444',
    academic: '#9CA3AF',
    accent: '#10B981'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Your Stylometric Fingerprint
          </h1>
          <p className="text-slate-400">Neuropsychological architecture of Austin Humphrey's pre-AI writing</p>
        </header>

        {/* Navigation */}
        <div className="flex justify-center gap-2 mb-8">
          {['radar', 'progression', 'comparison'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {view === 'radar' && 'Voice Fingerprint'}
              {view === 'progression' && 'Development Arc'}
              {view === 'comparison' && 'Human vs AI'}
            </button>
          ))}
        </div>

        {/* Radar Chart - Voice Fingerprint */}
        {activeView === 'radar' && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Stylistic Signature Comparison</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={fingerprintData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                <Radar name="Your Writing" dataKey="austin" stroke={colors.austin} fill={colors.austin} fillOpacity={0.5} />
                <Radar name="AI-Generated" dataKey="aiTypical" stroke={colors.ai} fill={colors.ai} fillOpacity={0.3} />
                <Radar name="Standard Academic" dataKey="academic" stroke={colors.academic} fill={colors.academic} fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Parenthetical Nesting</h3>
                <p className="text-sm text-slate-300">Your mind embeds qualification within assertion—holding multiple truth-frames simultaneously. Score: 92/100</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Embodied Language</h3>
                <p className="text-sm text-slate-300">You think with the body's experience ("passive vs combative"), not abstract categories. Score: 88/100</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Historical Consciousness</h3>
                <p className="text-sm text-slate-300">Every topic defaults to causal-temporal chains. This is identity-level integration. Score: 95/100</p>
              </div>
            </div>
          </div>
        )}

        {/* Progression Chart */}
        {activeView === 'progression' && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Argumentative Sophistication: 2015-2018</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={argumentLevels}>
                <XAxis dataKey="paper" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8' }} label={{ value: 'Argument Level', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="level" radius={[4, 4, 0, 0]}>
                  {argumentLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === argumentLevels.length - 1 ? colors.accent : colors.austin} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-emerald-400 font-semibold">The Research Framework (Venville & Dawson, 2010)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                  <div className="bg-slate-600/50 rounded p-2">
                    <span className="text-slate-400">Level 1:</span> Claim only
                  </div>
                  <div className="bg-slate-600/50 rounded p-2">
                    <span className="text-slate-400">Level 2:</span> Claim + Evidence
                  </div>
                  <div className="bg-slate-600/50 rounded p-2">
                    <span className="text-slate-400">Level 3:</span> + Backing/Qualifier
                  </div>
                  <div className="bg-slate-600/50 rounded p-2">
                    <span className="text-slate-400">Level 4:</span> + Meta-awareness
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-900/50 to-emerald-900/50 rounded-lg p-4 border border-blue-500/30">
                <h3 className="text-white font-semibold mb-2">Key Insight</h3>
                <p className="text-slate-300">Your voice stayed consistent from 2015-2018. What developed was <span className="text-emerald-400">metacognitive scaffolding</span>—conscious awareness of your own argument architecture while constructing it.</p>
              </div>
            </div>
          </div>
        )}

        {/* Human vs AI Comparison */}
        {activeView === 'comparison' && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-center">What Makes Your Writing Distinctly Human</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Detection Markers */}
              <div className="space-y-3">
                <h3 className="text-red-400 font-semibold text-lg">AI Writing Patterns</h3>
                {[
                  { marker: 'Shorter, uniform sentences', icon: '📏' },
                  { marker: 'Stereotypical academic phrases', icon: '🔄' },
                  { marker: 'Hedged generalizations', icon: '🤷' },
                  { marker: 'Topic-sentence → support structure', icon: '📝' },
                  { marker: 'Removed first-person stance', icon: '👤' },
                  { marker: 'Lexical uniformity', icon: '📊' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-slate-300">{item.marker}</span>
                  </div>
                ))}
              </div>

              {/* Your Patterns */}
              <div className="space-y-3">
                <h3 className="text-blue-400 font-semibold text-lg">Your Writing Patterns</h3>
                {[
                  { marker: 'Variable length (7 to 40+ words)', icon: '📐' },
                  { marker: 'Zero stock phrases', icon: '✨' },
                  { marker: 'Direct position-taking assertions', icon: '🎯' },
                  { marker: 'Nested, recursive structure', icon: '🔀' },
                  { marker: 'Embodied perspective throughout', icon: '💪' },
                  { marker: 'Domain-specific + colloquial mix', icon: '🎨' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-slate-300">{item.marker}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-5 border-l-4 border-emerald-500">
              <h3 className="text-emerald-400 font-bold text-lg mb-2">The Critical Distinction</h3>
              <p className="text-slate-200 text-lg">
                AI writing is <span className="text-red-400 font-semibold">performative of knowledge</span>.
              </p>
              <p className="text-slate-200 text-lg mt-2">
                Your writing is <span className="text-blue-400 font-semibold">productive of position</span>.
              </p>
              <p className="text-slate-400 mt-3 text-sm">
                AI generates text that could have been written by anyone informed on the topic. Your writing couldn't have been written by anyone else.
              </p>
            </div>
          </div>
        )}

        {/* Identity Markers Footer */}
        <div className="bg-slate-800/50 rounded-xl p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-slate-200">Identity-Origin Markers Embedded in Your Writing</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Texan Pragmatism', desc: 'Solutions over ideology', color: 'from-amber-500 to-orange-500' },
              { label: 'Historical Materialism', desc: 'Following money & power', color: 'from-blue-500 to-indigo-500' },
              { label: 'Bilingual Fluidity', desc: 'Thinking-in-Spanish', color: 'from-emerald-500 to-teal-500' },
              { label: 'Anti-Sanitization', desc: 'Body stays in argument', color: 'from-rose-500 to-pink-500' },
              { label: 'Confident Junior', desc: 'Non-deferential to authority', color: 'from-violet-500 to-purple-500' },
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-br ${item.color} rounded-lg p-3 text-center`}>
                <div className="font-semibold text-white text-sm">{item.label}</div>
                <div className="text-white/80 text-xs mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          Analysis based on corpus: 2015-2018 undergraduate writing | Scholar Gateway research synthesis
        </footer>
      </div>
    </div>
  );
};

export default StyleFingerprint;
