import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { StepIngestion } from './components/StepIngestion';
import { StepDiagnostic } from './components/StepDiagnostic';
import { StepJobMatching } from './components/StepJobMatching';
import { HITLModal } from './components/HITLModal';
import { StudioEditor } from './components/StudioEditor';
import { MultiAgentVisualizerModal } from './components/MultiAgentVisualizerModal';
import { LoginModal } from './components/LoginModal';
import { api } from './services/api';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sampleCatalog, setSampleCatalog] = useState(null);

  // Workflow Stepper: 1: Ingestion, 2: Diagnostic, 3: JobMatching, 4: Studio
  const [currentStep, setCurrentStep] = useState(1);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [hitlData, setHitlData] = useState(null);
  const [hitlLoading, setHitlLoading] = useState(false);
  const [tailoredResult, setTailoredResult] = useState(null);
  const [prefilledText, setPrefilledText] = useState('');
  const [prefilledLang, setPrefilledLang] = useState('en');
  const [prefilledJdText, setPrefilledJdText] = useState('');
  const [prefilledRole, setPrefilledRole] = useState('');

  // Load threads and sample catalog on startup
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
      const data = await api.getSampleCatalog();
      setSampleCatalog(data);
    } catch (err) {
      console.error('Error loading samples catalog:', err);
    }
  };

  const loadThreadDetails = async (threadId) => {
    try {
      const res = await api.getAuditResult(threadId);
      if (res.tailored_result) {
        setTailoredResult(res.tailored_result);
        setCurrentStep(4);
      } else if (res.diagnostic_report) {
        setDiagnosticReport(res.diagnostic_report);
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } catch (err) {
      console.error('Error loading thread details:', err);
      setCurrentStep(1);
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
      setThreads([newThread, ...threads]);
      setActiveThreadId(newThread.id);
      setCurrentStep(1);
      setDiagnosticReport(null);
      setTailoredResult(null);
      setPrefilledText('');
      setPrefilledJdText('');
      setPrefilledRole('');
      setHitlData(null);
      setSidebarOpen(false);
    } catch (err) {
      console.error('Error creating new thread:', err);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await api.deleteThread(threadId);
      const remaining = threads.filter((t) => t.id !== threadId);
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

  // 1-Click Load Curated Candidate & JD Pairing
  const handleLoadPairing = (resumeId, jdId) => {
    if (!sampleCatalog) return;
    const resume = sampleCatalog.sample_resumes?.find((r) => r.id === resumeId);
    const jd = sampleCatalog.sample_jds?.find((j) => j.id === jdId);
    if (resume) {
      setPrefilledText(resume.raw_text);
      setPrefilledLang(resume.language);
    }
    if (jd) {
      setPrefilledJdText(jd.text);
      setPrefilledRole(jd.title);
    }
    setCurrentStep(1);
    setDiagnosticReport(null);
    setTailoredResult(null);
    setHitlData(null);
  };

  // Step 1 -> Step 2
  const handleParsedConfirmed = (reportData) => {
    setDiagnosticReport(reportData);
    setCurrentStep(2);
    fetchThreads();
  };

  // Step 2 -> Step 3
  const handleProceedToMatching = () => {
    setCurrentStep(3);
  };

  // Step 3 -> LangGraph Remediation Loop
  const handleStartRemediation = async (jobDescription, targetRole) => {
    setMatchingLoading(true);
    try {
      const res = await api.matchJob(activeThreadId, jobDescription, targetRole);
      if (res.hitl_pending) {
        // Paused at HITL Gate!
        setHitlData(res);
      } else {
        // Converged!
        setTailoredResult(res);
        setCurrentStep(4);
        fetchThreads();
      }
    } catch (err) {
      console.error('Error matching job:', err);
      alert(err.response?.data?.detail || 'Error during remediation');
    } finally {
      setMatchingLoading(false);
    }
  };

  // Resolve HITL Modal
  const handleResolveHITL = async (skill, decision, notes) => {
    setHitlLoading(true);
    try {
      const res = await api.resumeHITL(activeThreadId, skill, decision, notes);
      setHitlData(null);
      setTailoredResult(res);
      setCurrentStep(4);
      fetchThreads();
    } catch (err) {
      console.error('Error resuming HITL:', err);
      alert(err.response?.data?.detail || 'Error resuming execution');
    } finally {
      setHitlLoading(false);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  if (!user && !authLoading) {
    return <LoginModal />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <Navbar
          activeThread={activeThread}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sampleCatalog={sampleCatalog}
          onLoadPairing={handleLoadPairing}
        />

        {/* Stepper Navigation */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-2.5 shadow-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-2 font-semibold transition-colors ${
                currentStep >= 1 ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 1 ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                1
              </span>
              <span>Ingestion & Verification</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <button
              onClick={() => diagnosticReport && setCurrentStep(2)}
              disabled={!diagnosticReport}
              className={`flex items-center space-x-2 font-semibold transition-colors ${
                currentStep >= 2 ? 'text-brand-600' : 'text-slate-400 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 2 ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                2
              </span>
              <span>Health Diagnostic</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <button
              onClick={() => diagnosticReport && setCurrentStep(3)}
              disabled={!diagnosticReport}
              className={`flex items-center space-x-2 font-semibold transition-colors ${
                currentStep >= 3 ? 'text-brand-600' : 'text-slate-400 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 3 ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                3
              </span>
              <span>Job Targeting</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <button
              onClick={() => tailoredResult && setCurrentStep(4)}
              disabled={!tailoredResult}
              className={`flex items-center space-x-2 font-semibold transition-colors ${
                currentStep >= 4 ? 'text-emerald-600' : 'text-slate-400 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 4 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                4
              </span>
              <span>Studio & Export</span>
            </button>
          </div>
        </div>

        {/* Dynamic Step View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          {currentStep === 1 && (
            <StepIngestion
              threadId={activeThreadId}
              initialText={prefilledText}
              initialLang={prefilledLang}
              onParsedConfirmed={handleParsedConfirmed}
            />
          )}

          {currentStep === 2 && (
            <StepDiagnostic
              report={diagnosticReport}
              language={activeThread?.language || 'en'}
              onProceedToMatching={handleProceedToMatching}
            />
          )}

          {currentStep === 3 && (
            <StepJobMatching
              threadId={activeThreadId}
              sampleJDs={sampleCatalog?.sample_jds || []}
              onStartRemediation={handleStartRemediation}
              initialJd={prefilledJdText}
              initialRole={prefilledRole}
              loading={matchingLoading}
            />
          )}

          {currentStep === 4 && (
            <StudioEditor
              resultData={tailoredResult}
              threadId={activeThreadId}
              language={activeThread?.language || 'en'}
              onBackToMatching={() => setCurrentStep(3)}
            />
          )}
        </main>
      </div>

      {/* Human-in-the-Loop Truth Gate Modal */}
      {hitlData && (
        <HITLModal
          hitlData={hitlData}
          onResolve={handleResolveHITL}
          loading={hitlLoading}
        />
      )}

      {/* Autonomous Multi-Agent Execution Visualizer Modal */}
      <MultiAgentVisualizerModal
        isOpen={matchingLoading || hitlLoading}
        mode="remediation"
        targetRole={prefilledRole || (activeThread?.title?.includes(' - ') ? activeThread.title.split(' - ')[1] : 'Target Role')}
        candidateName={activeThread?.title?.includes(' - ') ? activeThread.title.split(' - ')[0] : 'Candidate'}
      />
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
