import { useRef, useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore';
import type { MockSocket } from '../services/mockSocket';
import { NotificationCenter } from './NotificationCenter';

interface TopBarProps {
  socket?: Socket | MockSocket;
}

export function TopBar({ socket }: TopBarProps) {
  const username = useAgentStore((s) => s.userName);
  const logout = useAgentStore((s) => s.logout);
  const toggleTheme = useAgentStore((s) => s.toggleTheme);
  const theme = useAgentStore((s) => s.theme);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-14 border-b border-border dark:border-[#232326] bg-card dark:bg-[#0F0F10] flex items-center justify-between px-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">MISSION CONTROL</p>
        <h1 className="text-base font-semibold mt-0.5">Watchover AI</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationCenter socket={socket} />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border dark:border-[#232326] hover:bg-accent dark:hover:bg-[#161618] focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent dark:hover:bg-[#161618] focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-[#161618] text-[#ffffff] flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
            <span className="text-sm font-medium">{username}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-[#0F0F10] border border-border dark:border-[#232326] rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#161618] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
