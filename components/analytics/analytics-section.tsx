import type { MetricPctChange } from "@structbuild/sdk";
import { Suspense } from "react";

import {
	AnalyticsChartsGrid,
	AnalyticsChartsGridFallback,
	type AnalyticsMetricPlacement,
} from "@/components/analytics/analytics-charts-grid";
import {
	AnalyticsKpiStrip,
	AnalyticsKpiStripFallback,
} from "@/components/analytics/analytics-kpi-strip";
import { AnalyticsCapToggle } from "@/components/analytics/cap-toggle";
import { AnalyticsRangeToggle } from "@/components/analytics/range-toggle";
import { AnalyticsResolutionToggle } from "@/components/analytics/resolution-toggle";
import { AnalyticsViewToggle } from "@/components/analytics/view-toggle";
import { summarizeAnalytics } from "@/lib/struct/analytics-queries";
import {
	applyAnalyticsCap,
	computeTradeCountComponentTotals,
	computeVolumeComponentTotals,
	restrictAnalyticsComponents,
	type AnalyticsMetricId,
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsView,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export type AnalyticsFetchers = {
	deltas: () => Promise<AnalyticsPoint[]>;
	timeseries: () => Promise<AnalyticsPoint[]>;
	changes: () => Promise<MetricPctChange | null>;
};

async function KpiLoader({
	deltasPromise,
	fetchers,
	excludeMetrics,
	allowedComponents,
}: {
	deltasPromise: Promise<AnalyticsPoint[]>;
	fetchers: AnalyticsFetchers;
	excludeMetrics?: readonly AnalyticsMetricId[];
	allowedComponents?: readonly VolumeComponentId[];
}) {
	const [points, changes] = await Promise.all([deltasPromise, fetchers.changes()]);
	const scopedPoints = restrictAnalyticsComponents(points, allowedComponents);
	return (
		<AnalyticsKpiStrip
			summary={summarizeAnalytics(scopedPoints)}
			volumeComponentTotals={computeVolumeComponentTotals(scopedPoints)}
			tradeCountComponentTotals={computeTradeCountComponentTotals(scopedPoints)}
			changes={changes}
			excludeMetrics={excludeMetrics}
			allowedComponents={allowedComponents}
		/>
	);
}

async function ChartsLoader({
	deltasPromise,
	fetchers,
	view,
	resolution,
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	endTime,
	cap,
	pathname,
	refreshedAt,
	allowedComponents,
}: {
	deltasPromise?: Promise<AnalyticsPoint[]>;
	fetchers: AnalyticsFetchers;
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	metricPlacements?: readonly AnalyticsMetricPlacement[];
	endTime?: number;
	cap?: boolean;
	pathname: string;
	refreshedAt: Date;
	allowedComponents?: readonly VolumeComponentId[];
}) {
	const raw =
		view === "cumulative"
			? await fetchers.timeseries()
			: await (deltasPromise ?? fetchers.deltas());
	const points = restrictAnalyticsComponents(
		applyAnalyticsCap(raw, endTime, cap ?? false),
		allowedComponents,
	);
	return (
		<AnalyticsChartsGrid
			points={points}
			view={view}
			resolution={resolution}
			excludeMetrics={excludeMetrics}
			appendMetrics={appendMetrics}
			metricPlacements={metricPlacements}
			pathname={pathname}
			refreshedAt={refreshedAt}
			allowedComponents={allowedComponents}
		/>
	);
}

type AnalyticsSectionProps = {
	title: string;
	description?: string;
	range: AnalyticsRange;
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	defaultResolution: AnalyticsResolution;
	defaultRange?: AnalyticsRange;
	fetchers: AnalyticsFetchers;
	headingLevel?: "h1" | "h2";
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	metricPlacements?: readonly AnalyticsMetricPlacement[];
	endTime?: number;
	cap?: boolean;
	defaultCap?: boolean;
	allowedComponents?: readonly VolumeComponentId[];
	pathname: string;
	showControls?: boolean;
	showKpis?: boolean;
};

export function AnalyticsSection({
	title,
	description,
	range,
	view,
	resolution,
	defaultResolution,
	defaultRange,
	fetchers,
	headingLevel = "h2",
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	endTime,
	cap = false,
	defaultCap = false,
	allowedComponents,
	pathname,
	showControls = true,
	showKpis = true,
}: AnalyticsSectionProps) {
	const Heading = headingLevel;
	const refreshedAt = new Date();
	const deltasPromise = view === "deltas" || showKpis ? fetchers.deltas() : undefined;
	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-col gap-0.5">
					<Heading className="text-lg font-medium text-foreground/90">
						{title}
					</Heading>
					{description ? (
						<p className="text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
				{showControls ? (
					<div className="flex flex-wrap items-center gap-2">
						{view === "deltas" ? <AnalyticsRangeToggle range={range} defaultRange={defaultRange} /> : null}
						<AnalyticsResolutionToggle
							range={range}
							resolution={resolution}
							defaultResolution={defaultResolution}
						/>
						<AnalyticsViewToggle view={view} />
						{endTime !== undefined ? (
							<AnalyticsCapToggle cap={cap} defaultCap={defaultCap} />
						) : null}
					</div>
				) : null}
			</div>

			{showKpis ? (
				<Suspense fallback={<AnalyticsKpiStripFallback excludeMetrics={excludeMetrics} />}>
					<KpiLoader
						deltasPromise={deltasPromise ?? fetchers.deltas()}
						fetchers={fetchers}
						excludeMetrics={excludeMetrics}
						allowedComponents={allowedComponents}
					/>
				</Suspense>
			) : null}

			<Suspense
				fallback={
					<AnalyticsChartsGridFallback
						view={view}
						excludeMetrics={excludeMetrics}
						appendMetrics={appendMetrics}
						metricPlacements={metricPlacements}
						pathname={pathname}
						refreshedAt={refreshedAt}
					/>
				}
			>
				<ChartsLoader
					deltasPromise={deltasPromise}
					fetchers={fetchers}
					view={view}
					resolution={resolution}
					excludeMetrics={excludeMetrics}
					appendMetrics={appendMetrics}
					metricPlacements={metricPlacements}
					endTime={endTime}
					cap={cap}
					pathname={pathname}
					refreshedAt={refreshedAt}
					allowedComponents={allowedComponents}
				/>
			</Suspense>
		</div>
	);
}
