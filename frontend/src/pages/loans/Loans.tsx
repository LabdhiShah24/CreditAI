import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { cx } from '../../utils/format';
import { LoanPlanner } from './LoanPlanner';
import { LoanTracker } from './LoanTracker';

export function Loans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'planner';

  const handleTabChange = (newTab: 'planner' | 'tracker') => {
    setSearchParams({ tab: newTab });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="inline-flex rounded-full border border-navy-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => handleTabChange('planner')}
              className={cx(
                'rounded-full px-6 py-2.5 text-sm font-semibold transition-colors',
                tab === 'planner'
                  ? 'bg-navy-900 text-white shadow'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              )}
            >
              Loan Planner
            </button>
            <button
              onClick={() => handleTabChange('tracker')}
              className={cx(
                'rounded-full px-6 py-2.5 text-sm font-semibold transition-colors',
                tab === 'tracker'
                  ? 'bg-navy-900 text-white shadow'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              )}
            >
              Loan Tracker
            </button>
          </div>
        </div>

        <div className="mt-6">
          {tab === 'planner' ? <LoanPlanner onSaveLoan={() => handleTabChange('tracker')} /> : <LoanTracker />}
        </div>
      </div>
    </AppShell>
  );
}
