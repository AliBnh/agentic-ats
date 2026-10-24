import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Paperclip,
  ShieldAlert,
  Sparkles,
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

const agentPlan = [
  {
    node: 'node_diagnostic_audit',
    label: 'Resume health audit',
    description: 'Checking structure, contact details, impact, and language norms.',
    steps: ['Read parsed resume', 'Check ATS structure', 'Measure content quality'],
  },
  {
    node: 'node_evaluate_ats',
    label: 'Role match analysis',
    description: 'Comparing your experience with the target role.',
    steps: ['Extract role requirements', 'Compare relevant skills', 'Calculate match score'],
  },
  {
    node: 'node_gap_analysis',
    label: 'Evidence and gap review',
    description: 'Finding requirements that need evidence or your confirmation.',
    steps: ['Review missing requirements', 'Check resume evidence', 'Decide whether to ask'],
  },
  {
    node: 'node_tailor_bullets',
    label: 'Experience tailoring',
    description: 'Rewriting relevant bullets while preserving your facts.',
    steps: ['Select relevant bullets', 'Improve clarity and relevance', 'Record every change'],
  },
  {
    node: 'node_synthesis',
    label: 'Application assembly',
    description: 'Preparing the final resume and grounded cover letter.',
    steps: ['Assemble fact-locked resume', 'Write role-focused letter', 'Prepare final output'],
  },
];

function Message({ role, children }) {
  const userMessage = role === 'user';
  return (
    <article className={`flex gap-3 ${userMessage ? 'justify-end' : 'justify-start'}`}>
      <section className={`flex min-w-0 max-w-3xl flex-col gap-1 ${userMessage ? 'items-end' : 'items-start'}`}>
        <span className="px-1 text-xs text-muted-foreground">
          {userMessage ? 'You' : 'Resume Copilot'}
        </span>
        {children}
      </section>
    </article>
  );
}

function ActivityTrace({ events, loading }) {
  const agentEvents = events.filter((event) => ['agent_start', 'agent_complete'].includes(event.type));
  if (!loading && agentEvents.length === 0) return null;

  const completed = new Set(
    agentEvents.filter((event) => event.type === 'agent_complete').map((event) => event.node)
  );
  const started = new Set(
    agentEvents.filter((event) => event.type === 'agent_start').map((event) => event.node)
  );
  const activeNode = agentPlan.find(({ node }) => started.has(node) && !completed.has(node))?.node;
  const progress = Math.round(((completed.size + (activeNode ? 0.35 : 0)) / agentPlan.length) * 100);
  const workflowComplete = events.some((event) => event.type === 'complete');
  const waitingForConfirmation = events.some((event) => event.type === 'hitl');

  return (
    <Card className="w-full">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="text-primary" />
            Application workflow
          </CardTitle>
          <Badge variant={loading ? 'secondary' : 'default'}>
            {loading ? `${completed.size}/${agentPlan.length} complete` : 'Complete'}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {agentPlan.map(({ node, label, description, steps }) => {
          const isStarted = started.has(node);
          const isComplete = completed.has(node);
          const completion = [...agentEvents].reverse().find(
            (event) => event.node === node && event.type === 'agent_complete'
          );
          const isActive = activeNode === node;
          const isAfterGate = node === 'node_tailor_bullets' || node === 'node_synthesis';
          const isWaiting = !isComplete && !isActive && waitingForConfirmation && isAfterGate;
          const isSkipped = !isComplete && !isActive && workflowComplete && !isWaiting;
          const status = isComplete
            ? 'Completed'
            : isActive
              ? 'Running'
              : isWaiting
                ? 'Waiting'
                : isSkipped
                  ? 'Skipped'
                  : isStarted
                    ? 'Queued'
                    : 'Pending';
          return (
            <div
              className={`rounded-md border p-3 ${isActive ? 'border-primary/40 bg-muted/40' : ''}`}
              key={node}
            >
              <div className="flex items-start gap-3">
                {isComplete ? (
                  <CheckCircle2 className="mt-0.5 shrink-0 text-muted-foreground" />
                ) : isActive ? (
                  <div className="mt-1 flex size-4 shrink-0 items-center justify-center">
                    <span className="size-2 animate-pulse rounded-full bg-primary" />
                  </div>
                ) : (
                  <Circle className="mt-0.5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <Badge variant={isComplete ? 'secondary' : isActive ? 'default' : 'outline'}>
                      {status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isComplete
                      ? completion?.summary || description
                      : isWaiting
                        ? 'Waiting for confirmation before this agent can run.'
                        : isSkipped
                          ? 'Not needed for this workflow run.'
                          : description}
                  </p>
                </div>
              </div>
              {(isActive || isComplete) && (
                <div className="ml-7 mt-3 flex flex-col gap-2 border-l pl-3">
                  {steps.map((step, index) => (
                    <div className="flex items-center gap-2 text-xs" key={step}>
                      {isComplete || (isActive && index === 0) ? (
                        <Check className="text-muted-foreground" />
                      ) : (
                        <Circle className="text-muted-foreground/50" />
                      )}
                      <span className={isComplete || (isActive && index === 0) ? '' : 'text-muted-foreground'}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
            <span>The workflow will move to the next step automatically.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeComposer({
  text,
  file,
  busy,
  onTextChange,
  onFileChange,
  onSubmit,
  sampleCatalog,
  onLoadSampleResume,
}) {
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        {sampleCatalog?.sample_resumes?.length > 0 && (
          <div className="mb-3 flex flex-col gap-2 border-b pb-3">
            <p className="text-xs font-medium text-muted-foreground">Or start with a sample resume</p>
            <div className="flex flex-wrap gap-2">
              {sampleCatalog.sample_resumes.slice(0, 4).map((resume) => (
                <Button
                  key={resume.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadSampleResume(resume.id)}
                  disabled={busy}
                  className="h-auto max-w-full justify-start whitespace-normal text-left"
                >
                  <FileText />
                  <span className="truncate">{resume.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
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

function JobComposer({ role, description, busy, onRoleChange, onDescriptionChange, onSubmit, sampleCatalog, onLoadSampleJob }) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-2 p-3">
        {sampleCatalog?.sample_jds?.length > 0 && (
          <div className="flex flex-col gap-2 border-b pb-3">
            <p className="text-xs font-medium text-muted-foreground">Or choose a sample job</p>
            <div className="flex flex-wrap gap-2">
              {sampleCatalog.sample_jds.slice(0, 4).map((job) => (
                <Button
                  key={job.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadSampleJob(job.id)}
                  disabled={busy}
                  className="h-auto max-w-full justify-start whitespace-normal text-left"
                >
                  <span className="truncate">{job.title}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
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
    <Card className="w-full">
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
  onLoadSampleResume,
  onLoadSampleJob,
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
        <div>
        <h1 className="text-sm font-semibold">Resume Copilot</h1>
        <p className="text-xs text-muted-foreground">One focused workspace for your next application</p>
        </div>
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
                sampleCatalog={sampleCatalog}
                onLoadSampleResume={onLoadSampleResume}
              />
            </Message>
          )}

          {error && <Badge variant="destructive" className="self-start">{error}</Badge>}

          {diagnosticReport && (
            <Message role="assistant">
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Baseline audit complete</CardTitle>
                    <Badge variant="success">{Math.round(diagnosticReport.health_score ?? diagnosticReport.overall_health_score ?? 0)}% health</Badge>
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
                sampleCatalog={sampleCatalog}
                onLoadSampleJob={onLoadSampleJob}
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
          <p className="pb-4 text-center text-xs text-muted-foreground">Workflow steps are shown as your application is prepared.</p>
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
