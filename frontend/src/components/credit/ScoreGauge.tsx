import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  RISK_BANDS,
  SCORE_MAX,
  SCORE_MIN,
  arcPath,
  bandForScore,
  scoreToAngle } from
'../../utils/score';
import { cx } from '../../utils/format';

interface ScoreGaugeProps {
  score: number;
  /** Rendered width in px; the gauge scales fluidly below this. */
  width?: number;
  className?: string;
  caption?: string;
}

const VB_W = 420;
const VB_H = 250;
const CX = 210;
const CY = 214;
const RADIUS = 168;
const STROKE = 30;
const GAP = 1.4;

export function ScoreGauge({
  score,
  width = 420,
  className,
  caption = 'Your CreditAI Score'
}: ScoreGaugeProps) {
  const band = bandForScore(score);
  const needleAngle = scoreToAngle(score);
  const reduceMotion = useReducedMotion();

  return (
    <figure
      className={cx('flex w-full flex-col items-center', className)}
      style={{ maxWidth: width }}>
      
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full"
          role="img"
          aria-label={`${caption}: ${score} out of ${SCORE_MAX}. ${band.label}.`}>
          
          {/* Track */}
          <path
            d={arcPath(CX, CY, RADIUS, 180, 0)}
            stroke="#E4E9F1"
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none" />
          
          {/* Bands */}
          {RISK_BANDS.map((b, i) => {
            const start = scoreToAngle(b.min) - (i === 0 ? 0 : GAP);
            const end = scoreToAngle(b.max);
            return (
              <path
                key={b.id}
                d={arcPath(CX, CY, RADIUS, start, end)}
                stroke={b.color}
                strokeWidth={STROKE}
                fill="none"
                opacity={b.id === band.id ? 1 : 0.42} />);


          })}

          {/* Needle */}
          <motion.g
            initial={reduceMotion ? { rotate: 90 - needleAngle } : { rotate: -90 }}
            animate={{ rotate: 90 - needleAngle }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}>
            
            <path
              d={`M ${CX - 7} ${CY} L ${CX} ${CY - RADIUS + 44} L ${CX + 7} ${CY} Z`}
              className="fill-navy-900" />
            
          </motion.g>
          <circle cx={CX} cy={CY} r="13" className="fill-navy-900" />
          <circle cx={CX} cy={CY} r="5" className="fill-white" />

          {/* Range labels */}
          <text
            x={CX - RADIUS}
            y={CY + 30}
            textAnchor="middle"
            className="fill-navy-400 font-sans"
            fontSize="17"
            fontWeight="600">
            
            {SCORE_MIN}
          </text>
          <text
            x={CX + RADIUS}
            y={CY + 30}
            textAnchor="middle"
            className="fill-navy-400 font-sans"
            fontSize="17"
            fontWeight="600">
            
            {SCORE_MAX}
          </text>
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[38%] flex flex-col items-center">
          <span className="font-display text-[clamp(3rem,9vw,4.5rem)] font-extrabold leading-none tracking-[-0.04em] text-navy-900">
            {score}
          </span>
        </div>
      </div>

      <figcaption className="mt-1 flex flex-col items-center gap-2 text-center">
        <span
          className={cx(
            'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-[1.05rem] font-bold',
            band.tint,
            band.text,
            band.border
          )}>
          
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: band.color }} />
          
          {band.label}
        </span>
        <span className="text-[0.95rem] text-navy-400">
          CreditAI presentation band · {band.min}–{band.max}
        </span>
      </figcaption>
    </figure>);

}