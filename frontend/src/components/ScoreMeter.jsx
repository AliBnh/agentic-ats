import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';

export const ScoreMeter = ({
  score = 0,
  label = 'ATS Match Score',
  size = 'md',
  scoreHistory = [],
  subtitle = '',
}) => {
  const roundedScore = Math.round(Number(score) || 0);

  const getScoreDetails = (val) => {
    if (val >= 85) {
      return {
        stroke: 'stroke-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        badgeVariant: 'success',
        grade: 'A+',
        statusText: 'Elite ATS Pass Rate',
      };
    }
    if (val >= 70) {
      return {
        stroke: 'stroke-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        badgeVariant: 'warning',
        grade: 'B',
        statusText: 'Remediation Ready',
      };
    }
    return {
      stroke: 'stroke-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badgeVariant: 'destructive',
      grade: 'C-',
      statusText: 'Critical ATS Gaps',
    };
  };

  const details = getScoreDetails(roundedScore);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, roundedScore)) / 100) * circumference;

  // Deduplicate consecutive identical scores and keep clean convergence steps
  const cleanHistory = (scoreHistory || []).reduce((acc, curr) => {
    const val = Math.round(Number(curr) || 0);
    if (acc.length === 0 || acc[acc.length - 1] !== val) {
      acc.push(val);
    }
    return acc;
  }, []);

  const hasGain =
    cleanHistory.length > 1 &&
    cleanHistory[cleanHistory.length - 1] > cleanHistory[0];
  const scoreDelta = hasGain
    ? cleanHistory[cleanHistory.length - 1] - cleanHistory[0]
    : 0;

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden transition-all group">
      {/* Background ambient glow matching score level */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 ${
          roundedScore >= 85
            ? 'bg-emerald-500'
            : roundedScore >= 70
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />

      <div className="relative flex items-center justify-center">
        <svg className="w-28 h-28 transform -rotate-90 drop-shadow-xs">
          {/* Track circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="7"
            className="text-muted/50"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${details.stroke} transition-all duration-1000 ease-out`}
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-black tracking-tight ${details.text} leading-none`}>
            {roundedScore}
            <span className="text-base font-bold text-muted-foreground">%</span>
          </span>
          <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-muted-foreground mt-0.5">
            Grade {details.grade}
          </span>
        </div>
      </div>

      <div className="mt-3 text-center space-y-1">
        <div className="text-xs font-bold text-foreground tracking-tight">{label}</div>
        <div className="flex items-center justify-center gap-1.5">
          <Badge
            variant={details.badgeVariant}
            className="text-[10px] font-semibold py-0.5 px-2 rounded-md"
          >
            {details.statusText}
          </Badge>
          {hasGain && (
            <Badge variant="brand" className="text-[10px] font-mono py-0.5 px-1.5 gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>+{scoreDelta}%</span>
            </Badge>
          )}
        </div>
      </div>

      {cleanHistory.length > 1 && (
        <div className="mt-3 pt-3 border-t border-border/60 w-full flex items-center justify-center flex-wrap gap-1 text-[11px] font-mono">
          <span className="text-muted-foreground font-sans text-[10px] uppercase font-bold mr-1">
            Loop:
          </span>
          {cleanHistory.map((s, idx) => (
            <React.Fragment key={idx}>
              <Badge
                variant={idx === cleanHistory.length - 1 ? 'brand' : 'secondary'}
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                {s}%
              </Badge>
              {idx < cleanHistory.length - 1 && (
                <span className="text-muted-foreground/40 text-[10px]">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
