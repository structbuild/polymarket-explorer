import type { BuilderTimeframe } from "@structbuild/sdk";

import {
	RESOLUTION_OPTIONS_BY_RANGE,
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
} from "@/lib/struct/analytics-shared";

export const BUILDERS_STACKED_METRICS = [
	"volume",
	"trades",
	"traders",
	"fees",
	"builderFees",
	"newUsers",
] as const;

export type BuildersStackedMetric = (typeof BUILDERS_STACKED_METRICS)[number];

export const BUILDERS_STACKED_METRIC_LABELS: Record<BuildersStackedMetric, string> = {
	volume: "Volume",
	trades: "Trades",
	traders: "Traders",
	fees: "Fees",
	builderFees: "Builder fees",
	newUsers: "New users",
};

export const BUILDERS_STACKED_METRIC_FORMAT: Record<
	BuildersStackedMetric,
	"currency" | "count"
> = {
	volume: "currency",
	trades: "count",
	traders: "count",
	fees: "currency",
	builderFees: "currency",
	newUsers: "count",
};

export const BUILDERS_STACKED_METRIC_FIELDS: Record<BuildersStackedMetric, keyof AnalyticsPoint> = {
	volume: "volumeUsd",
	trades: "txnCount",
	traders: "uniqueTraders",
	fees: "feesUsd",
	builderFees: "builderFeesUsd",
	newUsers: "newUsers",
};

export const OTHER_SLOT = "other";

export type BuildersStackedSlot = {
	id: string;
	code: string | null;
	label: string;
};

export type BuildersStackedDatum = { t: number } & Record<string, number>;

export type BuildersStackedMetricData = {
	slots: BuildersStackedSlot[];
	data: BuildersStackedDatum[];
};

export type BuildersStackedData = {
	byMetric: Record<BuildersStackedMetric, BuildersStackedMetricData>;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
};

const TIMEFRAME_TO_RANGE: Record<
	BuilderTimeframe,
	{ range: AnalyticsRange; resolution: AnalyticsResolution }
> = {
	"1d": { range: "1d", resolution: "60" },
	"7d": { range: "7d", resolution: "240" },
	"30d": { range: "30d", resolution: "D" },
	lifetime: { range: "all", resolution: "W" },
};

export function resolveStackedRange(timeframe: BuilderTimeframe) {
	return TIMEFRAME_TO_RANGE[timeframe];
}

export function parseBuildersStackedResolution(
	timeframe: BuilderTimeframe,
	value: string | string[] | undefined,
): AnalyticsResolution {
	const { range, resolution: defaultResolution } = resolveStackedRange(timeframe);
	const raw = Array.isArray(value) ? value[0] : value;
	const allowed = RESOLUTION_OPTIONS_BY_RANGE[range];
	return allowed.includes(raw as AnalyticsResolution)
		? (raw as AnalyticsResolution)
		: defaultResolution;
}

export function fieldKey(slotId: string, metric: BuildersStackedMetric): string {
	return `${slotId}__${metric}`;
}
