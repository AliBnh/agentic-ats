import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Target,
  LayoutGrid
} from 'lucide-react';
import { ScoreMeter } from './ScoreMeter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StepDiagnostic = ({ report, language = 'en', onProceedToMatching }) => {
  const [severityFilter, setSeverityFilter] = useState('ALL');

  if (!report) {
    return (
      <Card className="p-10 text-center text-muted-foreground max-w-xl mx-auto border-dashed">
        <FileSearch className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-bold text-foreground">No Diagnostic Report Available</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Please complete Step 1 (Ingestion & Verification) to generate your health audit.
        </p>
      </Card>
    );
  }

  const {
    overall_health_score = 0,
    ats_formatting_score = 0,
    content_impact_score = 0,
    language_norm_score = 0,
    issues = [],
  } = report;

  const criticalIssues = issues.filter((i) => i.severity === 'CRITICAL');
  const warningIssues = issues.filter((i) => i.severity === 'WARNING');
  const suggestionIssues = issues.filter((i) => i.severity === 'SUGGESTION');

  const filteredIssues = issues.filter((i) => {
    if (severityFilter === 'ALL') return true;
    return i.severity === severityFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5">
          <Badge variant="brand" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Stage 02 // Pre-Targeting Health Diagnostic</span>
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Pre-Job Recruitment Health & ATS Layout Audit
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          Benchmarked against {language === 'fr' ? 'French Market Norms (Norme AFNOR / Recruteur FR)' : 'US/UK Fortune 500 ATS Standard (Greenhouse, Workday, Lever)'}.
        </p>
      </div>

      {/* Scorecards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Overall Health (ScoreMeter) */}
        <ScoreMeter
          score={overall_health_score}
          label="Overall Baseline Health"
          subtitle="Pre-Job Matching"
        />

        {/* Pillar 2: ATS Layout */}
        <Card className="p-5 flex flex-col justify-between shadow-xs border-border/80 relative overflow-hidden card-hover">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>ATS Parseability</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Harvard 1-Col
              </Badge>
            </div>
            <div className="text-3xl font-black text-foreground pt-1">
              {Math.round(ats_formatting_score)}%
            </div>
            <p className="text-[11px] text-muted-foreground">
              Single-column hierarchy, zero table traps, contact schema.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Benchmark Target</span>
              <span className="font-bold text-foreground">90%</span>
            </div>
            <Progress
              value={ats_formatting_score}
              className="h-2"
              indicatorClassName="bg-primary"
            />
          </div>
        </Card>

        {/* Pillar 3: Content Impact & STAR */}
        <Card className="p-5 flex flex-col justify-between shadow-xs border-border/80 relative overflow-hidden card-hover">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Content Impact</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                STAR Metrics
              </Badge>
            </div>
            <div className="text-3xl font-black text-foreground pt-1">
              {Math.round(content_impact_score)}%
            </div>
            <p className="text-[11px] text-muted-foreground">
              Density of active action verbs and quantified business outcomes.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Benchmark Target</span>
              <span className="font-bold text-foreground">85%</span>
            </div>
            <Progress
              value={content_impact_score}
              className="h-2"
              indicatorClassName="bg-indigo-500"
            />
          </div>
        </Card>

        {/* Pillar 4: Regional Compliance */}
        <Card className="p-5 flex flex-col justify-between shadow-xs border-border/80 relative overflow-hidden card-hover">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Regional Norms</span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                {language === 'fr' ? 'AFNOR FR' : 'US EEO'}
              </Badge>
            </div>
            <div className="text-3xl font-black text-foreground pt-1">
              {Math.round(language_norm_score)}%
            </div>
            <p className="text-[11px] text-muted-foreground">
              {language === 'fr'
                ? 'Conventions recruteur France: diplôme, soft skills, clarté.'
                : 'US/UK EEO compliance, contact formatting, page length.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Benchmark Target</span>
              <span className="font-bold text-foreground">95%</span>
            </div>
            <Progress
              value={language_norm_score}
              className="h-2"
              indicatorClassName="bg-emerald-500"
            />
          </div>
        </Card>
      </div>

      {/* Issues Breakdown Matrix */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
              <span>Diagnostic Action Matrix</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {issues.length} {issues.length === 1 ? 'finding' : 'findings'}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Identified vulnerabilities that will be addressed in the Job Targeting remediation loop.
            </p>
          </div>

          {/* Severity Filter Tabs */}
          <Tabs value={severityFilter} onValueChange={setSeverityFilter} className="w-auto">
            <TabsList className="bg-muted/70 h-8">
              <TabsTrigger value="ALL" className="text-xs py-1 px-2.5 font-medium">
                All ({issues.length})
              </TabsTrigger>
              <TabsTrigger value="CRITICAL" className="text-xs py-1 px-2.5 font-medium text-destructive">
                Critical ({criticalIssues.length})
              </TabsTrigger>
              <TabsTrigger value="WARNING" className="text-xs py-1 px-2.5 font-medium text-amber-600 dark:text-amber-400">
                Warnings ({warningIssues.length})
              </TabsTrigger>
              <TabsTrigger value="SUGGESTION" className="text-xs py-1 px-2.5 font-medium text-primary">
                Tips ({suggestionIssues.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredIssues.length === 0 ? (
          <Card className="p-8 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 text-sm flex items-center space-x-3.5 shadow-xs">
            <CheckCircle2 className="w-7 h-7 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-bold text-base">All Filtered Checks Passed!</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                No issues detected under this severity filter.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue, idx) => {
              const isCrit = issue.severity === 'CRITICAL';
              const isWarn = issue.severity === 'WARNING';

              return (
                <Card
                  key={idx}
                  className={`p-5 transition-all shadow-xs border ${
                    isCrit
                      ? 'border-destructive/40 bg-destructive/5'
                      : isWarn
                      ? 'border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-border/80 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 shrink-0">
                        {isCrit ? (
                          <div className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : isWarn ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-sm font-bold text-foreground">
                          {issue.title}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={isCrit ? 'destructive' : isWarn ? 'warning' : 'secondary'}
                      className="text-[10px] font-bold uppercase tracking-wider shrink-0"
                    >
                      {issue.severity}
                    </Badge>
                  </div>

                  {issue.recommendation && (
                    <div className="mt-3.5 pl-10 pt-3 border-t border-border/50">
                      <div className="p-3 rounded-xl bg-card border border-border/60 text-xs flex items-start space-x-2">
                        <span className="font-bold text-primary shrink-0 uppercase tracking-wider text-[10px] mt-0.5">
                          Remediation Plan:
                        </span>
                        <span className="text-foreground/90 font-medium leading-relaxed">
                          {issue.recommendation}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Action Card */}
      <Card className="p-6 bg-gradient-to-r from-card to-accent/40 border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Ready for Targeted Job Alignment?</h4>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg">
            Stage 3 will calculate semantic similarity via Qdrant vector indexing, identify competency gaps, and launch the STAR rewriting loop.
          </p>
        </div>

        <Button
          onClick={onProceedToMatching}
          variant="brand"
          className="px-6 py-3 h-11 font-bold text-sm shadow-sm shadow-brand-600/20 gap-2 shrink-0 active:scale-95 transition-all"
        >
          <span>Proceed to Target Job Alignment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
};
