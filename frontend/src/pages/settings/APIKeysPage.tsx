// yss_orbit\frontend\src\features\settings\pages\APIKeysPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Key, Copy, Trash2, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

const mockApiKeys: ApiKey[] = [
  { id: '1', name: 'Production API Key', key: 'pk_live_1234567890abcdef', createdAt: '2026-01-15', lastUsed: '2026-05-28' },
  { id: '2', name: 'Development Key', key: 'pk_test_0987654321fedcba', createdAt: '2026-03-10', lastUsed: '2026-05-27' },
];

const fetchApiKeys = async (): Promise<ApiKey[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockApiKeys), 600));
};

export default function APIKeysPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      // In a real app we would update the cache here
      console.log('Deleted key');
    }
  });

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)] max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="text-[length:var(--font-size-2xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">API Keys</h1>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
            Manage API keys for integrating with YSS Orbit.
          </p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={16} />}>
          Generate New Key
        </Button>
      </div>

      <Card variant="elevated" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[length:var(--font-size-sm)] text-[var(--color-text)]">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Name</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Secret Key</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Created</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">Last Used</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {isLoading && (
                [...Array(2)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-48 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-24 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-24 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-8 bg-[var(--color-surface-hover)] animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              )}

              {!isLoading && apiKeys?.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-[var(--space-4)] font-[number:var(--font-weight-medium)] flex items-center gap-[var(--space-2)]">
                    <Key size={16} className="text-[var(--color-text-muted)]" />
                    {apiKey.name}
                  </td>
                  <td className="p-[var(--space-4)] font-mono">
                    {showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••••••••••'}
                  </td>
                  <td className="p-[var(--space-4)] text-[var(--color-text-secondary)]">{apiKey.createdAt}</td>
                  <td className="p-[var(--space-4)] text-[var(--color-text-secondary)]">{apiKey.lastUsed || 'Never'}</td>
                  <td className="p-[var(--space-4)] text-right">
                    <div className="flex items-center justify-end gap-[var(--space-2)]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        iconLeft={showKeys[apiKey.id] ? <EyeOff size={14} /> : <Eye size={14} />} 
                        onClick={() => toggleShowKey(apiKey.id)}
                        aria-label={showKeys[apiKey.id] ? "Hide Key" : "Show Key"}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        iconLeft={<Copy size={14} />} 
                        onClick={() => copyToClipboard(apiKey.key)}
                        aria-label="Copy Key"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        iconLeft={<Trash2 size={14} className="text-[var(--color-error)]" />} 
                        onClick={() => deleteMutation.mutate(apiKey.id)}
                        loading={deleteMutation.isPending}
                        aria-label="Delete Key"
                      />
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
