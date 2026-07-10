// yss_orbit\frontend\src\modules\platformAdmin\components\BreakGlassConfirm.tsx
import React, { useState } from 'react';

export const BreakGlassConfirm: React.FC<{ onConfirm: (reason: string) => void }> = ({ onConfirm }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
      <h3 className="text-red-800 font-bold text-lg mb-2">Emergency Access Request</h3>
      <p className="text-red-600 mb-4 text-sm">You are requesting break-glass access. This action will be logged and audited.</p>
      <textarea 
        required 
        value={reason} 
        onChange={e => setReason(e.target.value)}
        placeholder="Enter justification for emergency access..."
        className="w-full p-2 border border-red-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
        rows={3}
      />
      <button 
        onClick={() => { if(reason) onConfirm(reason); }}
        disabled={!reason}
        className="bg-red-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
      >
        Confirm Access Request
      </button>
    </div>
  );
};
