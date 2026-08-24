import { prisma } from '../../db/client';

export interface BacktestRuleInput {
  name: string;
  category: string;
  severity: string;
  ruleType: 'threshold' | 'pattern';
  mitreTactic: string;
  mitreTechnique: string;
  conditionJson: string;
  windowSeconds?: number;
  thresholdCount?: number;
  timeRangeHours?: number; // default last 24h
}

export interface BacktestResult {
  totalEventsAnalyzed: number;
  totalMatches: number;
  matchesByEntity: Record<string, number>;
  matchedEventSamples: any[];
  estimatedAlertRatePerHour: number;
  executionDurationMs: number;
}

export async function backtestRuleAgainstHistory(input: BacktestRuleInput): Promise<BacktestResult> {
  const startTime = Date.now();
  const timeRangeHours = input.timeRangeHours || 24;
  const cutoff = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

  // Fetch historical events within window
  const historicalEvents = await prisma.telemetryEvent.findMany({
    where: {
      timestamp: { gte: cutoff },
    },
    orderBy: { timestamp: 'asc' },
    take: 5000,
  });

  const condition = JSON.parse(input.conditionJson || '{}');
  const windowSeconds = input.windowSeconds || 60;
  const thresholdCount = input.thresholdCount || 1;

  let totalMatches = 0;
  const matchesByEntity: Record<string, number> = {};
  const matchedEventSamples: any[] = [];

  // Simulated sliding window map for backtesting
  const slidingWindows: Map<string, number[]> = new Map();

  for (const dbEvent of historicalEvents) {
    const raw = JSON.parse(dbEvent.rawPayload || '{}');
    const sourceIp = dbEvent.sourceIp || '127.0.0.1';
    const username = dbEvent.username || dbEvent.userId || 'unknown';
    const eventTime = dbEvent.timestamp.getTime();

    let isMatch = false;
    let entityKey = `ip:${sourceIp}`;

    if (input.ruleType === 'threshold') {
      if (condition.eventTypes && condition.eventTypes.includes(dbEvent.eventType)) {
        entityKey = condition.groupBy === 'user' ? `user:${username}` : `ip:${sourceIp}`;
        if (!slidingWindows.has(entityKey)) {
          slidingWindows.set(entityKey, []);
        }
        const timestamps = slidingWindows.get(entityKey)!;
        const validTimestamps = timestamps.filter((t) => t >= eventTime - windowSeconds * 1000);
        validTimestamps.push(eventTime);
        slidingWindows.set(entityKey, validTimestamps);

        if (validTimestamps.length >= thresholdCount) {
          isMatch = true;
          slidingWindows.set(entityKey, []);
        }
      }
    } else if (input.ruleType === 'pattern') {
      if (condition.eventType === dbEvent.eventType) {
        if (!condition.outcome || condition.outcome === dbEvent.outcome) {
          isMatch = true;
        }
      }
    }

    if (isMatch) {
      totalMatches++;
      matchesByEntity[entityKey] = (matchesByEntity[entityKey] || 0) + 1;
      if (matchedEventSamples.length < 5) {
        matchedEventSamples.push({
          eventId: dbEvent.eventId,
          eventType: dbEvent.eventType,
          timestamp: dbEvent.timestamp,
          entityKey,
          sourceService: dbEvent.sourceService,
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const estimatedRate = timeRangeHours > 0 ? totalMatches / timeRangeHours : totalMatches;

  return {
    totalEventsAnalyzed: historicalEvents.length,
    totalMatches,
    matchesByEntity,
    matchedEventSamples,
    estimatedAlertRatePerHour: Math.round(estimatedRate * 10) / 10,
    executionDurationMs: durationMs,
  };
}
