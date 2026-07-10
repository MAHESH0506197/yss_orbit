// yss_orbit\frontend\src\features\settings\pages\BrandingPage.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload } from 'lucide-react';

export default function BrandingPage() {
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  
  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)] max-w-4xl">
      <div>
        <h1 className="text-[length:var(--font-size-2xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">Branding</h1>
        <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
          Customize the look and feel of your portal.
        </p>
      </div>

      <Card variant="elevated" title="Logo & Assets">
        <div className="flex flex-col gap-[var(--space-6)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)] text-[var(--color-text)]">Company Logo</label>
            <div className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-8)] flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer bg-[var(--color-surface)]">
              <Upload size={24} className="mb-[var(--space-2)]" />
              <p className="text-[length:var(--font-size-sm)]">Click or drag image to upload</p>
              <p className="text-[length:var(--font-size-xs)] mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" title="Theme Colors">
        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)] text-[var(--color-text)]">Primary Color</label>
            <div className="flex items-center gap-[var(--space-3)]">
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32" />
            </div>
            <p className="text-[length:var(--font-size-xs)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
              This color will be used for primary buttons, active states, and links.
            </p>
          </div>
          
          <div className="flex justify-end mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--color-border)]">
            <Button variant="primary">Save Branding</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
