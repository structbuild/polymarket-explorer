import "server-only";

import type {
	AnalyticsResolution as StructAnalyticsResolution,
	BuilderFeeRate,
	BuilderFeeRateHistoryEntry,
	BuilderGlobalLatestRow,
	BuilderLatestRowWithMetadata,
	BuilderMetadata,
	BuilderSortBy,
	BuilderTagRow,
	BuilderTimeframe,
	CohortRetentionRow,
	BuilderMetadataInline,
	CompositionBucketRow,
	CompositionResponse,
	CompositionSeries,
	ConcentrationResponse,
	GlobalBuilderTagRow,
	GlobalChangeTimeframe,
	GlobalPctChange,
	TagBuilderRow,
	TopTraderRow,
	TopTradersSortBy,
	StructClient,
	Trade,
} from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	emptyOffsetPage,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";
import type { PaginatedResource } from "@/lib/struct/types";

export const structBuildersListCacheTag = "struct-builders-list";
export const structBuilderByCodeCacheTag = "struct-builder-by-code";
export const structBuilderMetadataCacheTag = "struct-builder-metadata";
export const structBuilderConcentrationCacheTag = "struct-builder-concentration";
export const structBuilderFeesCacheTag = "struct-builder-fees";
export const structBuilderFeesHistoryCacheTag = "struct-builder-fees-history";
export const structBuilderRetentionCacheTag = "struct-builder-retention";
export const structBuilderTagsCacheTag = "struct-builder-tags";
export const structBuilderTopTradersCacheTag = "struct-builder-top-traders";
export const structBuilderTradesCacheTag = "struct-builder-trades-v1";
export const structBuilderCompositionCacheTag = "struct-builder-composition";
export const structBuilderGlobalCacheTag = "struct-builder-global";
export const structBuilderGlobalChangesCacheTag = "struct-builder-global-changes";
export const structBuilderGlobalTagsCacheTag = "struct-builder-global-tags";
export const structTagBuildersCacheTag = "struct-tag-builders";
export const structAllBuilderCodesCacheTag = "struct-all-builder-codes";

export const defaultBuilderTradesPageSize = 25;

export type GetBuilderTradesRequest = NonNullable<Parameters<StructClient["markets"]["getTrades"]>[0]>;
export type BuilderTradesPageOptions = Omit<GetBuilderTradesRequest, "builder_codes">;

export async function getBuildersPaginated(
	limit: number = defaultPageSize,
	offset: number = 0,
	sort: BuilderSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
): Promise<PaginatedResult<BuilderLatestRowWithMetadata>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuildersListCacheTag);

	const client = getStructClient();
	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.builders.getBuilders({
			limit,
			offset,
			sort,
			sort_desc: true,
			timeframe,
		});
		const data = response.data ?? [];
		const hasMore = response.pagination?.has_more ?? data.length === limit;
		return {
			data,
			hasMore,
			nextCursor: hasMore ? String(offset + limit) : null,
		};
	} catch (error) {
		logStructError(`getBuildersPaginated:${sort}:${timeframe}:${offset}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export async function getAllBuilderCodes(maxCount?: number): Promise<{ code: string }[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAllBuilderCodesCacheTag);

	if (maxCount !== undefined && maxCount <= 0) return [];

	const client = getStructClient();
	if (!client) return [];

	const results: { code: string }[] = [];
	const batchSize = 250;
	let offset = 0;

	try {
		let requestCount = 0;
		while (true) {
			if (requestCount >= maxPaginationRequests) {
				logPaginationLimitReached("getAllBuilderCodes");
				break;
			}
			const response = await client.builders.getBuilders({
				limit: batchSize,
				offset,
				sort: "volume",
				timeframe: "lifetime",
			});
			const rows = response.data ?? [];
			for (const row of rows) {
				if (row.builder_code) {
					results.push({ code: row.builder_code });
					if (maxCount !== undefined && results.length >= maxCount) {
						return results;
					}
				}
			}
			requestCount += 1;
			if (rows.length < batchSize) break;
			offset += batchSize;
		}
		return results;
	} catch (error) {
		logStructError("getAllBuilderCodes", error);
		return results;
	}
}

export async function getBuilderByCode(
	code: string,
	timeframe: BuilderTimeframe = "lifetime",
): Promise<BuilderLatestRowWithMetadata | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderByCodeCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getBuilder({ builder_code: code, timeframe });
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderByCode:${code}:${timeframe}`, error);
		return null;
	}
}

export async function getBuilderMetadata(code: string): Promise<BuilderMetadata | null> {
	"use cache";
	cacheLife("hours");
	cacheTag(structBuilderMetadataCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getBuilderMetadata({ builder_code: code });
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderMetadata:${code}`, error);
		return null;
	}
}

export async function getBuilderConcentration(
	code: string,
	timeframe: BuilderTimeframe = "lifetime",
): Promise<ConcentrationResponse | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderConcentrationCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getBuilderConcentration({
			builder_code: code,
			timeframe,
		});
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderConcentration:${code}:${timeframe}`, error);
		return null;
	}
}

export async function getBuilderFees(code: string): Promise<BuilderFeeRate | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderFeesCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getBuilderFees({ builder_code: code });
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderFees:${code}`, error);
		return null;
	}
}

export async function getBuilderFeesHistory(
	code: string,
	limit: number = 100,
): Promise<BuilderFeeRateHistoryEntry[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderFeesHistoryCacheTag);

	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.builders.getBuilderFeesHistory({
			builder_code: code,
			limit,
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) return [];
		logStructError(`getBuilderFeesHistory:${code}`, error);
		return [];
	}
}

export async function getBuilderRetention(
	code: string,
	from?: number,
	to?: number,
): Promise<CohortRetentionRow[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderRetentionCacheTag);

	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.builders.getBuilderRetention({
			builder_code: code,
			...(from !== undefined ? { from } : {}),
			...(to !== undefined ? { to } : {}),
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) return [];
		logStructError(`getBuilderRetention:${code}`, error);
		return [];
	}
}

export async function getBuilderTags(
	code: string,
	sort: BuilderSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
	limit: number = 50,
): Promise<BuilderTagRow[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderTagsCacheTag);

	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.builders.getBuilderTags({
			builder_code: code,
			sort,
			timeframe,
			limit,
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) return [];
		logStructError(`getBuilderTags:${code}:${sort}:${timeframe}`, error);
		return [];
	}
}

export async function getBuilderTopTraders(
	code: string,
	sort: TopTradersSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
	limit: number = 50,
): Promise<TopTraderRow[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderTopTradersCacheTag);

	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.builders.getBuilderTopTraders({
			builder_code: code,
			sort_by: sort,
			timeframe,
			limit,
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) return [];
		logStructError(`getBuilderTopTraders:${code}:${sort}:${timeframe}`, error);
		return [];
	}
}

export async function getBuilderTradesPage(
	code: string,
	options?: BuilderTradesPageOptions,
): Promise<PaginatedResource<Trade, number>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderTradesCacheTag);

	const client = getStructClient();
	const limit = options?.limit ?? defaultBuilderTradesPageSize;

	if (!client) {
		return emptyOffsetPage<Trade>(limit);
	}

	const offset = options?.offset ?? 0;
	const { sort_desc, trade_types, ...restOptions } = (options ?? {}) as BuilderTradesPageOptions;

	try {
		const response = await client.markets.getTrades({
			builder_codes: code,
			...restOptions,
			limit: limit + 1,
			offset,
			sort_desc: sort_desc ?? true,
			trade_types: trade_types ?? "OrderFilled,OrdersMatched",
		});
		const data = response.data.slice(0, limit);
		const hasMore = response.data.length > limit;
		const nextCursor = hasMore ? offset + data.length : null;

		return {
			data,
			hasMore,
			nextCursor,
			pageSize: limit,
		};
	} catch (error) {
		if (readStatus(error) === 404) {
			return emptyOffsetPage<Trade>(limit);
		}

		logStructError(`getBuilderTradesPage:${code}`, error);
		return emptyOffsetPage<Trade>(limit);
	}
}

export type BuilderCompositionResult = {
	buckets: CompositionBucketRow[];
	builderMetadata: Record<string, BuilderMetadataInline>;
};

export async function getBuilderComposition(
	metric: BuilderSortBy = "volume",
	resolution: StructAnalyticsResolution = "60",
	countBack: number = 500,
	topN: number = 10,
	series: CompositionSeries = "cumulative",
	from?: number,
	to?: number,
): Promise<BuilderCompositionResult> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderCompositionCacheTag);

	const client = getStructClient();
	if (!client) {
		return { buckets: [], builderMetadata: {} };
	}

	try {
		const response = await client.builders.getComposition({
			metric,
			resolution,
			count_back: countBack,
			top_n: topN,
			series,
			...(from !== undefined ? { from } : {}),
			...(to !== undefined ? { to } : {}),
		});
		return parseCompositionResponse(response.data);
	} catch (error) {
		logStructError(
			`getBuilderComposition:${metric}:${resolution}:${countBack}:${topN}:${series}:${from ?? ""}:${to ?? ""}`,
			error,
		);
		return { buckets: [], builderMetadata: {} };
	}
}

function parseCompositionResponse(
	body: CompositionResponse | undefined,
): BuilderCompositionResult {
	const buckets = body?.data ?? [];
	const rawMeta = body?.builder_metadata as
		| Record<string, BuilderMetadataInline>
		| undefined;
	const builderMetadata =
		rawMeta !== undefined && rawMeta !== null && typeof rawMeta === "object"
			? rawMeta
			: {};
	return { buckets, builderMetadata };
}

export async function getBuilderGlobal(
	timeframe: BuilderTimeframe = "lifetime",
): Promise<BuilderGlobalLatestRow | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getGlobal({ timeframe });
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderGlobal:${timeframe}`, error);
		return null;
	}
}

export async function getBuilderGlobalChanges(
	timeframe: GlobalChangeTimeframe = "24h",
): Promise<GlobalPctChange | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalChangesCacheTag);

	const client = getStructClient();
	if (!client) return null;

	try {
		const response = await client.builders.getGlobalChanges({ timeframe });
		return response.data ?? null;
	} catch (error) {
		if (readStatus(error) === 404) return null;
		logStructError(`getBuilderGlobalChanges:${timeframe}`, error);
		return null;
	}
}

export async function getBuilderGlobalTags(
	sort: BuilderSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
	limit: number = 50,
	offset: number = 0,
): Promise<PaginatedResult<GlobalBuilderTagRow>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structBuilderGlobalTagsCacheTag);

	const client = getStructClient();
	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.builders.getGlobalTags({
			sort,
			timeframe,
			limit,
			offset,
		});
		const data = response.data ?? [];
		const hasMore = response.pagination?.has_more ?? data.length === limit;
		return {
			data,
			hasMore,
			nextCursor: hasMore ? String(offset + limit) : null,
		};
	} catch (error) {
		logStructError(`getBuilderGlobalTags:${sort}:${timeframe}:${offset}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export async function getTagBuilders(
	tag: string,
	sort: BuilderSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
	limit: number = 50,
): Promise<TagBuilderRow[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTagBuildersCacheTag);

	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.builders.getTagBuilders({
			tag,
			sort,
			timeframe,
			limit,
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) return [];
		logStructError(`getTagBuilders:${tag}:${sort}:${timeframe}`, error);
		return [];
	}
}
