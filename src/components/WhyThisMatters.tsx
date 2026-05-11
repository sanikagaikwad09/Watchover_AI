import { Info } from 'lucide-react';

interface WhyThisMattersProps {
  text?: string;
  risk: 'low' | 'medium' | 'high';
}

export function WhyThisMatters({ text, risk }: WhyThisMattersProps) {
  if (!text || risk === 'low') {
    return null;
  }

  const borderColor =
    risk === 'high' ? 'border-l-red-600 dark:border-l-red-500' : 'border-l-amber-600 dark:border-l-amber-500';

  return (
    <div className={`mt-3 rounded-md border border-weak border-l-2 bg-bg px-3 py-2 ${borderColor}`}>
      <div className="flex items-start gap-2 text-text-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">Why this matters</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary line-clamp-2">{text}</p>
        </div>
      </div>
    </div>
  );
}
