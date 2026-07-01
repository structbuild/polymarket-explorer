"use client";

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
import { ShareCardHeader } from "@/components/analytics/share-card-header";
import { VolumeAnalyticsChart } from "@/components/analytics/volume-analytics-chart";
import { VolumeModeLabel } from "@/components/analytics/volume-mode-label";
import { useVolumeMode } from "@/lib/hooks/use-volume-mode";
import {
	VOLUME_COMPONENT_IDS,
	type AnalyticsMetricId,
	type AnalyticsPoint,
	type AnalyticsResolution,
	type AnalyticsSubject,
	type AnalyticsView,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

const EQUAL_HEIGHT_CARD_CLASS =
	"grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto]";

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
const COLOR_CONVERT = "#ec4899";
const COLOR_YES = "var(--chart-1)";
const COLOR_NO = "var(--chart-4)";
const COLOR_SINGLE = "var(--chart-2)";
const COLOR_TOTAL = "#64748b";
const COLOR_OTHER = "#94a3b8";
const COLOR_REWARDS = "#8b5cf6";
const COLOR_MAKER_REBATE = "#f59e0b";
const COLOR_YIELD = "#14b8a6";

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
	{ key: "convertedCollateralUsd", label: "Conversions", color: COLOR_CONVERT, stackId: "v" },
	VOLUME_TOTAL_SERIES,
];

const VOLUME_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyVolumeUsd", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellVolumeUsd", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionVolumeUsd", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeVolumeUsd", label: "Merges", color: COLOR_MERGE },
	{ key: "splitVolumeUsd", label: "Splits", color: COLOR_SPLIT },
	{ key: "convertedCollateralUsd", label: "Conversions", color: COLOR_CONVERT },
	VOLUME_TOTAL_SERIES,
];

const SHARES_TOTAL_SERIES: AnalyticsSeries = {
	key: "sharesVolume",
	label: "Total",
	color: COLOR_TOTAL,
	isTotal: true,
};

const VOLUME_NOTIONAL_SERIES: AnalyticsSeries[] = [
	{ key: "buySharesVolume", label: "Buys", color: COLOR_VOLUME_BUY, stackId: "vn" },
	{ key: "sellSharesVolume", label: "Sells", color: COLOR_VOLUME_SELL, stackId: "vn" },
	{ key: "otherSharesVolume", label: "Other", color: COLOR_OTHER, stackId: "vn" },
	SHARES_TOTAL_SERIES,
];

const VOLUME_NOTIONAL_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buySharesVolume", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellSharesVolume", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "otherSharesVolume", label: "Other", color: COLOR_OTHER },
	SHARES_TOTAL_SERIES,
];

const TRADE_COUNT_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY, stackId: "tc" },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL, stackId: "tc" },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM, stackId: "tc" },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE, stackId: "tc" },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT, stackId: "tc" },
	{ key: "convertedCount", label: "Conversions", color: COLOR_CONVERT, stackId: "tc" },
	TRADE_COUNT_TOTAL_SERIES,
];

const TRADE_COUNT_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT },
	{ key: "convertedCount", label: "Conversions", color: COLOR_CONVERT },
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

const INCENTIVES_SERIES: AnalyticsSeries[] = [
	{ key: "rewardVolumeUsd", label: "Rewards", color: COLOR_REWARDS, stackId: "inc" },
	{ key: "makerRebateVolumeUsd", label: "Maker rebates", color: COLOR_MAKER_REBATE, stackId: "inc" },
	{ key: "yieldVolumeUsd", label: "Yield", color: COLOR_YIELD, stackId: "inc" },
];

const INCENTIVES_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "rewardVolumeUsd", label: "Rewards", color: COLOR_REWARDS },
	{ key: "makerRebateVolumeUsd", label: "Maker rebates", color: COLOR_MAKER_REBATE },
	{ key: "yieldVolumeUsd", label: "Yield", color: COLOR_YIELD },
];

const YES_NO_SHARES_SERIES: AnalyticsSeries[] = [
	{ key: "yesSharesVolume", label: "Yes", color: COLOR_YES, stackId: "yns" },
	{ key: "noSharesVolume", label: "No", color: COLOR_NO, stackId: "yns" },
];

const YES_NO_SHARES_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "yesSharesVolume", label: "Yes", color: COLOR_YES },
	{ key: "noSharesVolume", label: "No", color: COLOR_NO },
];

const CHART_SPECS: ChartSpec[] = [
	{
		kind: "timeSeries",
		id: "volume",
		title: "Volume",
		tooltip:
			"USD volume = price × shares actually exchanged. Switch the volume display in settings to view notional ($1-payout shares traded) — the figure Polymarket publishes as headline volume.",
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
		title: "Notional volume",
		tooltip:
			"Total $1-payout shares filled in the bucket — Polymarket's headline volume metric. Switch the global volume display to Notional to make this the primary view.",
		variant: "bar",
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
	{
		kind: "timeSeries",
		id: "incentives",
		title: "Rewards & incentives",
		tooltip:
			"Liquidity rewards, maker rebates, and collateral yield distributed to traders — separate from trading PnL.",
		variant: "bar",
		series: INCENTIVES_SERIES,
		valueFormat: "currency",
		cumulative: {
			series: INCENTIVES_CUMULATIVE_SERIES,
		},
	},
	{
		kind: "timeSeries",
		id: "yesNoShares",
		title: "Yes vs No shares",
		tooltip: "Notional shares (each settles $0–$1) traded for outcome index 0 (Yes) and 1 (No).",
		variant: "bar",
		series: YES_NO_SHARES_SERIES,
		valueFormat: "count",
		cumulative: {
			series: YES_NO_SHARES_CUMULATIVE_SERIES,
		},
	},
];

function toChartData(points: AnalyticsPoint[]): Array<{ t: number } & Record<string, number>> {
	return points.map((p) => ({
		t: p.t,
		volumeUsd: p.volumeUsd ?? 0,
		buyVolumeUsd: p.buyVolumeUsd ?? 0,
		sellVolumeUsd: p.sellVolumeUsd ?? 0,
		redemptionVolumeUsd: p.redemptionVolumeUsd ?? 0,
		mergeVolumeUsd: p.mergeVolumeUsd ?? 0,
		splitVolumeUsd: p.splitVolumeUsd ?? 0,
		yesVolumeUsd: p.yesVolumeUsd ?? 0,
		noVolumeUsd: p.noVolumeUsd ?? 0,
		uniqueTraders: p.uniqueTraders ?? 0,
		uniqueMakers: p.uniqueMakers ?? 0,
		uniqueTakers: p.uniqueTakers ?? 0,
		txnCount: p.txnCount ?? 0,
		buyCount: p.buyCount ?? 0,
		sellCount: p.sellCount ?? 0,
		redemptionCount: p.redemptionCount ?? 0,
		mergeCount: p.mergeCount ?? 0,
		splitCount: p.splitCount ?? 0,
		yesCount: p.yesCount ?? 0,
		noCount: p.noCount ?? 0,
		feesUsd: p.feesUsd ?? 0,
		builderFeesUsd: p.builderFeesUsd ?? 0,
		newUsers: p.newUsers ?? 0,
		avgRevenuePerUserUsd: p.avgRevenuePerUserUsd ?? 0,
		avgVolumePerUserUsd: p.avgVolumePerUserUsd ?? 0,
		sharesVolume: p.sharesVolume ?? 0,
		buySharesVolume: p.buySharesVolume ?? 0,
		sellSharesVolume: p.sellSharesVolume ?? 0,
		otherSharesVolume: Math.max(
			0,
			(p.sharesVolume ?? 0) - (p.buySharesVolume ?? 0) - (p.sellSharesVolume ?? 0),
		),
		convertedCollateralUsd: p.convertedCollateralUsd ?? 0,
		convertedCount: p.convertedCount ?? 0,
		makerRebateVolumeUsd: p.makerRebateVolumeUsd ?? 0,
		rewardVolumeUsd: p.rewardVolumeUsd ?? 0,
		yieldVolumeUsd: p.yieldVolumeUsd ?? 0,
		yesSharesVolume: p.yesSharesVolume ?? 0,
		noSharesVolume: p.noSharesVolume ?? 0,
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
	const result = specs.map((spec) => ({ ...spec }));
	let col = 0;
	for (let i = 0; i < result.length; i++) {
		if (result[i].wide) {
			if (col === 1) {
				result[i] = { ...result[i], wide: false };
				col = 0;
			}
		} else {
			col = col === 0 ? 1 : 0;
		}
	}
	if (col === 1) {
		const last = result[result.length - 1];
		if (last && !last.wide && !last.keepNarrow) {
			result[result.length - 1] = { ...last, wide: true };
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

function withSecondaryVolumeMode(spec: ChartSpec, mode: "usd" | "notional"): ChartSpec {
	if (spec.kind !== "timeSeries" || spec.id !== "shares" || mode !== "notional") return spec;
	return {
		...spec,
		title: "USD volume",
		tooltip:
			"USD volume = price × shares actually exchanged. Shown here as the secondary view since the primary Volume chart is currently in notional mode.",
		series: [{ ...spec.series[0], key: "volumeUsd", label: "USD" }],
		valueFormat: "currency",
	};
}

const SERIES_COMPONENTS: Partial<Record<string, VolumeComponentId>> = {
	buyVolumeUsd: "buy",
	sellVolumeUsd: "sell",
	redemptionVolumeUsd: "redeem",
	mergeVolumeUsd: "merge",
	splitVolumeUsd: "split",
	convertedCollateralUsd: "convert",
	buyCount: "buy",
	sellCount: "sell",
	redemptionCount: "redeem",
	mergeCount: "merge",
	splitCount: "split",
	convertedCount: "convert",
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
	subject?: AnalyticsSubject;
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
	subject,
}: AnalyticsChartsGridProps) {
	const { mode } = useVolumeMode();
	const data = toChartData(points);
	const specs = balanceLayout(
		applyMetricPlacements(
			reorderAppended(visibleCharts(excludeMetrics), appendMetrics),
			metricPlacements,
		).map((spec) =>
			withSecondaryVolumeMode(
				withViewVariant(withAllowedComponents(spec, allowedComponents), view),
				mode,
			),
		),
	);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{specs.map((spec) => {
				const isVolumeChart = spec.kind === "timeSeries" && spec.id === "volume";
				const headerTitle = isVolumeChart ? (
					<VolumeModeLabel usd="Volume (USD)" notional="Volume (notional)" />
				) : (
					spec.title
				);
				return (
					<div key={spec.id} className={spec.wide ? "min-w-0 lg:col-span-2" : "h-full min-w-0"}>
						<ShareableChartCard
							cardClassName={EQUAL_HEIGHT_CARD_CLASS}
							title={spec.title}
							titleNode={isVolumeChart ? headerTitle : undefined}
							shareHeader={
								<ShareCardHeader
									title={headerTitle}
									subject={subject}
									view={view}
									resolution={resolution}
									points={points}
								/>
							}
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
							) : isVolumeChart ? (
								<VolumeAnalyticsChart
									data={data}
									usdSeries={spec.series}
									notionalSeries={
										view === "cumulative"
											? VOLUME_NOTIONAL_CUMULATIVE_SERIES
											: VOLUME_NOTIONAL_SERIES
									}
									variant={spec.variant}
									interactiveLegend={spec.interactiveLegend}
									resolution={resolution}
									view={view}
									showIncomplete={view === "deltas"}
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
				);
			})}
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
				<div key={spec.id} className={spec.wide ? "min-w-0 lg:col-span-2" : "h-full min-w-0"}>
					<ChartCard
						className={EQUAL_HEIGHT_CARD_CLASS}
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
