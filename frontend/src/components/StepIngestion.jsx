import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { MultiAgentVisualizerModal } from './MultiAgentVisualizerModal';

export const StepIngestion = ({
  threadId,
  onParsedConfirmed,
  initialText = '',
  initialLang = 'en'
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState(initialLang);
  const [loading, setLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    await processIngestion(selectedFile, null);
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
      setInputText(res.extracted_text);
      setLanguage(res.detected_language);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Step 1: Ingestion & Parsing Verification
        </h2>
        <p className="text-sm text-slate-500">
          Upload your CV (PDF) or paste raw text in French or English. Our parser validates formatting before auditing.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Ingestion Box */}
      {!parsedPreview ? (
        <div className="space-y-4">
          {/* Drag & Drop Card */}
          <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-brand-50/20 transition-all duration-200 group shadow-xs">
            <input
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-100 text-brand-600 flex items-center justify-center mb-4 transition-colors">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-sm font-semibold text-slate-800 group-hover:text-brand-600">
              Click to upload PDF resume
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Supports French and English documents
            </span>
          </label>

          <div className="flex items-center space-x-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or paste text</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Paste Text Area */}
          <div className="space-y-3">
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw CV / resume text here..."
              className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors shadow-xs"
            />
            <button
              onClick={() => processIngestion(null, inputText)}
              disabled={loading || !inputText.trim()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm shadow-brand-600/20 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting & Analyzing Anomaly Layers...</span>
                </>
              ) : (
                <>
                  <span>Inspect & Validate Extraction</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* HITL Step 1: Verification Dialog */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Human-in-the-Loop: Verify Extraction</h3>
                <p className="text-xs text-slate-500">Ensure the text was extracted accurately from your PDF.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="en">English (US/UK Norms)</option>
                <option value="fr">Français (Norme Française)</option>
              </select>
            </div>
          </div>

          {/* Anomaly Alerts */}
          {parsedPreview.parsing_metadata?.anomalies?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="font-semibold flex items-center space-x-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Parser Anomaly Alerts Detected:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
                {parsedPreview.parsing_metadata.anomalies.map((anom, idx) => (
                  <li key={idx}>{anom}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Text Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Parsed Text (Editable before running diagnostic):
            </label>
            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs font-mono text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setParsedPreview(null)}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Upload Different File
            </button>
            <button
              onClick={handleConfirmParsing}
              disabled={loading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-sm shadow-brand-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Diagnostic Health Audit...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Run Diagnostic Health Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
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

