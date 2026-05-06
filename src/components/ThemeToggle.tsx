import { useEffect } from 'react';
import { useAgentStore } from '../store/agentStore';

export default function ThemeToggle(): JSX.Element {
  const theme = useAgentStore((s) => s.theme);
  const toggle = useAgentStore((s) => s.toggleTheme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-md border border-weak bg-panel px-3 py-2 text-sm text-slate-300 hover:opacity-90"
    >
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
