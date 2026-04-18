import "server-only";

import type {
	AnalyticsResolution,
	ChangeTimeframe,
	MetricPctChange,
	TimeBucketRow,
} from "@structbuild/sdk";
import { HttpError } from "@structbuild/sdk";
import type { HttpResponse } from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import {
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsSummary,
} from "@/lib/struct/analytics-shared";

type RangeConfig = {
	resolution: AnalyticsResolution;
	countBack: number;
	revalidateSeconds: number;
};

export const RANGE_CONFIG: Record<AnalyticsRange, RangeConfig> = {
	"1d": { resolution: "60", countBack: 24, revalidateSeconds: 120 },
	"7d": { resolution: "240", countBack: 42, revalidateSeconds: 300 },
	"30d": { resolution: "D", countBack: 30, revalidateSeconds: 600 },
	all: { resolution: "D", countBack: 500, revalidateSeconds: 3600 },
};

const GLOBAL_RANGE_CONFIG: Record<AnalyticsRange, RangeConfig> = {
	...RANGE_CONFIG,
	all: { resolution: "W", countBack: 260, revalidateSeconds: 3600 },
};

const CHANGES_TIMEFRAME: Record<AnalyticsRange, ChangeTimeframe> = {
	"1d": "24h",
	"7d": "7d",
	"30d": "30d",
	all: "1y",
};

export const structAnalyticsDeltasCacheTag = "struct-analytics-deltas";
export const structAnalyticsChangesCacheTag = "struct-analytics-changes";
export const structAnalyticsTimeseriesCacheTag = "struct-analytics-timeseries";
export const structMarketAnalyticsDeltasCacheTag = "struct-market-analytics-deltas";
export const structMarketAnalyticsChangesCacheTag = "struct-market-analytics-changes";
export const structMarketAnalyticsTimeseriesCacheTag = "struct-market-analytics-timeseries";
export const structTagAnalyticsDeltasCacheTag = "struct-tag-analytics-deltas";
export const structTagAnalyticsChangesCacheTag = "struct-tag-analytics-changes";
export const structTagAnalyticsTimeseriesCacheTag = "struct-tag-analytics-timeseries";
export const structTraderAnalyticsDeltasCacheTag = "struct-trader-analytics-deltas";
export const structTraderAnalyticsChangesCacheTag = "struct-trader-analytics-changes";
export const structTraderAnalyticsTimeseriesCacheTag = "struct-trader-analytics-timeseries";

const MAX_PAGINATION_REQUESTS = 5;

function toNumber(value: number | undefined | null): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapRow(row: TimeBucketRow): AnalyticsPoint {
	return {
		t: row.t,
		volumeUsd: toNumber(row.v),
		buyVolumeUsd: toNumber(row.bv),
		sellVolumeUsd: toNumber(row.sv),
		redemptionVolumeUsd: toNumber(row.rv),
		mergeVolumeUsd: toNumber(row.mv),
		splitVolumeUsd: toNumber(row.spv),
		yesVolumeUsd: toNumber(row.yv),
		noVolumeUsd: toNumber(row.nv),
		uniqueTraders: toNumber(row.ut),
		txnCount: toNumber(row.tc),
		buyCount: toNumber(row.bc),
		sellCount: toNumber(row.sc),
		redemptionCount: toNumber(row.rc),
		mergeCount: toNumber(row.mc),
		splitCount: toNumber(row.sp),
		yesCount: toNumber(row.yc),
		noCount: toNumber(row.nc),
		feesUsd: toNumber(row.f),
		sharesVolume: toNumber(row.sh),
		buyDistUnder10: toNumber(row.bd_u10),
		buyDist10to100: toNumber(row.bd_100),
		buyDist100to1k: toNumber(row.bd_1k),
		buyDist1kTo10k: toNumber(row.bd_10k),
		buyDist10kTo50k: toNumber(row.bd_50k),
		buyDistOver50k: toNumber(row.bd_50p),
	};
}

function emptyPoint(t: number): AnalyticsPoint {
	return {
		t,
		volumeUsd: 0,
		buyVolumeUsd: 0,
		sellVolumeUsd: 0,
		redemptionVolumeUsd: 0,
		mergeVolumeUsd: 0,
		splitVolumeUsd: 0,
		yesVolumeUsd: 0,
		noVolumeUsd: 0,
		uniqueTraders: 0,
		txnCount: 0,
		buyCount: 0,
		sellCount: 0,
		redemptionCount: 0,
		mergeCount: 0,
		splitCount: 0,
		yesCount: 0,
		noCount: 0,
		feesUsd: 0,
		sharesVolume: 0,
		buyDistUnder10: 0,
		buyDist10to100: 0,
		buyDist100to1k: 0,
		buyDist1kTo10k: 0,
		buyDist10kTo50k: 0,
		buyDistOver50k: 0,
	};
}

const FIXED_RESOLUTION_SECONDS: Partial<Record<AnalyticsResolution, number>> = {
	"1": 60,
	"5": 300,
	"15": 900,
	"30": 1800,
	"60": 3600,
	"240": 14400,
	D: 86400,
	"1D": 86400,
	W: 604800,
	"1W": 604800,
};

type BucketFillMode = "zero" | "carryForward";

function pickFiller(mode: BucketFillMode, last: AnalyticsPoint | null, t: number): AnalyticsPoint {
	if (mode === "carryForward" && last) return { ...last, t };
	return emptyPoint(t);
}

function fillBuckets(
	points: AnalyticsPoint[],
	resolution: AnalyticsResolution,
	mode: BucketFillMode = "zero",
): AnalyticsPoint[] {
	if (points.length < 2) return points;
	const byT = new Map(points.map((p) => [p.t, p]));
	const start = points[0].t;
	const end = points[points.length - 1].t;
	const filled: AnalyticsPoint[] = [];

	const step = FIXED_RESOLUTION_SECONDS[resolution];
	if (step) {
		let last: AnalyticsPoint | null = null;
		for (let t = start; t <= end; t += step) {
			const existing = byT.get(t);
			if (existing) {
				filled.push(existing);
				last = existing;
			} else {
				filled.push(pickFiller(mode, last, t));
			}
		}
		return filled;
	}

	if (resolution === "M" || resolution === "1M") {
		const cursor = new Date(start * 1000);
		let last: AnalyticsPoint | null = null;
		while (true) {
			const t = Math.floor(cursor.getTime() / 1000);
			if (t > end) break;
			const existing = byT.get(t);
			if (existing) {
				filled.push(existing);
				last = existing;
			} else {
				filled.push(pickFiller(mode, last, t));
			}
			cursor.setUTCMonth(cursor.getUTCMonth() + 1);
		}
		return filled;
	}

	return points;
}

type TimeBucketsPageParams = {
	resolution: AnalyticsResolution;
	count_back: number;
	to?: number;
};

async function fetchTimeBucketsWithPagination<Extra extends object>(
	fetchPage: (
		params: Extra & TimeBucketsPageParams,
	) => Promise<HttpResponse<TimeBucketRow[]>>,
	extraParams: Extra,
	range: AnalyticsRange,
	label: string,
	configMap: Record<AnalyticsRange, RangeConfig> = RANGE_CONFIG,
	fillMode: BucketFillMode = "zero",
): Promise<AnalyticsPoint[]> {
	const config = configMap[range];
	const collected: AnalyticsPoint[] = [];
	const seenTimestamps = new Set<number>();
	let to: number | undefined;
	let requests = 0;

	while (requests < MAX_PAGINATION_REQUESTS) {
		let envelope;
		try {
			envelope = await fetchPage({
				...extraParams,
				resolution: config.resolution,
				count_back: config.countBack,
				to,
			});
		} catch (error) {
			if (collected.length === 0) throw error;
			console.warn(
				`${label}:${range} pagination stopped at request ${requests + 1}`,
				error,
			);
			break;
		}

		const rows = envelope.data ?? [];
		let oldestThisRequest: number | null = null;
		for (const row of rows) {
			if (seenTimestamps.has(row.t)) continue;
			seenTimestamps.add(row.t);
			collected.push(mapRow(row));
			if (oldestThisRequest === null || row.t < oldestThisRequest) {
				oldestThisRequest = row.t;
			}
		}

		requests += 1;

		if (range !== "all") break;

		const hasMore = envelope.pagination?.has_more === true;
		if (!hasMore || rows.length === 0 || oldestThisRequest === null) break;
		to = oldestThisRequest - 1;
	}

	collected.sort((a, b) => a.t - b.t);
	return fillBuckets(collected, config.resolution, fillMode);
}

function handleDeltasError(label: string, error: unknown): AnalyticsPoint[] {
	if (error instanceof HttpError && error.status === 404) {
		return [];
	}
	const status = error instanceof HttpError ? error.status : "unknown";
	console.error(
		`${label} failed (status=${status})`,
		error instanceof Error ? error.message : error,
	);
	return [];
}

function handleChangesError(label: string, error: unknown): MetricPctChange | null {
	if (error instanceof HttpError && error.status === 404) {
		return null;
	}
	const status = error instanceof HttpError ? error.status : "unknown";
	console.error(
		`${label} failed (status=${status})`,
		error instanceof Error ? error.message : error,
	);
	return null;
}

export const getAnalyticsDeltas = cache(
	unstable_cache(
		async (range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getDeltas(params),
					{},
					range,
					"getAnalyticsDeltas",
					GLOBAL_RANGE_CONFIG,
				);
			} catch (error) {
				return handleDeltasError(`getAnalyticsDeltas:${range}`, error);
			}
		},
		[structAnalyticsDeltasCacheTag, "v5"],
		{ revalidate: 300, tags: [structAnalyticsDeltasCacheTag] },
	),
);

export const getAnalyticsChanges = cache(
	unstable_cache(
		async (range: AnalyticsRange): Promise<MetricPctChange | null> => {
			const client = getStructClient();
			if (!client) return null;
			try {
				const response = await client.analytics.getChanges({
					timeframe: CHANGES_TIMEFRAME[range],
				});
				return response.data;
			} catch (error) {
				return handleChangesError(`getAnalyticsChanges:${range}`, error);
			}
		},
		[structAnalyticsChangesCacheTag, "v1"],
		{ revalidate: 300, tags: [structAnalyticsChangesCacheTag] },
	),
);

export const getMarketAnalyticsDeltas = cache(
	unstable_cache(
		async (conditionId: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getMarketDeltas(params),
					{ condition_id: conditionId },
					range,
					`getMarketAnalyticsDeltas:${conditionId}`,
				);
			} catch (error) {
				return handleDeltasError(
					`getMarketAnalyticsDeltas:${conditionId}:${range}`,
					error,
				);
			}
		},
		[structMarketAnalyticsDeltasCacheTag, "v4"],
		{ revalidate: 300, tags: [structMarketAnalyticsDeltasCacheTag] },
	),
);

export const getMarketAnalyticsChanges = cache(
	unstable_cache(
		async (
			conditionId: string,
			range: AnalyticsRange,
		): Promise<MetricPctChange | null> => {
			const client = getStructClient();
			if (!client) return null;
			try {
				const response = await client.analytics.getMarketChanges({
					condition_id: conditionId,
					timeframe: CHANGES_TIMEFRAME[range],
				});
				return response.data;
			} catch (error) {
				return handleChangesError(
					`getMarketAnalyticsChanges:${conditionId}:${range}`,
					error,
				);
			}
		},
		[structMarketAnalyticsChangesCacheTag, "v1"],
		{ revalidate: 300, tags: [structMarketAnalyticsChangesCacheTag] },
	),
);

export const getTagAnalyticsDeltas = cache(
	unstable_cache(
		async (tag: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getTagDeltas(params),
					{ tag },
					range,
					`getTagAnalyticsDeltas:${tag}`,
				);
			} catch (error) {
				return handleDeltasError(`getTagAnalyticsDeltas:${tag}:${range}`, error);
			}
		},
		[structTagAnalyticsDeltasCacheTag, "v4"],
		{ revalidate: 300, tags: [structTagAnalyticsDeltasCacheTag] },
	),
);

export const getTagAnalyticsChanges = cache(
	unstable_cache(
		async (tag: string, range: AnalyticsRange): Promise<MetricPctChange | null> => {
			const client = getStructClient();
			if (!client) return null;
			try {
				const response = await client.analytics.getTagChanges({
					tag,
					timeframe: CHANGES_TIMEFRAME[range],
				});
				return response.data;
			} catch (error) {
				return handleChangesError(`getTagAnalyticsChanges:${tag}:${range}`, error);
			}
		},
		[structTagAnalyticsChangesCacheTag, "v1"],
		{ revalidate: 300, tags: [structTagAnalyticsChangesCacheTag] },
	),
);

export const getTraderAnalyticsDeltas = cache(
	unstable_cache(
		async (address: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getTraderDeltas(params),
					{ address },
					range,
					`getTraderAnalyticsDeltas:${address}`,
				);
			} catch (error) {
				return handleDeltasError(
					`getTraderAnalyticsDeltas:${address}:${range}`,
					error,
				);
			}
		},
		[structTraderAnalyticsDeltasCacheTag, "v4"],
		{ revalidate: 300, tags: [structTraderAnalyticsDeltasCacheTag] },
	),
);

export const getTraderAnalyticsChanges = cache(
	unstable_cache(
		async (
			address: string,
			range: AnalyticsRange,
		): Promise<MetricPctChange | null> => {
			const client = getStructClient();
			if (!client) return null;
			try {
				const response = await client.analytics.getTraderChanges({
					address,
					timeframe: CHANGES_TIMEFRAME[range],
				});
				return response.data;
			} catch (error) {
				return handleChangesError(
					`getTraderAnalyticsChanges:${address}:${range}`,
					error,
				);
			}
		},
		[structTraderAnalyticsChangesCacheTag, "v1"],
		{ revalidate: 300, tags: [structTraderAnalyticsChangesCacheTag] },
	),
);

export const getAnalyticsTimeseries = cache(
	unstable_cache(
		async (range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getTimeseries(params),
					{},
					range,
					"getAnalyticsTimeseries",
					GLOBAL_RANGE_CONFIG,
					"carryForward",
				);
			} catch (error) {
				return handleDeltasError(`getAnalyticsTimeseries:${range}`, error);
			}
		},
		[structAnalyticsTimeseriesCacheTag, "v3"],
		{ revalidate: 300, tags: [structAnalyticsTimeseriesCacheTag] },
	),
);

export const getMarketAnalyticsTimeseries = cache(
	unstable_cache(
		async (conditionId: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getMarketTimeseries(params),
					{ condition_id: conditionId },
					range,
					`getMarketAnalyticsTimeseries:${conditionId}`,
					RANGE_CONFIG,
					"carryForward",
				);
			} catch (error) {
				return handleDeltasError(
					`getMarketAnalyticsTimeseries:${conditionId}:${range}`,
					error,
				);
			}
		},
		[structMarketAnalyticsTimeseriesCacheTag, "v3"],
		{ revalidate: 300, tags: [structMarketAnalyticsTimeseriesCacheTag] },
	),
);

export const getTagAnalyticsTimeseries = cache(
	unstable_cache(
		async (tag: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getTagTimeseries(params),
					{ tag },
					range,
					`getTagAnalyticsTimeseries:${tag}`,
					RANGE_CONFIG,
					"carryForward",
				);
			} catch (error) {
				return handleDeltasError(`getTagAnalyticsTimeseries:${tag}:${range}`, error);
			}
		},
		[structTagAnalyticsTimeseriesCacheTag, "v3"],
		{ revalidate: 300, tags: [structTagAnalyticsTimeseriesCacheTag] },
	),
);

export const getTraderAnalyticsTimeseries = cache(
	unstable_cache(
		async (address: string, range: AnalyticsRange): Promise<AnalyticsPoint[]> => {
			const client = getStructClient();
			if (!client) return [];
			try {
				return await fetchTimeBucketsWithPagination(
					(params) => client.analytics.getTraderTimeseries(params),
					{ address },
					range,
					`getTraderAnalyticsTimeseries:${address}`,
					RANGE_CONFIG,
					"carryForward",
				);
			} catch (error) {
				return handleDeltasError(
					`getTraderAnalyticsTimeseries:${address}:${range}`,
					error,
				);
			}
		},
		[structTraderAnalyticsTimeseriesCacheTag, "v3"],
		{ revalidate: 300, tags: [structTraderAnalyticsTimeseriesCacheTag] },
	),
);

export function summarizeAnalytics(points: AnalyticsPoint[]): AnalyticsSummary {
	if (points.length === 0) {
		return {
			totalVolumeUsd: 0,
			totalFeesUsd: 0,
			totalTxnCount: 0,
			uniqueTradersTotal: 0,
			avgTradeSizeUsd: 0,
		};
	}

	let totalVolumeUsd = 0;
	let totalFeesUsd = 0;
	let totalTxnCount = 0;
	let uniqueTradersTotal = 0;

	for (const p of points) {
		totalVolumeUsd += p.volumeUsd;
		totalFeesUsd += p.feesUsd;
		totalTxnCount += p.txnCount;
		uniqueTradersTotal += p.uniqueTraders;
	}

	const avgTradeSizeUsd = totalTxnCount > 0 ? totalVolumeUsd / totalTxnCount : 0;

	return {
		totalVolumeUsd,
		totalFeesUsd,
		totalTxnCount,
		uniqueTradersTotal,
		avgTradeSizeUsd,
	};
}
