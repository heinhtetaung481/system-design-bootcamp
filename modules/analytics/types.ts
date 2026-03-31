// Stub — analytics/telemetry types will be added as the module grows
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}
