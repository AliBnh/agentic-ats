import React from 'react';
import { Menu, Zap, ChevronDown, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = ({
  activeThread,
  onToggleSidebar,
  sampleCatalog,
  onLoadPairing
}) => {
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
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20 sticky top-0 shadow-2xs">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center space-x-3">
          <span className="text-sm font-bold text-foreground tracking-tight truncate max-w-xs md:max-w-md">
            {activeThread?.title || 'AgenticATS Studio'}
          </span>
          {activeThread?.language && (
            <Badge variant="brand" className="hidden sm:inline-flex uppercase tracking-wider text-[10px]">
              {activeThread.language === 'fr' ? 'FR - Français' : 'EN - English'}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Groq LPU Real-time Status */}
        <Badge variant="success" className="hidden sm:inline-flex items-center gap-1.5 py-1 px-3 font-semibold shadow-2xs">
          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
          <span>Groq LPU (~450 tok/s)</span>
        </Badge>

        {/* 1-Click Real-World Pairing Selector with shadcn DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm shadow-brand-600/20 gap-1.5 active:scale-95 transition-all"
              size="sm"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Select Real-World Match</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-96 p-1.5">
            <DropdownMenuLabel className="flex items-center justify-between text-[11px] font-bold text-brand-700 uppercase tracking-wider py-1.5 px-2 bg-muted/50 rounded-lg">
              <span>Curated Match Demo (1-Click)</span>
              <span className="text-[10px] text-muted-foreground font-mono">Ali BENHIMA PFE 2027</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto space-y-0.5 py-1">
              {curatedPairings.map((p, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={() => onLoadPairing(p.resumeId, p.jdId)}
                  className="flex flex-col items-start p-2.5 cursor-pointer rounded-lg hover:bg-accent group transition-all"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                      {p.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {p.sub}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
