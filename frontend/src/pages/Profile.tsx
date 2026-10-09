import React, { useEffect, useState } from 'react';
import { PencilIcon, UserIcon } from 'lucide-react';
import { AppShell, PageHeader } from '../components/layout/AppShell';
import { Card, SectionHeading } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { RiskBandBadge } from '../components/ui/Badge';
import { bandForScore } from '../utils/score';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';

export function Profile() {
  const { user } = useAuth();
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [user?.profile_picture]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi('/assessments/latest/');
        setLatestAssessment(res.assessment);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  if (!user) return <AppShell><div className="p-8 text-center">Loading...</div></AppShell>;

  const band = latestAssessment ? bandForScore(latestAssessment.creditai_score) : null;

  const personal = [
    { label: 'First Name', value: user.first_name || '-' },
    { label: 'Last Name', value: user.last_name || '-' },
    { label: 'Email', value: user.email || '-' },
    { label: 'Username', value: user.username },
    { label: 'Member Since', value: new Date(user.date_joined).toLocaleDateString() }
  ];

  return (
    <AppShell>
      <PageHeader title="My Profile" />

      <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[2rem] font-bold text-white overflow-hidden"
          aria-hidden="true">
          
          {user.profile_picture && !imgError ? (
            <img src={user.profile_picture} alt="" onError={() => setImgError(true)} className="h-full w-full object-cover" />
          ) : user.first_name ? (
            user.first_name[0].toUpperCase()
          ) : (
            <UserIcon size={34} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.75rem] font-extrabold tracking-[-0.025em] text-navy-900">
            {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
          </h2>
          <p className="mt-1 text-[1.02rem] text-navy-500">
            @{user.username} · Member since {new Date(user.date_joined).toLocaleDateString()}
          </p>
        </div>
      </Card>

      <section className="mt-10" aria-label="Personal information">
        <SectionHeading title="Personal Information" />
        <Card className="mt-5 p-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {personal.map((item) =>
            <div key={item.label}>
                <dt className="text-[0.95rem] font-semibold text-navy-500">
                  {item.label}
                </dt>
                <dd className="mt-1 break-words font-display text-[1.2rem] font-bold text-navy-900">
                  {item.value}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </section>

      {latestAssessment && band && (
        <section className="mt-10" aria-label="Latest credit assessment">
          <SectionHeading
            title="Latest Credit Assessment"
            action={
            <ButtonLink to="/history" variant="secondary" size="sm">
                View history
              </ButtonLink>
            } />
          
          <Card className="mt-5 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[0.95rem] font-semibold text-navy-500">
                  CreditAI Score
                </p>
                <p
                  className="mt-1 font-display text-[2.75rem] font-extrabold leading-none tracking-[-0.04em]"
                  style={{ color: band.color }}>
                  
                  {latestAssessment.creditai_score}
                </p>
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold text-navy-500">
                  Risk Band
                </p>
                <div className="mt-2">
                  <RiskBandBadge score={latestAssessment.creditai_score} />
                </div>
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold text-navy-500">
                  Payment Risk
                </p>
                <p className="mt-1 font-display text-[1.75rem] font-extrabold tracking-[-0.03em] text-navy-900">
                  {latestAssessment.calibrated_pd.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-[0.95rem] font-semibold text-navy-500">
                  Last Analyzed
                </p>
                <p className="mt-1 font-display text-[1.35rem] font-bold text-navy-900">
                  {new Date(latestAssessment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}
    </AppShell>
  );
}