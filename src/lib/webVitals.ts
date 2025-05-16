import { NextWebVitalsMetric } from 'next/app';
import { captureException } from '@/lib/sentry';

/**
 * Report Web Vitals metrics
 * @param metric Web Vitals metric
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${metric.name} - ${metric.value}`);
    return;
  }
  
  // In production, send to analytics service
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    startTime: metric.startTime,
    label: metric.label,
  });
  
  // Send to analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      captureException(error, { context: 'webVitals' });
    });
  }
}
