import type { AnalyticsMetricId, AnalyticsPoint, VolumeComponentId } from "@/lib/struct/analytics-shared";
import { BUY_DIST_KEYS, VOLUME_COMPONENT_IDS } from "@/lib/struct/analytics-shared";

const ANALYTICS_POINT_KEYS = [
	"t",
	"volumeUsd",
	"buyVolumeUsd",
	"sellVolumeUsd",
	"redemptionVolumeUsd",
	"mergeVolumeUsd",
	"splitVolumeUsd",
	"yesVolumeUsd",
	"noVolumeUsd",
	"uniqueTraders",
	"uniqueMakers",
	"uniqueTakers",
	"txnCount",
	"buyCount",
	"sellCount",
	"redemptionCount",
	"mergeCount",
	"splitCount",
	"yesCount",
	"noCount",
	"feesUsd",
	"builderFeesUsd",
	"newUsers",
	"avgRevenuePerUserUsd",
	"avgVolumePerUserUsd",
	"sharesVolume",
	"buySharesVolume",
	"sellSharesVolume",
	"convertedCollateralUsd",
	"convertedCount",
	"makerRebateVolumeUsd",
	"rewardVolumeUsd",
	"yieldVolumeUsd",
	"yesSharesVolume",
	"noSharesVolume",
	...BUY_DIST_KEYS,
] as const satisfies readonly (keyof AnalyticsPoint)[];

type AnalyticsPointKey = (typeof ANALYTICS_POINT_KEYS)[number];

const METRIC_FIELDS: Record<AnalyticsMetricId, readonly AnalyticsPointKey[]> = {
	volume: [
		"volumeUsd",
		"buyVolumeUsd",
		"sellVolumeUsd",
		"redemptionVolumeUsd",
		"mergeVolumeUsd",
		"splitVolumeUsd",
		"convertedCollateralUsd",
	],
	yesNo: ["yesVolumeUsd", "noVolumeUsd"],
	yesNoCount: ["yesCount", "noCount"],
	uniqueTraders: ["uniqueTraders"],
	fees: ["feesUsd"],
	avgTradeSize: [
		"volumeUsd",
		"txnCount",
		"buyVolumeUsd",
		"sellVolumeUsd",
		"redemptionVolumeUsd",
		"mergeVolumeUsd",
		"splitVolumeUsd",
		"convertedCollateralUsd",
		"buyCount",
		"sellCount",
		"redemptionCount",
		"mergeCount",
		"splitCount",
		"convertedCount",
	],
	shares: ["sharesVolume", "buySharesVolume", "sellSharesVolume"],
	tradeTypes: [
		"txnCount",
		"buyCount",
		"sellCount",
		"redemptionCount",
		"mergeCount",
		"splitCount",
		"convertedCount",
	],
	makersTakers: ["uniqueMakers", "uniqueTakers"],
	newUsers: ["newUsers"],
	avgRevenuePerUser: ["avgRevenuePerUserUsd"],
	avgVolumePerUser: ["avgVolumePerUserUsd"],
	buyDistribution: [...BUY_DIST_KEYS],
	incentives: ["rewardVolumeUsd", "makerRebateVolumeUsd", "yieldVolumeUsd"],
	yesNoShares: ["yesSharesVolume", "noSharesVolume"],
	builderFees: ["builderFeesUsd"],
	trades: ["txnCount"],
};

const KPI_FIELDS: Partial<Record<AnalyticsMetricId, readonly AnalyticsPointKey[]>> = {
	volume: ["volumeUsd", "sharesVolume"],
	fees: ["feesUsd"],
	trades: ["txnCount"],
	uniqueTraders: ["uniqueTraders"],
	avgTradeSize: [
		"volumeUsd",
		"sharesVolume",
		"txnCount",
		"buyVolumeUsd",
		"sellVolumeUsd",
		"redemptionVolumeUsd",
		"mergeVolumeUsd",
		"splitVolumeUsd",
		"convertedCollateralUsd",
	],
};

const DEFAULT_VISIBLE_METRICS: AnalyticsMetricId[] = [
	"volume",
	"yesNo",
	"yesNoCount",
	"uniqueTraders",
	"fees",
	"avgTradeSize",
	"shares",
	"buyDistribution",
	"tradeTypes",
];

const DEFAULT_KPI_METRICS: AnalyticsMetricId[] = ["volume", "fees", "trades", "uniqueTraders", "avgTradeSize"];

const VOLUME_COMPONENT_FIELDS: Record<VolumeComponentId, readonly AnalyticsPointKey[]> = {
	buy: ["buyVolumeUsd", "buyCount"],
	sell: ["sellVolumeUsd", "sellCount"],
	redeem: ["redemptionVolumeUsd", "redemptionCount"],
	merge: ["mergeVolumeUsd", "mergeCount"],
	split: ["splitVolumeUsd", "splitCount"],
	convert: ["convertedCollateralUsd", "convertedCount"],
};

export type AnalyticsProjectionOptions = {
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	showKpis?: boolean;
	allowedComponents?: readonly VolumeComponentId[];
};

function visibleMetricIds({
	excludeMetrics,
	appendMetrics,
}: Pick<AnalyticsProjectionOptions, "excludeMetrics" | "appendMetrics">): AnalyticsMetricId[] {
	const excluded = new Set(excludeMetrics ?? []);
	const base = DEFAULT_VISIBLE_METRICS.filter((id) => !excluded.has(id));
	const appended = (appendMetrics ?? []).filter((id) => !excluded.has(id));
	return [...base, ...appended];
}

function visibleKpiMetricIds({
	excludeMetrics,
	showKpis,
}: Pick<AnalyticsProjectionOptions, "excludeMetrics" | "showKpis">): AnalyticsMetricId[] {
	if (showKpis === false) return [];
	const excluded = new Set(excludeMetrics ?? []);
	return DEFAULT_KPI_METRICS.filter((id) => !excluded.has(id));
}

export function collectRequiredAnalyticsKeys(options: AnalyticsProjectionOptions): Set<AnalyticsPointKey> {
	const keys = new Set<AnalyticsPointKey>(["t"]);
	for (const metricId of visibleMetricIds(options)) {
		for (const key of METRIC_FIELDS[metricId] ?? []) {
			keys.add(key);
		}
	}
	for (const metricId of visibleKpiMetricIds(options)) {
		for (const key of KPI_FIELDS[metricId] ?? []) {
			keys.add(key);
		}
	}
	const components = options.allowedComponents ?? VOLUME_COMPONENT_IDS;
	for (const component of components) {
		for (const key of VOLUME_COMPONENT_FIELDS[component] ?? []) {
			keys.add(key);
		}
	}
	return keys;
}

export function projectAnalyticsPoint(point: AnalyticsPoint, keys: Set<AnalyticsPointKey>): AnalyticsPoint {
	const projected = { t: point.t } as AnalyticsPoint;
	for (const key of keys) {
		if (key === "t") continue;
		projected[key] = point[key];
	}
	return projected;
}

export function projectAnalyticsPoints(
	points: AnalyticsPoint[],
	options: AnalyticsProjectionOptions,
): AnalyticsPoint[] {
	const keys = collectRequiredAnalyticsKeys(options);
	return points.map((point) => projectAnalyticsPoint(point, keys));
}
