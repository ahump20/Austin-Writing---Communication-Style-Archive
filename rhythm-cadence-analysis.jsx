import React, { useState } from 'react';

const RhythmAnalysis = () => {
  const [selectedExample, setSelectedExample] = useState(0);

  const rhythmExamples = [
    {
      title: "Economic History Proposal (2018)",
      sentences: [
        { text: "Marijuana legalization has made great strides in the past decade.", words: 9, type: "declarative", color: "bg-blue-500" },
        { text: "While the basic side effects of marijuana differ in that the user is placed in a more passive state opposed to a combative, the market effects of outlawing the drug do mirror those created by alcohol prohibition.", words: 38, type: "complex-qualified", color: "bg-emerald-500" },
        { text: "Unfortunately, the changes required for marijuana to follow alcohol's path to legalization are difficult to achieve.", words: 16, type: "pivot", color: "bg-amber-500" },
      ]
    },
    {
      title: "Thomas Paine Review (2015)",
      sentences: [
        { text: "Common Sense was revolutionary.", words: 4, type: "declarative", color: "bg-blue-500" },
        { text: "Thomas Paine's unique ability of communicating these complex issues to the general public in a way that fired them up changed the course of history.", words: 26, type: "complex-qualified", color: "bg-emerald-500" },
        { text: "Without it, we may very well still be British subjects.", words: 10, type: "pivot", color: "bg-amber-500" },
      ]
    },
    {
      title: "IR Response - US-China (2017)",
      sentences: [
        { text: "The question is simple.", words: 4, type: "declarative", color: "bg-blue-500" },
        { text: "A Harvard study showed that in fifteen cases in history where a rising and an established power interacted, ten ended in war.", words: 22, type: "complex-qualified", color: "bg-emerald-500" },
        { text: "China's rise demands our attention.", words: 5, type: "pivot", color: "bg-amber-500" },
      ]
    }
  ];

  const getBarWidth = (words, maxWords = 40) => {
    return `${Math.min((words / maxWords) * 100, 100)}%`;
  };

  const rhythmPattern = [
    { phase: "GROUND", desc: "Short declarative establishes base", avgWords: "4-10", icon: "🎯" },
    { phase: "COMPLICATE", desc: "Long nested sentence adds qualification", avgWords: "20-40+", icon: "🔄" },
    { phase: "RESOLVE", desc: "Medium pivot drives forward", avgWords: "10-18", icon: "➡️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
            Rhythm & Cadence Architecture
          </h1>
          <p className="text-slate-400">The unconscious pulse of your prose</p>
        </header>

        {/* The Pattern */}
        <div className="bg-slate-800/70 rounded-2xl p-6 mb-8 backdrop-blur">
          <h2 className="text-xl font-semibold mb-6 text-center">Your Signature Rhythm Pattern</h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {rhythmPattern.map((phase, i) => (
              <React.Fragment key={i}>
                <div className={`flex-1 max-w-xs rounded-xl p-4 ${
                  i === 0 ? 'bg-blue-900/50 border border-blue-500/50' :
                  i === 1 ? 'bg-emerald-900/50 border border-emerald-500/50' :
                  'bg-amber-900/50 border border-amber-500/50'
                }`}>
                  <div className="text-center">
                    <span className="text-3xl">{phase.icon}</span>
                    <h3 className={`font-bold text-lg mt-2 ${
                      i === 0 ? 'text-blue-400' :
                      i === 1 ? 'text-emerald-400' :
                      'text-amber-400'
                    }`}>{phase.phase}</h3>
                    <p className="text-slate-300 text-sm mt-1">{phase.desc}</p>
                    <p className="text-slate-500 text-xs mt-2">{phase.avgWords} words</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:block text-slate-500 text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-center text-slate-400 mt-6 text-sm italic">
            This rhythm isn't taught. It emerges from how you think—establishing ground, complicating it, then resolving to forward motion.
          </p>
        </div>

        {/* Example Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {rhythmExamples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setSelectedExample(i)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                selectedExample === i
                  ? 'bg-white/10 border border-white/30 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ex.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* Visualization */}
        <div className="bg-slate-800/70 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-lg font-semibold mb-4">{rhythmExamples[selectedExample].title}</h2>

          <div className="space-y-6">
            {rhythmExamples[selectedExample].sentences.map((sentence, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sentence.type === 'declarative' ? 'bg-blue-500/20 text-blue-400' :
                    sentence.type === 'complex-qualified' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {sentence.type}
                  </span>
                  <span className="text-slate-500 text-xs">{sentence.words} words</span>
                </div>

                {/* Sentence bar visualization */}
                <div className="relative">
                  <div className="h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${sentence.color} transition-all duration-500 flex items-center px-3`}
                      style={{ width: getBarWidth(sentence.words) }}
                    >
                      <span className="text-xs text-white/80 truncate">
                        {sentence.words <= 10 ? sentence.text : `${sentence.text.substring(0, 50)}...`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full sentence */}
                <p className="text-slate-300 text-sm leading-relaxed pl-2 border-l-2 border-slate-600">
                  "{sentence.text}"
                </p>
              </div>
            ))}
          </div>

          {/* Word count scale */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40+ words</span>
            </div>
            <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 rounded-full mt-1 opacity-30"></div>
          </div>
        </div>

        {/* Insight Panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-slate-800/50 rounded-xl p-5 border border-blue-500/20">
            <h3 className="text-blue-400 font-semibold mb-3">Why This Matters</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              AI-generated text maintains <span className="text-red-400">uniform sentence length</span>—a key detection marker. Your natural rhythm shows <span className="text-blue-400">dramatic variance</span> (4 to 40+ words) that reflects genuine cognitive processing, not pattern-matching.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800/50 rounded-xl p-5 border border-emerald-500/20">
            <h3 className="text-emerald-400 font-semibold mb-3">The Neuropsychological Root</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              This pattern maps to working memory cycles: <span className="text-blue-400">establish context</span> (low load), <span className="text-emerald-400">hold multiple frames</span> (high load), <span className="text-amber-400">resolve and release</span> (medium load). Your writing breathes.
            </p>
          </div>
        </div>

        {/* Musical Analogy */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 text-center">
          <h3 className="text-slate-300 font-semibold mb-3">🎵 If Your Prose Were Music</h3>
          <div className="flex justify-center items-center gap-2 text-2xl">
            <span className="text-blue-400">♩</span>
            <span className="text-emerald-400">♪♪♪♪♪♪♪</span>
            <span className="text-amber-400">♩♩</span>
            <span className="text-slate-500">|</span>
            <span className="text-blue-400">♩</span>
            <span className="text-emerald-400">♪♪♪♪♪♪♪</span>
            <span className="text-amber-400">♩♩</span>
          </div>
          <p className="text-slate-500 text-sm mt-3">
            Short note → Long phrase with internal complexity → Medium resolution → Repeat
          </p>
        </div>

        <footer className="mt-8 text-center text-slate-600 text-xs">
          Rhythm analysis derived from 7 papers spanning 2015-2018
        </footer>
      </div>
    </div>
  );
};

export default RhythmAnalysis;
