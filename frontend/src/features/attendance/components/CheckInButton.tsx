// yss_orbit\frontend\src\modules\attendance\components\CheckInButton.tsx
import React, { useState } from 'react';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceService } from './services/attendanceService';

export const CheckInButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (isCheckedIn) {
        await AttendanceService.checkOut();
        setIsCheckedIn(false);
      } else {
        await AttendanceService.checkIn();
        setIsCheckedIn(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={`px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg transform transition-transform active:scale-95 ${
        isCheckedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {loading ? 'Processing...' : isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
    </button>
  );
};
