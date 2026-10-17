import React, { useState } from 'react';
import {
  UserCheck,
  Check,
  X,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldAlert,
  Quote,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const HITLModal = ({
  hitlData,
  onResolve,
  loading = false,
}) => {
  if (!hitlData || !hitlData.hitl_question) return null;

  const { skill, question, context } = hitlData.hitl_question;
  const [selectedDecision, setSelectedDecision] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(skill, selectedDecision, notes);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-6 sm:p-7 space-y-5 border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="space-y-3">
          <div className="flex items-start space-x-3.5 border-b border-border/70 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
                  Ethical Truth Gate (HITL)
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  LangGraph Checkpoint Paused
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Skill Claim Verification Required
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Verify whether candidate has specific skills before proceeding with resume tailoring
          </DialogDescription>
        </DialogHeader>

        {/* Question & Context Box */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
            {question}
          </p>

          {context && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center space-x-1 text-primary font-bold text-[11px] uppercase tracking-wider">
                <Quote className="w-3 h-3" />
                <span>Excerpt from Job Requirements:</span>
              </div>
              <p className="italic text-foreground/80 pl-4 border-l-2 border-primary/40">
                "{context}"
              </p>
            </div>
          )}
        </div>

        {/* Decision Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Select Your Verification Response:
            </label>

            <div className="space-y-2">
              {/* Option 1: APPROVED */}
              <div
                onClick={() => setSelectedDecision('APPROVED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all card-hover ${
                  selectedDecision === 'APPROVED'
                    ? 'bg-emerald-500/10 border-emerald-500 text-foreground font-semibold shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-card border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-foreground">
                      Yes, I have hands-on experience with <strong className="text-primary">{skill}</strong>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Permits the STAR rewriter to showcase this skill with active verbs and business outcomes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: TRANSFERABLE */}
              <div
                onClick={() => setSelectedDecision('TRANSFERABLE')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all card-hover ${
                  selectedDecision === 'TRANSFERABLE'
                    ? 'bg-indigo-500/10 border-indigo-500 text-foreground font-semibold shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-card border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-foreground">
                      I have transferable or equivalent knowledge to highlight
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Frames existing skills as a strong foundation without claiming ungrounded mastery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 3: DECLINED */}
              <div
                onClick={() => setSelectedDecision('DECLINED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all card-hover ${
                  selectedDecision === 'DECLINED'
                    ? 'bg-destructive/10 border-destructive text-destructive font-semibold shadow-xs ring-1 ring-destructive/30'
                    : 'bg-card border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
                    <X className="w-3 h-3" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-destructive">
                      No, do not include (Maintain 100% truthfulness)
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Omit this skill entirely to protect credibility and ATS audit compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional context notes */}
          {selectedDecision !== 'DECLINED' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-foreground">
                Optional Context / Scope (e.g. "1 year in production with Docker & AWS"):
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give brief context for the rewriter agent..."
                className="text-xs h-9 bg-muted/20 focus-visible:bg-background"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="brand"
              className="w-full py-3 h-11 font-bold text-sm shadow-sm shadow-brand-600/20 gap-2 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resuming LangGraph Tailoring Loop...</span>
                </>
              ) : (
                <>
                  <span>Confirm Verification & Resume Tailoring</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
