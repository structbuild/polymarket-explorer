import "server-only";

import type {
	BuilderPctChange,
	BuilderTimeBucketRow,
	ChangeTimeframe,
	GlobalChangeTimeframe,
	GlobalPctChange,
	MetricPctChange,
	TimeBucketRow,
	TraderTimeBucketRow,
} from "@structbuild/sdk";
import { HttpError } from "@structbuild/sdk";
import type { HttpResponse } from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";

import { getStructClient } from "@/lib/struct/client";
import {
	type AnalyticsPoint,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsSummary,
} from "@/lib/struct/analytics-shared";

type RangeConfig = {
	resolution: AnalyticsResolution;
	countBack: number;
	paginate: boolean;
};

const RANGE_SECONDS: Record<Exclude<AnalyticsRange, "all">, number> = {
	"1d": 86400,
	"7d": 7 * 86400,
	"30d": 30 * 86400,
};

const ALL_RANGE_COUNT_BACK: Record<AnalyticsResolution, number> = {
	"60": 500,
	"240": 500,
	D: 500,
	W: 260,
	M: 120,
};

function computeCountBack(range: AnalyticsRange, resolution: AnalyticsResolution): number {
	if (range === "all") return ALL_RANGE_COUNT_BACK[resolution];
	const rangeSec = RANGE_SECONDS[range];
	const stepSec = FIXED_RESOLUTION_SECONDS[resolution];
	if (!stepSec) return 30;
	return Math.ceil(rangeSec / stepSec);
}

function buildRangeConfig(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): RangeConfig {
	return {
		resolution,
		countBack: computeCountBack(range, resolution),
		paginate: range === "all",
	};
}

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
export const structBuilderAnalyticsDeltasCacheTag = "struct-builder-analytics-deltas";
export const structBuilderAnalyticsChangesCacheTag = "struct-builder-analytics-changes";
export const structBuilderAnalyticsTimeseriesCacheTag = "struct-builder-analytics-timeseries";
export const structBuilderGlobalAnalyticsDeltasCacheTag = "struct-builder-global-analytics-deltas";
export const structBuilderGlobalAnalyticsChangesCacheTag = "struct-builder-global-analytics-changes";
export const structBuilderGlobalAnalyticsTimeseriesCacheTag = "struct-builder-global-analytics-timeseries";

const MAX_PAGINATION_REQUESTS = 5;

function toNumber(value: number | undefined | null): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

type AnyTimeBucketRow = TimeBucketRow | TraderTimeBucketRow | BuilderTimeBucketRow;

function mapRow(row: AnyTimeBucketRow): AnalyticsPoint {
	return {
		t: row.t,
		volumeUsd: toNumber(row.v),
		buyVolumeUsd: toNumber(row.bv),
		sellVolumeUsd: toNumber(row.sv),
		redemptionVolumeUsd: toNumber("rv" in row ? row.rv : 0),
		mergeVolumeUsd: toNumber("mv" in row ? row.mv : 0),
		splitVolumeUsd: toNumber("spv" in row ? row.spv : 0),
		yesVolumeUsd: toNumber(row.yv),
		noVolumeUsd: toNumber(row.nv),
		uniqueTraders: toNumber("ut" in row ? row.ut : 0),
		uniqueMakers: toNumber("um" in row ? row.um : 0),
		uniqueTakers: toNumber("uk" in row ? row.uk : 0),
		txnCount: toNumber(row.tc),
		buyCount: toNumber(row.bc),
		sellCount: toNumber(row.sc),
		redemptionCount: toNumber("rc" in row ? row.rc : 0),
		mergeCount: toNumber("mc" in row ? row.mc : 0),
		splitCount: toNumber("sp" in row ? row.sp : 0),
		yesCount: toNumber(row.yc),
		noCount: toNumber(row.nc),
		feesUsd: toNumber(row.f),
		builderFeesUsd: toNumber("bf" in row ? row.bf : 0),
		newUsers: toNumber("nu" in row ? row.nu : 0),
		avgRevenuePerUserUsd: toNumber("ar" in row ? row.ar : 0),
		avgVolumePerUserUsd: toNumber("av" in row ? row.av : 0),
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
		uniqueMakers: 0,
		uniqueTakers: 0,
		txnCount: 0,
		buyCount: 0,
		sellCount: 0,
		redemptionCount: 0,
		mergeCount: 0,
		splitCount: 0,
		yesCount: 0,
		noCount: 0,
		feesUsd: 0,
		builderFeesUsd: 0,
		newUsers: 0,
		avgRevenuePerUserUsd: 0,
		avgVolumePerUserUsd: 0,
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
	"60": 3600,
	"240": 14400,
	D: 86400,
	W: 604800,
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

	if (resolution === "M") {
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

async function fetchTimeBucketsWithPagination<
	Extra extends object,
	Row extends AnyTimeBucketRow,
>(
	fetchPage: (
		params: Extra & TimeBucketsPageParams,
	) => Promise<HttpResponse<Row[]>>,
	extraParams: Extra,
	config: RangeConfig,
	label: string,
	fillMode: BucketFillMode = "zero",
): Promise<AnalyticsPoint[]> {
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
			console.warn("%s pagination stopped at request %d", label, requests + 1, error);
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

		if (!config.paginate) break;

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

export async function getAnalyticsDeltas(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getDeltas(params),
			{},
			buildRangeConfig(range, resolution),
			`getAnalyticsDeltas:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getAnalyticsDeltas:${range}:${resolution}`,
			error,
		);
	}
}

export async function getAnalyticsChanges(range: AnalyticsRange): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAnalyticsChangesCacheTag);

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
}

export async function getMarketAnalyticsDeltas(
	conditionId: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getMarketDeltas(params),
			{ condition_id: conditionId },
			buildRangeConfig(range, resolution),
			`getMarketAnalyticsDeltas:${conditionId}:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getMarketAnalyticsDeltas:${conditionId}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getMarketAnalyticsChanges(
	conditionId: string,
	range: AnalyticsRange,
): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketAnalyticsChangesCacheTag);

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
}

export async function getTagAnalyticsDeltas(
	tag: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTagAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getTagDeltas(params),
			{ tag },
			buildRangeConfig(range, resolution),
			`getTagAnalyticsDeltas:${tag}:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getTagAnalyticsDeltas:${tag}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getTagAnalyticsChanges(
	tag: string,
	range: AnalyticsRange,
): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTagAnalyticsChangesCacheTag);

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
}

export async function getTraderAnalyticsDeltas(
	address: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTraderAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getTraderDeltas(params),
			{ address },
			buildRangeConfig(range, resolution),
			`getTraderAnalyticsDeltas:${address}:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getTraderAnalyticsDeltas:${address}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getTraderAnalyticsChanges(
	address: string,
	range: AnalyticsRange,
): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTraderAnalyticsChangesCacheTag);

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
}

export async function getAnalyticsTimeseries(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getTimeseries(params),
			{},
			buildRangeConfig(range, resolution),
			`getAnalyticsTimeseries:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getAnalyticsTimeseries:${range}:${resolution}`,
			error,
		);
	}
}

export async function getMarketAnalyticsTimeseries(
	conditionId: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getMarketTimeseries(params),
			{ condition_id: conditionId },
			buildRangeConfig(range, resolution),
			`getMarketAnalyticsTimeseries:${conditionId}:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getMarketAnalyticsTimeseries:${conditionId}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getTagAnalyticsTimeseries(
	tag: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTagAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getTagTimeseries(params),
			{ tag },
			buildRangeConfig(range, resolution),
			`getTagAnalyticsTimeseries:${tag}:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getTagAnalyticsTimeseries:${tag}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getTraderAnalyticsTimeseries(
	address: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTraderAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.analytics.getTraderTimeseries(params),
			{ address },
			buildRangeConfig(range, resolution),
			`getTraderAnalyticsTimeseries:${address}:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getTraderAnalyticsTimeseries:${address}:${range}:${resolution}`,
			error,
		);
	}
}

const BUILDER_GLOBAL_CHANGES_TIMEFRAME: Record<AnalyticsRange, GlobalChangeTimeframe> = {
	"1d": "24h",
	"7d": "7d",
	"30d": "30d",
	all: "1y",
};

function projectBuilderChanges(
	source: BuilderPctChange | GlobalPctChange,
): MetricPctChange {
	return {
		volume_usd: source.volume_usd,
		buy_volume_usd: source.buy_volume_usd,
		sell_volume_usd: source.sell_volume_usd,
		unique_traders: source.unique_traders,
		unique_makers: source.unique_makers,
		unique_takers: source.unique_takers,
		txn_count: source.txn_count,
		fees_usd: source.fees_usd,
		shares_volume: source.shares_volume,
		yes_volume_usd: source.yes_volume_usd,
		no_volume_usd: source.no_volume_usd,
	};
}

export async function getBuilderAnalyticsDeltas(
	builderCode: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.builders.getBuilderDeltas(params),
			{ builder_code: builderCode },
			buildRangeConfig(range, resolution),
			`getBuilderAnalyticsDeltas:${builderCode}:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getBuilderAnalyticsDeltas:${builderCode}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getBuilderAnalyticsTimeseries(
	builderCode: string,
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.builders.getBuilderTimeseries(params),
			{ builder_code: builderCode },
			buildRangeConfig(range, resolution),
			`getBuilderAnalyticsTimeseries:${builderCode}:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getBuilderAnalyticsTimeseries:${builderCode}:${range}:${resolution}`,
			error,
		);
	}
}

export async function getBuilderAnalyticsChanges(
	builderCode: string,
	range: AnalyticsRange,
): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderAnalyticsChangesCacheTag);

	const client = getStructClient();
	if (!client) return null;
	try {
		const response = await client.builders.getBuilderChanges({
			builder_code: builderCode,
			timeframe: CHANGES_TIMEFRAME[range],
		});
		return response.data ? projectBuilderChanges(response.data) : null;
	} catch (error) {
		return handleChangesError(
			`getBuilderAnalyticsChanges:${builderCode}:${range}`,
			error,
		);
	}
}

export async function getBuilderGlobalAnalyticsDeltas(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalAnalyticsDeltasCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.builders.getGlobalDeltas(params),
			{},
			buildRangeConfig(range, resolution),
			`getBuilderGlobalAnalyticsDeltas:${range}:${resolution}`,
		);
	} catch (error) {
		return handleDeltasError(
			`getBuilderGlobalAnalyticsDeltas:${range}:${resolution}`,
			error,
		);
	}
}

export async function getBuilderGlobalAnalyticsTimeseries(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): Promise<AnalyticsPoint[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalAnalyticsTimeseriesCacheTag);

	const client = getStructClient();
	if (!client) return [];
	try {
		return await fetchTimeBucketsWithPagination(
			(params) => client.builders.getGlobalTimeseries(params),
			{},
			buildRangeConfig(range, resolution),
			`getBuilderGlobalAnalyticsTimeseries:${range}:${resolution}`,
			"carryForward",
		);
	} catch (error) {
		return handleDeltasError(
			`getBuilderGlobalAnalyticsTimeseries:${range}:${resolution}`,
			error,
		);
	}
}

export async function getBuilderGlobalAnalyticsChanges(
	range: AnalyticsRange,
): Promise<MetricPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalAnalyticsChangesCacheTag);

	const client = getStructClient();
	if (!client) return null;
	try {
		const response = await client.builders.getGlobalChanges({
			timeframe: BUILDER_GLOBAL_CHANGES_TIMEFRAME[range],
		});
		return response.data ? projectBuilderChanges(response.data) : null;
	} catch (error) {
		return handleChangesError(`getBuilderGlobalAnalyticsChanges:${range}`, error);
	}
}

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
