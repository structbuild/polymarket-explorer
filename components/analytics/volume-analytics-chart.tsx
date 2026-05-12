"use client";

import { useCallback, useMemo } from "react";

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
	variant: "area" | "bar";
	interactiveLegend?: boolean;
	resolution?: AnalyticsResolution;
	view: AnalyticsView;
	showIncomplete?: boolean;
};

const NOTIONAL_COLOR = "var(--chart-2)";

export function VolumeAnalyticsChart({
	data,
	usdSeries,
	variant,
	interactiveLegend,
	resolution,
	view,
	showIncomplete,
}: VolumeAnalyticsChartProps) {
	const { mode } = useVolumeMode();

	const series = useMemo<AnalyticsSeries[]>(() => {
		if (mode === "notional") {
			return [{ key: "sharesVolume", label: "Notional", color: NOTIONAL_COLOR }];
		}
		return usdSeries;
	}, [mode, usdSeries]);

	const effectiveVariant = mode === "notional" ? "area" : variant;
	const effectiveLegend = mode === "notional" ? false : interactiveLegend;

	const formatValue = useCallback(
		(value: number) => formatVolumeValue(mode, value, value, { compact: true }),
		[mode],
	);

	return (
		<AnalyticsChart
			data={data}
			variant={effectiveVariant}
			series={series}
			valueFormat="currency"
			formatValue={formatValue}
			interactiveLegend={effectiveLegend}
			resolution={resolution}
			labelMode={view === "deltas" ? "bucket" : "point"}
			showIncomplete={showIncomplete}
		/>
	);
}
