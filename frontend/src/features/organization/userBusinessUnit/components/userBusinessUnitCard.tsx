// yss_orbit\frontend\src\modules\userBusinessUnit\components\userBusinessUnitCard.tsx
import React from 'react';
import type { UserBusinessUnitMembership } from '../types/userBusinessUnitTypes';
import { formatIST } from '@/utils/date';

export interface UserBusinessUnitCardProps {
  membership: UserBusinessUnitMembership;
  onDeactivate?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const UserBusinessUnitCard: React.FC<UserBusinessUnitCardProps> = ({
  membership,
  onDeactivate,
  onActivate,
  onDelete,
  className = '',
}) => {
  const { id, userFullName, userEmail, businessUnitName, roleName, isActiveMembership, joinedAt } = membership;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{userFullName || userEmail}</h4>
          <p className="text-xs text-gray-500">{userEmail}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isActiveMembership ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isActiveMembership ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{businessUnitName}</span>
        </div>
        {roleName && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{roleName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Joined {formatIST(new Date(joinedAt), 'PPP')}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {isActiveMembership && onDeactivate && (
          <button
            onClick={() => onDeactivate(id)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium"
          >
            Deactivate
          </button>
        )}
        {!isActiveMembership && onActivate && (
          <button
            onClick={() => onActivate(id)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
          >
            Activate
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-xs py-1.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default UserBusinessUnitCard;
