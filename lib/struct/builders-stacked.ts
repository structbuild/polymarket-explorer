import "server-only";

import type { BuilderSortBy, BuilderTimeframe, CompositionBucketRow } from "@structbuild/sdk";

import { getBuilderComposition } from "@/lib/struct/builder-queries";
import {
	BUILDERS_STACKED_METRICS,
	OTHER_SLOT,
	fieldKey,
	type BuildersStackedData,
	type BuildersStackedDatum,
	type BuildersStackedMetric,
	type BuildersStackedMetricData,
	type BuildersStackedSlot,
} from "@/lib/struct/builders-stacked-shared";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";

function truncateCode(code: string, length = 4): string {
	const trimmed = code.trim();
	if (!trimmed.startsWith("0x") || trimmed.length <= length * 2 + 2) return trimmed;
	return `${trimmed.slice(0, length + 2)}…${trimmed.slice(-length)}`;
}

function formatSlotLabel(code: string): string {
	return truncateCode(code);
}

const COMPOSITION_METRIC: Record<BuildersStackedMetric, BuilderSortBy> = {
	volume: "volume",
	trades: "txns",
	traders: "traders",
	fees: "fees",
	builderFees: "builder_fees",
	newUsers: "new_users",
};

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

export async function getBuildersStackedData({
	timeframe,
	resolution,
	topN,
}: {
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
	topN: number;
}): Promise<BuildersStackedData> {
	const countBack = computeCompositionCountBack(timeframe, resolution);

	const entriesByMetric = await Promise.all(
		BUILDERS_STACKED_METRICS.map((metric) =>
			getBuilderComposition(COMPOSITION_METRIC[metric], resolution, countBack, topN, "delta"),
		),
	);

	const byMetric = Object.fromEntries(
		BUILDERS_STACKED_METRICS.map((metric, idx) => [
			metric,
			buildMetricData(metric, entriesByMetric[idx] ?? [], topN),
		]),
	) as Record<BuildersStackedMetric, BuildersStackedMetricData>;

	return { byMetric, range: timeframe === "lifetime" ? "all" : timeframe, resolution };
}

function buildMetricData(
	metric: BuildersStackedMetric,
	entries: CompositionBucketRow[],
	topN: number,
): BuildersStackedMetricData {
	const slotsById = new Map<string, BuildersStackedSlot & { rank: number }>();
	const rowsByTimestamp = new Map<number, BuildersStackedDatum>();

	for (const entry of entries) {
		const isOther = entry.code === OTHER_SLOT || entry.r === 0 || entry.r > topN;
		const slotId = isOther ? OTHER_SLOT : `rank-${entry.r}`;
		if (!slotsById.has(slotId)) {
			slotsById.set(slotId, {
				id: slotId,
				code: isOther ? null : entry.code,
				label: isOther ? "Other" : formatSlotLabel(entry.code),
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
