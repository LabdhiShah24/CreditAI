import type { RiskBand } from '../types/credit';

export const SCORE_MIN = 300;
export const SCORE_MAX = 900;

/** CreditAI presentation bands — internal model-derived, not a bureau score. */
export const RISK_BANDS: RiskBand[] = [
{
  id: 'very-high',
  min: 300,
  max: 499,
  label: 'Very High Risk',
  color: '#D9443C',
  tint: 'bg-coral-50',
  text: 'text-coral-700',
  border: 'border-coral-200'
},
{
  id: 'high',
  min: 500,
  max: 599,
  label: 'High Risk',
  color: '#F2645A',
  tint: 'bg-coral-50',
  text: 'text-coral-700',
  border: 'border-coral-200'
},
{
  id: 'elevated',
  min: 600,
  max: 649,
  label: 'Elevated Risk',
  color: '#F5A524',
  tint: 'bg-amber-50',
  text: 'text-amber-700',
  border: 'border-amber-200'
},
{
  id: 'moderate',
  min: 650,
  max: 699,
  label: 'Moderate Risk',
  color: '#E3C22B',
  tint: 'bg-amber-50',
  text: 'text-amber-700',
  border: 'border-amber-200'
},
{
  id: 'low',
  min: 700,
  max: 749,
  label: 'Low Risk',
  color: '#7BC98A',
  tint: 'bg-mint-50',
  text: 'text-mint-700',
  border: 'border-mint-200'
},
{
  id: 'very-low',
  min: 750,
  max: 900,
  label: 'Very Low Risk',
  color: '#0E9F6E',
  tint: 'bg-mint-50',
  text: 'text-mint-700',
  border: 'border-mint-200'
}];


export function bandForScore(score: number): RiskBand {
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  return (
    RISK_BANDS.find((band) => clamped >= band.min && clamped <= band.max) ??
    RISK_BANDS[0]);

}

/** Maps a score onto the 180°→0° sweep of the semicircular gauge. */
export function scoreToAngle(score: number): number {
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, score));
  const ratio = (clamped - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return 180 - ratio * 180;
}

export function polarPoint(
cx: number,
cy: number,
radius: number,
angleDeg: number)
: {x: number;y: number;} {
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
}

export function arcPath(
cx: number,
cy: number,
radius: number,
startAngle: number,
endAngle: number)
: string {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}