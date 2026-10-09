import React, { useEffect, useState } from 'react';
import { SparklesIcon } from 'lucide-react';
import { AppShell, PageHeader } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { AssessmentView } from '../components/credit/AssessmentView';
import { fetchApi, mapDjangoAssessment } from '../services/api';

export function Result() {
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi('/assessments/latest/');
        setLatestAssessment(mapDjangoAssessment(res.assessment));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <AppShell><div className="p-8 text-center text-slate-500">Loading result...</div></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        title="Your Credit Assessment"
        subtitle="Based on the information you just submitted."
        action={
          <div className="flex gap-3">
            <ButtonLink to="/loans?tab=planner&handoff=true" variant="outline" size="sm">
              Plan This Loan
            </ButtonLink>
            <ButtonLink to="/assistant" variant="ai" size="sm">
              <SparklesIcon size={17} aria-hidden="true" />
              Explain this with CreditAI
            </ButtonLink>
          </div>
        } />
      
      {latestAssessment ? (
        <AssessmentView assessment={latestAssessment} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No assessment found.</p>
        </div>
      )}
    </AppShell>
  );
}