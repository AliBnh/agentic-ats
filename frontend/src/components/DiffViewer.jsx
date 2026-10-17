import React from 'react';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

export const DiffViewer = ({ diff = [] }) => {
  if (!diff || diff.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No bullet diff records available. Run tailoring to inspect line-by-line enhancements.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Line-by-Line Bullet Optimizations ({diff.length})
        </span>
        <span className="text-[11px] text-brand-700 font-mono font-semibold">STAR Methodology Applied</span>
      </div>

      <div className="space-y-3">
        {diff.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-100 pb-2">
              <span className="text-slate-800">
                {item.role} @ <strong className="text-brand-700">{item.company}</strong>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Quantified STAR
              </span>
            </div>

            {/* Original */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Before (Original):</span>
              <p className="text-xs text-slate-600 line-through bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 font-mono">
                {item.original}
              </p>
            </div>

            {/* Tailored */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">After (Optimized):</span>
              <p className="text-xs text-slate-900 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 font-medium">
                {item.tailored}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
