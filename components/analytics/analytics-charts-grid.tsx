import { ChartCard } from "@/components/market/chart-card";
import { AnalyticsAttribution } from "@/components/analytics/analytics-attribution";
import { ShareableChartCard } from "@/components/analytics/shareable-chart-card";
import {
	AnalyticsChart,
	type AnalyticsSeries,
	type AnalyticsValueFormat,
} from "@/components/analytics/analytics-chart";
import { AvgTradeSizeChart } from "@/components/analytics/avg-trade-size-chart";
import { AvgTradeSizeComponentsToggle } from "@/components/analytics/avg-trade-size-components-toggle";
import {
	BuyDistributionPie,
	BuyDistributionPieFallback,
} from "@/components/analytics/buy-distribution-pie";
import {
	VOLUME_COMPONENT_IDS,
	type AnalyticsMetricId,
	type AnalyticsPoint,
	type AnalyticsResolution,
	type AnalyticsView,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

function slugForFilename(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function buildChartFilename(pathname: string, title: string): string {
	const pathPart = slugForFilename(pathname) || "polymarket";
	const titlePart = slugForFilename(title) || "chart";
	return `${pathPart}-${titlePart}.png`;
}

type TimeSeriesChartSpec = {
	kind: "timeSeries";
	id: AnalyticsMetricId;
	title: string;
	tooltip?: string;
	variant: "area" | "bar";
	series: AnalyticsSeries[];
	valueFormat: AnalyticsValueFormat;
	wide?: boolean;
	keepNarrow?: boolean;
	interactiveLegend?: boolean;
	cumulative?: {
		title?: string;
		series?: AnalyticsSeries[];
	};
};

type BuyDistributionChartSpec = {
	kind: "buyDistribution";
	id: AnalyticsMetricId;
	title: string;
	tooltip?: string;
	wide?: boolean;
	keepNarrow?: boolean;
};

type AvgTradeSizeChartSpec = {
	kind: "avgTradeSize";
	id: AnalyticsMetricId;
	title: string;
	tooltip?: string;
	wide?: boolean;
	keepNarrow?: boolean;
};

type ChartSpec = TimeSeriesChartSpec | BuyDistributionChartSpec | AvgTradeSizeChartSpec;

export type AnalyticsMetricPlacement = {
	metric: AnalyticsMetricId;
	after: AnalyticsMetricId;
};

const COLOR_VOLUME_BUY = "#10b981";
const COLOR_VOLUME_SELL = "#ef4444";
const COLOR_VOLUME_REDEEM = "#8b5cf6";
const COLOR_MERGE = "#f59e0b";
const COLOR_SPLIT = "#06b6d4";
const COLOR_YES = "var(--chart-1)";
const COLOR_NO = "var(--chart-4)";
const COLOR_SINGLE = "var(--chart-2)";
const COLOR_TOTAL = "#64748b";
const COLOR_MAKERS = "var(--chart-1)";
const COLOR_TAKERS = "var(--chart-4)";

const VOLUME_TOTAL_SERIES: AnalyticsSeries = {
	key: "volumeUsd",
	label: "Total",
	color: COLOR_TOTAL,
	isTotal: true,
};

const TRADE_COUNT_TOTAL_SERIES: AnalyticsSeries = {
	key: "txnCount",
	label: "Total",
	color: COLOR_TOTAL,
	isTotal: true,
};

const VOLUME_SERIES: AnalyticsSeries[] = [
	{ key: "buyVolumeUsd", label: "Buys", color: COLOR_VOLUME_BUY, stackId: "v" },
	{ key: "sellVolumeUsd", label: "Sells", color: COLOR_VOLUME_SELL, stackId: "v" },
	{
		key: "redemptionVolumeUsd",
		label: "Redemptions",
		color: COLOR_VOLUME_REDEEM,
		stackId: "v",
	},
	{ key: "mergeVolumeUsd", label: "Merges", color: COLOR_MERGE, stackId: "v" },
	{ key: "splitVolumeUsd", label: "Splits", color: COLOR_SPLIT, stackId: "v" },
	VOLUME_TOTAL_SERIES,
];

const VOLUME_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyVolumeUsd", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellVolumeUsd", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionVolumeUsd", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeVolumeUsd", label: "Merges", color: COLOR_MERGE },
	{ key: "splitVolumeUsd", label: "Splits", color: COLOR_SPLIT },
	VOLUME_TOTAL_SERIES,
];

const TRADE_COUNT_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY, stackId: "tc" },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL, stackId: "tc" },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM, stackId: "tc" },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE, stackId: "tc" },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT, stackId: "tc" },
	TRADE_COUNT_TOTAL_SERIES,
];

const TRADE_COUNT_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT },
	TRADE_COUNT_TOTAL_SERIES,
];

const YES_NO_COUNT_SERIES: AnalyticsSeries[] = [
	{ key: "yesCount", label: "Yes", color: COLOR_YES, stackId: "ync" },
	{ key: "noCount", label: "No", color: COLOR_NO, stackId: "ync" },
];

const YES_NO_COUNT_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "yesCount", label: "Yes", color: COLOR_YES },
	{ key: "noCount", label: "No", color: COLOR_NO },
];

const CHART_SPECS: ChartSpec[] = [
	{
		kind: "timeSeries",
		id: "volume",
		title: "Volume",
		tooltip:
			"True USD volume (price × shares). Polymarket's headline volume counts each share traded as $1, so their figure matches 'Shares traded' below — not this number.",
		variant: "bar",
		series: VOLUME_SERIES,
		valueFormat: "currency",
		wide: true,
		interactiveLegend: true,
		cumulative: {
			series: VOLUME_CUMULATIVE_SERIES,
		},
	},
	{
		kind: "timeSeries",
		id: "yesNo",
		title: "Yes vs No volume",
		tooltip: "Shows volume for outcome index 0 and 1.",
		variant: "bar",
		series: [
			{ key: "yesVolumeUsd", label: "Yes", color: COLOR_YES, stackId: "yn" },
			{ key: "noVolumeUsd", label: "No", color: COLOR_NO, stackId: "yn" },
		],
		valueFormat: "currency",
		cumulative: {
			series: [
				{ key: "yesVolumeUsd", label: "Yes", color: COLOR_YES },
				{ key: "noVolumeUsd", label: "No", color: COLOR_NO },
			],
		},
	},
	{
		kind: "timeSeries",
		id: "yesNoCount",
		title: "Yes vs No trades",
		tooltip: "Shows transactions for outcome index 0 and 1.",
		variant: "bar",
		series: YES_NO_COUNT_SERIES,
		valueFormat: "count",
		cumulative: {
			series: YES_NO_COUNT_CUMULATIVE_SERIES,
		},
	},
	{
		kind: "timeSeries",
		id: "uniqueTraders",
		title: "Unique traders",
		tooltip: "Distinct addresses that traded in the bucket.",
		variant: "area",
		series: [{ key: "uniqueTraders", label: "Traders", color: COLOR_SINGLE }],
		valueFormat: "count",
	},
	{
		kind: "timeSeries",
		id: "makersTakers",
		title: "Makers vs takers",
		tooltip: "Distinct makers (order-resting side) and takers (order-initiator side) active in the bucket. A trader can appear in both.",
		variant: "area",
		series: [
			{ key: "uniqueMakers", label: "Makers", color: COLOR_MAKERS },
			{ key: "uniqueTakers", label: "Takers", color: COLOR_TAKERS },
		],
		valueFormat: "count",
	},
	{
		kind: "timeSeries",
		id: "fees",
		title: "Fees",
		tooltip: "Shows only fees from orders matched/filled.",
		variant: "area",
		series: [{ key: "feesUsd", label: "Fees", color: COLOR_SINGLE }],
		valueFormat: "currency",
	},
	{
		kind: "avgTradeSize",
		id: "avgTradeSize",
		title: "Avg trade size",
		tooltip: "Volume divided by trade count for the selected components.",
	},
	{
		kind: "timeSeries",
		id: "shares",
		title: "Shares traded",
		tooltip:
			"Total shares filled in the bucket. Polymarket reports each share as $1, so this count equals what they publish as headline $ volume.",
		variant: "area",
		series: [{ key: "sharesVolume", label: "Shares", color: COLOR_SINGLE }],
		valueFormat: "count",
		keepNarrow: true,
	},
	{
		kind: "buyDistribution",
		id: "buyDistribution",
		title: "Buy size distribution",
		keepNarrow: true,
	},
	{
		kind: "timeSeries",
		id: "tradeTypes",
		title: "Trade types",
		variant: "bar",
		series: TRADE_COUNT_SERIES,
		valueFormat: "count",
		wide: true,
		interactiveLegend: true,
		cumulative: {
			series: TRADE_COUNT_CUMULATIVE_SERIES,
		},
	},
];

const EXTRA_CHART_SPECS: ChartSpec[] = [
	{
		kind: "timeSeries",
		id: "builderFees",
		title: "Builder fees",
		tooltip: "Builder-attributed fee revenue.",
		variant: "area",
		series: [{ key: "builderFeesUsd", label: "Builder fees", color: COLOR_SINGLE }],
		valueFormat: "currency",
	},
	{
		kind: "timeSeries",
		id: "newUsers",
		title: "New builder users",
		tooltip: "Traders whose first builder-attributed trade occurred in the bucket.",
		variant: "area",
		series: [{ key: "newUsers", label: "New users", color: COLOR_SINGLE }],
		valueFormat: "count",
	},
	{
		kind: "timeSeries",
		id: "avgRevenuePerUser",
		title: "ARPU",
		tooltip: "Builder fees divided by unique traders.",
		variant: "area",
		series: [{ key: "avgRevenuePerUserUsd", label: "ARPU", color: COLOR_SINGLE }],
		valueFormat: "currency",
		keepNarrow: true,
	},
	{
		kind: "timeSeries",
		id: "avgVolumePerUser",
		title: "AVPU",
		tooltip: "Volume divided by unique traders.",
		variant: "area",
		series: [{ key: "avgVolumePerUserUsd", label: "AVPU", color: COLOR_SINGLE }],
		valueFormat: "currency",
		keepNarrow: true,
	},
];

function toChartData(points: AnalyticsPoint[]): Array<{ t: number } & Record<string, number>> {
	return points.map((p) => ({
		t: p.t,
		volumeUsd: p.volumeUsd,
		buyVolumeUsd: p.buyVolumeUsd,
		sellVolumeUsd: p.sellVolumeUsd,
		redemptionVolumeUsd: p.redemptionVolumeUsd,
		mergeVolumeUsd: p.mergeVolumeUsd,
		splitVolumeUsd: p.splitVolumeUsd,
		yesVolumeUsd: p.yesVolumeUsd,
		noVolumeUsd: p.noVolumeUsd,
		uniqueTraders: p.uniqueTraders,
		uniqueMakers: p.uniqueMakers,
		uniqueTakers: p.uniqueTakers,
		txnCount: p.txnCount,
		buyCount: p.buyCount,
		sellCount: p.sellCount,
		redemptionCount: p.redemptionCount,
		mergeCount: p.mergeCount,
		splitCount: p.splitCount,
		yesCount: p.yesCount,
		noCount: p.noCount,
		feesUsd: p.feesUsd,
		builderFeesUsd: p.builderFeesUsd,
		newUsers: p.newUsers,
		avgRevenuePerUserUsd: p.avgRevenuePerUserUsd,
		avgVolumePerUserUsd: p.avgVolumePerUserUsd,
		sharesVolume: p.sharesVolume,
	}));
}

function visibleCharts(excludeMetrics?: readonly AnalyticsMetricId[]): ChartSpec[] {
	if (!excludeMetrics || excludeMetrics.length === 0) return CHART_SPECS;
	const excluded = new Set(excludeMetrics);
	return CHART_SPECS.filter((spec) => !excluded.has(spec.id));
}

function reorderAppended(
	specs: ChartSpec[],
	appendMetrics?: readonly AnalyticsMetricId[],
): ChartSpec[] {
	if (!appendMetrics || appendMetrics.length === 0) return specs;
	const appended = new Set(appendMetrics);
	const kept = specs.filter((spec) => !appended.has(spec.id));
	const allSpecs = [...CHART_SPECS, ...EXTRA_CHART_SPECS];
	const tail = appendMetrics
		.map((id) => allSpecs.find((spec) => spec.id === id))
		.filter((spec): spec is ChartSpec => Boolean(spec));
	return [...kept, ...tail];
}

function applyMetricPlacements(
	specs: ChartSpec[],
	placements?: readonly AnalyticsMetricPlacement[],
): ChartSpec[] {
	if (!placements || placements.length === 0) return specs;
	const result = [...specs];
	for (const { metric, after } of placements) {
		const metricIndex = result.findIndex((spec) => spec.id === metric);
		const afterIndex = result.findIndex((spec) => spec.id === after);
		if (metricIndex === -1 || afterIndex === -1 || metricIndex === afterIndex + 1) {
			continue;
		}
		const [spec] = result.splice(metricIndex, 1);
		const nextAfterIndex = result.findIndex((item) => item.id === after);
		result.splice(nextAfterIndex + 1, 0, spec);
	}
	return result;
}

function balanceLayout(specs: ChartSpec[]): ChartSpec[] {
	const nonWideCount = specs.reduce((acc, s) => acc + (s.wide ? 0 : 1), 0);
	if (nonWideCount % 2 === 0) return specs;
	const result = [...specs];
	for (let i = result.length - 1; i >= 0; i--) {
		if (!result[i].wide && !result[i].keepNarrow) {
			result[i] = { ...result[i], wide: true };
			return result;
		}
	}
	for (let i = result.length - 1; i >= 0; i--) {
		if (!result[i].wide) {
			result[i] = { ...result[i], wide: true };
			break;
		}
	}
	return result;
}

function withViewVariant(spec: ChartSpec, view: AnalyticsView): ChartSpec {
	if (view !== "cumulative" || spec.kind !== "timeSeries") return spec;
	return {
		...spec,
		variant: "area",
		title: spec.cumulative?.title ?? spec.title,
		series: spec.cumulative?.series ?? spec.series,
	};
}

const SERIES_COMPONENTS: Partial<Record<string, VolumeComponentId>> = {
	buyVolumeUsd: "buy",
	sellVolumeUsd: "sell",
	redemptionVolumeUsd: "redeem",
	mergeVolumeUsd: "merge",
	splitVolumeUsd: "split",
	buyCount: "buy",
	sellCount: "sell",
	redemptionCount: "redeem",
	mergeCount: "merge",
	splitCount: "split",
};

function withAllowedComponents(
	spec: ChartSpec,
	allowedComponents: readonly VolumeComponentId[],
): ChartSpec {
	if (spec.kind !== "timeSeries") return spec;
	if (allowedComponents.length === VOLUME_COMPONENT_IDS.length) return spec;
	const allowed = new Set(allowedComponents);
	return {
		...spec,
		series: spec.series.filter((series) => {
			const component = SERIES_COMPONENTS[series.key];
			return !component || allowed.has(component);
		}),
		cumulative: spec.cumulative
			? {
					...spec.cumulative,
					series: spec.cumulative.series?.filter((series) => {
						const component = SERIES_COMPONENTS[series.key];
						return !component || allowed.has(component);
					}),
				}
			: undefined,
	};
}

type AnalyticsChartsGridProps = {
	points: AnalyticsPoint[];
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	metricPlacements?: readonly AnalyticsMetricPlacement[];
	allowedComponents?: readonly VolumeComponentId[];
	pathname: string;
	refreshedAt: Date;
};

export function AnalyticsChartsGrid({
	points,
	view,
	resolution,
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	allowedComponents = VOLUME_COMPONENT_IDS,
	pathname,
	refreshedAt,
}: AnalyticsChartsGridProps) {
	const data = toChartData(points);
	const specs = balanceLayout(
		applyMetricPlacements(
			reorderAppended(visibleCharts(excludeMetrics), appendMetrics),
			metricPlacements,
		).map((spec) => withViewVariant(withAllowedComponents(spec, allowedComponents), view)),
	);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{specs.map((spec) => (
				<div key={spec.id} className={spec.wide ? "lg:col-span-2" : undefined}>
					<ShareableChartCard
						title={spec.title}
						tooltip={spec.tooltip}
						filename={buildChartFilename(pathname, spec.title)}
						headerAction={
							spec.kind === "avgTradeSize" ? (
								<AvgTradeSizeComponentsToggle allowedComponents={allowedComponents} />
							) : undefined
						}
						footer={
							<AnalyticsAttribution pathname={pathname} refreshedAt={refreshedAt} />
						}
					>
						{spec.kind === "buyDistribution" ? (
							<BuyDistributionPie points={points} />
						) : spec.kind === "avgTradeSize" ? (
							<AvgTradeSizeChart
								points={points}
								view={view}
								resolution={resolution}
								showIncomplete={view === "deltas"}
								allowedComponents={allowedComponents}
							/>
						) : (
							<AnalyticsChart
								data={data}
								variant={spec.variant}
								series={spec.series}
								valueFormat={spec.valueFormat}
								interactiveLegend={spec.interactiveLegend}
								resolution={resolution}
								labelMode={view === "deltas" ? "bucket" : "point"}
								showIncomplete={view === "deltas"}
							/>
						)}
					</ShareableChartCard>
				</div>
			))}
		</div>
	);
}

type AnalyticsChartsGridFallbackProps = {
	view?: AnalyticsView;
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	metricPlacements?: readonly AnalyticsMetricPlacement[];
	pathname: string;
	refreshedAt: Date;
};

export function AnalyticsChartsGridFallback({
	view,
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	pathname,
	refreshedAt,
}: AnalyticsChartsGridFallbackProps) {
	const resolvedView: AnalyticsView = view ?? "deltas";
	const specs = balanceLayout(
		applyMetricPlacements(
			reorderAppended(visibleCharts(excludeMetrics), appendMetrics),
			metricPlacements,
		).map((spec) => withViewVariant(spec, resolvedView)),
	);
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{specs.map((spec) => (
				<div key={spec.id} className={spec.wide ? "lg:col-span-2" : undefined}>
					<ChartCard
						title={spec.title}
						tooltip={spec.tooltip}
						footer={
							<AnalyticsAttribution pathname={pathname} refreshedAt={refreshedAt} />
						}
					>
						{spec.kind === "buyDistribution" ? (
							<BuyDistributionPieFallback />
						) : (
							<div className="h-[240px] animate-pulse rounded-md bg-muted/60 sm:h-[300px]" />
						)}
					</ChartCard>
				</div>
			))}
		</div>
	);
}
