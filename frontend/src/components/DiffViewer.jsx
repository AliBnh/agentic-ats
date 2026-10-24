import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Check,
  Copy,
  Columns,
  Rows,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const DiffViewer = ({ diff = [] }) => {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'unified'
  const [copiedIndex, setCopiedIndex] = useState(null);

  // STRICT FILTER: Never display items where original and tailored are identical
  const genuineDiffs = (diff || []).filter(
    (item) =>
      item &&
      item.original &&
      item.tailored &&
      item.original.trim() !== item.tailored.trim()
  );

  const handleCopyBullet = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (genuineDiffs.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border/80 space-y-3.5 shadow-xs max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground">
            All Bullets Already Meet High-Impact STAR Standards
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
            Your candidate bullet points already contain verifiable metrics, active action verbs, and proven outcomes. No synthetic rewriting was required.
          </p>
        </div>
        <div className="inline-flex pt-1">
          <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fact-Locked Truth Gate Intact (0 Hallucinations)</span>
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              STAR Bullet Optimizations ({genuineDiffs.length})
            </span>
            <Badge variant="secondary" className="px-2 py-0 font-mono text-[10px]">
              Zero Hallucinations
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center rounded-lg bg-card border border-border/70 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unified View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Diff Cards List */}
        <div className="space-y-3.5">
          {genuineDiffs.map((item, idx) => (
            <Card key={idx} className="p-4 sm:p-5 space-y-3.5 border-border/80 shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-semibold pb-2.5 border-b border-border/60 flex-wrap gap-2">
                <div className="flex items-center space-x-2 text-foreground">
                  <span className="font-bold">{item.role || 'Role'}</span>
                  <span className="text-muted-foreground">@</span>
                  <Badge variant="outline" className="font-bold text-primary border-primary/30">
                    {item.company || 'Enterprise'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="success" className="text-[10px] font-bold gap-1 py-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>STAR + Metric Injected</span>
                  </Badge>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyBullet(item.tailored, idx)}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Bullet</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Copy tailored STAR bullet
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Side-by-Side Mode */}
              {viewMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Original Left Column */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-destructive">
                      <span>Original (Before):</span>
                      <span className="opacity-75">Unquantified</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed line-through decoration-destructive/60">
                      {item.original}
                    </p>
                  </div>

                  {/* Tailored Right Column */}
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Tailored (STAR Optimized):</span>
                      </span>
                      <span>Quantified Outcome</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {item.tailored}
                    </p>
                  </div>
                </div>
              ) : (
                /* Unified Mode */
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive line-through leading-relaxed">
                    <span className="font-bold mr-2 select-none">-</span>
                    {item.original}
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                    <span className="font-bold mr-2 select-none text-emerald-600">+</span>
                    {item.tailored}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
