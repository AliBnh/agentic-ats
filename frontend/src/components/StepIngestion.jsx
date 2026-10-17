import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  FileCheck,
  Languages,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { MultiAgentVisualizerModal } from './MultiAgentVisualizerModal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const StepIngestion = ({
  threadId,
  onParsedConfirmed,
  initialText = '',
  initialLang = 'en',
}) => {
  const [activeTab, setActiveTab] = useState(initialText ? 'text' : 'upload');
  const [inputText, setInputText] = useState(initialText);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState(initialLang);
  const [loading, setLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const sampleResumes = [
    {
      title: 'Ali Benhima · Senior SWE & GenAI',
      lang: 'en',
      badge: 'EN · AI Tech',
      text: `ALI BENHIMA
Casablanca, Morocco | ali.benhima@example.com | linkedin.com/in/alibenhima | github.com/alibenhima

PROFESSIONAL SUMMARY
Senior Software Engineer and GenAI Architect with 4+ years of experience designing and deploying high-throughput microservices, multi-agent LLM systems, and enterprise vector search pipelines. Proven track record scaling FastAPI/React architectures on Kubernetes.

TECHNICAL SKILLS
Languages: Python, JavaScript/TypeScript, SQL, Bash
Frameworks: FastAPI, Django, React, Node.js, Next.js
AI & GenAI: LangGraph, LangChain, Llama 3, Groq LPU, Qdrant, RAG, DSPy, OpenAI API
Cloud & DevOps: Docker, Kubernetes, AWS (ECS, S3, RDS), GitHub Actions, CI/CD, Terraform
Databases: PostgreSQL, Redis, Qdrant Vector Store, MongoDB

PROFESSIONAL EXPERIENCE
Senior AI Engineer | BCG X Delivery Casablanca | 2023 - Present
- Architected enterprise multi-agent RAG reasoning engine processing 15,000+ legal queries daily with sub-second response times.
- Optimized vector search pipeline using Qdrant and hybrid BM25 re-ranking, boosting precision@5 by 34%.
- Mentored 6 junior engineers and led migration to Kubernetes microservices, achieving 99.98% production uptime.

Software Engineer | Capgemini Engineering | 2021 - 2023
- Built high-concurrency microservices backend in Python (FastAPI) and PostgreSQL serving 250,000 active users.
- Reduced API p99 latency from 420ms to 78ms through Redis caching layers and asynchronous query batching.
- Implemented end-to-end automated testing suites with PyTest, increasing test coverage from 55% to 92%.

EDUCATION
Master of Science in Computer Science & Artificial Intelligence
CentraleSupélec / EMSI | 2016 - 2021 | Magna Cum Laude`
    },
    {
      title: 'Ali Benhima · Conseil IT & Stratégie',
      lang: 'fr',
      badge: 'FR · Conseil SI',
      text: `ALI BENHIMA
Casablanca, Maroc | ali.benhima@example.com | +212 6 00 00 00 00 | linkedin.com/in/alibenhima

RÉSUMÉ PROFESSIONNEL
Consultant Senior en Stratégie SI, Transformation Digitale et Cybersécurité avec 4 ans d'expérience au sein de cabinets de conseil de premier plan. Expert en schémas directeurs, gouvernance des données, cadrage AMOA et intégration d'agents IA d'entreprise.

COMPÉTENCES CLÉS
Conseil & Stratégie : Schéma Directeur SI, Cadrage AMOA, Urbanisation des SI, Conduite du Changement
Secteurs : Banques & Assurances, Secteur Public, Télécoms, Souveraineté Numérique
Technologies & IA : Architecture Cloud, Sécurité SI (ISO 27001), LLMs & Agents Autonomes, Python, BI & Data
Méthodologies : Agile Scrum, SAFe, Design Thinking, ITIL v4

EXPÉRIENCE PROFESSIONNELLE
Consultant Senior Stratégie & Cyber | Wavestone ALMA Casablanca | 2023 - Présent
- Pilotage de la stratégie de souveraineté numérique et migration cloud pour une grande institution financière marocaine (budget 4.5M€).
- Élaboration du plan d'assurance sécurité et cartographie des risques cyber selon les référentiels DNSSI et ISO 27001.
- Animation de 40+ ateliers de cadrage stratégique auprès des comités de direction (Comex / Codir).

Consultant Systèmes d'Information | Deloitte Afrique Technology | 2021 - 2023
- Réalisation du schéma directeur des systèmes d'information pour un groupe panafricain présent dans 8 pays.
- Pilotage AMOA pour la refonte du SI financier et mise en place de dashboards décisionnels sous Power BI.
- Réduction des délais de traitement des clôtures comptables de 14 jours à 4 jours ouvrés.

FORMATION
Diplôme d'Ingénieur d'État en Systèmes d'Information & Management
École Mohammadia d'Ingénieurs (EMI) / ENSIAS | 2016 - 2021`
    }
  ];

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    await processIngestion(selectedFile, null);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      await processIngestion(droppedFile, null);
    }
  };

  const processIngestion = async (uploadFile, rawText) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      if (threadId) formData.append('thread_id', threadId);
      if (uploadFile) {
        formData.append('file', uploadFile);
      } else if (rawText) {
        formData.append('raw_text', rawText);
      } else {
        throw new Error('Please select a file or paste resume text.');
      }

      const res = await api.uploadResume(formData);
      setParsedPreview(res);
      setInputText(res.extracted_text || rawText || '');
      setLanguage(res.detected_language || 'en');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error processing document');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmParsing = async () => {
    setLoading(true);
    setError('');
    try {
      const activeId = parsedPreview?.thread_id || threadId;
      const res = await api.confirmParsing(activeId, inputText, language);
      onParsedConfirmed(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error confirming parsing');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample) => {
    setInputText(sample.text);
    setLanguage(sample.lang);
    setActiveTab('text');
  };

  const wordCount = (inputText || '').trim().split(/\s+/).filter(Boolean).length;
  const charCount = (inputText || '').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5">
          <Badge variant="brand" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Stage 01 // Ingestion & Semantic Extraction</span>
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Candidate Resume Ingestion & AST Verification
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          Upload your candidate document (PDF/TXT) or paste raw text. Our AST parser validates layout integrity, extracts factual entities, and checks for ATS table traps before auditing.
        </p>
      </div>

      {/* 1-Click Sample Pre-loaders */}
      {!parsedPreview && (
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>Load Curated Candidate Profile (1-Click):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sampleResumes.map((sample, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => loadSample(sample)}
                className="text-xs font-medium gap-1.5 h-8 bg-muted/40 hover:bg-accent hover:border-primary/40 active:scale-95 transition-all"
              >
                <span>{sample.title}</span>
                <Badge variant={sample.lang === 'fr' ? 'brand' : 'success'} className="text-[10px] px-1 py-0 font-mono">
                  {sample.badge}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="animate-shake">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">Extraction Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mode A: Ingestion Input (Upload or Paste) */}
      {!parsedPreview ? (
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-5 pb-3 border-b border-border/70 flex items-center justify-between flex-wrap gap-2">
              <TabsList className="bg-muted/70">
                <TabsTrigger value="upload" className="text-xs font-semibold gap-1.5">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Document (PDF / TXT)</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs font-semibold gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Paste Resume Text</span>
                </TabsTrigger>
              </TabsList>

              <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                Supports French & US/UK Norms
              </span>
            </div>

            <CardContent className="p-6">
              {/* Tab 1: Upload */}
              <TabsContent value="upload" className="m-0 space-y-4">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative ${
                    isDragOver
                      ? 'border-primary bg-primary/5 scale-[0.99]'
                      : 'border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-accent/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors text-center">
                    {file ? file.name : 'Click to select or drag & drop PDF resume'}
                  </span>

                  <span className="text-xs text-muted-foreground mt-1 text-center">
                    Single-column or multi-column PDF, TXT (Maximum file size: 10MB)
                  </span>

                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      PDF Document
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Text File (.txt)
                    </Badge>
                  </div>
                </label>
              </TabsContent>

              {/* Tab 2: Paste Text */}
              <TabsContent value="text" className="m-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Raw Resume Content:</span>
                    <span className="font-mono text-[11px]">
                      {wordCount} words · {charCount} chars
                    </span>
                  </div>

                  <Textarea
                    rows={12}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste the full text of your CV / Resume here..."
                    className="font-mono text-xs p-4 bg-muted/30 focus-visible:bg-background resize-y transition-colors leading-relaxed"
                  />
                </div>

                <Button
                  onClick={() => processIngestion(null, inputText)}
                  disabled={loading || !inputText.trim()}
                  variant="brand"
                  className="w-full py-3 h-11 font-bold text-sm shadow-sm gap-2 active:scale-[0.99] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Layout & AST Fact Nodes...</span>
                    </>
                  ) : (
                    <>
                      <span>Inspect Layout & Verify Extraction</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      ) : (
        /* Mode B: HITL Verification & Anomaly Review */
        <Card className="shadow-sm border-border/80 overflow-hidden">
          <CardHeader className="p-6 border-b border-border/70 bg-card/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>Human-in-the-Loop: Verification Gate</span>
                  <Badge variant="success" className="text-[10px] font-mono">
                    Parsed
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review extracted text and select your target regional ATS conventions.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground">Regional Standard:</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-48 h-9 text-xs font-semibold bg-muted/40">
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en" className="text-xs">
                    English (US/UK Harvard Standard)
                  </SelectItem>
                  <SelectItem value="fr" className="text-xs">
                    Français (Norme AFNOR / Recruteur FR)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Parser Anomalies Banner */}
            {parsedPreview.parsing_metadata?.anomalies?.length > 0 && (
              <Alert variant="warning" className="border-amber-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold">
                  Layout Anomalies Detected by Sentinel:
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-xs pl-1 mt-1 text-muted-foreground">
                    {parsedPreview.parsing_metadata.anomalies.map((anom, idx) => (
                      <li key={idx} className="text-foreground/90 font-medium">
                        {anom}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Stats Pill Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-muted-foreground">Document Word Count:</span>
                <span className="font-mono font-bold text-foreground">{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  AST Immutable Fact Gate
                </Badge>
                <Badge variant="success" className="text-[10px] font-mono">
                  100% Extracted
                </Badge>
              </div>
            </div>

            {/* Editable Text Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground">
                  Extracted Resume Text (Editable prior to Diagnostic):
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  You may edit bullet points or fix typos directly
                </span>
              </div>

              <Textarea
                rows={14}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="font-mono text-xs p-4 bg-muted/20 focus-visible:bg-background transition-colors leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParsedPreview(null)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Different File</span>
              </Button>

              <Button
                onClick={handleConfirmParsing}
                disabled={loading}
                variant="brand"
                className="text-sm font-bold shadow-sm shadow-brand-600/20 gap-2 px-7 py-3 h-11 active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running Recruitment Health Audit on Groq...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Launch Diagnostic Audit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Multi-Agent Animation during parsing / health check */}
      <MultiAgentVisualizerModal
        isOpen={loading}
        mode="ingestion"
        candidateName={parsedPreview?.full_name || 'Candidate'}
      />
    </div>
  );
};
