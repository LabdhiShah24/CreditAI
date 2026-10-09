import React from 'react';
import { cx } from '../../utils/format';
import { bandForScore } from '../../utils/score';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'navy' | 'ai' | 'mint' | 'amber' | 'coral' | 'lavender';
  className?: string;
  size?: 'sm' | 'md';
}

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  navy: 'bg-navy-50 text-navy-700 border-navy-200',
  ai: 'bg-ai-50 text-ai-700 border-ai-200',
  mint: 'bg-mint-50 text-mint-700 border-mint-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  coral: 'bg-coral-50 text-coral-700 border-coral-200',
  lavender: 'bg-lavender-50 text-ai-700 border-lavender-200'
};

export function Badge({
  children,
  tone = 'navy',
  className,
  size = 'md'
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-pill border font-semibold',
        size === 'md' ? 'px-3.5 py-1.5 text-[0.95rem]' : 'px-3 py-1 text-[0.85rem]',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

export function RiskBandBadge({
  score,
  size = 'md',
  className




}: {score: number;size?: 'sm' | 'md';className?: string;}) {
  const band = bandForScore(score);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-pill border font-semibold',
        size === 'md' ? 'px-3.5 py-1.5 text-[0.95rem]' : 'px-3 py-1 text-[0.85rem]',
        band.tint,
        band.text,
        band.border,
        className
      )}>
      
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: band.color }} />
      
      {band.label}
    </span>);

}