import React, { useState } from 'react';
import { Menu, Zap, Sparkles, ChevronDown, Check, Compass, Target } from 'lucide-react';

export const Navbar = ({
  activeThread,
  onToggleSidebar,
  sampleCatalog,
  onLoadPairing
}) => {
  const [showPairingMenu, setShowPairingMenu] = useState(false);

  const curatedPairings = [
    {
      label: 'Wavestone ALMA Casablanca',
      sub: 'Ali Benhima (Conseil IT) ➔ Cyber, Souveraineté & Stratégie',
      resumeId: 'ali-consulting-fr',
      jdId: 'wavestone-alma-fr',
      badge: 'FR - Conseil'
    },
    {
      label: 'BCG X Delivery Casablanca',
      sub: 'Ali Benhima (SWE & GenAI) ➔ Python, FastAPI, React, Cloud',
      resumeId: 'ali-swe-genai-en',
      jdId: 'bcg-x-swe-en',
      badge: 'EN - Tech & AI'
    },
    {
      label: 'Deloitte Afrique Technology',
      sub: 'Ali Benhima (Conseil IT) ➔ Stratégie SI, AMOA & Finance',
      resumeId: 'ali-consulting-fr',
      jdId: 'deloitte-tech-fr',
      badge: 'FR - AMOA'
    },
    {
      label: 'Visa Consulting & Analytics (VCA)',
      sub: 'Ali Benhima (Payments) ➔ Digital Payments & Analytics',
      resumeId: 'ali-consulting-en',
      jdId: 'visa-vca-en',
      badge: 'EN - Payments'
    },
    {
      label: 'Ostorlab Cybersecurity',
      sub: 'Ali Benhima (GenAI & Security) ➔ Security Testing Automation',
      resumeId: 'ali-swe-genai-en',
      jdId: 'ostorlab-cyber-en',
      badge: 'EN - Cyber'
    },
    {
      label: 'Capgemini Engineering',
      sub: 'Ali Benhima (Full Stack) ➔ Smart Carpool Network (Azure/Java/Python)',
      resumeId: 'ali-swe-fastapi-fr',
      jdId: 'capgemini-backend-fr',
      badge: 'FR - Full Stack'
    },
    {
      label: 'Sofrecom (Orange Group)',
      sub: 'Ali Benhima (Full Stack) ➔ Java, Spring Boot, Angular, Microservices',
      resumeId: 'ali-swe-fastapi-fr',
      jdId: 'sofrecom-fullstack-fr',
      badge: 'FR - Java/Angular'
    },
    {
      label: 'Capgemini Data & AI',
      sub: 'Ali Benhima (Data & AI) ➔ Machine Learning, Python, Data Pipelines',
      resumeId: 'ali-swe-fastapi-fr',
      jdId: 'capgemini-data-ai-fr',
      badge: 'FR - Data & AI'
    },
    {
      label: 'VISEO (AI & Cloud Solutions)',
      sub: 'Ali Benhima (SWE & GenAI) ➔ Enterprise LLM Agents, RAG, Kubernetes',
      resumeId: 'ali-swe-genai-en',
      jdId: 'viseo-senior-llm-en',
      badge: 'EN - Senior GenAI'
    },
    {
      label: 'ChainGPT (Web3 & AI Frontier)',
      sub: 'Ali Benhima (AI-Native) ➔ AI Coding Agents, Autonomous Systems, Fast Demos',
      resumeId: 'ali-swe-genai-en',
      jdId: 'chaingpt-ainative-en',
      badge: 'EN - AI-Native SWE'
    }
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20 sticky top-0 shadow-xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-xs md:max-w-md">
            {activeThread?.title || 'AgenticATS Studio'}
          </span>
          {activeThread?.language && (
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 shadow-xs">
              {activeThread.language === 'fr' ? 'FR - Français' : 'EN - English'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Groq LPU Real-time Status */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
          <span>Groq LPU (~450 tok/s)</span>
        </div>

        {/* 1-Click Real-World Pairing Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPairingMenu(!showPairingMenu)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-600/20 transition-all duration-200 active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-white" />
            <span>Select Real-World Match</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          {showPairingMenu && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 divide-y divide-slate-100">
              <div className="px-4 py-2 text-[11px] font-bold text-brand-700 uppercase tracking-wider flex items-center justify-between bg-slate-50/50">
                <span>Curated Match Demo (1-Click)</span>
                <span className="text-[10px] text-slate-500 font-mono">Ali BENHIMA PFE 2027</span>
              </div>
              <div className="max-h-96 overflow-y-auto py-1">
                {curatedPairings.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onLoadPairing(p.resumeId, p.jdId);
                      setShowPairingMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 group transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600">
                        {p.label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {p.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
