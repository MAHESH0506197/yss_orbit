// yss_orbit\frontend\src\modules\notification\components\ChannelSelector.tsx
import React from 'react';

export const ChannelSelector: React.FC<{ channels: string[], selected: string[], onChange: (channels: string[]) => void }> = ({ channels, selected, onChange }) => {
  const toggle = (ch: string) => {
    if (selected.includes(ch)) {
      onChange(selected.filter(c => c !== ch));
    } else {
      onChange([...selected, ch]);
    }
  };

  return (
    <div className="flex space-x-2">
      {channels.map(ch => (
        <button
          key={ch}
          onClick={() => toggle(ch)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${selected.includes(ch) ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {ch}
        </button>
      ))}
    </div>
  );
};
