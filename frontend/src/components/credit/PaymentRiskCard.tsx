import React from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cx } from '../../utils/format';

interface PaymentRiskCardProps {
  risk: number;
  className?: string;
}

function toneFor(risk: number) {
  if (risk < 3) return { color: '#0E9F6E', label: 'Well below average', chip: 'bg-mint-50 text-mint-700 border-mint-200' };
  if (risk < 8) return { color: '#F5A524', label: 'Worth monitoring', chip: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { color: '#D9443C', label: 'Needs attention', chip: 'bg-coral-50 text-coral-700 border-coral-200' };
}

export function PaymentRiskCard({ risk, className }: PaymentRiskCardProps) {
  const tone = toneFor(risk);
  // Ring is scaled against a 20% ceiling so small values stay readable.
  const pct = Math.min(1, risk / 20);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className={cx('flex h-full flex-col p-6 sm:p-7', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[1.25rem] font-bold text-navy-900">
            Payment Risk
          </h3>
          <p className="mt-1 text-[0.98rem] leading-snug text-navy-500">
            Estimated payment-difficulty probability
          </p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tone.color}16`, color: tone.color }}
          aria-hidden="true">
          
          <ShieldCheckIcon size={20} />
        </span>
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#E4E9F1"
              strokeWidth="12" />
            
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={tone.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)} />
            
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-navy-900">
              {risk.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span
            className={cx(
              'inline-flex rounded-pill border px-3 py-1 text-[0.9rem] font-semibold',
              tone.chip
            )}>
            
            {tone.label}
          </span>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-navy-500">
            CreditAI models a {risk.toFixed(2)}% chance of payment difficulty on
            this profile over the modelled term.
          </p>
        </div>
      </div>
    </Card>);

}