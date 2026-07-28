import { ComboAnalyticsChart } from "@/components/combos/combo-analytics-chart";
import { ChartCard } from "@/components/market/chart-card";
import type { AnalyticsResolution, AnalyticsView } from "@/lib/struct/analytics-shared";
import {
	COMBO_CHART_METRICS,
	type ComboAnalyticsPoint,
	type ComboChartMetric,
} from "@/lib/struct/combo-analytics-shared";

type ComboAnalyticsGridProps = {
	view: AnalyticsView;
	deltas: ComboAnalyticsPoint[];
	timeseries: ComboAnalyticsPoint[];
	resolution: AnalyticsResolution;
};

function hasData(metric: ComboChartMetric, points: ComboAnalyticsPoint[]): boolean {
	return metric.series.some((s) => points.some((p) => (p[s.key] ?? 0) !== 0));
}

export function ComboAnalyticsGrid({
	view,
	deltas,
	timeseries,
	resolution,
}: ComboAnalyticsGridProps) {
	const points = view === "cumulative" ? timeseries : deltas;
	const metrics = COMBO_CHART_METRICS.filter((metric) => hasData(metric, points));

	if (metrics.length === 0) {
		return null;
	}

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{metrics.map((metric, index) => (
				<ChartCard
					key={metric.id}
					title={metric.title}
					tooltip={metric.description}
					className={index === 0 ? "lg:col-span-2" : undefined}
				>
					<ComboAnalyticsChart
						metric={metric}
						view={view}
						points={points}
						resolution={resolution}
					/>
				</ChartCard>
			))}
		</div>
	);
}
