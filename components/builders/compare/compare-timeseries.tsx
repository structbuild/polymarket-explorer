"use client";

import {
	AnalyticsChart,
	type AnalyticsValueFormat,
} from "@/components/analytics/analytics-chart";
import { Card, CardContent } from "@/components/ui/card";
import { formatVolumeValue } from "@/components/ui/volume";
import { COMPARE_ACTIVITY_METRICS } from "@/lib/builder-compare-activity";
import { useVolumeMode } from "@/lib/hooks/use-volume-mode";
import type { CompareActivity } from "@/lib/struct/builder-compare";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";

type CompareTimeseriesProps = {
	activity: CompareActivity;
	resolution: AnalyticsResolution;
};

export function CompareTimeseries({ activity, resolution }: CompareTimeseriesProps) {
	const { mode } = useVolumeMode();

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{COMPARE_ACTIVITY_METRICS.map((metric) => {
				const useNotional = Boolean(metric.isVolume) && mode === "notional";
				const series = useNotional ? activity.volumeShares : activity.byMetric[metric.id];
				const valueFormat: AnalyticsValueFormat =
					metric.format === "currency" ? "currency" : "count";
				const formatValue = useNotional
					? (value: number) => formatVolumeValue("notional", value, value, { compact: true })
					: undefined;
				const hasData = series.data.length > 0 && series.series.length > 0;
				const label = useNotional ? "Volume (notional)" : metric.label;

				return (
					<Card key={metric.id} variant="analytics">
						<CardContent className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
							{hasData ? (
								<AnalyticsChart
									data={series.data}
									variant="area"
									series={series.series}
									valueFormat={valueFormat}
									formatValue={formatValue}
									interactiveLegend
									resolution={resolution}
								/>
							) : (
								<div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground sm:h-[300px]">
									No activity in this window.
								</div>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
