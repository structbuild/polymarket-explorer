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
	type AnalyticsView,
	type VolumeComponentId,
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
	showIncomplete?: boolean;
};

export function AvgTradeSizeChart({ points, view, showIncomplete }: Props) {
	const [components] = useAvgTradeSizeComponents();

	const data = useMemo(() => {
		let cumVol = 0;
		let cumCnt = 0;
		return points.map((p) => {
			let vol = 0;
			let cnt = 0;
			for (const c of components) {
				vol += p[COMPONENT_VOLUME_KEYS[c]] as number;
				cnt += p[COMPONENT_COUNT_KEYS[c]] as number;
			}
			if (view === "cumulative") {
				cumVol += vol;
				cumCnt += cnt;
				return { t: p.t, avgTradeSize: cumCnt > 0 ? cumVol / cumCnt : 0 };
			}
			return { t: p.t, avgTradeSize: cnt > 0 ? vol / cnt : 0 };
		});
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
			showIncomplete={showIncomplete}
		/>
	);
}
