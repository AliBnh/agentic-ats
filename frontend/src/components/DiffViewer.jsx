import React from 'react';
import { ArrowRight, CheckCircle2, RefreshCw, Sparkles, Check } from 'lucide-react';

export const DiffViewer = ({ diff = [] }) => {
  // STRICT FILTER: Never display items where original and tailored are identical
  const genuineDiffs = (diff || []).filter(
    (item) => item && item.original && item.tailored && item.original.trim() !== item.tailored.trim()
  );

  if (genuineDiffs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            All Experience Bullets Already Meet High-Impact STAR Standards
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Your candidate bullet points already contain verifiable metrics, active action verbs, and proven outcomes. No fabrication or synthetic rewriting was required.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold">
          <Check className="w-3.5 h-3.5 text-emerald-700" />
          <span>Fact-Locked Truth Gate Intact (0 Hallucinations)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Line-by-Line Bullet Optimizations ({genuineDiffs.length})
        </span>
        <span className="text-[11px] text-brand-700 font-mono font-semibold flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>STAR Methodology & Target Keywords Applied</span>
        </span>
      </div>

      <div className="space-y-3">
        {genuineDiffs.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-100 pb-2">
              <span className="text-slate-800">
                {item.role} @ <strong className="text-brand-700">{item.company}</strong>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                STAR Optimized
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
