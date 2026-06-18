import "server-only";

import type {
	BuilderFeeRate,
	BuilderLatestRowWithMetadata,
	BuilderTagRow,
	BuilderTimeframe,
	ConcentrationResponse,
} from "@structbuild/sdk";

import type { AnalyticsSeries } from "@/components/analytics/analytics-chart";
import { getBuilderDisplayName } from "@/lib/builder-display-name";
import {
	COMPARE_ACTIVITY_METRICS,
} from "@/lib/builder-compare-activity";
import { buildBuilderColorMap } from "@/lib/builder-compare-colors";
import {
	getBuilderByCode,
	getBuilderConcentration,
	getBuilderFees,
	getBuildersPaginated,
	getBuilderTags,
} from "@/lib/struct/builder-queries";
import { getBuilderAnalyticsDeltas } from "@/lib/struct/analytics-queries";
import {
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
	getDefaultResolution,
} from "@/lib/struct/analytics-shared";

export type CompareBuilder = {
	code: string;
	seriesKey: string;
	displayName: string;
	color: string;
	row: BuilderLatestRowWithMetadata;
	fees: BuilderFeeRate | null;
	concentration: ConcentrationResponse | null;
	tags: BuilderTagRow[];
};

export type CompareTimeseriesDatum = { t: number } & Record<string, number>;

export type CompareTimeseries = {
	data: CompareTimeseriesDatum[];
	series: AnalyticsSeries[];
};

export type CompareActivity = {
	byMetric: Record<string, CompareTimeseries>;
	volumeShares: CompareTimeseries;
};

export type BuilderCompareResult = {
	builders: CompareBuilder[];
	missing: string[];
	resolution: AnalyticsResolution;
	activity: CompareActivity;
};

function timeframeToRange(timeframe: BuilderTimeframe): AnalyticsRange {
	return timeframe === "lifetime" ? "all" : timeframe;
}

export type CompareCandidateBuilder = {
	builder_code: string;
	name: string | null;
	icon_url: string | null;
};

export async function getCompareCandidateBuilders(
	timeframe: BuilderTimeframe,
	limit = 50,
): Promise<CompareCandidateBuilder[]> {
	const result = await getBuildersPaginated(Math.max(limit * 2, 100), 0, "volume", timeframe);
	const candidates: CompareCandidateBuilder[] = [];
	for (const row of result.data) {
		const name = row.metadata?.name?.trim();
		if (!name) continue;
		candidates.push({
			builder_code: row.builder_code,
			name,
			icon_url: row.metadata?.icon_url ?? null,
		});
		if (candidates.length >= limit) break;
	}
	return candidates;
}

type TimeseriesEntry = {
	key: string;
	label: string;
	color: string;
	points: AnalyticsPoint[];
};

function buildTimeseries(
	entries: TimeseriesEntry[],
	selector: (point: AnalyticsPoint) => number,
): CompareTimeseries {
	const byTimestamp = new Map<number, CompareTimeseriesDatum>();
	for (const entry of entries) {
		for (const point of entry.points) {
			let datum = byTimestamp.get(point.t);
			if (!datum) {
				datum = { t: point.t };
				byTimestamp.set(point.t, datum);
			}
			datum[entry.key] = selector(point);
		}
	}
	const data = Array.from(byTimestamp.values()).sort((a, b) => a.t - b.t);
	const series: AnalyticsSeries[] = entries.map((entry) => ({
		key: entry.key,
		label: entry.label,
		color: entry.color,
	}));
	return { data, series };
}

export async function loadBuilderCompare(input: {
	codes: string[];
	timeframe: BuilderTimeframe;
}): Promise<BuilderCompareResult> {
	const { codes, timeframe } = input;
	const range = timeframeToRange(timeframe);
	const resolution: AnalyticsResolution = getDefaultResolution(range, "scoped");
	const colorMap = buildBuilderColorMap(codes);

	const loaded = await Promise.all(
		codes.map(async (code) => {
			const [row, fees, concentration, tags, points] = await Promise.all([
				getBuilderByCode(code, timeframe),
				getBuilderFees(code),
				getBuilderConcentration(code, timeframe),
				getBuilderTags(code, "volume", timeframe, 12),
				getBuilderAnalyticsDeltas(code, range, resolution),
			]);
			return { code, row, fees, concentration, tags, points };
		}),
	);

	const builders: CompareBuilder[] = [];
	const missing: string[] = [];
	const timeseriesEntries: TimeseriesEntry[] = [];

	for (const item of loaded) {
		if (!item.row) {
			missing.push(item.code);
			continue;
		}
		const displayName = getBuilderDisplayName(item.code, item.row.metadata);
		const color = colorMap[item.code];
		const seriesKey = `b${builders.length}`;
		builders.push({
			code: item.code,
			seriesKey,
			displayName,
			color,
			row: item.row,
			fees: item.fees,
			concentration: item.concentration,
			tags: item.tags,
		});
		timeseriesEntries.push({ key: seriesKey, label: displayName, color, points: item.points });
	}

	const byMetric: Record<string, CompareTimeseries> = {};
	for (const metric of COMPARE_ACTIVITY_METRICS) {
		byMetric[metric.id] = buildTimeseries(timeseriesEntries, metric.selector);
	}

	const activity: CompareActivity = {
		byMetric,
		volumeShares: buildTimeseries(timeseriesEntries, (point) => point.sharesVolume),
	};

	return { builders, missing, resolution, activity };
}
