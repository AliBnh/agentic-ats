import React, { useState, useEffect } from 'react';
import { Edit3, Eye, FileText, Download, Copy, Check, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { ScoreMeter } from './ScoreMeter';
import { api } from '../services/api';

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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autonomous Optimization Complete</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            ATS-Perfected Career Deliverables
          </h2>
          <p className="text-xs text-slate-500 max-w-md">
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
      </div>

      {/* Main Studio Workbench */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col h-[750px]">
        {/* Studio Toolbar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-600" />
              <span>In-Platform Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'diff'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Diff View (Before/After)</span>
            </button>

            <button
              onClick={() => setActiveTab('cover_letter')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'cover_letter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cover Letter</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {wordCount} words
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
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
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 font-mono text-xs">
          {activeTab === 'editor' && (
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-800 resize-none focus:outline-none leading-relaxed font-mono"
              placeholder="Optimized markdown resume content..."
            />
          )}

          {activeTab === 'diff' && (
            <DiffViewer diff={resultData?.diff || []} />
          )}

          {activeTab === 'cover_letter' && (
            <textarea
              value={coverLetterContent}
              onChange={(e) => setCoverLetterContent(e.target.value)}
              className="w-full h-full bg-transparent text-slate-800 resize-none focus:outline-none leading-relaxed font-sans"
              placeholder="Tailored cover letter content..."
            />
          )}
        </div>
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBackToMatching}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tailor for another Job Description</span>
        </button>
      </div>
    </div>
  );
};
