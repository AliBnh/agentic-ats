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
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-card transition-all duration-200 ${
          isOpen ? 'w-80' : 'w-0 -translate-x-full'
        } md:relative md:w-80 md:translate-x-0 overflow-hidden`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">
                  AgenticATS
                </h1>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Resume workspace
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="md:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <Button
            onClick={onNewThread}
            variant="default"
            className="w-full"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Resume Audit</span>
          </Button>

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

        <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Audit History</span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
            {filteredThreads.length} {filteredThreads.length === 1 ? 'audit' : 'audits'}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
          {filteredThreads.length === 0 ? (
            <div className="mx-2 flex flex-col gap-2 rounded-md border border-dashed p-6 text-center">
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
                  className={`group relative flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-xs transition-colors ${
                    isActive
                      ? 'border-border bg-accent text-foreground font-semibold'
                      : 'text-muted-foreground border-transparent hover:bg-accent/40 hover:text-foreground'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5 truncate pr-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {thread.title || 'Untitled Audit'}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                        {formattedDate && <span>{formattedDate}</span>}
                        {formattedDate && <span>•</span>}
                        <span className="uppercase">{thread.language || 'EN'} Norms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
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
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs uppercase">
                    {user?.full_name ? user.full_name[0] : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="truncate">
                <div className="flex items-center gap-1 truncate text-xs font-semibold text-foreground">
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
                  className="text-muted-foreground hover:text-destructive"
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
