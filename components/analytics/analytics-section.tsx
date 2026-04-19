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
import { AnalyticsViewToggle } from "@/components/analytics/view-toggle";
import { summarizeAnalytics } from "@/lib/struct/analytics-queries";
import {
	applyAnalyticsCap,
	type AnalyticsMetricId,
	type AnalyticsPoint,
	type AnalyticsRange,
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
}: {
	fetchers: AnalyticsFetchers;
	view: AnalyticsView;
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	endTime?: number;
	cap?: boolean;
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
		/>
	);
}

type AnalyticsSectionProps = {
	title: string;
	description?: string;
	range: AnalyticsRange;
	view: AnalyticsView;
	fetchers: AnalyticsFetchers;
	headingLevel?: "h1" | "h2";
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	endTime?: number;
	cap?: boolean;
	defaultCap?: boolean;
};

export function AnalyticsSection({
	title,
	description,
	range,
	view,
	fetchers,
	headingLevel = "h2",
	excludeMetrics,
	appendMetrics,
	endTime,
	cap = false,
	defaultCap = false,
}: AnalyticsSectionProps) {
	const Heading = headingLevel;
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
					{view === "deltas" ? <AnalyticsRangeToggle range={range} /> : null}
					<AnalyticsViewToggle view={view} />
					{endTime !== undefined ? (
						<AnalyticsCapToggle cap={cap} defaultCap={defaultCap} />
					) : null}
				</div>
			</div>

			<Suspense
				key={`kpi-${range}-${view}`}
				fallback={<AnalyticsKpiStripFallback excludeMetrics={excludeMetrics} />}
			>
				<KpiLoader fetchers={fetchers} excludeMetrics={excludeMetrics} />
			</Suspense>

			<Suspense
				key={`charts-${range}-${view}-${cap ? "cap" : "all"}`}
				fallback={
					<AnalyticsChartsGridFallback
						view={view}
						excludeMetrics={excludeMetrics}
						appendMetrics={appendMetrics}
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
				/>
			</Suspense>
		</div>
	);
}
