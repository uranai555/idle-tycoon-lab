type AnalyticsEvent = {
  type: string;
  themeId: string;
  timestamp: number;
  data: Record<string, unknown>;
};

const MAX_EVENTS = 500;
const events: AnalyticsEvent[] = [];

export function trackEvent(
  type: string,
  themeId: string,
  data: Record<string, unknown> = {}
): void {
  const event: AnalyticsEvent = {
    type,
    themeId,
    timestamp: Date.now(),
    data,
  };
  if (events.length >= MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS + 1);
  }
  events.push(event);
  console.log('[ANALYTICS]', JSON.stringify(event));
}

export function getEvents(): AnalyticsEvent[] {
  return [...events];
}

export function clearEvents(): void {
  events.length = 0;
}

export function getEventsByTheme(themeId: string): AnalyticsEvent[] {
  return events.filter(e => e.themeId === themeId);
}