type PerfMetricPayload = {
  type: string;
  name: string;
  value: number;
  rating?: string;
  id?: string;
  route?: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

type UploadMetricPayload = {
  type: 'upload';
  context: 'animal' | 'event';
  fileName: string;
  sizeBytes: number;
  durationMs: number;
  retries: number;
  success: boolean;
  network?: string;
  timestamp: number;
  errorMessage?: string;
};

const PERF_ENDPOINT = import.meta.env.VITE_PERF_METRICS_URL as string | undefined;
const PERF_ENABLED = import.meta.env.VITE_PERF_METRICS_ENABLED === 'true';

const getNetworkType = () => {
  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string };
  }).connection;
  return connection?.effectiveType;
};

const emit = (payload: PerfMetricPayload | UploadMetricPayload) => {
  if (!PERF_ENABLED) return;
  if (PERF_ENDPOINT) {
    fetch(PERF_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload),
    }).catch(() => {});
    return;
  }
  // Fallback seguro: log local apenas
  console.info('[Perf]', payload);
};

export const logUploadMetric = (payload: Omit<UploadMetricPayload, 'timestamp' | 'network'>) => {
  emit({
    ...payload,
    timestamp: Date.now(),
    network: getNetworkType(),
  });
};

export const initWebVitals = async () => {
  if (!PERF_ENABLED) return;

  const [{ onINP, onLCP, onCLS, onTTFB, onFCP }] = await Promise.all([
    import('web-vitals'),
  ]);

  const route = window.location.pathname;

  const report = (metric: {
    name: string;
    value: number;
    rating: string;
    id: string;
  }) => {
    emit({
      type: 'web-vital',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      route,
      timestamp: Date.now(),
    });
  };

  onINP(report);
  onLCP(report);
  onCLS(report);
  onTTFB(report);
  onFCP(report);

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          emit({
            type: 'longtask',
            name: entry.name || 'longtask',
            value: entry.duration,
            route,
            timestamp: Date.now(),
            metadata: {
              startTime: entry.startTime,
            },
          });
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Ignorar ambientes sem suporte
    }
  }
};

