import { ChartCard } from "@/components/market/chart-card";
import {
	AnalyticsChart,
	type AnalyticsSeries,
	type AnalyticsValueFormat,
} from "@/components/analytics/analytics-chart";
import {
	BuyDistributionPie,
	BuyDistributionPieFallback,
} from "@/components/analytics/buy-distribution-pie";
import type {
	AnalyticsMetricId,
	AnalyticsPoint,
	AnalyticsView,
} from "@/lib/struct/analytics-shared";

type TimeSeriesChartSpec = {
	kind: "timeSeries";
	id: AnalyticsMetricId;
	title: string;
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
	wide?: boolean;
	keepNarrow?: boolean;
};

type ChartSpec = TimeSeriesChartSpec | BuyDistributionChartSpec;

const COLOR_VOLUME_BUY = "#10b981";
const COLOR_VOLUME_SELL = "#ef4444";
const COLOR_VOLUME_REDEEM = "#8b5cf6";
const COLOR_MERGE = "#f59e0b";
const COLOR_SPLIT = "#06b6d4";
const COLOR_YES = "var(--chart-1)";
const COLOR_NO = "var(--chart-4)";
const COLOR_TRADERS = "var(--chart-3)";
const COLOR_FEES = "var(--chart-5)";
const COLOR_SHARES = "var(--chart-2)";

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
];

const VOLUME_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyVolumeUsd", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellVolumeUsd", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionVolumeUsd", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeVolumeUsd", label: "Merges", color: COLOR_MERGE },
	{ key: "splitVolumeUsd", label: "Splits", color: COLOR_SPLIT },
];

const TRADE_COUNT_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY, stackId: "tc" },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL, stackId: "tc" },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM, stackId: "tc" },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE, stackId: "tc" },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT, stackId: "tc" },
];

const TRADE_COUNT_CUMULATIVE_SERIES: AnalyticsSeries[] = [
	{ key: "buyCount", label: "Buys", color: COLOR_VOLUME_BUY },
	{ key: "sellCount", label: "Sells", color: COLOR_VOLUME_SELL },
	{ key: "redemptionCount", label: "Redemptions", color: COLOR_VOLUME_REDEEM },
	{ key: "mergeCount", label: "Merges", color: COLOR_MERGE },
	{ key: "splitCount", label: "Splits", color: COLOR_SPLIT },
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
		variant: "area",
		series: [{ key: "uniqueTraders", label: "Traders", color: COLOR_TRADERS }],
		valueFormat: "count",
	},
	{
		kind: "timeSeries",
		id: "fees",
		title: "Fees",
		variant: "area",
		series: [{ key: "feesUsd", label: "Fees", color: COLOR_FEES }],
		valueFormat: "currency",
	},
	{
		kind: "timeSeries",
		id: "shares",
		title: "Shares traded",
		variant: "area",
		series: [{ key: "sharesVolume", label: "Shares", color: COLOR_SHARES }],
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
		txnCount: p.txnCount,
		buyCount: p.buyCount,
		sellCount: p.sellCount,
		redemptionCount: p.redemptionCount,
		mergeCount: p.mergeCount,
		splitCount: p.splitCount,
		yesCount: p.yesCount,
		noCount: p.noCount,
		feesUsd: p.feesUsd,
		sharesVolume: p.sharesVolume,
	}));
}

function visibleCharts(excludeMetrics?: readonly AnalyticsMetricId[]): ChartSpec[] {
	if (!excludeMetrics || excludeMetrics.length === 0) return CHART_SPECS;
	const excluded = new Set(excludeMetrics);
	return CHART_SPECS.filter((spec) => !excluded.has(spec.id));
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

type AnalyticsChartsGridProps = {
	points: AnalyticsPoint[];
	view: AnalyticsView;
	excludeMetrics?: readonly AnalyticsMetricId[];
};

export function AnalyticsChartsGrid({
	points,
	view,
	excludeMetrics,
}: AnalyticsChartsGridProps) {
	const data = toChartData(points);
	const specs = balanceLayout(
		visibleCharts(excludeMetrics).map((spec) => withViewVariant(spec, view)),
	);

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{specs.map((spec) => (
				<div key={spec.id} className={spec.wide ? "lg:col-span-2" : undefined}>
					<ChartCard title={spec.title}>
						{spec.kind === "buyDistribution" ? (
							<BuyDistributionPie points={points} />
						) : (
							<AnalyticsChart
								data={data}
								variant={spec.variant}
								series={spec.series}
								valueFormat={spec.valueFormat}
								interactiveLegend={spec.interactiveLegend}
							/>
						)}
					</ChartCard>
				</div>
			))}
		</div>
	);
}

export function AnalyticsChartsGridFallback({
	view,
	excludeMetrics,
}: {
	view?: AnalyticsView;
	excludeMetrics?: readonly AnalyticsMetricId[];
} = {}) {
	const resolvedView: AnalyticsView = view ?? "deltas";
	const specs = balanceLayout(
		visibleCharts(excludeMetrics).map((spec) => withViewVariant(spec, resolvedView)),
	);
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{specs.map((spec) => (
				<div key={spec.id} className={spec.wide ? "lg:col-span-2" : undefined}>
					<ChartCard title={spec.title}>
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
