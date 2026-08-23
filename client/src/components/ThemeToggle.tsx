import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={`Current: ${theme} mode. Click to switch.`}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title="Toggle Appearance Mode"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="capitalize">{theme}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => {
              setTheme('light');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
              theme === 'light'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light</span>
            </div>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
          </button>

          <button
            onClick={() => {
              setTheme('dark');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
              theme === 'dark'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark</span>
            </div>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
          </button>

          <button
            onClick={() => {
              setTheme('system');
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
              theme === 'system'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-500" />
              <span>System</span>
            </div>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
