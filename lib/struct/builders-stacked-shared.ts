import type { BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import {
	RESOLUTION_OPTIONS_BY_RANGE,
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
} from "@/lib/struct/analytics-shared";
import { isBuilderSortAvailableForTimeframe } from "@/lib/struct/builder-shared";

export const BUILDERS_STACKED_METRICS = [
	"volume",
	"trades",
	"traders",
	"fees",
	"builderFees",
	"newUsers",
] as const;

export type BuildersStackedMetric = (typeof BUILDERS_STACKED_METRICS)[number];

export const DEFAULT_BUILDERS_STACKED_METRIC: BuildersStackedMetric = "volume";
export const DEFAULT_BUILDERS_STACKED_TOP_N = 7;

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

export const BUILDERS_STACKED_API_METRICS: Record<BuildersStackedMetric, BuilderSortBy> = {
	volume: "volume",
	trades: "txns",
	traders: "traders",
	fees: "fees",
	builderFees: "builder_fees",
	newUsers: "new_users",
};

export const BUILDERS_STACKED_METRIC_FIELDS: Record<BuildersStackedMetric, keyof AnalyticsPoint> = {
	volume: "volumeUsd",
	trades: "txnCount",
	traders: "uniqueTraders",
	fees: "feesUsd",
	builderFees: "builderFeesUsd",
	newUsers: "newUsers",
};

export function isBuildersStackedMetricAvailableForTimeframe(
	metric: BuildersStackedMetric,
	timeframe: BuilderTimeframe,
): boolean {
	return isBuilderSortAvailableForTimeframe(BUILDERS_STACKED_API_METRICS[metric], timeframe);
}

export function getBuildersStackedMetricOptionsForTimeframe(
	timeframe: BuilderTimeframe,
): readonly BuildersStackedMetric[] {
	return BUILDERS_STACKED_METRICS.filter((metric) =>
		isBuildersStackedMetricAvailableForTimeframe(metric, timeframe),
	);
}

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

export type BuildersStackedData = BuildersStackedMetricData & {
	metric: BuildersStackedMetric;
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

export function parseBuildersStackedMetric(
	value: string | string[] | undefined,
	timeframe?: BuilderTimeframe,
): BuildersStackedMetric {
	const raw = Array.isArray(value) ? value[0] : value;
	const metric = BUILDERS_STACKED_METRICS.includes(raw as BuildersStackedMetric)
		? (raw as BuildersStackedMetric)
		: null;
	if (!metric) return DEFAULT_BUILDERS_STACKED_METRIC;
	return timeframe == null || isBuildersStackedMetricAvailableForTimeframe(metric, timeframe)
		? metric
		: DEFAULT_BUILDERS_STACKED_METRIC;
}

export function fieldKey(slotId: string, metric: BuildersStackedMetric): string {
	return `${slotId}__${metric}`;
}
