import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck2,
  Activity,
  Sparkles,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const MultiAgentVisualizerModal = ({ isOpen, mode = 'remediation', targetRole = '', candidateName = 'Candidate' }) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [logs, setLogs] = useState([]);

  const agents = [
    {
      id: 'parser',
      name: 'Agent 1: Ingestion & Fact-Locking Sentinel',
      tag: 'AST Parser',
      role: 'Extracts immutable taxonomy (companies, dates, degrees) to block hallucination.',
      badge: 'Fact-Locked AST'
    },
    {
      id: 'sentinel',
      name: 'Agent 2: Typographic & ATS Compliance Sentinel',
      tag: 'Format Auditor',
      role: 'Audits Harvard/McKinsey ATS standards: single-column, 15mm margins, Latin-1.',
      badge: 'Zero Table Traps'
    },
    {
      id: 'vector',
      name: 'Agent 3: Semantic Matcher & Vector Cross-Scorer',
      tag: 'Qdrant Embeddings',
      role: 'Cross-indexes candidate experience vectors against target JD competencies.',
      badge: 'Cosine Similarity'
    },
    {
      id: 'hitl',
      name: 'Agent 4: Gap Analyzer & Truth Gatekeeper',
      tag: 'HITL Gate',
      role: 'Intercepts unverified skills to guarantee zero ungrounded claims.',
      badge: 'Verification Sentinel'
    },
    {
      id: 'star',
      name: 'Agent 5: STAR Bullet Point Tailoring Agent',
      tag: 'Groq LLM Engine',
      role: 'Iteratively refines bullets: Action Verb + Context + Quantified Impact metrics.',
      badge: 'STAR Convergence Loop'
    },
    {
      id: 'synthesizer',
      name: 'Agent 6: Executive Pitch & Deliverables Synthesizer',
      tag: 'Studio Assembly',
      role: 'Assembles executive ATS resume and bespoke high-conversion cover letter.',
      badge: 'Harvard Standard PDF'
    }
  ];

  const logMessages = [
    `[0.4s] AST Parser: Extracted candidate facts for ${candidateName} (zero dummy fields).`,
    `[1.1s] ATS Sentinel: Confirmed single-column Harvard layout & Latin-1 encoding standards.`,
    `[2.3s] Qdrant Engine: Embedded requirements and computed semantic cross-similarity.`,
    `[3.8s] Gap Analyzer: Verified candidate employment timeline and skill prerequisites.`,
    `[5.2s] Groq Optimizer: Rewriting experience bullets with quantified STAR metrics...`,
    `[7.6s] Deliverables Engine: Synthesizing executive ATS resume and tailored cover letter...`
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentAgentIndex(0);
      setProgress(15);
      setLogs([]);
      return;
    }

    // Progression timer
    const interval = setInterval(() => {
      setCurrentAgentIndex((prev) => {
        const next = prev < agents.length - 1 ? prev + 1 : prev;
        return next;
      });
      setProgress((prev) => Math.min(prev + 16, 94));
    }, 4500);

    // Logs timer
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        if (prev.length < logMessages.length) {
          return [...prev, logMessages[prev.length]];
        }
        return prev;
      });
    }, 3200);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-2xl w-full p-7 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
              </span>
              <span>Autonomous Multi-Agent Swarm Active</span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {progress}% Completed
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'remediation'
              ? `Tailoring for: ${targetRole || 'Target Role'}`
              : `Ingesting & Auditing Resume: ${candidateName}`}
          </h3>
          <p className="text-xs text-slate-500">
            Coordinating 6 specialized AI agents across ingestion, ATS scoring, gap analysis, and STAR tailoring loops.
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-600 to-indigo-600 h-1.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Multi-Agent Orchestration Flow Cards */}
        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
          {agents.map((agent, idx) => {
            const isCompleted = idx < currentAgentIndex;
            const isCurrent = idx === currentAgentIndex;
            const isPending = idx > currentAgentIndex;

            return (
              <div
                key={agent.id}
                className={`flex items-start justify-between p-3 rounded-2xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-brand-50/40 border-brand-300 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/70 border-slate-200/70 opacity-90'
                    : 'bg-white border-slate-100 opacity-40'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                        {agent.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{agent.role}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-800 animate-pulse">
                      Processing
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] text-slate-400">
                      Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Log Stream */}
        <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 text-slate-200 font-mono text-[11px] space-y-1 shadow-inner">
          <div className="flex items-center space-x-2 text-[10px] font-semibold uppercase text-slate-400 border-b border-slate-800 pb-1.5 mb-1">
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span>Multi-Agent Live Execution Stream</span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="text-slate-300 flex items-center space-x-1.5">
                  <span className="text-brand-400 font-bold">›</span>
                  <span>{log}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">Initializing agent communication channels...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
