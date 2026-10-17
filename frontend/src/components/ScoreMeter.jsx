import React from 'react';

export const ScoreMeter = ({ score = 0, label = "ATS Match Score", size = "md", scoreHistory = [] }) => {
  const getScoreColor = (val) => {
    if (val >= 85) return 'text-emerald-600 stroke-emerald-500';
    if (val >= 70) return 'text-amber-600 stroke-amber-500';
    return 'text-rose-600 stroke-rose-500';
  };

  const getScoreBadgeBg = (val) => {
    if (val >= 85) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (val >= 70) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Deduplicate consecutive identical scores and keep clean convergence steps
  const cleanHistory = (scoreHistory || []).reduce((acc, curr) => {
    const val = Math.round(Number(curr) || 0);
    if (acc.length === 0 || acc[acc.length - 1] !== val) {
      acc.push(val);
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all">
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="7"
            className="text-slate-100"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-black tracking-tight ${getScoreColor(score)}`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>

      <span className="mt-2 text-xs font-semibold text-slate-700 text-center">{label}</span>

      {cleanHistory.length > 1 && (
        <div className="mt-2.5 flex items-center justify-center flex-wrap gap-1 text-[11px] font-mono">
          <span className="text-slate-400 font-sans text-[10px] uppercase font-bold mr-1">Progression:</span>
          {cleanHistory.map((s, idx) => (
            <React.Fragment key={idx}>
              <span
                className={`px-1.5 py-0.5 rounded-md font-bold border text-[11px] ${
                  idx === cleanHistory.length - 1
                    ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {s}%
              </span>
              {idx < cleanHistory.length - 1 && <span className="text-slate-300">→</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

