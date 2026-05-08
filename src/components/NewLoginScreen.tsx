import { useAgentStore } from '../store/agentStore';

export function LoginScreen() {
  const login = useAgentStore((s) => s.login);

  return (
    <div className="h-screen flex items-center justify-center bg-background dark:bg-[#050505]">
      <div className="w-full max-w-2xl px-6">
        <div className="bg-card dark:bg-[#0F0F10] border border-border dark:border-[#232326] rounded-lg p-10 shadow-sm text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">WATCHOVER AI</p>
          <h1 className="text-3xl font-semibold mt-4">Watchover AI</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
            Watchover AI is an interactive demo dashboard showcasing agent decision traces, trust scores,
            and governance controls. This demo uses simulated data so you can explore features without
            a running backend.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => login('Demo User')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Continue to demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
