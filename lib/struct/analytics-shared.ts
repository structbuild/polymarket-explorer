export type AnalyticsRange = "1d" | "7d" | "30d" | "all";

export type AnalyticsMetricId =
	| "volume"
	| "fees"
	| "trades"
	| "tradeTypes"
	| "uniqueTraders"
	| "makersTakers"
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

export const ANALYTICS_RANGE_DESCRIPTIONS: Record<AnalyticsRange, string> = {
	"1d": "Last 24 hours",
	"7d": "Last 7 days",
	"30d": "Last 30 days",
	all: "All time",
};

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = "all";

export function parseAnalyticsRange(
	value: string | string[] | undefined,
	defaultRange: AnalyticsRange = DEFAULT_ANALYTICS_RANGE,
): AnalyticsRange {
	const raw = Array.isArray(value) ? value[0] : value;
	return ANALYTICS_RANGES.includes(raw as AnalyticsRange)
		? (raw as AnalyticsRange)
		: defaultRange;
}

export type AnalyticsResolution = "60" | "240" | "D" | "W" | "M";

export const ANALYTICS_RESOLUTION_LABELS: Record<AnalyticsResolution, string> = {
	"60": "1h",
	"240": "4h",
	D: "1d",
	W: "1w",
	M: "1m",
};

export const ANALYTICS_RESOLUTION_DESCRIPTIONS: Record<AnalyticsResolution, string> = {
	"60": "1 hour buckets",
	"240": "4 hour buckets",
	D: "Daily buckets",
	W: "Weekly buckets",
	M: "Monthly buckets",
};

export const RESOLUTION_OPTIONS_BY_RANGE: Record<AnalyticsRange, readonly AnalyticsResolution[]> = {
	"1d": ["60", "240"],
	"7d": ["60", "240", "D"],
	"30d": ["60", "240", "D"],
	all: ["D", "W", "M"],
};

export type AnalyticsScope = "global" | "scoped";

export function getDefaultResolution(
	range: AnalyticsRange,
	scope: AnalyticsScope = "scoped",
): AnalyticsResolution {
	if (range === "1d") return "60";
	if (range === "7d") return "240";
	if (range === "30d") return "D";
	return scope === "global" ? "W" : "D";
}

export function parseAnalyticsResolution(
	value: string | string[] | undefined,
	range: AnalyticsRange,
	scope: AnalyticsScope = "scoped",
): AnalyticsResolution {
	const raw = Array.isArray(value) ? value[0] : value;
	const allowed = RESOLUTION_OPTIONS_BY_RANGE[range];
	const fallback = getDefaultResolution(range, scope);
	if (allowed.length === 0) return fallback;
	return allowed.includes(raw as AnalyticsResolution)
		? (raw as AnalyticsResolution)
		: fallback;
}

export type AnalyticsView = "deltas" | "cumulative";

export const ANALYTICS_VIEWS: AnalyticsView[] = ["deltas", "cumulative"];

export const ANALYTICS_VIEW_LABELS: Record<AnalyticsView, string> = {
	deltas: "Per-period",
	cumulative: "Cumulative",
};

export const ANALYTICS_VIEW_DESCRIPTIONS: Record<AnalyticsView, string> = {
	deltas: "Show activity per bucket",
	cumulative: "Show running total over time",
};

export const DEFAULT_ANALYTICS_VIEW: AnalyticsView = "deltas";

export function parseAnalyticsView(value: string | string[] | undefined): AnalyticsView {
	const raw = Array.isArray(value) ? value[0] : value;
	return ANALYTICS_VIEWS.includes(raw as AnalyticsView)
		? (raw as AnalyticsView)
		: DEFAULT_ANALYTICS_VIEW;
}

export type AnalyticsParams = {
	view: AnalyticsView;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	defaultResolution: AnalyticsResolution;
	defaultRange: AnalyticsRange;
};

export function parseAnalyticsParams(
	searchParams: Record<string, string | string[] | undefined>,
	scope: AnalyticsScope = "scoped",
	defaultRange: AnalyticsRange = DEFAULT_ANALYTICS_RANGE,
): AnalyticsParams {
	const view = parseAnalyticsView(searchParams.view);
	const range = view === "cumulative" ? "all" : parseAnalyticsRange(searchParams.range, defaultRange);
	const resolution = parseAnalyticsResolution(searchParams.resolution, range, scope);
	const defaultResolution = getDefaultResolution(range, scope);
	return { view, range, resolution, defaultResolution, defaultRange };
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
	uniqueMakers: number;
	uniqueTakers: number;
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

export type VolumeComponentId = "buy" | "sell" | "redeem" | "merge" | "split";

export const VOLUME_COMPONENT_IDS: readonly VolumeComponentId[] = [
	"buy",
	"sell",
	"redeem",
	"merge",
	"split",
];

export const VOLUME_COMPONENT_LABELS: Record<VolumeComponentId, string> = {
	buy: "Buys",
	sell: "Sells",
	redeem: "Redemptions",
	merge: "Merges",
	split: "Splits",
};

export const DEFAULT_VOLUME_COMPONENTS: readonly VolumeComponentId[] = VOLUME_COMPONENT_IDS;

export const DEFAULT_KPI_VOLUME_COMPONENTS: readonly VolumeComponentId[] = ["buy", "sell"];

export const AVG_TRADE_SIZE_STORAGE_KEY = "analytics:avgTradeSizeComponents";

export type ComponentTotals = Record<VolumeComponentId, number>;

export function isDefaultVolumeComponents(
	components: readonly VolumeComponentId[],
): boolean {
	return components.length === VOLUME_COMPONENT_IDS.length;
}

export function computeVolumeComponentTotals(points: AnalyticsPoint[]): ComponentTotals {
	const totals: ComponentTotals = { buy: 0, sell: 0, redeem: 0, merge: 0, split: 0 };
	for (const p of points) {
		totals.buy += p.buyVolumeUsd;
		totals.sell += p.sellVolumeUsd;
		totals.redeem += p.redemptionVolumeUsd;
		totals.merge += p.mergeVolumeUsd;
		totals.split += p.splitVolumeUsd;
	}
	return totals;
}

export function computeTradeCountComponentTotals(points: AnalyticsPoint[]): ComponentTotals {
	const totals: ComponentTotals = { buy: 0, sell: 0, redeem: 0, merge: 0, split: 0 };
	for (const p of points) {
		totals.buy += p.buyCount;
		totals.sell += p.sellCount;
		totals.redeem += p.redemptionCount;
		totals.merge += p.mergeCount;
		totals.split += p.splitCount;
	}
	return totals;
}

export function sumSelectedComponentTotals(
	totals: ComponentTotals,
	components: readonly VolumeComponentId[],
): number {
	let sum = 0;
	for (const id of components) sum += totals[id];
	return sum;
}

export function deserializeVolumeComponents(raw: string): readonly VolumeComponentId[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return DEFAULT_KPI_VOLUME_COMPONENTS;
	}
	if (!Array.isArray(parsed)) return DEFAULT_KPI_VOLUME_COMPONENTS;
	const valid = new Set<VolumeComponentId>(VOLUME_COMPONENT_IDS);
	const filtered = parsed.filter(
		(v): v is VolumeComponentId => typeof v === "string" && valid.has(v as VolumeComponentId),
	);
	if (filtered.length === 0) return DEFAULT_KPI_VOLUME_COMPONENTS;
	return VOLUME_COMPONENT_IDS.filter((id) => filtered.includes(id));
}

export function computeAvgTradeSizePctChange(
	volumePct: number | null | undefined,
	txnPct: number | null | undefined,
): number | null {
	if (volumePct === null || volumePct === undefined) return null;
	if (txnPct === null || txnPct === undefined) return null;
	const denom = 1 + txnPct;
	if (denom === 0) return null;
	return (1 + volumePct) / denom - 1;
}
