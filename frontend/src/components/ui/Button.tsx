import React from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/format';

type Variant = 'primary' | 'ai' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
  'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-900 shadow-card',
  ai: 'bg-ai-600 text-white hover:bg-ai-500 active:bg-ai-700 shadow-ai',
  secondary:
  'bg-white text-navy-900 border border-navy-200 hover:border-navy-300 hover:bg-navy-50',
  ghost: 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-[0.95rem]',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-[1.05rem]'
};

const base =
'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:translate-y-px disabled:opacity-50 disabled:pointer-events-none';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      {...rest}>
      
      {children}
    </button>);

}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  to
}: CommonProps & {to: string;}) {
  return (
    <Link
      to={to}
      className={cx(base, variants[variant], sizes[size], className)}>
      
      {children}
    </Link>);

}