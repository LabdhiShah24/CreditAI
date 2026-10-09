import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon, TrendingUpIcon, WalletIcon } from 'lucide-react';
import { ScoreGauge } from '../credit/ScoreGauge';
import { Card } from '../ui/Card';

function Float({
  children,
  delay = 0,
  className




}: {children: React.ReactNode;delay?: number;className?: string;}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}>
      
      {children}
    </motion.div>);

}

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <Float>
        <Card className="px-4 pb-6 pt-6 sm:px-8">
          <div className="flex items-center justify-between">
            <span className="text-[0.95rem] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Sample assessment
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-ai-50 px-3 py-1 text-[0.88rem] font-semibold text-ai-700">
              <SparklesIcon size={14} aria-hidden="true" />
              AI generated
            </span>
          </div>
          <ScoreGauge score={794} width={440} className="mx-auto mt-3" />
        </Card>
      </Float>

      <Float delay={0.12} className="absolute -left-3 top-[58%] hidden sm:block lg:-left-10">
        <div className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-lift">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-50 text-mint-600">
            <TrendingUpIcon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.88rem] font-medium text-navy-500">Payment risk</p>
            <p className="font-display text-[1.15rem] font-extrabold text-navy-900">
              1.17%
            </p>
          </div>
        </div>
      </Float>

      <Float delay={0.2} className="absolute -right-3 top-[22%] hidden sm:block lg:-right-10">
        <div className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-lift">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender-100 text-ai-700">
            <WalletIcon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.88rem] font-medium text-navy-500">Payment-to-income</p>
            <p className="font-display text-[1.15rem] font-extrabold text-navy-900">
              10%
            </p>
          </div>
        </div>
      </Float>

      <Float delay={0.28} className="mt-4">
        <div className="flex items-start gap-3 rounded-card border border-ai-200 bg-ai-600 p-4 text-white shadow-ai">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <SparklesIcon size={17} aria-hidden="true" />
          </span>
          <p className="text-[1rem] leading-relaxed">
            <span className="font-semibold">CreditAI Assistant:</span> your EMI is
            10% of your income, which the model treats as a stabilising factor.
          </p>
        </div>
      </Float>
    </div>);

}