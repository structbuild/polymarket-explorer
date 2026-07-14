import "server-only";

import { cache } from "react";

import type {
	ComboGlobalAnalyticsChanges,
	ComboGlobalAnalyticsCountsResponse,
} from "@structbuild/sdk";

import {
	comboChangesTimeframe,
	computeComboCountBack,
	toComboAnalyticsPoint,
	type ComboAnalyticsPoint,
} from "@/lib/struct/combo-analytics-shared";
import type {
	AnalyticsRange,
	AnalyticsResolution,
	AnalyticsView,
} from "@/lib/struct/analytics-shared";
import {
	getComboAnalyticsChanges,
	getComboAnalyticsCounts,
	getComboAnalyticsDeltas,
	getComboAnalyticsTimeseries,
} from "@/lib/struct/queries/combos";

export type ComboAnalyticsSectionData = {
	view: AnalyticsView;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	counts: ComboGlobalAnalyticsCountsResponse | null;
	changes: ComboGlobalAnalyticsChanges | null;
	deltas: ComboAnalyticsPoint[];
	timeseries: ComboAnalyticsPoint[];
};

const loadComboAnalyticsSectionDataCached = cache(
	async (
		view: AnalyticsView,
		range: AnalyticsRange,
		resolution: AnalyticsResolution,
	): Promise<ComboAnalyticsSectionData> => {
		const countBack = computeComboCountBack(range, resolution);

		const [counts, changes, deltas, timeseries] = await Promise.all([
			getComboAnalyticsCounts(),
			getComboAnalyticsChanges(comboChangesTimeframe(range)),
			getComboAnalyticsDeltas(resolution, countBack),
			view === "cumulative"
				? getComboAnalyticsTimeseries(resolution, countBack)
				: Promise.resolve([]),
		]);

		return {
			view,
			range,
			resolution,
			counts,
			changes,
			deltas: deltas.map(toComboAnalyticsPoint),
			timeseries: timeseries.map(toComboAnalyticsPoint),
		};
	},
);

export function loadComboAnalyticsSectionData({
	view,
	range,
	resolution,
}: {
	view: AnalyticsView;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
}): Promise<ComboAnalyticsSectionData> {
	return loadComboAnalyticsSectionDataCached(view, range, resolution);
}
