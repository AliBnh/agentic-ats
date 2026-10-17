import React, { useState, useEffect } from 'react';
import { Edit3, Eye, FileText, Download, Copy, Check, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { ScoreMeter } from './ScoreMeter';
import { api } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export const StudioEditor = ({
  resultData,
  threadId,
  language = 'en',
  onBackToMatching
}) => {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'diff', 'cover_letter'
  const [markdownContent, setMarkdownContent] = useState(resultData?.tailored_markdown || '');
  const [coverLetterContent, setCoverLetterContent] = useState(resultData?.cover_letter || '');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (resultData?.tailored_markdown) {
      setMarkdownContent(resultData.tailored_markdown);
    }
    if (resultData?.cover_letter) {
      setCoverLetterContent(resultData.cover_letter);
    }
  }, [resultData]);

  const handleCopy = () => {
    const textToCopy = activeTab === 'cover_letter' ? coverLetterContent : markdownContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const content = activeTab === 'cover_letter' ? coverLetterContent : markdownContent;
      const filename = activeTab === 'cover_letter' ? 'tailored_cover_letter.pdf' : 'ats_optimized_resume.pdf';
      const blob = await api.exportPdf(content);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
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

  const wordCount = markdownContent.trim().split(/\s+/).filter(Boolean).length;
  const initialScore = resultData?.initial_score || 50;
  const finalScore = resultData?.final_score || 85;
  const scoreHistory = resultData?.score_history || [initialScore, finalScore];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner with Scores */}
      <Card className="p-6 shadow-sm border-border flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Optimization Complete</span>
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ATS-Perfected Career Deliverables
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Your CV has been tailored using STAR metrics and aligned with the target job requirements. Facts remain strictly locked.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <ScoreMeter
            score={finalScore}
            label="Target ATS Match"
            scoreHistory={scoreHistory}
          />
        </div>
      </Card>

      {/* Main Studio Workbench with shadcn Tabs */}
      <Card className="overflow-hidden shadow-sm border-border flex flex-col h-[750px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
          {/* Studio Toolbar */}
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <TabsList className="bg-muted">
              <TabsTrigger value="editor" className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>In-Platform Editor</span>
              </TabsTrigger>

              <TabsTrigger value="diff" className="gap-1.5 text-xs">
                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Diff View (Before/After)</span>
              </TabsTrigger>

              <TabsTrigger value="cover_letter" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cover Letter</span>
              </TabsTrigger>
            </TabsList>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline mr-1">
                {wordCount} words
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Building PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{activeTab === 'cover_letter' ? 'Download Letter PDF' : 'Download ATS PDF'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-card font-mono text-xs">
            <TabsContent value="editor" className="m-0 h-full">
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="w-full h-full bg-transparent text-foreground resize-none focus:outline-none leading-relaxed font-mono text-xs"
                placeholder="Optimized markdown resume content..."
              />
            </TabsContent>

            <TabsContent value="diff" className="m-0">
              <DiffViewer diff={resultData?.diff || []} />
            </TabsContent>

            <TabsContent value="cover_letter" className="m-0 h-full">
              <textarea
                value={coverLetterContent}
                onChange={(e) => setCoverLetterContent(e.target.value)}
                className="w-full h-full bg-transparent text-foreground resize-none focus:outline-none leading-relaxed font-sans text-xs"
                placeholder="Tailored cover letter content..."
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      <div className="flex justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToMatching}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tailor for another Job Description</span>
        </Button>
      </div>
    </div>
  );
};
