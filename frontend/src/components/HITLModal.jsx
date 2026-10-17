import React, { useState } from 'react';
import { UserCheck, Check, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
  loading = false
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
      <DialogContent className="max-w-lg p-6 space-y-4">
        {/* Header */}
        <DialogHeader className="space-y-3">
          <div className="flex items-start space-x-3.5 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-border">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
                  Ethical Truth Gate (HITL)
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">LangGraph Checkpoint Paused</span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground">Skill Verification Required</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Verify whether candidate has specific skills before proceeding with resume tailoring
          </DialogDescription>
        </DialogHeader>

        {/* Question & Context */}
        <div className="space-y-3">
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {question}
          </p>

          {context && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground italic">
              <span className="text-primary font-semibold not-italic">From Job Description: </span>
              "{context}"
            </div>
          )}
        </div>

        {/* Form Options */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Your Verification Response:
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setSelectedDecision('APPROVED')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'APPROVED'
                    ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Yes, I have hands-on experience with <strong className="text-foreground">{skill}</strong></span>
                </div>
              </div>

              <div
                onClick={() => setSelectedDecision('TRANSFERABLE')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'TRANSFERABLE'
                    ? 'bg-indigo-500/10 border-indigo-500 text-foreground font-semibold shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>I have equivalent / transferable knowledge to highlight</span>
                </div>
              </div>

              <div
                onClick={() => setSelectedDecision('DECLINED')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDecision === 'DECLINED'
                    ? 'bg-destructive/10 border-destructive text-destructive font-semibold shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5 text-xs">
                  <X className="w-4 h-4 text-destructive shrink-0" />
                  <span>No, do not include (Maintain 100% truthfulness)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional context notes */}
          {selectedDecision !== 'DECLINED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Optional Details / Scope (e.g., "1 year in production with AWS ECS"):
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Give brief context for the rewriter agent..."
                className="text-xs bg-muted/20 focus-visible:bg-background"
              />
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              variant="brand"
              className="w-full py-3 h-auto font-semibold text-sm shadow-sm gap-2"
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
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
