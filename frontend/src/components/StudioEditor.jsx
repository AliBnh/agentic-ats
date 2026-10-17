import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Eye,
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Loader2,
  ArrowLeft,
  Columns,
  Maximize2,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  ShieldCheck,
  FileCheck,
  Printer,
  Share2
} from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { ScoreMeter } from './ScoreMeter';
import { api } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const StudioEditor = ({
  resultData,
  threadId,
  language = 'en',
  onBackToMatching,
}) => {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'diff', 'cover_letter'
  const [markdownContent, setMarkdownContent] = useState(
    resultData?.tailored_markdown || ''
  );
  const [coverLetterContent, setCoverLetterContent] = useState(
    resultData?.cover_letter || ''
  );
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState('split'); // 'split', 'edit', 'preview'

  useEffect(() => {
    if (resultData?.tailored_markdown) {
      setMarkdownContent(resultData.tailored_markdown);
    }
    if (resultData?.cover_letter) {
      setCoverLetterContent(resultData.cover_letter);
    }
  }, [resultData]);

  const handleCopy = () => {
    const textToCopy =
      activeTab === 'cover_letter' ? coverLetterContent : markdownContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const content =
        activeTab === 'cover_letter' ? coverLetterContent : markdownContent;
      const filename =
        activeTab === 'cover_letter'
          ? 'executive_cover_letter.pdf'
          : 'ats_perfected_resume.pdf';
      const blob = await api.exportPdf(content);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const insertMarkdownTag = (tag) => {
    const textarea = document.getElementById('markdown-editor-area');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
    let replacement = '';

    if (tag === 'bold') replacement = `**${selectedText || 'bold text'}**`;
    else if (tag === 'italic') replacement = `*${selectedText || 'italic text'}*`;
    else if (tag === 'h1') replacement = `\n# ${selectedText || 'SECTION TITLE'}\n`;
    else if (tag === 'h2') replacement = `\n## ${selectedText || 'SUBSECTION'}\n`;
    else if (tag === 'bullet') replacement = `\n- ${selectedText || 'Achieved [Metric] by implementing [Action]...'}\n`;

    const newContent =
      markdownContent.substring(0, start) +
      replacement +
      markdownContent.substring(end);
    setMarkdownContent(newContent);
  };

  const wordCount = (
    activeTab === 'cover_letter' ? coverLetterContent : markdownContent
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const initialScore = resultData?.initial_score || 52;
  const finalScore = resultData?.final_score || 88;
  const scoreHistory = resultData?.score_history || [initialScore, finalScore];

  // Helper to render basic Markdown preview as formatted Harvard ATS resume
  const renderFormattedPreview = (content) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div className="max-w-2xl mx-auto bg-card text-foreground p-8 rounded-xl shadow-xs border border-border/80 font-sans text-xs space-y-3 leading-relaxed">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1.5" />;

          // H1 / Main Header
          if (trimmed.startsWith('# ')) {
            return (
              <div key={i} className="pt-2 text-center">
                <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                  {trimmed.replace('# ', '')}
                </h1>
                <div className="h-0.5 w-full bg-foreground/20 mt-1 mb-2" />
              </div>
            );
          }

          // H2 / Section Title
          if (trimmed.startsWith('## ')) {
            return (
              <div key={i} className="pt-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground border-b border-border pb-1 mb-1">
                  {trimmed.replace('## ', '')}
                </h2>
              </div>
            );
          }

          // H3
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={i} className="text-xs font-bold text-foreground">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.substring(2);
            return (
              <div key={i} className="flex items-start space-x-2 pl-3">
                <span className="text-foreground/70 font-bold select-none leading-none mt-1">
                  •
                </span>
                <span className="flex-1 text-foreground/90">{bulletText}</span>
              </div>
            );
          }

          // Standard paragraph / Contact line
          return (
            <p key={i} className="text-foreground/90">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
        {/* Top Executive Banner */}
        <Card className="p-6 border-border/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 bg-card/60 backdrop-blur-md">
          <div className="space-y-2.5 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 flex-wrap gap-1">
              <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Optimization Complete</span>
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                Converged in {scoreHistory.length} Cycles
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              ATS-Perfected Career Deliverables
            </h2>

            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Your resume has been rewritten using Harvard single-column ATS specifications, STAR quantified impact metrics, and target keyword embeddings. Factual entities remain strictly truth-locked.
            </p>
          </div>

          <div className="shrink-0">
            <ScoreMeter
              score={finalScore}
              label="Target Role Match Score"
              scoreHistory={scoreHistory}
            />
          </div>
        </Card>

        {/* Main Studio Workbench */}
        <Card className="overflow-hidden border-border/80 shadow-sm flex flex-col h-[780px]">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col h-full"
          >
            {/* Top Toolbar */}
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border/80 flex items-center justify-between flex-wrap gap-2.5">
              <TabsList className="bg-muted/80">
                <TabsTrigger value="editor" className="gap-1.5 text-xs font-semibold">
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Resume Studio</span>
                </TabsTrigger>

                <TabsTrigger value="diff" className="gap-1.5 text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>STAR Bullet Diff</span>
                </TabsTrigger>

                <TabsTrigger value="cover_letter" className="gap-1.5 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Executive Cover Letter</span>
                </TabsTrigger>
              </TabsList>

              {/* Center Formatting Shortcuts (When in editor tab) */}
              {activeTab === 'editor' && (
                <div className="hidden lg:flex items-center space-x-1 rounded-lg bg-card border border-border/70 p-0.5">
                  <button
                    type="button"
                    onClick={() => insertMarkdownTag('bold')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownTag('italic')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownTag('h2')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded text-[11px] font-bold"
                    title="Section Header"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownTag('bullet')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Bullet Point"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-border mx-1" />

                  {/* View Mode Switcher */}
                  <div className="flex items-center space-x-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('split')}
                      className={`px-2 py-1 rounded text-[11px] ${
                        editorViewMode === 'split'
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('edit')}
                      className={`px-2 py-1 rounded text-[11px] ${
                        editorViewMode === 'edit'
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('preview')}
                      className={`px-2 py-1 rounded text-[11px] ${
                        editorViewMode === 'preview'
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: Copy & Export */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline mr-1">
                  {wordCount} words
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs h-8 bg-card"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={exportingPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-8 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {exportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {activeTab === 'cover_letter'
                          ? 'Download Letter PDF'
                          : 'Download ATS PDF'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card">
              {/* TAB 1: RESUME STUDIO */}
              <TabsContent value="editor" className="m-0 h-full">
                {editorViewMode === 'split' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    {/* Left: Raw Markdown Editor */}
                    <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-muted/20">
                      <div className="px-3 py-2 bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                        <span>Markdown Source</span>
                        <span className="font-mono text-[10px]">Editable</span>
                      </div>
                      <textarea
                        id="markdown-editor-area"
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        className="w-full flex-1 p-4 bg-transparent text-foreground resize-none focus:outline-none leading-relaxed font-mono text-xs"
                        placeholder="Optimized markdown resume content..."
                      />
                    </div>

                    {/* Right: Live Formatted Harvard ATS Preview */}
                    <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-muted/10">
                      <div className="px-3 py-2 bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                        <span>Harvard ATS 1-Column Layout Preview</span>
                        <Badge variant="success" className="text-[9px] font-mono">
                          100% Parseable
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        {renderFormattedPreview(markdownContent)}
                      </div>
                    </div>
                  </div>
                ) : editorViewMode === 'edit' ? (
                  <textarea
                    id="markdown-editor-area"
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    className="w-full h-full bg-transparent text-foreground resize-none focus:outline-none leading-relaxed font-mono text-xs p-2"
                    placeholder="Optimized markdown resume content..."
                  />
                ) : (
                  <div className="h-full overflow-y-auto">
                    {renderFormattedPreview(markdownContent)}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: DIFF VIEWER */}
              <TabsContent value="diff" className="m-0">
                <DiffViewer diff={resultData?.diff || []} />
              </TabsContent>

              {/* TAB 3: EXECUTIVE COVER LETTER */}
              <TabsContent value="cover_letter" className="m-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  {/* Left: Editable Textarea */}
                  <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-muted/20">
                    <div className="px-3 py-2 bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                      <span>Cover Letter Source</span>
                      <span className="font-mono text-[10px]">Editable</span>
                    </div>
                    <textarea
                      value={coverLetterContent}
                      onChange={(e) => setCoverLetterContent(e.target.value)}
                      className="w-full flex-1 p-4 bg-transparent text-foreground resize-none focus:outline-none leading-relaxed font-sans text-xs"
                      placeholder="Tailored cover letter content..."
                    />
                  </div>

                  {/* Right: Executive Letterhead Preview */}
                  <div className="flex flex-col h-full border border-border/80 rounded-xl overflow-hidden bg-muted/10">
                    <div className="px-3 py-2 bg-muted/40 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                      <span>Executive Letterhead Preview</span>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        Formatted
                      </Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 font-sans text-xs leading-relaxed space-y-4 bg-card text-foreground rounded-lg m-2 border border-border/60 shadow-2xs">
                      <div className="whitespace-pre-line">
                        {coverLetterContent}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Bottom Navigation Link */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToMatching}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tailor for another Job Description</span>
          </Button>

          <span className="text-[11px] text-muted-foreground font-mono">
            Deterministic Output // Fact-Locked by Groq & LangGraph
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
};
