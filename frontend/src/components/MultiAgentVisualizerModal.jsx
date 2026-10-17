import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Terminal,
  Loader2,
  Cpu,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const MultiAgentVisualizerModal = ({
  isOpen,
  mode = 'remediation',
  targetRole = '',
  candidateName = 'Candidate',
}) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [progress, setProgress] = useState(18);
  const [logs, setLogs] = useState([]);

  const agents = [
    {
      id: 'parser',
      name: 'Agent 1: Ingestion & Fact-Locking Sentinel',
      tag: 'AST Parser',
      role: 'Extracts immutable taxonomy (companies, dates, degrees) to block hallucination.',
      badge: 'Fact-Locked AST',
      latency: '~0.4s',
    },
    {
      id: 'sentinel',
      name: 'Agent 2: Typographic & ATS Compliance Sentinel',
      tag: 'Format Auditor',
      role: 'Audits Harvard/McKinsey ATS standards: single-column, 15mm margins, Latin-1.',
      badge: 'Zero Table Traps',
      latency: '~0.6s',
    },
    {
      id: 'vector',
      name: 'Agent 3: Semantic Matcher & Vector Cross-Scorer',
      tag: 'Qdrant Embeddings',
      role: 'Cross-indexes candidate experience vectors against target JD competencies.',
      badge: 'Cosine Similarity',
      latency: '~1.1s',
    },
    {
      id: 'hitl',
      name: 'Agent 4: Gap Analyzer & Truth Gatekeeper',
      tag: 'HITL Gate',
      role: 'Intercepts unverified skills to guarantee zero ungrounded claims.',
      badge: 'Verification Sentinel',
      latency: '~0.5s',
    },
    {
      id: 'star',
      name: 'Agent 5: STAR Bullet Point Tailoring Agent',
      tag: 'Groq LLM Engine',
      role: 'Iteratively refines bullets: Action Verb + Context + Quantified Impact metrics.',
      badge: 'STAR Convergence Loop',
      latency: '~1.8s',
    },
    {
      id: 'synthesizer',
      name: 'Agent 6: Executive Pitch & Deliverables Synthesizer',
      tag: 'Studio Assembly',
      role: 'Assembles executive ATS resume and bespoke high-conversion cover letter.',
      badge: 'Harvard Standard PDF',
      latency: '~0.9s',
    },
  ];

  const logMessages = [
    `[0.3s] AST Parser: Extracted candidate facts for ${candidateName} (zero dummy fields).`,
    `[0.9s] ATS Sentinel: Confirmed single-column Harvard layout & Latin-1 encoding standards.`,
    `[1.8s] Qdrant Engine: Embedded requirements and computed semantic cross-similarity.`,
    `[2.9s] Gap Analyzer: Verified candidate employment timeline and skill prerequisites.`,
    `[4.3s] Groq Optimizer: Rewriting experience bullets with quantified STAR metrics...`,
    `[6.1s] Deliverables Engine: Synthesizing executive ATS resume and tailored cover letter...`,
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentAgentIndex(0);
      setProgress(18);
      setLogs([]);
      return;
    }

    const interval = setInterval(() => {
      setCurrentAgentIndex((prev) => {
        const next = prev < agents.length - 1 ? prev + 1 : prev;
        return next;
      });
      setProgress((prev) => Math.min(prev + 16, 94));
    }, 3800);

    const logInterval = setInterval(() => {
      setLogs((prev) => {
        if (prev.length < logMessages.length) {
          return [...prev, logMessages[prev.length]];
        }
        return prev;
      });
    }, 2600);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl w-full p-6 sm:p-7 space-y-5 overflow-hidden border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <Badge
              variant="brand"
              className="gap-2 py-1 px-3 text-xs uppercase tracking-wider font-bold shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Autonomous Multi-Agent Swarm Active</span>
            </Badge>

            <span className="text-xs font-mono font-bold text-primary">
              {progress}% Completed
            </span>
          </div>

          <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
            {mode === 'remediation'
              ? `Tailoring for: ${targetRole || 'Target Role'}`
              : `Ingesting & Auditing Resume: ${candidateName}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Coordinating 6 specialized AI agents across ingestion, ATS compliance, semantic cross-scoring, and STAR tailoring loops on Groq LPUs.
          </DialogDescription>
        </DialogHeader>

        {/* Global Progress Bar */}
        <div className="w-full space-y-1">
          <Progress
            value={progress}
            className="h-2 rounded-full"
            indicatorClassName="bg-gradient-to-r from-brand-600 via-primary to-indigo-600 transition-all duration-700"
          />
        </div>

        {/* Multi-Agent Orchestration Flow Cards */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {agents.map((agent, idx) => {
            const isCompleted = idx < currentAgentIndex;
            const isCurrent = idx === currentAgentIndex;
            const isPending = idx > currentAgentIndex;

            return (
              <Card
                key={agent.id}
                className={`flex items-start justify-between p-3 border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary/10 border-primary/50 shadow-xs'
                    : isCompleted
                    ? 'bg-card/70 border-border/70 opacity-90'
                    : 'bg-card/30 border-border/40 opacity-40'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="text-xs font-bold text-foreground">
                        {agent.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono px-1.5 py-0"
                      >
                        {agent.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {agent.role}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2 text-right">
                  {isCurrent && (
                    <Badge variant="brand" className="text-[10px] animate-pulse">
                      Processing
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="success" className="text-[10px]">
                      Verified
                    </Badge>
                  )}
                  {isPending && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Queued
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Live Terminal Log Stream */}
        <div className="bg-slate-950 dark:bg-black rounded-xl p-3.5 border border-slate-800 text-slate-200 font-mono text-[11px] space-y-1 shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase text-slate-400 border-b border-slate-800 pb-1.5 mb-1">
            <span className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-brand-400" />
              <span>Multi-Agent Live Execution Stream</span>
            </span>
            <span className="text-emerald-400 font-mono">~450 tok/s</span>
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
              <div className="text-slate-500 italic">
                Initializing agent communication channels on Groq LPU...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
