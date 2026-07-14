import { AnalyticsRangeToggle } from "@/components/analytics/range-toggle";
import { AnalyticsResolutionToggle } from "@/components/analytics/resolution-toggle";
import { AnalyticsViewToggle } from "@/components/analytics/view-toggle";
import { ComboAnalyticsGrid } from "@/components/combos/combo-analytics-grid";
import {
	ComboAnalyticsKpi,
	ComboAnalyticsKpiFallback,
} from "@/components/combos/combo-analytics-kpi";
import {
	ComboAnalyticsTotals,
	ComboAnalyticsTotalsFallback,
} from "@/components/combos/combo-analytics-totals";
import { ChartCard } from "@/components/market/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DEFAULT_ANALYTICS_RANGE,
	getDefaultResolution,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";
import { loadComboAnalyticsSectionData } from "@/lib/struct/combo-analytics-section-data";
import { COMBO_CHART_METRICS } from "@/lib/struct/combo-analytics-shared";

type ComboAnalyticsSectionProps = {
	view: AnalyticsView;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
};

export function ComboAnalyticsControls({
	view,
	range,
	resolution,
}: ComboAnalyticsSectionProps) {
	return (
		<div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
			<div className="flex flex-wrap items-center gap-2">
				{view === "deltas" ? (
					<AnalyticsRangeToggle range={range} defaultRange={DEFAULT_ANALYTICS_RANGE} />
				) : null}
				<AnalyticsResolutionToggle
					range={range}
					resolution={resolution}
					defaultResolution={getDefaultResolution(range, "global")}
				/>
			</div>
			<div className="hidden h-5 w-px bg-border sm:block" />
			<AnalyticsViewToggle view={view} />
		</div>
	);
}

export function ComboAnalyticsControlsFallback() {
	return (
		<div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-7 w-28" />
			</div>
			<div className="hidden h-5 w-px bg-border sm:block" />
			<Skeleton className="h-7 w-28" />
		</div>
	);
}

export async function ComboAnalyticsKpiSection({
	view,
	range,
	resolution,
}: ComboAnalyticsSectionProps) {
	const { counts, changes } = await loadComboAnalyticsSectionData({
		view,
		range,
		resolution,
	});

	if (!counts) {
		return null;
	}

	return <ComboAnalyticsKpi counts={counts} changes={changes} />;
}

export function ComboAnalyticsKpiSectionFallback() {
	return <ComboAnalyticsKpiFallback />;
}

export async function ComboAnalyticsChartsSection({
	view,
	range,
	resolution,
}: ComboAnalyticsSectionProps) {
	const { counts, deltas, timeseries } = await loadComboAnalyticsSectionData({
		view,
		range,
		resolution,
	});

	if (!counts) {
		return null;
	}

	return (
		<ComboAnalyticsGrid
			view={view}
			deltas={deltas}
			timeseries={timeseries}
			resolution={resolution}
		/>
	);
}

export function ComboAnalyticsChartsSectionFallback() {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{COMBO_CHART_METRICS.map((metric, index) => (
				<ChartCard
					key={metric.id}
					title={<Skeleton className="h-5 w-40" />}
					className={index === 0 ? "lg:col-span-2" : undefined}
				>
					<div className="h-[240px] min-h-[240px] w-full animate-pulse rounded-md bg-muted/60 sm:h-[300px]" />
				</ChartCard>
			))}
		</div>
	);
}

export async function ComboAnalyticsTotalsSection({
	view,
	range,
	resolution,
}: ComboAnalyticsSectionProps) {
	const { counts } = await loadComboAnalyticsSectionData({
		view,
		range,
		resolution,
	});

	if (!counts) {
		return null;
	}

	return <ComboAnalyticsTotals counts={counts} />;
}

export function ComboAnalyticsTotalsSectionFallback() {
	return <ComboAnalyticsTotalsFallback />;
}
