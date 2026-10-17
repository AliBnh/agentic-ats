import React from 'react';
import { PlusCircle, FileText, Trash2, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export const Sidebar = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isOpen,
  onToggle
}) => {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-card border-r border-border transition-all duration-300 shadow-xs ${
        isOpen ? 'w-72' : 'w-0 -translate-x-full'
      } md:relative md:w-72 md:translate-x-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-base tracking-tight leading-none">AgenticATS</h1>
            <span className="text-[10px] text-brand-600 font-bold tracking-wider uppercase">Multi-Agent Studio</span>
          </div>
        </div>
      </div>

      {/* New Audit Action */}
      <div className="p-3">
        <Button
          onClick={onNewThread}
          variant="brand"
          className="w-full flex items-center justify-center space-x-2 rounded-xl font-semibold text-xs shadow-sm shadow-brand-600/20 py-2.5 h-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Resume Audit</span>
        </Button>
      </div>

      {/* Audit History List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Audit History
        </div>

        {threads.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl mx-2">
            No audits yet. Click New to start.
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 border ${
                  isActive
                    ? 'bg-accent/80 text-foreground font-semibold border-border shadow-2xs'
                    : 'text-muted-foreground border-transparent hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pr-2">
                  <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{thread.title || 'Untitled Audit'}</span>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <Badge
                    variant={isActive ? "brand" : "secondary"}
                    className="text-[10px] uppercase font-bold px-1.5 py-0"
                  >
                    {thread.language || 'EN'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 p-0 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Separator />

      {/* User Profile Bar */}
      <div className="p-3 bg-muted/40">
        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center space-x-2.5 truncate">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-brand-600 text-white text-xs font-bold uppercase">
                {user?.full_name ? user.full_name[0] : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="truncate">
              <div className="text-xs font-semibold text-foreground truncate">{user?.full_name || 'Demo User'}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email || 'demo@agenticats.com'}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
