import { Bell, Check, Eye, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore';
import type { MockSocket } from '../services/mockSocket';

interface NotificationCenterProps {
  socket?: Socket | MockSocket;
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) {
    return 'now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationCenter({ socket }: NotificationCenterProps) {
  const notifications = useAgentStore((state) => state.notifications);
  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);
  const markAllNotificationsRead = useAgentStore((state) => state.markAllNotificationsRead);
  const clearNotification = useAgentStore((state) => state.clearNotification);
  const openDecisionReplay = useAgentStore((state) => state.openDecisionReplay);
  const approveAction = useAgentStore((state) => state.approveAction);
  const showFeedback = useAgentStore((state) => state.showFeedback);
  const trackEvent = useAgentStore((state) => state.trackEvent);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      markAllNotificationsRead();
      trackEvent('notifications opened');
    }
  };

  const handleInspect = (actionId?: string) => {
    if (!actionId) {
      return;
    }
    openDecisionReplay(actionId);
    setIsOpen(false);
  };

  const handleApprove = (actionId?: string) => {
    if (!actionId) {
      return;
    }

    if (socket) {
      socket.emit('agent:approve', { actionId });
      showFeedback('Approval sent...', 'success');
    } else {
      approveAction(actionId);
    }

    setIsOpen(false);
  };

  const handleRetry = (actionId?: string) => {
    if (!actionId) {
      return;
    }

    if (socket) {
      socket.emit('agent:retry', { actionId });
      showFeedback('Retry sent...', 'warning');
    } else {
      showFeedback('Retry requested.', 'warning');
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open notifications"
        className="relative rounded-lg border border-border dark:border-[#232326] p-2 transition-colors hover:bg-accent dark:hover:bg-[#161618] focus:outline-none focus:ring-2 focus:ring-slate-500"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg dark:border-[#232326] dark:bg-[#0F0F10]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-[#232326]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Notifications</p>
              <h3 className="mt-0.5 text-sm font-semibold">Action center</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-text-secondary transition-colors hover:bg-accent dark:hover:bg-[#161618]"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[22rem] space-y-2 overflow-y-auto p-3">
            {notifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-bg px-4 py-6 text-center text-sm text-text-secondary dark:border-[#232326]">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-weak bg-bg p-3 transition-colors hover:border-slate-400 dark:hover:border-[#2F2F33]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            notification.severity === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : notification.severity === 'warning'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : notification.severity === 'success'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-[#161618] dark:text-slate-300'
                          }`}
                        >
                          {notification.severity}
                        </span>
                        <span className="text-xs text-text-muted">{formatRelativeTime(notification.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-text-primary">{notification.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => clearNotification(notification.id)}
                      className="rounded-md p-1 text-text-muted transition-colors hover:bg-accent dark:hover:bg-[#161618]"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspect(notification.actionId)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-weak bg-surface px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(notification.actionId)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-weak bg-surface px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRetry(notification.actionId)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-weak bg-surface px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
