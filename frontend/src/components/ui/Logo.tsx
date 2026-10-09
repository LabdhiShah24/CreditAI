import React from 'react';
import { cx } from '../../utils/format';

interface LogoProps {
  size?: number;
  className?: string;
  tone?: 'light' | 'dark';
}

/**
 * CreditAI mark: an upward credit arc (score gauge) wrapped around a
 * neural node — finance trajectory + AI, drawn as one continuous geometry.
 */
export function LogoMark({ size = 36, className, tone = 'light' }: LogoProps) {
  const bg = tone === 'light' ? '#0B1530' : '#FFFFFF';
  const arc = tone === 'light' ? '#6B5BF2' : '#5A46E0';
  const accent = tone === 'light' ? '#12B886' : '#0E9F6E';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="CreditAI"
      className={className}>
      
      <rect width="40" height="40" rx="11" fill={bg} />
      <path
        d="M11 26a9 9 0 0 1 16.2-5.4"
        stroke={arc}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none" />
      
      <path
        d="M22.3 14.4h5.4v5.4"
        stroke={accent}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />
      
      <circle cx="11" cy="26" r="2.9" fill={accent} />
      <circle cx="27.6" cy="26" r="2.9" fill={arc} />
    </svg>);

}

interface LogoLockupProps {
  size?: number;
  className?: string;
  tone?: 'light' | 'dark';
  labelClassName?: string;
}

export function Logo({
  size = 36,
  className,
  tone = 'light',
  labelClassName
}: LogoLockupProps) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} tone={tone} />
      <span
        className={cx(
          'font-display text-[1.3rem] font-extrabold tracking-[-0.02em]',
          tone === 'light' ? 'text-navy-900' : 'text-white',
          labelClassName
        )}>
        
        Credit<span className="text-ai-600">AI</span>
      </span>
    </span>);

}