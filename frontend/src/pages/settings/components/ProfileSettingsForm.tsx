// yss_orbit\frontend\src\features\settings\components\ProfileSettingsForm.tsx
import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ProfileSettingsForm() {
  return (
    <form className="flex flex-col gap-[var(--space-4)]" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <label className="text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)] text-[var(--color-text)]">First Name</label>
          <Input defaultValue="Admin" />
        </div>
        <div className="flex flex-col gap-[var(--space-1)]">
          <label className="text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)] text-[var(--color-text)]">Last Name</label>
          <Input defaultValue="User" />
        </div>
      </div>
      <div className="flex flex-col gap-[var(--space-1)]">
        <label className="text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)] text-[var(--color-text)]">Email Address</label>
        <Input type="email" defaultValue="admin@yssorbit.com" />
      </div>
      <div className="flex justify-end mt-[var(--space-2)]">
        <Button variant="primary">Save Changes</Button>
      </div>
    </form>
  );
}
