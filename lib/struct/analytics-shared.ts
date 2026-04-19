export type AnalyticsRange = "1d" | "7d" | "30d" | "all";

export type AnalyticsMetricId =
	| "volume"
	| "fees"
	| "trades"
	| "tradeTypes"
	| "uniqueTraders"
	| "avgTradeSize"
	| "yesNo"
	| "yesNoCount"
	| "shares"
	| "buyDistribution";

export const ANALYTICS_RANGES: AnalyticsRange[] = ["1d", "7d", "30d", "all"];

export const ANALYTICS_RANGE_LABELS: Record<AnalyticsRange, string> = {
	"1d": "1d",
	"7d": "7d",
	"30d": "30d",
	all: "All",
};

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = "all";

export function parseAnalyticsRange(value: string | string[] | undefined): AnalyticsRange {
	const raw = Array.isArray(value) ? value[0] : value;
	return ANALYTICS_RANGES.includes(raw as AnalyticsRange)
		? (raw as AnalyticsRange)
		: DEFAULT_ANALYTICS_RANGE;
}

export type AnalyticsView = "deltas" | "cumulative";

export const ANALYTICS_VIEWS: AnalyticsView[] = ["deltas", "cumulative"];

export const ANALYTICS_VIEW_LABELS: Record<AnalyticsView, string> = {
	deltas: "Per-period",
	cumulative: "Cumulative",
};

export const DEFAULT_ANALYTICS_VIEW: AnalyticsView = "deltas";

export function parseAnalyticsView(value: string | string[] | undefined): AnalyticsView {
	const raw = Array.isArray(value) ? value[0] : value;
	return ANALYTICS_VIEWS.includes(raw as AnalyticsView)
		? (raw as AnalyticsView)
		: DEFAULT_ANALYTICS_VIEW;
}

export const ANALYTICS_CAP_BUFFER_SECONDS = 7 * 86400;

export function parseAnalyticsCap(
	value: string | string[] | undefined,
): boolean | undefined {
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === "1" || raw === "true") return true;
	if (raw === "0" || raw === "false") return false;
	return undefined;
}

export type AnalyticsPoint = {
	t: number;
	volumeUsd: number;
	buyVolumeUsd: number;
	sellVolumeUsd: number;
	redemptionVolumeUsd: number;
	mergeVolumeUsd: number;
	splitVolumeUsd: number;
	yesVolumeUsd: number;
	noVolumeUsd: number;
	uniqueTraders: number;
	txnCount: number;
	buyCount: number;
	sellCount: number;
	redemptionCount: number;
	mergeCount: number;
	splitCount: number;
	yesCount: number;
	noCount: number;
	feesUsd: number;
	sharesVolume: number;
	buyDistUnder10: number;
	buyDist10to100: number;
	buyDist100to1k: number;
	buyDist1kTo10k: number;
	buyDist10kTo50k: number;
	buyDistOver50k: number;
};

export const BUY_DIST_KEYS = [
	"buyDistUnder10",
	"buyDist10to100",
	"buyDist100to1k",
	"buyDist1kTo10k",
	"buyDist10kTo50k",
	"buyDistOver50k",
] as const satisfies readonly (keyof AnalyticsPoint)[];

export type BuyDistributionKey = (typeof BUY_DIST_KEYS)[number];

export const BUY_DIST_LABELS: Record<BuyDistributionKey, string> = {
	buyDistUnder10: "<$10",
	buyDist10to100: "$10–$100",
	buyDist100to1k: "$100–$1K",
	buyDist1kTo10k: "$1K–$10K",
	buyDist10kTo50k: "$10K–$50K",
	buyDistOver50k: "$50K+",
};

export function applyAnalyticsCap(
	points: AnalyticsPoint[],
	endTime: number | undefined,
	cap: boolean,
): AnalyticsPoint[] {
	if (!cap || endTime === undefined) return points;
	const cutoff = endTime + ANALYTICS_CAP_BUFFER_SECONDS;
	return points.filter((p) => p.t <= cutoff);
}

export type AnalyticsSummary = {
	totalVolumeUsd: number;
	totalFeesUsd: number;
	totalTxnCount: number;
	uniqueTradersTotal: number;
	avgTradeSizeUsd: number;
};
