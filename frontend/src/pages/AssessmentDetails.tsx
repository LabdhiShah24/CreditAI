import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { AppShell, PageHeader } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { ButtonLink } from '../components/ui/Button';
import { AssessmentView } from '../components/credit/AssessmentView';
import { fetchApi, mapDjangoAssessment } from '../services/api';

export function AssessmentDetails() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi(`/assessments/${id}/`);
        setAssessment(mapDjangoAssessment(res.assessment));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return <AppShell><div className="p-8 text-center text-slate-500">Loading assessment...</div></AppShell>;
  }

  if (!assessment) {
    return (
      <AppShell>
        <PageHeader title="Assessment not found" />
        <Card className="p-8 text-center">
          <p className="text-[1.05rem] text-navy-500">
            We couldn&rsquo;t find that assessment. It may have been removed.
          </p>
          <ButtonLink to="/history" variant="secondary" className="mt-6">
            Back to history
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/history"
        className="mb-4 inline-flex items-center gap-2 rounded-pill px-3 py-2 text-[1rem] font-semibold text-navy-500 transition-colors duration-150 ease-out hover:bg-navy-50 hover:text-navy-900">
        
        <ArrowLeftIcon size={17} aria-hidden="true" />
        Assessment History
      </Link>
      <PageHeader
        title="Your Credit Assessment"
        subtitle={`Saved assessment from ${new Date(assessment.created_at).toLocaleDateString()}.`}
        action={
          <ButtonLink to="/loans?tab=planner&handoff=true" variant="outline" size="sm">
            Plan This Loan
          </ButtonLink>
        } />
      
      <AssessmentView assessment={assessment} />
    </AppShell>
  );
}