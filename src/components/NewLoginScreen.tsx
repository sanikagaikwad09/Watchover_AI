import { useAgentStore } from '../store/agentStore';
import { ArrowRight, ShieldCheck, Sparkles, Clock3 } from 'lucide-react';

export function LoginScreen() {
  const login = useAgentStore((s) => s.login);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-text-primary">
      <div className="w-full max-w-3xl">
        <div className="rounded-lg border border-weak bg-surface shadow-sm">
          <div className="border-b border-weak px-6 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Watchover AI</p>
            <h1 className="mt-1 text-2xl font-semibold">AI agent transparency, without the noise</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Review live agent decisions, inspect risk, and step into a realistic demo environment that feels like a real operations console.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-weak bg-bg px-3 py-1 text-xs text-text-secondary">Mock auth</span>
                <span className="rounded-full border border-weak bg-bg px-3 py-1 text-xs text-text-secondary">Real-time activity</span>
                <span className="rounded-full border border-weak bg-bg px-3 py-1 text-xs text-text-secondary">Decision replay</span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-weak bg-bg px-4 py-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium">Transparent controls</p>
                    <p className="text-sm text-text-secondary">Inspect approvals, pauses, and reruns from one place.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-weak bg-bg px-4 py-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium">Enterprise-grade realism</p>
                    <p className="text-sm text-text-secondary">Live-looking agent activity, governance, and audit context.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-weak bg-bg px-4 py-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium">Start in seconds</p>
                    <p className="text-sm text-text-secondary">No backend setup required for the demo experience.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-weak bg-bg p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Demo access</p>
              <h2 className="mt-2 text-lg font-semibold">Continue into the control room</h2>
              <p className="mt-2 text-sm text-text-secondary">
                This opens the simulated dashboard with seeded agents and real-time mock events.
              </p>

              <button
                type="button"
                onClick={() => login('Demo User')}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-[#F5F5F5] dark:bg-[#F5F5F5] dark:text-[#050505] dark:hover:bg-white"
              >
                Continue to demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
