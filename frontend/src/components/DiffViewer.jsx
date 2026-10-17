import React from 'react';
import { CheckCircle2, Sparkles, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const DiffViewer = ({ diff = [] }) => {
  // STRICT FILTER: Never display items where original and tailored are identical
  const genuineDiffs = (diff || []).filter(
    (item) => item && item.original && item.tailored && item.original.trim() !== item.tailored.trim()
  );

  if (genuineDiffs.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            All Experience Bullets Already Meet High-Impact STAR Standards
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            Your candidate bullet points already contain verifiable metrics, active action verbs, and proven outcomes. No fabrication or synthetic rewriting was required.
          </p>
        </div>
        <div className="inline-flex">
          <Badge variant="success" className="gap-1.5 py-1 px-3 text-[11px] font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Fact-Locked Truth Gate Intact (0 Hallucinations)</span>
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Line-by-Line Bullet Optimizations ({genuineDiffs.length})
        </span>
        <Badge variant="brand" className="gap-1 font-mono text-[11px] font-semibold py-0.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STAR Methodology & Target Keywords Applied</span>
        </Badge>
      </div>

      <div className="space-y-3">
        {genuineDiffs.map((item, idx) => (
          <Card
            key={idx}
            className="p-4 space-y-3 border-border shadow-xs"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground border-b border-border/60 pb-2">
              <span className="text-foreground">
                {item.role} @ <strong className="text-primary font-bold">{item.company}</strong>
              </span>
              <Badge variant="success" className="text-[10px] font-bold">
                STAR Optimized
              </Badge>
            </div>

            {/* Original */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-destructive tracking-wider">Before (Original):</span>
              <p className="text-xs text-muted-foreground line-through bg-destructive/5 p-2.5 rounded-lg border border-destructive/20 font-mono">
                {item.original}
              </p>
            </div>

            {/* Tailored */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">After (Optimized):</span>
              <p className="text-xs text-foreground bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 font-medium">
                {item.tailored}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
