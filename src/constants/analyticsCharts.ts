import type { CSSProperties } from 'react';

/** Shared Recharts styling — blue palette for admin / teacher / organiser analytics */

export const ANALYTICS_REGISTERED_FILL = '#bfdbfe';
export const ANALYTICS_ATTENDED_FILL = '#2563eb';
export const ANALYTICS_TREND_FILL = '#1d4ed8';
export const ANALYTICS_PIE_FILLS = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'] as const;

export const analyticsTooltipContentStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 15px -3px rgb(15 23 42 / 0.08)',
};

export const analyticsCartesianGridProps = {
  stroke: '#e2e8f0',
  strokeDasharray: '4 4' as const,
  vertical: false,
};
