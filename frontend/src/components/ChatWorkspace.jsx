import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { StudioEditor } from './StudioEditor';

const nodeLabels = {
  node_diagnostic_audit: 'Auditing resume health and ATS structure',
  node_evaluate_ats: 'Matching experience against the target role',
  node_gap_analysis: 'Checking gaps and unverified skills',
  node_tailor_bullets: 'Tailoring experience with STAR evidence',
  node_synthesis: 'Preparing your resume and cover letter',
};

function Message({ role, children }) {
  const userMessage = role === 'user';
  return (
    <article className={`flex gap-3 ${userMessage ? 'justify-end' : 'justify-start'}`}>
      {!userMessage && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles />
        </span>
      )}
      <section className={`flex min-w-0 max-w-3xl flex-col gap-1 ${userMessage ? 'items-end' : 'items-start'}`}>
        <span className="px-1 text-xs font-medium text-muted-foreground">
          {userMessage ? 'You' : 'Resume Copilot'}
        </span>
        {children}
      </section>
      {userMessage && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User />
        </span>
      )}
    </article>
  );
}

function ActivityTrace({ events, loading }) {
  const nodeEvents = events.filter((event) => event.type === 'node');
  if (!loading && nodeEvents.length === 0) return null;

  const progress = Math.min(100, Math.max(8, Math.round((nodeEvents.length / 5) * 100)));

  return (
    <Card className="w-full border-border/80">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="text-primary" />
            Working through your resume
          </CardTitle>
          <Badge variant={loading ? 'brand' : 'success'}>{loading ? 'Live' : 'Done'}</Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {nodeEvents.map((event, index) => (
          <div className="flex items-start gap-3" key={`${event.node}-${index}`}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{nodeLabels[event.node] || event.node}</p>
              <p className="text-xs text-muted-foreground">{event.status || 'Agent updated the workflow'}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="animate-spin text-primary" />
            <span>The next agent is starting...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeComposer({ text, file, busy, onTextChange, onFileChange, onSubmit }) {
  return (
    <Card className="w-full border-border/80 shadow-sm">
      <CardContent className="p-3">
        {file && (
          <Badge variant="secondary" className="mb-2 gap-2">
            <FileText />
            {file.name}
          </Badge>
        )}
        <Textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Paste your resume here, or attach a PDF..."
          className="min-h-32 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={busy}
        />
        <Separator className="my-2" />
        <div className="flex items-center justify-between gap-2 px-1">
          <label htmlFor="resume-file" className="cursor-pointer">
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.txt"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              className="sr-only"
              disabled={busy}
            />
            <span className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <Paperclip />
              Attach CV
            </span>
          </label>
          <Button size="icon" onClick={onSubmit} disabled={busy || (!text.trim() && !file)} aria-label="Submit resume">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function JobComposer({ role, description, busy, onRoleChange, onDescriptionChange, onSubmit }) {
  return (
    <Card className="w-full border-border/80 shadow-sm">
      <CardContent className="flex flex-col gap-2 p-3">
        <Input
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
          placeholder="Target role (optional)"
          disabled={busy}
        />
        <Textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Paste the job description..."
          className="min-h-28 resize-none"
          disabled={busy}
        />
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={busy || !description.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
            Optimize resume
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ data, loading, onResolve }) {
  const [decision, setDecision] = useState('APPROVED');
  const [notes, setNotes] = useState('');
  const question = data?.hitl_question;
  if (!question) return null;

  return (
    <Card className="w-full border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldAlert className="text-amber-600 dark:text-amber-400" />
          I need your confirmation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-sm leading-relaxed">{question.question}</p>
        {question.context && <p className="border-l-2 border-primary/40 pl-3 text-xs italic text-muted-foreground">“{question.context}”</p>}
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['APPROVED', 'I have this experience'],
            ['TRANSFERABLE', 'I have related experience'],
            ['DECLINED', 'Do not include it'],
          ].map(([value, label]) => (
            <Button key={value} type="button" variant={decision === value ? 'default' : 'outline'} onClick={() => setDecision(value)} className="h-auto justify-start whitespace-normal py-2 text-left text-xs">
              {decision === value && <Check />}
              {label}
            </Button>
          ))}
        </div>
        {decision !== 'DECLINED' && <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional experience context" />}
        <Button disabled={loading} onClick={() => onResolve(question.skill, decision, notes)}>
          {loading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

export function ChatWorkspace({
  activeThread,
  activeThreadId,
  diagnosticReport,
  tailoredResult,
  hitlData,
  hitlLoading,
  matchingLoading,
  agentEvents,
  sampleCatalog,
  prefilledText,
  prefilledLang,
  prefilledJdText,
  prefilledRole,
  onParsedConfirmed,
  onStartRemediation,
  onResolveHITL,
  onBackToMatching,
}) {
  const [resumeText, setResumeText] = useState(prefilledText);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [role, setRole] = useState(prefilledRole);
  const [jobDescription, setJobDescription] = useState(prefilledJdText);
  const [error, setError] = useState('');

  useEffect(() => {
    setResumeText(prefilledText);
    setRole(prefilledRole);
    setJobDescription(prefilledJdText);
  }, [prefilledJdText, prefilledRole, prefilledText]);

  const resumeSubmitted = Boolean(diagnosticReport || matchingLoading || tailoredResult || hitlData);
  const jobSubmitted = Boolean(matchingLoading || tailoredResult || hitlData);
  const candidateName = useMemo(() => activeThread?.title?.split(' - ')[0] || 'your resume', [activeThread]);

  const submitResume = async () => {
    setResumeBusy(true);
    setError('');
    try {
      const formData = new FormData();
      if (activeThreadId) formData.append('thread_id', activeThreadId);
      if (resumeFile) formData.append('file', resumeFile);
      else formData.append('raw_text', resumeText);
      const uploaded = await api.uploadResume(formData);
      const report = await api.confirmParsing(
        uploaded.thread_id || activeThreadId,
        uploaded.extracted_text,
        uploaded.detected_language || prefilledLang,
        uploaded.parsed_ast,
      );
      onParsedConfirmed(report);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to process the resume.');
    } finally {
      setResumeBusy(false);
    }
  };

  const submitJob = () => onStartRemediation(jobDescription, role);

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
      <header className="flex items-center gap-3 border-b border-border/70 px-4 py-4 sm:px-6">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles />
        </span>
        <div>
          <h1 className="text-sm font-semibold">Resume Copilot</h1>
          <p className="text-xs text-muted-foreground">A focused workspace for one resume at a time</p>
        </div>
        <Badge variant="outline" className="ml-auto hidden sm:flex">LangGraph</Badge>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <Message role="assistant">
            <p className="max-w-xl text-sm leading-6">
              I can turn your CV into a role-specific, ATS-friendly application. Upload it or paste it below and I’ll show you each step.
            </p>
          </Message>

          {resumeSubmitted && (
            <Message role="user">
              <Badge variant="secondary" className="gap-2 px-3 py-2">
                <FileText />
                {resumeFile?.name || `${candidateName} submitted a resume`}
              </Badge>
            </Message>
          )}

          {!resumeSubmitted && (
            <Message role="assistant">
              <ResumeComposer
                text={resumeText}
                file={resumeFile}
                busy={resumeBusy}
                onTextChange={setResumeText}
                onFileChange={setResumeFile}
                onSubmit={submitResume}
              />
            </Message>
          )}

          {error && <Badge variant="destructive" className="self-start">{error}</Badge>}

          {diagnosticReport && (
            <Message role="assistant">
              <Card className="w-full border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Baseline audit complete</CardTitle>
                    <Badge variant="success">{Math.round(diagnosticReport.overall_health_score || 0)}% health</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 pt-0 sm:grid-cols-3">
                  <Metric label="ATS format" value={diagnosticReport.ats_formatting_score} />
                  <Metric label="Content impact" value={diagnosticReport.content_impact_score} />
                  <Metric label="Language norms" value={diagnosticReport.language_norm_score} />
                </CardContent>
              </Card>
            </Message>
          )}

          {diagnosticReport && !jobSubmitted && (
            <Message role="assistant">
              <p className="mb-1 text-sm">What job should I tailor it for?</p>
              <JobComposer
                role={role}
                description={jobDescription}
                busy={matchingLoading}
                onRoleChange={setRole}
                onDescriptionChange={setJobDescription}
                onSubmit={submitJob}
              />
            </Message>
          )}

          {(matchingLoading || agentEvents.length > 0) && (
            <Message role="assistant">
              <ActivityTrace events={agentEvents} loading={matchingLoading} />
            </Message>
          )}

          {hitlData && (
            <Message role="assistant">
              <VerificationCard data={hitlData} loading={hitlLoading} onResolve={onResolveHITL} />
            </Message>
          )}

          {tailoredResult && (
            <Message role="assistant">
              <div className="flex w-full flex-col gap-3">
                <p className="text-sm">Your tailored application is ready.</p>
                <StudioEditor resultData={tailoredResult} threadId={activeThreadId} language={activeThread?.language || 'en'} onBackToMatching={onBackToMatching} />
              </div>
            </Message>
          )}

          <Separator />
          <p className="pb-4 text-center text-xs text-muted-foreground">Observable workflow updates are shown as agents work. Private hidden reasoning is not exposed.</p>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <Card className="border-border/70 bg-muted/20">
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{Math.round(value || 0)}%</span>
      </CardContent>
    </Card>
  );
}
