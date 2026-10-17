import React, { useState } from 'react';
import {
  PlusCircle,
  FileText,
  Trash2,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const Sidebar = ({
  threads = [],
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isOpen,
  onToggle
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const lang = (t.language || '').toLowerCase();
    return title.includes(query) || lang.includes(query);
  });

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-card border-r border-border/80 transition-all duration-300 shadow-sm ${
          isOpen ? 'w-80' : 'w-0 -translate-x-full'
        } md:relative md:w-80 md:translate-x-0 overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border/70 flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-primary to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-foreground text-base tracking-tight leading-none truncate">
                  AgenticATS
                </h1>
                <Badge variant="brand" className="text-[9px] font-mono px-1.5 py-0 uppercase">
                  Pro
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                Multi-Agent Career Studio
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="md:hidden h-8 w-8 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Button: New Audit */}
        <div className="p-3 pb-2 space-y-2.5">
          <Button
            onClick={onNewThread}
            variant="brand"
            className="w-full flex items-center justify-center space-x-2 rounded-xl font-semibold text-xs shadow-sm shadow-brand-600/25 py-2.5 h-10 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Resume Audit</span>
          </Button>

          {/* Quick Search Audits */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit sessions..."
              className="pl-8 text-xs h-9 bg-muted/40 border-border/60 focus-visible:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Audit Sessions List Header */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <span>Audit History</span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
            {filteredThreads.length} {filteredThreads.length === 1 ? 'audit' : 'audits'}
          </span>
        </div>

        {/* Audit History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center space-y-2 mx-2 rounded-xl border border-dashed border-border/80 bg-muted/20">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <div className="text-xs font-medium text-foreground">
                {searchQuery ? 'No matching audits' : 'No audits yet'}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {searchQuery
                  ? 'Try searching with a different term.'
                  : 'Start by uploading a resume or choosing a demo.'}
              </p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const formattedDate = thread.created_at
                ? new Date(thread.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : null;

              return (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 border ${
                    isActive
                      ? 'bg-accent/80 text-foreground font-semibold border-primary/30 shadow-xs'
                      : 'text-muted-foreground border-transparent hover:bg-accent/40 hover:text-foreground'
                  }`}
                >
                  {/* Left accent bar for active thread */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                  )}

                  <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/60 text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {thread.title || 'Untitled Audit'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center space-x-1.5 mt-0.5">
                        {formattedDate && <span>{formattedDate}</span>}
                        {formattedDate && <span>•</span>}
                        <span className="uppercase">{thread.language || 'EN'} Norms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Badge
                      variant={isActive ? 'brand' : 'secondary'}
                      className="text-[10px] uppercase font-bold px-1.5 py-0 h-5"
                    >
                      {thread.language || 'EN'}
                    </Badge>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        Delete audit
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator className="opacity-80" />

        {/* User Profile Bar */}
        <div className="p-3 bg-muted/20">
          <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/70 shadow-xs">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="relative">
                <Avatar className="w-8 h-8 rounded-lg border border-border">
                  <AvatarFallback className="bg-gradient-to-tr from-brand-600 to-indigo-600 text-white text-xs font-bold uppercase rounded-lg">
                    {user?.full_name ? user.full_name[0] : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
              </div>

              <div className="truncate">
                <div className="text-xs font-semibold text-foreground truncate flex items-center space-x-1">
                  <span>{user?.full_name || 'Enterprise Candidate'}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {user?.email || 'demo@agenticats.com'}
                </div>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Sign out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
