import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const Navbar = ({ activeThread, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar} aria-label="Open conversations">
          <Menu />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{activeThread?.title || 'New resume audit'}</p>
          <p className="text-[11px] text-muted-foreground">Resume Copilot</p>
        </div>
        {activeThread?.language && (
          <Badge variant="secondary" className="hidden uppercase sm:inline-flex">
            {activeThread.language}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
        <Avatar className="size-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
