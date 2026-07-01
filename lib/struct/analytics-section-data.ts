import "server-only";

import type { AnalyticsMetricPctChange } from "@structbuild/sdk";

import { projectAnalyticsPoints, type AnalyticsProjectionOptions } from "@/lib/struct/analytics-projection";
import {
	getAnalyticsChanges,
	getAnalyticsDeltas,
	getAnalyticsTimeseries,
	getBuilderGlobalAnalyticsChanges,
	getBuilderGlobalAnalyticsDeltas,
	getBuilderGlobalAnalyticsTimeseries,
	getBuilderAnalyticsChanges,
	getBuilderAnalyticsDeltas,
	getBuilderAnalyticsTimeseries,
	getMarketAnalyticsChanges,
	getMarketAnalyticsDeltas,
	getMarketAnalyticsTimeseries,
	getTagAnalyticsChanges,
	getTagAnalyticsDeltas,
	getTagAnalyticsTimeseries,
	getTraderAnalyticsChanges,
	getTraderAnalyticsDeltas,
	getTraderAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import type {
	AnalyticsPoint,
	AnalyticsQuerySource,
	AnalyticsRange,
	AnalyticsResolution,
	AnalyticsView,
} from "@/lib/struct/analytics-shared";

export type AnalyticsSectionData = {
	view: AnalyticsView;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	chartPoints: AnalyticsPoint[];
	kpiPoints: AnalyticsPoint[] | null;
	changes: AnalyticsMetricPctChange | null;
};

type AnalyticsLoaders = {
	deltas: () => Promise<AnalyticsPoint[]>;
	timeseries: () => Promise<AnalyticsPoint[]>;
	changes: () => Promise<AnalyticsMetricPctChange | null>;
};

function getAnalyticsLoaders(
	source: AnalyticsQuerySource,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): AnalyticsLoaders {
	switch (source.kind) {
		case "builderGlobal":
			return {
				deltas: () => getBuilderGlobalAnalyticsDeltas(range, resolution),
				timeseries: () => getBuilderGlobalAnalyticsTimeseries(range, resolution),
				changes: () => getBuilderGlobalAnalyticsChanges(range),
			};
		case "market":
			return {
				deltas: () => getMarketAnalyticsDeltas(source.conditionId, range, resolution),
				timeseries: () => getMarketAnalyticsTimeseries(source.conditionId, range, resolution),
				changes: () => getMarketAnalyticsChanges(source.conditionId, range),
			};
		case "tag":
			return {
				deltas: () => getTagAnalyticsDeltas(source.tag, range, resolution),
				timeseries: () => getTagAnalyticsTimeseries(source.tag, range, resolution),
				changes: () => getTagAnalyticsChanges(source.tag, range),
			};
		case "trader":
			return {
				deltas: () => getTraderAnalyticsDeltas(source.address, range, resolution),
				timeseries: () => getTraderAnalyticsTimeseries(source.address, range, resolution),
				changes: () => getTraderAnalyticsChanges(source.address, range),
			};
		case "builder":
			return {
				deltas: () => getBuilderAnalyticsDeltas(source.code, range, resolution),
				timeseries: () => getBuilderAnalyticsTimeseries(source.code, range, resolution),
				changes: () => getBuilderAnalyticsChanges(source.code, range),
			};
		case "global":
		default:
			return {
				deltas: () => getAnalyticsDeltas(range, resolution),
				timeseries: () => getAnalyticsTimeseries(range, resolution),
				changes: () => getAnalyticsChanges(range),
			};
	}
}

export async function loadAnalyticsSectionData({
	source,
	range,
	resolution,
	view,
	showKpis,
	projection,
}: {
	source: AnalyticsQuerySource;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	view: AnalyticsView;
	showKpis: boolean;
	projection?: AnalyticsProjectionOptions;
}): Promise<AnalyticsSectionData> {
	const loaders = getAnalyticsLoaders(source, range, resolution);
	const deltasPromise = view === "deltas" || showKpis ? loaders.deltas() : null;
	const chartPromise = view === "cumulative" ? loaders.timeseries() : deltasPromise!;

	const [chartPoints, kpiPoints, changes] = await Promise.all([
		chartPromise,
		showKpis ? deltasPromise! : Promise.resolve(null),
		showKpis ? loaders.changes() : Promise.resolve(null),
	]);

	const projectionOptions = projection ?? { showKpis };
	const compactChartPoints = projectAnalyticsPoints(chartPoints, projectionOptions);
	const compactKpiPoints = kpiPoints ? projectAnalyticsPoints(kpiPoints, projectionOptions) : null;

	return {
		view,
		range,
		resolution,
		chartPoints: compactChartPoints,
		kpiPoints: compactKpiPoints,
		changes,
	};
}
