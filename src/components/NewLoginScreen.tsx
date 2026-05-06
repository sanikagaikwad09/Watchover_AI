import { useState } from 'react';
import { useAgentStore } from '../store/agentStore';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useAgentStore((s) => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      console.log('[UI] Login submitted');
      login(username.trim());
    }
  };

  const handleCreateAccount = () => {
    const nextUser = username.trim() || 'Agent Operator';
    console.log('[UI] Create account clicked');
    login(nextUser);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background dark:bg-[#050505]">
      <div className="w-full max-w-md">
        <div className="bg-card dark:bg-[#0F0F10] border border-border dark:border-[#232326] rounded-lg p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">MISSION CONTROL</p>
            <h1 className="text-2xl font-semibold mt-2">ControlLayer</h1>
            <p className="text-sm text-muted-foreground mt-2">Agent Control & Transparency System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Login form">
            <div>
              <label htmlFor="username" className="block text-sm mb-2 font-medium">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-[#232326] bg-background dark:bg-[#161618] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent focus:ring-offset-2 dark:focus:ring-offset-[#050505]"
                placeholder="Enter your username"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-[#232326] bg-background dark:bg-[#161618] text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent focus:ring-offset-2 dark:focus:ring-offset-[#050505]"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              aria-label="Sign in to ControlLayer"
              className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505]"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={handleCreateAccount}
              aria-label="Create a new account"
              className="w-full px-4 py-2.5 border border-border dark:border-[#232326] hover:bg-accent dark:hover:bg-[#161618] text-foreground dark:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-[#050505]"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
