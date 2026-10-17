import React from 'react';
import { PlusCircle, FileText, Trash2, LogOut, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shadow-xs ${
        isOpen ? 'w-72' : 'w-0 -translate-x-full'
      } md:relative md:w-72 md:translate-x-0`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base tracking-tight leading-none">AgenticATS</h1>
            <span className="text-[10px] text-brand-600 font-bold tracking-wider uppercase">Multi-Agent Studio</span>
          </div>
        </div>
      </div>

      {/* New Audit Action */}
      <div className="p-3">
        <button
          onClick={onNewThread}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm shadow-brand-600/20 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Resume Audit</span>
        </button>
      </div>

      {/* Audit History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Audit History
        </div>

        {threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No audits yet. Click New to start.
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-semibold shadow-xs border border-brand-200/80'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0 pr-2">
                  <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span className="truncate">{thread.title || 'Untitled Audit'}</span>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                    isActive ? 'bg-brand-100/60 text-brand-700 border-brand-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {thread.language || 'EN'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Bar */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'Demo User'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'demo@agenticats.com'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
