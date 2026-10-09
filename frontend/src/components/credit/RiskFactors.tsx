import React from 'react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import type { RiskFactor } from '../../types/credit';
import { Card } from '../ui/Card';
import { cx } from '../../utils/format';

function FactorRow({ factor }: {factor: RiskFactor;}) {
  const isHigher = factor.direction === 'higher';
  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[1.02rem] font-semibold text-navy-900">
          {factor.label}
        </span>
        <span
          className={cx(
            'shrink-0 text-[0.92rem] font-semibold',
            isHigher ? 'text-coral-600' : 'text-mint-600'
          )}>
          
          {Math.round(factor.influence * 100)}% influence
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-pill bg-navy-100"
        role="img"
        aria-label={`${factor.label}: ${Math.round(factor.influence * 100)} percent relative influence`}>
        
        <div
          className={cx(
            'h-full rounded-pill transition-[width] duration-300 ease-out',
            isHigher ? 'bg-coral-500' : 'bg-mint-500'
          )}
          style={{ width: `${Math.round(factor.influence * 100)}%` }} />
        
      </div>
      <p className="mt-2 text-[0.95rem] leading-snug text-navy-500">
        {factor.detail}
      </p>
    </li>);

}

function FactorGroup({
  title,
  blurb,
  factors,
  direction





}: {title: string;blurb: string;factors: RiskFactor[];direction: 'higher' | 'lower';}) {
  const isHigher = direction === 'higher';
  const Icon = isHigher ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Card className="flex h-full flex-col p-6">
      <div className="flex items-center gap-3">
        <span
          className={cx(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            isHigher ? 'bg-coral-50 text-coral-600' : 'bg-mint-50 text-mint-600'
          )}
          aria-hidden="true">
          
          <Icon size={18} />
        </span>
        <h3 className="font-display text-[1.2rem] font-bold text-navy-900">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-[0.96rem] leading-snug text-navy-500">{blurb}</p>
      <ul className="mt-4 divide-y divide-navy-100">
        {factors.map((factor) =>
        <FactorRow key={factor.id} factor={factor} />
        )}
      </ul>
    </Card>);

}

export function RiskFactors({ factors }: {factors: RiskFactor[];}) {
  const higher = factors.
  filter((f) => f.direction === 'higher').
  sort((a, b) => b.influence - a.influence);
  const lower = factors.
  filter((f) => f.direction === 'lower').
  sort((a, b) => b.influence - a.influence);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FactorGroup
        title="Higher Modeled Risk"
        blurb="Pushed the assessment toward a higher modelled payment difficulty."
        factors={higher}
        direction="higher" />
      
      <FactorGroup
        title="Lower Modeled Risk"
        blurb="Pulled the assessment toward a lower modelled payment difficulty."
        factors={lower}
        direction="lower" />
      
    </div>);

}