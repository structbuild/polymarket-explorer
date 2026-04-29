import "server-only";

import type { BuilderMetadataInline, BuilderTimeframe, CompositionBucketRow } from "@structbuild/sdk";

import { getBuilderComposition } from "@/lib/struct/builder-queries";
import { getBuilderDisplayName } from "@/lib/builder-display-name";
import {
	BUILDERS_STACKED_API_METRICS,
	DEFAULT_BUILDERS_STACKED_METRIC,
	OTHER_SLOT,
	fieldKey,
	type BuildersStackedData,
	type BuildersStackedDatum,
	type BuildersStackedMetric,
	type BuildersStackedMetricData,
	type BuildersStackedSlot,
} from "@/lib/struct/builders-stacked-shared";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";

function formatSlotLabel(code: string, metadataByCode: Record<string, BuilderMetadataInline>): string {
	return getBuilderDisplayName(code, metadataByCode[code] ?? null);
}

const RESOLUTION_SECONDS: Partial<Record<AnalyticsResolution, number>> = {
	"60": 3600,
	"240": 14400,
	D: 86400,
	W: 604800,
};

const TIMEFRAME_SECONDS: Partial<Record<BuilderTimeframe, number>> = {
	"1d": 86400,
	"7d": 7 * 86400,
	"30d": 30 * 86400,
};

const ALL_COUNT_BACK: Record<AnalyticsResolution, number> = {
	"60": 500,
	"240": 500,
	D: 500,
	W: 260,
	M: 120,
};

function computeCompositionCountBack(
	timeframe: BuilderTimeframe,
	resolution: AnalyticsResolution,
): number {
	if (timeframe === "lifetime") return ALL_COUNT_BACK[resolution];
	const timeframeSeconds = TIMEFRAME_SECONDS[timeframe];
	const resolutionSeconds = RESOLUTION_SECONDS[resolution];
	if (!timeframeSeconds || !resolutionSeconds) return 30;
	return Math.ceil(timeframeSeconds / resolutionSeconds);
}

function getCompositionWindow(
	timeframe: BuilderTimeframe,
	resolution: AnalyticsResolution,
	countBack: number,
): { from: number; to: number } | null {
	if (timeframe === "lifetime") return null;
	const resolutionSeconds = RESOLUTION_SECONDS[resolution];
	if (!resolutionSeconds) return null;

	const nowSeconds = Math.floor(Date.now() / 1000);
	const to = Math.floor(nowSeconds / resolutionSeconds) * resolutionSeconds;
	const from = to - Math.max(countBack - 1, 0) * resolutionSeconds;

	return { from, to };
}

export async function getBuildersStackedData({
	timeframe,
	resolution,
	topN,
	metric = DEFAULT_BUILDERS_STACKED_METRIC,
}: {
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
	topN: number;
	metric?: BuildersStackedMetric;
}): Promise<BuildersStackedData> {
	const countBack = computeCompositionCountBack(timeframe, resolution);
	const window = getCompositionWindow(timeframe, resolution, countBack);
	const apiMetric = BUILDERS_STACKED_API_METRICS[metric];

	const { buckets: entries, builderMetadata } = await getBuilderComposition(
		apiMetric,
		resolution,
		countBack,
		topN,
		"delta",
		window?.from,
		window?.to,
	);

	const metricData = buildMetricData(metric, entries, topN, builderMetadata);

	return {
		...metricData,
		metric,
		range: timeframe === "lifetime" ? "all" : timeframe,
		resolution,
	};
}

function buildMetricData(
	metric: BuildersStackedMetric,
	entries: CompositionBucketRow[],
	topN: number,
	builderMetadata: Record<string, BuilderMetadataInline>,
): BuildersStackedMetricData {
	const slotsById = new Map<string, BuildersStackedSlot & { rank: number }>();
	const rowsByTimestamp = new Map<number, BuildersStackedDatum>();

	for (const entry of sortCompositionEntries(entries)) {
		const isOther = entry.code === OTHER_SLOT || entry.r === 0 || entry.r > topN;
		const slotId = isOther ? OTHER_SLOT : `rank-${entry.r}`;
		if (!slotsById.has(slotId)) {
			slotsById.set(slotId, {
				id: slotId,
				code: isOther ? null : entry.code,
				label: isOther ? "Other" : formatSlotLabel(entry.code, builderMetadata),
				rank: isOther ? topN + 1 : entry.r,
			});
		}
		const row = rowsByTimestamp.get(entry.t) ?? { t: entry.t };
		const key = fieldKey(slotId, metric);
		row[key] = (row[key] ?? 0) + readMetricValue(entry, metric);
		rowsByTimestamp.set(entry.t, row);
	}

	const slots = [...slotsById.values()]
		.sort((a, b) => a.rank - b.rank)
		.map((slot) => ({
			id: slot.id,
			code: slot.code,
			label: slot.label,
		}));
	const data = [...rowsByTimestamp.values()].sort((a, b) => a.t - b.t);

	return { slots, data };
}

function sortCompositionEntries(entries: CompositionBucketRow[]): CompositionBucketRow[] {
	return [...entries].sort(
		(a, b) => a.t - b.t || a.r - b.r || a.code.localeCompare(b.code),
	);
}

function readMetricValue(entry: CompositionBucketRow, metric: BuildersStackedMetric): number {
	switch (metric) {
		case "volume":
			return entry.v;
		case "trades":
			return entry.tc;
		case "traders":
			return entry.ut;
		case "fees":
			return entry.f;
		case "builderFees":
			return entry.bf;
		case "newUsers":
			return entry.nu;
	}
}
