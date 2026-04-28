"use client";

import { useMemo } from "react";

import {
	AnalyticsChart,
	type AnalyticsSeries,
} from "@/components/analytics/analytics-chart";
import { useAvgTradeSizeComponents } from "@/lib/hooks/use-avg-trade-size-components";
import {
	VOLUME_COMPONENT_LABELS,
	type AnalyticsPoint,
	type AnalyticsResolution,
	type AnalyticsView,
	type VolumeComponentId,
	VOLUME_COMPONENT_IDS,
} from "@/lib/struct/analytics-shared";

const COMPONENT_VOLUME_KEYS: Record<VolumeComponentId, keyof AnalyticsPoint> = {
	buy: "buyVolumeUsd",
	sell: "sellVolumeUsd",
	redeem: "redemptionVolumeUsd",
	merge: "mergeVolumeUsd",
	split: "splitVolumeUsd",
};

const COMPONENT_COUNT_KEYS: Record<VolumeComponentId, keyof AnalyticsPoint> = {
	buy: "buyCount",
	sell: "sellCount",
	redeem: "redemptionCount",
	merge: "mergeCount",
	split: "splitCount",
};

function buildSeriesLabel(components: readonly VolumeComponentId[]): string {
	if (components.length === 0) return "Avg trade size";
	return components.map((c) => VOLUME_COMPONENT_LABELS[c]).join(" + ");
}

type Props = {
	points: AnalyticsPoint[];
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	showIncomplete?: boolean;
	allowedComponents?: readonly VolumeComponentId[];
};

export function AvgTradeSizeChart({
	points,
	view,
	resolution,
	showIncomplete,
	allowedComponents = VOLUME_COMPONENT_IDS,
}: Props) {
	const [storedComponents] = useAvgTradeSizeComponents();
	const components = useMemo(() => {
		const selected = storedComponents.filter((component) =>
			allowedComponents.includes(component),
		);
		return selected.length > 0 ? selected : allowedComponents;
	}, [storedComponents, allowedComponents]);

	const data = useMemo(() => {
		if (view !== "cumulative") {
			return points.map((p) => {
				let vol = 0;
				let cnt = 0;
				for (const c of components) {
					vol += p[COMPONENT_VOLUME_KEYS[c]] as number;
					cnt += p[COMPONENT_COUNT_KEYS[c]] as number;
				}
				return { t: p.t, avgTradeSize: cnt > 0 ? vol / cnt : 0 };
			});
		}

		let cumVol = 0;
		let cumCnt = 0;
		const cumulativeData: Array<{ t: number; avgTradeSize: number }> = [];
		for (const p of points) {
			let vol = 0;
			let cnt = 0;
			for (const c of components) {
				vol += p[COMPONENT_VOLUME_KEYS[c]] as number;
				cnt += p[COMPONENT_COUNT_KEYS[c]] as number;
			}
			cumVol += vol;
			cumCnt += cnt;
			cumulativeData.push({ t: p.t, avgTradeSize: cumCnt > 0 ? cumVol / cumCnt : 0 });
		}
		return cumulativeData;
	}, [points, components, view]);

	const series = useMemo<AnalyticsSeries[]>(
		() => [
			{
				key: "avgTradeSize",
				label: buildSeriesLabel(components),
				color: "var(--chart-2)",
			},
		],
		[components],
	);

	return (
		<AnalyticsChart
			data={data}
			variant="area"
			series={series}
			valueFormat="currency"
			resolution={resolution}
			labelMode={view === "deltas" ? "bucket" : "point"}
			showIncomplete={showIncomplete}
		/>
	);
}
