// yss_orbit\frontend\src\modules\userBusinessUnit\pages\BusinessUnitMemberPage.tsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MembershipTable } from './components/MembershipTable';
import { useUserBusinessUnit } from './hooks/useuserBusinessUnit';

export interface BusinessUnitMemberPageProps {
  buId?: string;
  className?: string;
}

/**
 * Shows all members of a specific Business Unit.
 * Reads ?buId=<UUID> from query params or uses the buId prop.
 */
export const BusinessUnitMemberPage: React.FC<BusinessUnitMemberPageProps> = ({
  buId: buIdProp,
  className = '',
}) => {
  const [searchParams] = useSearchParams();
  const buId = buIdProp ?? searchParams.get('buId') ?? '';

  const { memberships, isLoading, error, refetch, applyFilters, toggleMembership, deleteMembership } =
    useUserBusinessUnit();

  useEffect(() => {
    if (buId) {
      applyFilters({ businessUnitId: buId });
    } else {
      refetch();
    }
  }, [buId]);

  const handleToggle = async (id: string) => {
    const m = memberships.find((x) => x.id === id);
    if (m) await toggleMembership(id, !m.isActiveMembership);
  };

  const buName =
    memberships.length > 0 ? (memberships[0]?.businessUnitName ?? buId ?? 'Business Unit') : (buId || 'Business Unit');

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Members — {buName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {memberships.length} member{memberships.length !== 1 ? 's' : ''} in this business unit
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <button onClick={refetch} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <MembershipTable
        memberships={memberships}
        isLoading={isLoading}
        onDeactivate={(id) => {
          const m = memberships.find((x) => x.id === id);
          if (m?.isActiveMembership) handleToggle(id);
        }}
        onActivate={(id) => {
          const m = memberships.find((x) => x.id === id);
          if (!m?.isActiveMembership) handleToggle(id);
        }}
        onDelete={deleteMembership}
      />
    </div>
  );
};

export default BusinessUnitMemberPage;
