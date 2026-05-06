import { useState } from 'react';
import { useAgentStore } from '../store/agentStore';

interface LoginProps {
  onSwitchToSignup: () => void;
}

export default function Login({ onSwitchToSignup }: LoginProps): JSX.Element {
  const login = useAgentStore((s) => s.login);
  const [name, setName] = useState('');
  const isInvalid = name.trim().length === 0;

  return (
    <div className="flex h-screen items-center justify-center bg-bg px-4 text-text-primary">
      <div className="w-full max-w-md rounded-lg border border-weak bg-surface p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-text-primary">Sign in</h2>
        <p className="mb-4 text-sm text-text-secondary">Enter a username to start (mock auth).</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-invalid={isInvalid}
          className="mb-2 w-full rounded-md border border-weak bg-surface p-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
        />
        <p className="mb-4 text-xs text-text-secondary">Username is required.</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => login(name)}
            disabled={isInvalid}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Continue
          </button>
        </div>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="mt-4 text-sm text-text-secondary hover:text-text-primary"
        >
          Need an account? Sign up
        </button>
      </div>
    </div>
  );
}
