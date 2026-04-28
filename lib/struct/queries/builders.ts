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

export const defaultBuilderTradesPageSize = 25;

export type GetBuilderTradesRequest = NonNullable<Parameters<StructClient["markets"]["getTrades"]>[0]>;
export type BuilderTradesPageOptions = Omit<GetBuilderTradesRequest, "builder_codes">;

export async function getBuildersPaginated(
	limit: number = defaultPageSize,
	offset: number = 0,
	sort: BuilderSortBy = "volume",
	timeframe: BuilderTimeframe = "lifetime",
): Promise<PaginatedResult<BuilderLatestRowWithMetadata>> {
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
	const client = getStructClient();
	const limit = options?.limit ?? defaultBuilderTradesPageSize;
	const builderCode = code.trim();

	if (!builderCode) {
		return emptyOffsetPage<Trade>(limit);
	}

	if (!client) {
		return emptyOffsetPage<Trade>(limit);
	}

	const offset = options?.offset ?? 0;
	const { sort_desc, trade_types, ...restOptions } = (options ?? {}) as BuilderTradesPageOptions;

	try {
		const response = await client.markets.getTrades({
			builder_codes: builderCode,
			...restOptions,
			limit: limit + 1,
			offset,
			sort_desc: sort_desc ?? true,
			trade_types: trade_types ?? "OrderFilled,OrdersMatched",
		});
		const normalizedBuilderCode = builderCode.toLowerCase();
		const matchingRows = response.data.filter(
			(trade) =>
				("builder_code" in trade ? trade.builder_code?.toLowerCase() : null) === normalizedBuilderCode,
		);
		const data = matchingRows.slice(0, limit);
		const hasMore = matchingRows.length > limit;
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

		logStructError(`getBuilderTradesPage:${builderCode}`, error);
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
