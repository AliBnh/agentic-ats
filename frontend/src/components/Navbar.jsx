import React from 'react';
import {
  Menu,
  Zap,
  ChevronDown,
  Compass,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
  Cpu,
  Layers,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const Navbar = ({
  activeThread,
  onToggleSidebar,
  sampleCatalog,
  onLoadPairing,
}) => {
  const { theme, toggleTheme } = useTheme();

  const curatedGroups = [
    {
      category: 'AI, GenAI & Tech Innovation',
      items: [
        {
          label: 'BCG X Delivery Casablanca',
          sub: 'Ali Benhima (SWE & GenAI) ➔ Python, FastAPI, React, Cloud',
          resumeId: 'ali-swe-genai-en',
          jdId: 'bcg-x-swe-en',
          badge: 'EN · BCG X AI',
          badgeVariant: 'success',
        },
        {
          label: 'VISEO (AI & Cloud Solutions)',
          sub: 'Ali Benhima (SWE & GenAI) ➔ Enterprise LLM Agents, RAG, K8s',
          resumeId: 'ali-swe-genai-en',
          jdId: 'viseo-senior-llm-en',
          badge: 'EN · Senior GenAI',
          badgeVariant: 'success',
        },
        {
          label: 'ChainGPT (Web3 & AI Frontier)',
          sub: 'Ali Benhima (AI-Native) ➔ AI Coding Agents & LLM Systems',
          resumeId: 'ali-swe-genai-en',
          jdId: 'chaingpt-ainative-en',
          badge: 'EN · Frontier AI',
          badgeVariant: 'success',
        },
        {
          label: 'Ostorlab Cybersecurity',
          sub: 'Ali Benhima (GenAI & Security) ➔ Security Testing Automation',
          resumeId: 'ali-swe-genai-en',
          jdId: 'ostorlab-cyber-en',
          badge: 'EN · Cyber AI',
          badgeVariant: 'warning',
        },
      ],
    },
    {
      category: 'Strategy & Management Consulting',
      items: [
        {
          label: 'Wavestone ALMA Casablanca',
          sub: 'Ali Benhima (Conseil IT) ➔ Cyber, Souveraineté & Stratégie',
          resumeId: 'ali-consulting-fr',
          jdId: 'wavestone-alma-fr',
          badge: 'FR · Conseil IT',
          badgeVariant: 'brand',
        },
        {
          label: 'Deloitte Afrique Technology',
          sub: 'Ali Benhima (Conseil IT) ➔ Stratégie SI, AMOA & Finance',
          resumeId: 'ali-consulting-fr',
          jdId: 'deloitte-tech-fr',
          badge: 'FR · AMOA Tech',
          badgeVariant: 'brand',
        },
        {
          label: 'Visa Consulting & Analytics (VCA)',
          sub: 'Ali Benhima (Payments) ➔ Digital Payments & Analytics',
          resumeId: 'ali-consulting-en',
          jdId: 'visa-vca-en',
          badge: 'EN · Payments',
          badgeVariant: 'secondary',
        },
      ],
    },
    {
      category: 'Cloud Engineering & Digital Platforms',
      items: [
        {
          label: 'Capgemini Engineering',
          sub: 'Ali Benhima (Full Stack) ➔ Smart Carpool (Azure / Java / Python)',
          resumeId: 'ali-swe-fastapi-fr',
          jdId: 'capgemini-backend-fr',
          badge: 'FR · Full Stack',
          badgeVariant: 'secondary',
        },
        {
          label: 'Capgemini Data & AI',
          sub: 'Ali Benhima (Data & AI) ➔ Machine Learning Pipelines & Python',
          resumeId: 'ali-swe-fastapi-fr',
          jdId: 'capgemini-data-ai-fr',
          badge: 'FR · Data & ML',
          badgeVariant: 'secondary',
        },
        {
          label: 'Sofrecom (Orange Group)',
          sub: 'Ali Benhima (Full Stack) ➔ Java, Spring Boot, Microservices',
          resumeId: 'ali-swe-fastapi-fr',
          jdId: 'sofrecom-fullstack-fr',
          badge: 'FR · Spring/Cloud',
          badgeVariant: 'secondary',
        },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <header className="h-16 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 transition-colors">
        {/* Left Section: Sidebar Toggle & Active Audit Context */}
        <div className="flex items-center space-x-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground font-medium">
              <span className="hover:text-foreground transition-colors">Audits</span>
              <span className="text-border">/</span>
            </div>

            <div className="flex items-center space-x-2 truncate">
              <h2 className="text-sm font-bold text-foreground tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {activeThread?.title || 'New Resume Audit'}
              </h2>

              {activeThread?.language && (
                <Badge
                  variant={activeThread.language === 'fr' ? 'brand' : 'secondary'}
                  className="hidden sm:inline-flex uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded-md"
                >
                  {activeThread.language === 'fr' ? 'FR · Français' : 'EN · English'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: System Metrics, 1-Click Curated Pairing, and Theme Switcher */}
        <div className="flex items-center space-x-2.5">
          {/* Fact-Locked Truth Sentinel Pill */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-help">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px]">Fact-Locked</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p className="font-semibold text-foreground">Zero-Hallucination Guardrail</p>
              <p className="text-muted-foreground mt-0.5">
                AST Parser and LangGraph truth gate guarantee no fabricated employers, dates, or degrees.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Groq LPU Real-Time Speed Pill */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold cursor-help">
                <Zap className="w-3.5 h-3.5 fill-primary text-primary animate-pulse" />
                <span className="text-[11px] font-mono">Groq LPU (~450 t/s)</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p className="font-semibold text-foreground">Groq Ultra-Fast Inference</p>
              <p className="text-muted-foreground mt-0.5">
                Llama 3.3 70B & 8B models running at lightning speed on LPUs for sub-second evaluations.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* 1-Click Curated Pairing Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="brand"
                size="sm"
                className="h-9 font-semibold text-xs gap-1.5 px-3.5 shadow-sm shadow-brand-600/20 active:scale-95 transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Select Demo Pairing</span>
                <span className="sm:hidden">Demos</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-2 space-y-1">
              <div className="px-2.5 py-2 rounded-lg bg-muted/60 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Curated Real-World Matches</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    10 Postings
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  1-click loads authentic candidate profile matched against verified enterprise job postings.
                </p>
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-[360px] overflow-y-auto space-y-3 p-1">
                {curatedGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-0.5">
                      {group.category}
                    </div>

                    <div className="space-y-0.5">
                      {group.items.map((item, idx) => (
                        <DropdownMenuItem
                          key={idx}
                          onClick={() => onLoadPairing(item.resumeId, item.jdId)}
                          className="flex flex-col items-start p-2.5 cursor-pointer rounded-lg hover:bg-accent group transition-all"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {item.label}
                            </span>
                            <Badge
                              variant={item.badgeVariant}
                              className="text-[10px] font-mono px-1.5 py-0"
                            >
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                            {item.sub}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Toggle to {theme === 'dark' ? 'Light' : 'Dark'} mode
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
};
