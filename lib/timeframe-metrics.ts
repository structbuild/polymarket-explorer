import type { MetricsTimeframe, SimpleTimeframeMetrics } from "@structbuild/sdk";

export type TimeframeMetrics = Partial<Record<MetricsTimeframe, SimpleTimeframeMetrics>>;

export function pickMetrics(
	metrics: TimeframeMetrics | null | undefined,
	timeframes?: readonly MetricsTimeframe[],
): TimeframeMetrics {
	if (!metrics) return {};
	if (!timeframes || timeframes.length === 0) return metrics;
	const picked: TimeframeMetrics = {};
	for (const timeframe of timeframes) {
		const value = metrics[timeframe];
		if (value) picked[timeframe] = value;
	}
	return picked;
}
