import type { MetricsTimeframe } from "@structbuild/sdk";

export const METRICS_TIMEFRAMES = ["1h", "6h", "24h", "7d", "30d", "lifetime"] as const satisfies readonly MetricsTimeframe[];

export type MetricsTimeframeChoice = (typeof METRICS_TIMEFRAMES)[number];

export const TIMEFRAME_LABELS: Record<MetricsTimeframeChoice, string> = {
	"1h": "1H",
	"6h": "6H",
	"24h": "24H",
	"7d": "7D",
	"30d": "30D",
	lifetime: "All",
};

export function isMetricsTimeframe(value: unknown): value is MetricsTimeframeChoice {
	return typeof value === "string" && (METRICS_TIMEFRAMES as readonly string[]).includes(value);
}
