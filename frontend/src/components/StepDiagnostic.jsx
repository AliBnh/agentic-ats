import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScoreMeter } from './ScoreMeter';

export const StepDiagnostic = ({ report, language = 'en', onProceedToMatching }) => {
  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500">
        No diagnostic report found. Please complete Step 1 first.
      </div>
    );
  }

  const {
    overall_health_score,
    ats_formatting_score,
    content_impact_score,
    language_norm_score,
    issues = []
  } = report;

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const warningIssues = issues.filter(i => i.severity === 'WARNING');
  const suggestionIssues = issues.filter(i => i.severity === 'SUGGESTION');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Stage 1 Diagnostic: Standalone Resume Health</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pre-Job Recruitment Health & Format Audit
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Evaluated against {language === 'fr' ? 'French (Norme Française)' : 'US/UK ATS & Recruiter'} industry benchmarks.
        </p>
      </div>

      {/* Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreMeter
          score={overall_health_score}
          label="Overall CV Health"
        />

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Parseability</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{Math.round(ats_formatting_score)}%</div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${ats_formatting_score}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Section structure & contact layout</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content & STAR Verbs</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{Math.round(content_impact_score)}%</div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${content_impact_score}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Quantifiable metrics & action verbs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cultural / Regional Norms</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{Math.round(language_norm_score)}%</div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${language_norm_score}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {language === 'fr' ? 'Conventions recruteurs FR' : 'US/UK EEO compliance'}
          </p>
        </div>
      </div>

      {/* Issues Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <span>Identified Remediation Actions ({issues.length})</span>
        </h3>

        {issues.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">Exceptional CV Health!</span> No critical formatting or content violations detected.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const isCrit = issue.severity === 'CRITICAL';
              const isWarn = issue.severity === 'WARNING';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all shadow-xs ${
                    isCrit
                      ? 'bg-rose-50/50 border-rose-200'
                      : isWarn
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      {isCrit ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-900">{issue.title}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        isCrit
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : isWarn
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 pl-6">{issue.description}</p>

                  <div className="mt-2.5 pl-6 pt-2 border-t border-slate-100 flex items-start space-x-2 text-xs">
                    <span className="font-semibold text-brand-700 flex-shrink-0">Action Plan:</span>
                    <span className="text-slate-700">{issue.recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Action */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onProceedToMatching}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl shadow-sm shadow-brand-600/20 flex items-center space-x-2 transition-all active:scale-[0.98]"
        >
          <span>Proceed to Target Job Alignment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
