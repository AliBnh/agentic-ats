import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const ScoreMeter = ({
  score = 0,
  label = 'ATS Match Score',
  scoreHistory = [],
  subtitle = '',
}) => {
  const roundedScore = Math.round(Number(score) || 0);
  const cleanHistory = scoreHistory.reduce((history, current) => {
    const value = Math.round(Number(current) || 0);
    return history.at(-1) === value ? history : [...history, value];
  }, []);
  const delta = cleanHistory.length > 1 ? cleanHistory.at(-1) - cleanHistory[0] : 0;
  const status = roundedScore >= 85
    ? { label: 'Elite ATS pass rate', variant: 'success' }
    : roundedScore >= 70
      ? { label: 'Remediation ready', variant: 'warning' }
      : { label: 'Critical ATS gaps', variant: 'destructive' };

  return (
    <Card className="border-border/80">
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex items-end justify-between gap-3">
          <span className="text-4xl font-semibold tracking-tight">
            {roundedScore}<span className="text-lg text-muted-foreground">%</span>
          </span>
          {delta > 0 && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp />
              +{delta}%
            </Badge>
          )}
        </div>
        <Progress value={roundedScore} className="h-2" />
        {cleanHistory.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Optimization history</span>
            {cleanHistory.map((value, index) => (
              <Badge key={`${value}-${index}`} variant={index === cleanHistory.length - 1 ? 'default' : 'secondary'}>
                {value}%
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
