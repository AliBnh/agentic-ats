import React, { useState, useEffect } from 'react';
import { Target, Zap, ArrowRight, Loader2, Sparkles, BookOpen } from 'lucide-react';

export const StepJobMatching = ({
  threadId,
  sampleJDs = [],
  onStartRemediation,
  initialJd = '',
  initialRole = '',
  loading = false
}) => {
  const [jobDescription, setJobDescription] = useState(initialJd);
  const [targetRole, setTargetRole] = useState(initialRole);

  useEffect(() => {
    if (initialJd) setJobDescription(initialJd);
    if (initialRole) setTargetRole(initialRole);
  }, [initialJd, initialRole]);

  const handleSelectSample = (jd) => {
    setJobDescription(jd.text);
    setTargetRole(jd.title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    onStartRemediation(jobDescription, targetRole);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-xs">
          <Target className="w-3.5 h-3.5 text-brand-600" />
          <span>Stage 2: Target Role Alignment</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Job Description Targeting & Remediation
        </h2>
        <p className="text-sm text-slate-500">
          The agent will compare your CV against this job, calculate semantic match via Qdrant, check for missing skills, and run the STAR optimization loop.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        {/* Sample JD Quick Fill */}
        {sampleJDs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Or load a real-world target job posting (1-Click):</span>
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {sampleJDs.map((jd) => (
                <button
                  type="button"
                  key={jd.id}
                  onClick={() => handleSelectSample(jd)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-medium border border-slate-200 hover:border-brand-300 transition-all shadow-xs flex items-center space-x-1.5 active:scale-95"
                >
                  <span className="truncate max-w-[220px]">{jd.title}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                    jd.language === 'fr' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {jd.language}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target Role Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Target Job Title / Role:
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Software Engineer, Lead Data Scientist, Consultant..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Job Description Text Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Job Description / Requirements:
          </label>
          <textarea
            rows={10}
            required
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description and requirements here..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || !jobDescription.trim()}
          className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-brand-600/20 flex items-center justify-center space-x-2.5 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Multi-Agent Engine Running (Evaluating & Tailoring on Groq)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Run Multi-Agent Autonomous Remediation</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

