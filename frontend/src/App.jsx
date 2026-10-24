import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { LoginModal } from './components/LoginModal';
import { api } from './services/api';

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sampleCatalog, setSampleCatalog] = useState(null);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [agentEvents, setAgentEvents] = useState([]);
  const [hitlData, setHitlData] = useState(null);
  const [hitlLoading, setHitlLoading] = useState(false);
  const [tailoredResult, setTailoredResult] = useState(null);
  const [prefilledText, setPrefilledText] = useState('');
  const [prefilledLang, setPrefilledLang] = useState('en');
  const [prefilledJdText, setPrefilledJdText] = useState('');
  const [prefilledRole, setPrefilledRole] = useState('');

  useEffect(() => {
    fetchThreads();
    fetchSamples();
  }, [user]);

  const fetchThreads = async () => {
    try {
      const data = await api.getThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
        loadThreadDetails(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
    }
  };

  const fetchSamples = async () => {
    try {
      setSampleCatalog(await api.getSampleCatalog());
    } catch (err) {
      console.error('Error loading samples catalog:', err);
    }
  };

  const resetConversation = () => {
    setDiagnosticReport(null);
    setTailoredResult(null);
    setHitlData(null);
    setAgentEvents([]);
    setPrefilledText('');
    setPrefilledJdText('');
    setPrefilledRole('');
  };

  const loadThreadDetails = async (threadId) => {
    try {
      const result = await api.getAuditResult(threadId);
      setDiagnosticReport(result.diagnostic_report);
      setTailoredResult(result.tailored_result);
      setHitlData(null);
      setAgentEvents([]);
    } catch (err) {
      console.error('Error loading thread details:', err);
      resetConversation();
    }
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    loadThreadDetails(threadId);
    setSidebarOpen(false);
  };

  const handleNewThread = async () => {
    try {
      const newThread = await api.createThread('New Resume Audit', 'en');
      setThreads((previous) => [newThread, ...previous]);
      setActiveThreadId(newThread.id);
      resetConversation();
      setSidebarOpen(false);
    } catch (err) {
      console.error('Error creating new thread:', err);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await api.deleteThread(threadId);
      const remaining = threads.filter((thread) => thread.id !== threadId);
      setThreads(remaining);
      if (activeThreadId === threadId) {
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
          loadThreadDetails(remaining[0].id);
        } else {
          handleNewThread();
        }
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  const handleLoadPairing = (resumeId, jdId) => {
    const resume = sampleCatalog?.sample_resumes?.find((item) => item.id === resumeId);
    const jd = sampleCatalog?.sample_jds?.find((item) => item.id === jdId);
    if (resume) {
      setPrefilledText(resume.raw_text);
      setPrefilledLang(resume.language);
    }
    if (jd) {
      setPrefilledJdText(jd.text);
      setPrefilledRole(jd.title);
    }
    setDiagnosticReport(null);
    setTailoredResult(null);
    setHitlData(null);
  };

  const handleLoadSampleResume = (resumeId) => {
    const resume = sampleCatalog?.sample_resumes?.find((item) => item.id === resumeId);
    if (!resume) return;
    setPrefilledText(resume.raw_text);
    setPrefilledLang(resume.language);
    setPrefilledJdText('');
    setPrefilledRole('');
    setDiagnosticReport(null);
    setTailoredResult(null);
    setHitlData(null);
    setAgentEvents([]);
  };

  const handleLoadSampleJob = (jdId) => {
    const job = sampleCatalog?.sample_jds?.find((item) => item.id === jdId);
    if (!job) return;
    setPrefilledJdText(job.text);
    setPrefilledRole(job.title);
    setTailoredResult(null);
    setHitlData(null);
    setAgentEvents([]);
  };

  const handleParsedConfirmed = (reportData) => {
    if (reportData?.thread_id) setActiveThreadId(reportData.thread_id);
    setDiagnosticReport(reportData);
    fetchThreads();
  };

  const handleStartRemediation = async (jobDescription, targetRole) => {
    setMatchingLoading(true);
    setAgentEvents([]);
    try {
      const result = await api.matchJobStream(
        activeThreadId,
        jobDescription,
        targetRole,
        (event) => setAgentEvents((previous) => [...previous.slice(-40), event])
      );
      if (result.hitl_pending) {
        setHitlData(result);
      } else {
        setTailoredResult(result);
        fetchThreads();
      }
    } catch (err) {
      console.error('Error matching job:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleResolveHITL = async (skill, decision, notes) => {
    setHitlLoading(true);
    try {
      const result = await api.resumeHITL(activeThreadId, skill, decision, notes);
      setHitlData(null);
      if (!result.hitl_pending) {
        setAgentEvents((previous) => [
          ...previous,
          { type: 'agent_start', node: 'node_tailor_bullets' },
          {
            type: 'agent_complete',
            node: 'node_tailor_bullets',
            summary: `${result.diff?.length || 0} bullet(s) improved`,
          },
          { type: 'agent_start', node: 'node_synthesis' },
          {
            type: 'agent_complete',
            node: 'node_synthesis',
            summary: 'Resume and cover letter are ready',
          },
          { type: 'complete' },
        ]);
      }
      setTailoredResult(result);
      fetchThreads();
    } catch (err) {
      console.error('Error resuming HITL:', err);
    } finally {
      setHitlLoading(false);
    }
  };

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  if (!user && !authLoading) return <LoginModal />;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Navbar
          activeThread={activeThread}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          sampleCatalog={sampleCatalog}
          onLoadPairing={handleLoadPairing}
        />
        <main className="min-h-0 flex-1">
          <ChatWorkspace
            activeThread={activeThread}
            activeThreadId={activeThreadId}
            diagnosticReport={diagnosticReport}
            tailoredResult={tailoredResult}
            hitlData={hitlData}
            hitlLoading={hitlLoading}
            matchingLoading={matchingLoading}
            agentEvents={agentEvents}
            sampleCatalog={sampleCatalog}
            prefilledText={prefilledText}
            prefilledLang={prefilledLang}
            prefilledJdText={prefilledJdText}
            prefilledRole={prefilledRole}
            onLoadSampleResume={handleLoadSampleResume}
            onLoadSampleJob={handleLoadSampleJob}
            onParsedConfirmed={handleParsedConfirmed}
            onProceedToMatching={() => {}}
            onStartRemediation={handleStartRemediation}
            onResolveHITL={handleResolveHITL}
            onBackToMatching={() => setTailoredResult(null)}
          />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
