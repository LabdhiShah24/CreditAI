import React from 'react';
import { cx } from '../../utils/format';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'li';
}

export function Card({ className, children, as = 'div' }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={cx(
        'rounded-card border border-navy-100 bg-surface shadow-card',
        className
      )}>
      
      {children}
    </Tag>);

}

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  level?: 2 | 3;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
  className
}: SectionHeadingProps) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return (
    <div
      className={cx(
        'flex flex-wrap items-end justify-between gap-x-6 gap-y-2',
        className
      )}>
      
      <div className="max-w-2xl">
        <Tag className="font-display text-[1.45rem] font-bold tracking-[-0.02em] text-navy-900 sm:text-[1.6rem]">
          {title}
        </Tag>
        {description ?
        <p className="mt-1.5 text-[1.02rem] leading-relaxed text-navy-500">
            {description}
          </p> :
        null}
      </div>
      {action}
    </div>);

}