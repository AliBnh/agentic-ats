import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Check, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const HITLModal = ({
  hitlData,
  onResolve,
  loading = false
}) => {
  if (!hitlData || !hitlData.hitl_question) return null;

  const { skill, question, context, options = [] } = hitlData.hitl_question;
  const [selectedDecision, setSelectedDecision] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(skill, selectedDecision, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start space-x-3.5 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 border border-brand-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Ethical Truth Gate (HITL)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">LangGraph Checkpoint Paused</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Skill Verification Required</h3>
          </div>
        </div>

        {/* Question & Context */}
        <div className="space-y-3">
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {question}
          </p>

          {context && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
              <span className="text-brand-700 font-semibold not-italic">From Job Description: </span>
              "{context}"
            </div>
          )}
        </div>

        {/* Form Options */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Select Your Verification Response:
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setSelectedDecision('APPROVED')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'APPROVED'
                    ? 'bg-brand-50 border-brand-500 text-brand-900 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Yes, I have hands-on experience with <strong>{skill}</strong></span>
                </div>
                <input
                  type="radio"
                  name="hitl_choice"
                  checked={selectedDecision === 'APPROVED'}
                  onChange={() => setSelectedDecision('APPROVED')}
                  className="hidden"
                />
              </label>

              <label
                onClick={() => setSelectedDecision('TRANSFERABLE')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'TRANSFERABLE'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>I have equivalent / transferable knowledge to highlight</span>
                </div>
                <input
                  type="radio"
                  name="hitl_choice"
                  checked={selectedDecision === 'TRANSFERABLE'}
                  onChange={() => setSelectedDecision('TRANSFERABLE')}
                  className="hidden"
                />
              </label>

              <label
                onClick={() => setSelectedDecision('DECLINED')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'DECLINED'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <X className="w-4 h-4 text-rose-600" />
                  <span>No, do not include (Maintain 100% truthfulness)</span>
                </div>
                <input
                  type="radio"
                  name="hitl_choice"
                  checked={selectedDecision === 'DECLINED'}
                  onChange={() => setSelectedDecision('DECLINED')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Optional context notes */}
          {selectedDecision !== 'DECLINED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Optional Details / Scope (e.g., "1 year in production with AWS ECS"):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give brief context for the rewriter agent..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-brand-600/20 flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resuming LangGraph Execution...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Resume Agent Optimization</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

