"use client";

import { useCallback } from "react";

import {
	AnalyticsChart,
	type AnalyticsSeries,
} from "@/components/analytics/analytics-chart";
import { formatVolumeValue } from "@/components/ui/volume";
import { useVolumeMode } from "@/lib/hooks/use-volume-mode";
import type { AnalyticsResolution, AnalyticsView } from "@/lib/struct/analytics-shared";

type VolumeChartDatum = { t: number } & Record<string, number>;

type VolumeAnalyticsChartProps = {
	data: VolumeChartDatum[];
	usdSeries: AnalyticsSeries[];
	notionalSeries: AnalyticsSeries[];
	variant: "area" | "bar";
	interactiveLegend?: boolean;
	resolution?: AnalyticsResolution;
	view: AnalyticsView;
	showIncomplete?: boolean;
};

export function VolumeAnalyticsChart({
	data,
	usdSeries,
	notionalSeries,
	variant,
	interactiveLegend,
	resolution,
	view,
	showIncomplete,
}: VolumeAnalyticsChartProps) {
	const { mode } = useVolumeMode();

	const series = mode === "notional" ? notionalSeries : usdSeries;

	const formatValue = useCallback(
		(value: number) => formatVolumeValue(mode, value, value, { compact: true }),
		[mode],
	);

	return (
		<AnalyticsChart
			key={mode}
			data={data}
			variant={variant}
			series={series}
			valueFormat="currency"
			formatValue={formatValue}
			interactiveLegend={interactiveLegend}
			resolution={resolution}
			labelMode={view === "deltas" ? "bucket" : "point"}
			showIncomplete={showIncomplete}
		/>
	);
}
