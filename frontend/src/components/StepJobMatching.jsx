import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
        <div className="inline-flex items-center space-x-1.5">
          <Badge variant="brand" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>Stage 2: Target Role Alignment</span>
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Job Description Targeting & Remediation
        </h2>
        <p className="text-sm text-muted-foreground">
          The agent will compare your CV against this job, calculate semantic match via Qdrant, check for missing skills, and run the STAR optimization loop.
        </p>
      </div>

      {/* Form */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sample JD Quick Fill */}
            {sampleJDs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Or load a real-world target job posting (1-Click):</span>
                </span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {sampleJDs.map((jd) => (
                    <button
                      type="button"
                      key={jd.id}
                      onClick={() => handleSelectSample(jd)}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary/80 hover:bg-accent text-secondary-foreground text-xs font-medium border border-border hover:border-primary/40 transition-all shadow-2xs flex items-center space-x-1.5 active:scale-95"
                    >
                      <span className="truncate max-w-[220px]">{jd.title}</span>
                      <Badge
                        variant={jd.language === 'fr' ? 'brand' : 'success'}
                        className="text-[10px] uppercase font-bold px-1.5 py-0"
                      >
                        {jd.language}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target Role Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Job Title / Role:
              </label>
              <Input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer, Lead Data Scientist, Consultant..."
                className="text-xs bg-muted/20 focus-visible:bg-background transition-colors"
              />
            </div>

            {/* Job Description Text Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Job Description / Requirements:
              </label>
              <Textarea
                rows={10}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste target job description and requirements here..."
                className="font-mono text-xs p-4 bg-muted/20 focus-visible:bg-background transition-colors resize-y"
              />
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className="w-full py-3.5 h-auto bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-sm shadow-brand-600/20 gap-2 active:scale-[0.99] transition-all"
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
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
