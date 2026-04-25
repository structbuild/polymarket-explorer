import type { MetricPctChange } from "@structbuild/sdk";
import { Suspense } from "react";

import {
	AnalyticsChartsGrid,
	AnalyticsChartsGridFallback,
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
	type AnalyticsMetricId,
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";

export type AnalyticsFetchers = {
	deltas: () => Promise<AnalyticsPoint[]>;
	timeseries: () => Promise<AnalyticsPoint[]>;
	changes: () => Promise<MetricPctChange | null>;
};

async function KpiLoader({
	fetchers,
	excludeMetrics,
}: {
	fetchers: AnalyticsFetchers;
	excludeMetrics?: readonly AnalyticsMetricId[];
}) {
	const [points, changes] = await Promise.all([fetchers.deltas(), fetchers.changes()]);
	return (
		<AnalyticsKpiStrip
			summary={summarizeAnalytics(points)}
			volumeComponentTotals={computeVolumeComponentTotals(points)}
			tradeCountComponentTotals={computeTradeCountComponentTotals(points)}
			changes={changes}
			excludeMetrics={excludeMetrics}
		/>
	);
}

async function ChartsLoader({
	fetchers,
	view,
	excludeMetrics,
	appendMetrics,
	endTime,
	cap,
	pathname,
	refreshedAt,
}: {
	fetchers: AnalyticsFetchers;
	view: AnalyticsView;
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	endTime?: number;
	cap?: boolean;
	pathname: string;
	refreshedAt: Date;
}) {
	const raw =
		view === "cumulative" ? await fetchers.timeseries() : await fetchers.deltas();
	const points = applyAnalyticsCap(raw, endTime, cap ?? false);
	return (
		<AnalyticsChartsGrid
			points={points}
			view={view}
			excludeMetrics={excludeMetrics}
			appendMetrics={appendMetrics}
			pathname={pathname}
			refreshedAt={refreshedAt}
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
	endTime?: number;
	cap?: boolean;
	defaultCap?: boolean;
	pathname: string;
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
	endTime,
	cap = false,
	defaultCap = false,
	pathname,
}: AnalyticsSectionProps) {
	const Heading = headingLevel;
	const refreshedAt = new Date();
	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-col gap-1">
					<Heading className="text-xl font-medium text-foreground/90 sm:text-2xl">
						{title}
					</Heading>
					{description ? (
						<p className="text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
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
			</div>

			<Suspense
				key={`kpi-${range}-${view}-${resolution}`}
				fallback={<AnalyticsKpiStripFallback excludeMetrics={excludeMetrics} />}
			>
				<KpiLoader fetchers={fetchers} excludeMetrics={excludeMetrics} />
			</Suspense>

			<Suspense
				key={`charts-${range}-${view}-${resolution}-${cap ? "cap" : "all"}`}
				fallback={
					<AnalyticsChartsGridFallback
						view={view}
						excludeMetrics={excludeMetrics}
						appendMetrics={appendMetrics}
						pathname={pathname}
						refreshedAt={refreshedAt}
					/>
				}
			>
				<ChartsLoader
					fetchers={fetchers}
					view={view}
					excludeMetrics={excludeMetrics}
					appendMetrics={appendMetrics}
					endTime={endTime}
					cap={cap}
					pathname={pathname}
					refreshedAt={refreshedAt}
				/>
			</Suspense>
		</div>
	);
}
