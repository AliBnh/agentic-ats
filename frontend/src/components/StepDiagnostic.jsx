import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScoreMeter } from './ScoreMeter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const StepDiagnostic = ({ report, language = 'en', onProceedToMatching }) => {
  if (!report) {
    return (
      <Card className="p-8 text-center text-muted-foreground max-w-xl mx-auto border-dashed">
        <p className="text-sm">No diagnostic report found. Please complete Step 1 first.</p>
      </Card>
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
        <div className="inline-flex items-center space-x-1.5">
          <Badge variant="brand" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Stage 1 Diagnostic: Standalone Resume Health</span>
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Pre-Job Recruitment Health & Format Audit
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Evaluated against {language === 'fr' ? 'French (Norme Française)' : 'US/UK ATS & Recruiter'} industry benchmarks.
        </p>
      </div>

      {/* Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreMeter
          score={overall_health_score}
          label="Overall CV Health"
        />

        <Card className="p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ATS Parseability</div>
            <div className="text-2xl font-black text-foreground mt-1">{Math.round(ats_formatting_score)}%</div>
          </div>
          <div className="mt-3">
            <Progress value={ats_formatting_score} className="h-2" indicatorClassName="bg-primary" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Section structure & contact layout</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Content & STAR Verbs</div>
            <div className="text-2xl font-black text-foreground mt-1">{Math.round(content_impact_score)}%</div>
          </div>
          <div className="mt-3">
            <Progress value={content_impact_score} className="h-2" indicatorClassName="bg-indigo-500" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Quantifiable metrics & action verbs</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cultural / Regional Norms</div>
            <div className="text-2xl font-black text-foreground mt-1">{Math.round(language_norm_score)}%</div>
          </div>
          <div className="mt-3">
            <Progress value={language_norm_score} className="h-2" indicatorClassName="bg-emerald-500" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {language === 'fr' ? 'Conventions recruteurs FR' : 'US/UK EEO compliance'}
          </p>
        </Card>
      </div>

      {/* Issues Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center space-x-2">
            <span>Identified Remediation Actions</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {issues.length}
            </Badge>
          </h3>
        </div>

        {issues.length === 0 ? (
          <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 text-sm flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-bold">Exceptional CV Health!</span> No critical formatting or content violations detected.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, idx) => {
              const isCrit = issue.severity === 'CRITICAL';
              const isWarn = issue.severity === 'WARNING';

              return (
                <Card
                  key={idx}
                  className={`p-4 transition-all shadow-xs ${
                    isCrit
                      ? 'border-destructive/40 bg-destructive/5'
                      : isWarn
                      ? 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      {isCrit ? (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      <span className="text-xs font-bold text-foreground">{issue.title}</span>
                    </div>

                    <Badge
                      variant={isCrit ? "destructive" : isWarn ? "warning" : "secondary"}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {issue.severity}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 pl-6">{issue.description}</p>

                  <div className="mt-2.5 pl-6 pt-2 border-t border-border/60 flex items-start space-x-2 text-xs">
                    <span className="font-semibold text-primary flex-shrink-0">Action Plan:</span>
                    <span className="text-foreground/90">{issue.recommendation}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Action */}
      <div className="pt-4 flex justify-end">
        <Button
          onClick={onProceedToMatching}
          variant="brand"
          className="px-6 py-3 h-auto font-semibold text-sm shadow-sm gap-2"
        >
          <span>Proceed to Target Job Alignment</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
