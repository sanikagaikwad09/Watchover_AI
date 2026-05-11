import { Code2, FileText, Mail, MessageSquare, type LucideIcon } from 'lucide-react';
import type { IntegrationType } from '../types/agent.types';

interface IntegrationBadgesProps {
  integrations: IntegrationType[];
  className?: string;
}

const INTEGRATION_META: Record<IntegrationType, { label: string; icon: LucideIcon }> = {
  slack: { label: 'Slack', icon: MessageSquare },
  gmail: { label: 'Gmail', icon: Mail },
  notion: { label: 'Notion', icon: FileText },
  github: { label: 'GitHub', icon: Code2 },
};

export function IntegrationBadges({ integrations, className = '' }: IntegrationBadgesProps) {
  const uniqueIntegrations = Array.from(new Set(integrations));

  if (uniqueIntegrations.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {uniqueIntegrations.map((integration) => {
        const meta = INTEGRATION_META[integration];
        const Icon = meta.icon;

        return (
          <span
            key={integration}
            title={`Synced with ${meta.label}`}
            className="inline-flex items-center gap-1 rounded-full border border-weak bg-bg px-2 py-0.5 text-[11px] text-text-secondary"
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
