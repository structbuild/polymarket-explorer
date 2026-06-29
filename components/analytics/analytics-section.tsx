import { Suspense } from "react";

import { AnalyticsChartsGridFallback, type AnalyticsMetricPlacement } from "@/components/analytics/analytics-charts-grid";
import { AnalyticsKpiStripFallback } from "@/components/analytics/analytics-kpi-strip";
import { AnalyticsSectionClient } from "@/components/analytics/analytics-section-client";
import { loadAnalyticsSectionData } from "@/lib/struct/analytics-section-data";
import {
	DEFAULT_ANALYTICS_RANGE,
	type AnalyticsMetricId,
	type AnalyticsQuerySource,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsView,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

type AnalyticsSectionProps = {
	title?: string;
	description?: string;
	range: AnalyticsRange;
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	defaultResolution: AnalyticsResolution;
	defaultRange?: AnalyticsRange;
	source: AnalyticsQuerySource;
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

async function AnalyticsSectionLoader({
	title,
	description,
	range,
	view,
	resolution,
	defaultRange = DEFAULT_ANALYTICS_RANGE,
	source,
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
	const initialData = await loadAnalyticsSectionData({
		source,
		range,
		resolution,
		view,
		showKpis,
		projection: {
			excludeMetrics,
			appendMetrics,
			showKpis,
			allowedComponents,
		},
	});

	return (
		<AnalyticsSectionClient
			initialData={initialData}
			source={source}
			title={title}
			description={description}
			defaultRange={defaultRange}
			headingLevel={headingLevel}
			excludeMetrics={excludeMetrics}
			appendMetrics={appendMetrics}
			metricPlacements={metricPlacements}
			endTime={endTime}
			initialCap={cap}
			defaultCap={defaultCap}
			allowedComponents={allowedComponents}
			pathname={pathname}
			showControls={showControls}
			showKpis={showKpis}
			refreshedAt={new Date().toISOString()}
		/>
	);
}

function AnalyticsSectionFallback({
	title,
	view,
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	pathname,
	showKpis = true,
}: Pick<
	AnalyticsSectionProps,
	"title" | "view" | "excludeMetrics" | "appendMetrics" | "metricPlacements" | "pathname" | "showKpis"
>) {
	return (
		<div className="space-y-6 sm:space-y-8">
			{title ? <div className="h-6 w-32 animate-pulse rounded bg-muted" /> : null}
			{showKpis ? <AnalyticsKpiStripFallback excludeMetrics={excludeMetrics} /> : null}
			<AnalyticsChartsGridFallback
				view={view}
				excludeMetrics={excludeMetrics}
				appendMetrics={appendMetrics}
				metricPlacements={metricPlacements}
				pathname={pathname}
				refreshedAt={new Date()}
			/>
		</div>
	);
}

export function AnalyticsSection(props: AnalyticsSectionProps) {
	return (
		<Suspense fallback={<AnalyticsSectionFallback {...props} />}>
			<AnalyticsSectionLoader {...props} />
		</Suspense>
	);
}
