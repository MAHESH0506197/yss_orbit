// yss_orbit\frontend\src\features\settings\pages\WebhooksPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Webhook, Edit, Trash2, Activity } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'failing';
}

const mockWebhooks: WebhookEndpoint[] = [
  { id: '1', url: 'https://api.acme.com/webhooks/orbit', events: ['customer.created', 'invoice.paid'], status: 'active' },
  { id: '2', url: 'https://hooks.slack.com/services/T000/B000/XXX', events: ['error.occurred'], status: 'failing' },
];

const fetchWebhooks = async (): Promise<WebhookEndpoint[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockWebhooks), 700));
};

export default function WebhooksPage() {
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchWebhooks,
  });

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)] max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="text-[length:var(--font-size-2xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">Webhooks</h1>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
            Configure webhooks to receive real-time updates.
          </p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={16} />}>
          Add Endpoint
        </Button>
      </div>

      <Card variant="elevated" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[length:var(--font-size-sm)] text-[var(--color-text)]">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Endpoint URL</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Events</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Status</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {isLoading && (
                [...Array(2)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-48 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-16 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-8 bg-[var(--color-surface-hover)] animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              )}

              {!isLoading && webhooks?.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-[var(--space-4)] font-[number:var(--font-weight-medium)] flex items-center gap-[var(--space-2)]">
                    <Webhook size={16} className="text-[var(--color-text-muted)]" />
                    {webhook.url}
                  </td>
                  <td className="p-[var(--space-4)]">
                    <div className="flex flex-wrap gap-[var(--space-1)]">
                      {webhook.events.map(event => (
                        <span key={event} className="px-[var(--space-2)] py-[var(--space-1)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md text-[length:var(--font-size-xs)]">
                          {event}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-[var(--space-4)]">
                    <span className={`px-[var(--space-2)] py-[var(--space-1)] rounded-full text-[length:var(--font-size-xs)] flex items-center gap-1 w-max ${
                      webhook.status === 'active' 
                        ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                        : 'bg-[var(--color-error-light)] text-[var(--color-error)]'
                    }`}>
                      <Activity size={12} />
                      {webhook.status}
                    </span>
                  </td>
                  <td className="p-[var(--space-4)] text-right">
                    <div className="flex items-center justify-end gap-[var(--space-2)]">
                      <Button variant="ghost" size="sm" iconLeft={<Edit size={14} />} aria-label="Edit" />
                      <Button variant="ghost" size="sm" iconLeft={<Trash2 size={14} className="text-[var(--color-error)]" />} aria-label="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
