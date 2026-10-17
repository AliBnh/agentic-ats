import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { MultiAgentVisualizerModal } from './MultiAgentVisualizerModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Step 1: Ingestion & Parsing Verification
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload your CV (PDF) or paste raw text in French or English. Our parser validates formatting before auditing.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Extraction Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Ingestion Box */}
      {!parsedPreview ? (
        <div className="space-y-4">
          {/* Drag & Drop Card */}
          <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-card hover:bg-accent/40 transition-all duration-200 group shadow-xs">
            <input
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center mb-4 transition-colors">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Click to upload PDF resume
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Supports French and English documents
            </span>
          </label>

          <div className="flex items-center space-x-4">
            <Separator className="flex-1" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              or paste text
            </span>
            <Separator className="flex-1" />
          </div>

          {/* Paste Text Area */}
          <div className="space-y-3">
            <Textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw CV / resume text here..."
              className="font-mono text-xs p-4 bg-card resize-y"
            />
            <Button
              onClick={() => processIngestion(null, inputText)}
              disabled={loading || !inputText.trim()}
              variant="brand"
              className="w-full py-3 h-auto font-semibold text-sm shadow-sm gap-2"
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
            </Button>
          </div>
        </div>
      ) : (
        /* HITL Step 1: Verification Dialog */
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Human-in-the-Loop: Verify Extraction</CardTitle>
                <CardDescription className="text-xs">Ensure the text was extracted accurately from your PDF.</CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground font-medium">Language:</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US/UK Norms)</SelectItem>
                  <SelectItem value="fr">Français (Norme Française)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {/* Anomaly Alerts */}
            {parsedPreview.parsing_metadata?.anomalies?.length > 0 && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Parser Anomaly Alerts Detected:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-0.5 text-xs pl-1 mt-1">
                    {parsedPreview.parsing_metadata.anomalies.map((anom, idx) => (
                      <li key={idx}>{anom}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Editable Text Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Parsed Text (Editable before running diagnostic):
              </label>
              <Textarea
                rows={12}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="font-mono text-xs p-4 bg-muted/30 focus-visible:bg-background transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParsedPreview(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Upload Different File
              </Button>
              <Button
                onClick={handleConfirmParsing}
                disabled={loading}
                variant="brand"
                className="text-sm font-semibold shadow-sm gap-2 px-6"
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
