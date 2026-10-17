import React, { useState, useEffect } from 'react';
import {
  Target,
  ArrowRight,
  Loader2,
  Sparkles,
  BookOpen,
  Building2,
  Briefcase,
  CheckCircle2,
  Cpu,
  Layers,
  Search,
  Zap,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StepJobMatching = ({
  threadId,
  sampleJDs = [],
  onStartRemediation,
  initialJd = '',
  initialRole = '',
  loading = false,
}) => {
  const [jobDescription, setJobDescription] = useState(initialJd);
  const [targetRole, setTargetRole] = useState(initialRole);
  const [selectedJdId, setSelectedJdId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (initialJd) setJobDescription(initialJd);
    if (initialRole) setTargetRole(initialRole);
  }, [initialJd, initialRole]);

  const quickRoles = [
    'Senior AI / GenAI Engineer',
    'Consultant Stratégie SI & AMOA',
    'Full Stack Cloud Architect',
    'Senior Cybersecurity Consultant',
    'Lead Data Scientist & ML Engineer'
  ];

  const handleSelectSample = (jd) => {
    setSelectedJdId(jd.id);
    setJobDescription(jd.text);
    setTargetRole(jd.title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    onStartRemediation(jobDescription, targetRole);
  };

  const wordCount = (jobDescription || '').trim().split(/\s+/).filter(Boolean).length;

  const filteredJDs = sampleJDs.filter((jd) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'FR') return jd.language === 'fr';
    if (categoryFilter === 'EN') return jd.language === 'en';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5">
          <Badge variant="brand" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>Stage 03 // Semantic Vector Matching & Remediation Loop</span>
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Job Description Targeting & Remediation
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          The agent will cross-index candidate vectors against target role competencies using Qdrant embeddings, intercept unverified skills at the Truth Gate, and run the STAR optimization loop.
        </p>
      </div>

      {/* Real-World Curated Job Library */}
      {sampleJDs.length > 0 && (
        <Card className="border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                  Curated Real-World Job Postings Library (1-Click Fill)
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Select from verified enterprise job descriptions across top tier employers.
                </CardDescription>
              </div>
            </div>

            {/* Language filter */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto">
              <TabsList className="bg-muted/70 h-8">
                <TabsTrigger value="ALL" className="text-xs py-1 px-2.5">
                  All Postings ({sampleJDs.length})
                </TabsTrigger>
                <TabsTrigger value="EN" className="text-xs py-1 px-2.5">
                  English ({sampleJDs.filter((j) => j.language === 'en').length})
                </TabsTrigger>
                <TabsTrigger value="FR" className="text-xs py-1 px-2.5">
                  Français ({sampleJDs.filter((j) => j.language === 'fr').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredJDs.map((jd) => {
                const isSelected = selectedJdId === jd.id;
                return (
                  <div
                    key={jd.id}
                    onClick={() => handleSelectSample(jd)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all card-hover flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs font-semibold'
                        : 'border-border/80 bg-card hover:bg-accent/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-foreground line-clamp-2 leading-snug">
                        {jd.title}
                      </span>
                      <Badge
                        variant={jd.language === 'fr' ? 'brand' : 'success'}
                        className="text-[9px] uppercase font-mono px-1.5 py-0 shrink-0"
                      >
                        {jd.language}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span className="truncate">Click to Load</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Alignment Form */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Role Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span>Target Job Title / Position:</span>
                </label>
                <span className="text-[11px] text-muted-foreground">e.g. Lead, Senior, Consultant</span>
              </div>

              <Input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer (Python, React, Cloud), IT Strategy Consultant..."
                className="text-xs h-10 bg-muted/20 focus-visible:bg-background transition-colors font-medium"
              />

              {/* Quick role pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                  Suggestions:
                </span>
                {quickRoles.map((role, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setTargetRole(role)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-secondary-foreground border border-border/60 transition-colors"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-foreground flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Job Description & Qualifications:</span>
                </label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {wordCount} words
                </span>
              </div>

              <Textarea
                rows={12}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description, responsibilities, and required qualifications here..."
                className="font-mono text-xs p-4 bg-muted/20 focus-visible:bg-background transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Agent Swarm Pipeline Status Card */}
            <div className="p-4 rounded-xl bg-accent/40 border border-border/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <span>Multi-Agent Remediation Orchestration:</span>
                </span>
                <Badge variant="brand" className="font-mono text-[10px]">
                  6 Agents Swarm
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                <div className="p-2 rounded-lg bg-card border border-border/60 space-y-0.5">
                  <div className="font-bold text-foreground">1. Qdrant Match</div>
                  <div>Semantic Cosine Scorer</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/60 space-y-0.5">
                  <div className="font-bold text-foreground">2. Truth Gate</div>
                  <div>HITL Skill Interceptor</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/60 space-y-0.5">
                  <div className="font-bold text-foreground">3. STAR Optimizer</div>
                  <div>Quantified Bullet Rewrite</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/60 space-y-0.5">
                  <div className="font-bold text-foreground">4. Harvard PDF</div>
                  <div>1-Page ATS Standard</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              disabled={loading || !jobDescription.trim()}
              className="w-full py-3.5 h-12 bg-gradient-to-r from-brand-600 via-primary to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-brand-600/25 gap-2 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Multi-Agent Swarm Tailoring on Groq LPU...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Launch Autonomous Multi-Agent Remediation</span>
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
