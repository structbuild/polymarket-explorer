"use client";

import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import type { AnalyticsView, AnalyticsResolution } from "@/lib/struct/analytics-shared";
import type {
	ComboAnalyticsPoint,
	ComboChartMetric,
} from "@/lib/struct/combo-analytics-shared";

type ComboAnalyticsChartProps = {
	metric: ComboChartMetric;
	view: AnalyticsView;
	points: ComboAnalyticsPoint[];
	resolution: AnalyticsResolution;
};

export function ComboAnalyticsChart({
	metric,
	view,
	points,
	resolution,
}: ComboAnalyticsChartProps) {
	const cumulative = view === "cumulative";
	return (
		<AnalyticsChart
			data={points}
			variant={cumulative ? "area" : "bar"}
			series={metric.series}
			valueFormat={metric.valueFormat}
			resolution={resolution}
			labelMode="bucket"
			interactiveLegend={metric.series.length > 1}
			showIncomplete={!cumulative}
		/>
	);
}
