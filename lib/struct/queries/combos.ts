import "server-only";

import type {
	AnalyticsChangeTimeframe,
	AnalyticsResolution,
	CandlestickResolution,
	ComboCandlesticksResponse,
	ComboGlobalAnalyticsBucketRow,
	ComboGlobalAnalyticsChanges,
	ComboGlobalAnalyticsCountsResponse,
	ComboMarket,
	ComboMarketSortBy,
	ComboMarketStatusFilter,
	ComboMarketTimeframe,
	ComboMetricsResponse,
	SortDirection,
	V31ComboPnlResponse,
} from "@structbuild/sdk";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import type { PaginatedResult } from "@/lib/struct/queries/_shared";
import { normalizeWalletAddress } from "@/lib/utils";

export type ComboMarketsFilters = {
	limit?: number;
	timeframe?: ComboMarketTimeframe;
	sortBy?: ComboMarketSortBy;
	sortDir?: SortDirection;
	status?: ComboMarketStatusFilter | null;
	creator?: string | null;
	legConditionId?: string | null;
	marketSlug?: string | null;
	eventSlug?: string | null;
	cursor?: string | null;
};

export async function getComboMarkets(
	filters: ComboMarketsFilters = {},
): Promise<PaginatedResult<ComboMarket>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	const {
		limit = 50,
		timeframe = "lifetime",
		sortBy = "usd_volume",
		sortDir = "desc",
		status,
		creator,
		legConditionId,
		marketSlug,
		eventSlug,
		cursor,
	} = filters;

	try {
		const response = await client.combos.getMarkets({
			limit,
			timeframe,
			sort_by: sortBy,
			sort_dir: sortDir,
			...(status ? { status } : {}),
			...(creator ? { creator } : {}),
			...(legConditionId ? { leg_condition_id: legConditionId } : {}),
			...(marketSlug ? { market_slug: marketSlug } : {}),
			...(eventSlug ? { event_slug: eventSlug } : {}),
			...(cursor ? { pagination_key: cursor } : {}),
		});
		const hasMore = response.pagination?.has_more ?? false;
		const nextKey = response.pagination?.pagination_key;
		return {
			data: response.data ?? [],
			hasMore,
			nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
		};
	} catch (error) {
		logStructError(`getComboMarkets:${sortBy}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export async function getComboMarketByConditionId(
	conditionId: string,
	timeframe: ComboMarketTimeframe = "lifetime",
): Promise<ComboMarket | null> {
	const client = getStructClient();

	if (!client || !conditionId) {
		return null;
	}

	try {
		const response = await client.combos.getMarkets({ condition_id: conditionId, timeframe, limit: 1 });
		return response.data?.[0] ?? null;
	} catch (error) {
		const status = readStatus(error);
		if (status === 404 || status === 400) {
			return null;
		}

		logStructError(`getComboMarketByConditionId:${conditionId}`, error);
		return null;
	}
}

export async function getComboMetrics(
	conditionId: string,
	timeframe = "all",
): Promise<ComboMetricsResponse | null> {
	const client = getStructClient();

	if (!client || !conditionId) {
		return null;
	}

	try {
		const response = await client.combos.getMetrics({ condition_id: conditionId, timeframe });
		return response.data ?? null;
	} catch (error) {
		const status = readStatus(error);
		if (status === 404 || status === 400) {
			return null;
		}

		logStructError(`getComboMetrics:${conditionId}`, error);
		return null;
	}
}

export async function getComboCandlesticks(
	conditionId: string,
	resolution: CandlestickResolution = "60",
	outcomeIndex = 0,
): Promise<ComboCandlesticksResponse | null> {
	const client = getStructClient();

	if (!client || !conditionId) {
		return null;
	}

	try {
		const response = await client.combos.getCandlesticks({
			condition_id: conditionId,
			outcome_index: outcomeIndex,
			resolution,
			count_back: 500,
		});
		return response.data ?? null;
	} catch (error) {
		const status = readStatus(error);
		if (status === 404 || status === 400) {
			return null;
		}

		logStructError(`getComboCandlesticks:${conditionId}`, error);
		return null;
	}
}

export async function getComboAnalyticsCounts(): Promise<ComboGlobalAnalyticsCountsResponse | null> {
	const client = getStructClient();

	if (!client) {
		return null;
	}

	try {
		const response = await client.combos.getAnalyticsCounts();
		return response.data ?? null;
	} catch (error) {
		logStructError("getComboAnalyticsCounts", error);
		return null;
	}
}

export async function getComboAnalyticsChanges(
	timeframe: AnalyticsChangeTimeframe = "24h",
): Promise<ComboGlobalAnalyticsChanges | null> {
	const client = getStructClient();

	if (!client) {
		return null;
	}

	try {
		const response = await client.combos.getAnalyticsChanges({ timeframe });
		return response.data ?? null;
	} catch (error) {
		logStructError(`getComboAnalyticsChanges:${timeframe}`, error);
		return null;
	}
}

export async function getComboAnalyticsTimeseries(
	resolution: AnalyticsResolution = "D",
	countBack = 90,
): Promise<ComboGlobalAnalyticsBucketRow[]> {
	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.combos.getAnalyticsTimeseries({ resolution, count_back: countBack });
		return response.data ?? [];
	} catch (error) {
		logStructError(`getComboAnalyticsTimeseries:${resolution}`, error);
		return [];
	}
}

export async function getTraderComboPnl(
	address: string,
	params: { positionId?: string | null; conditionId?: string | null },
): Promise<V31ComboPnlResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);
	const positionId = params.positionId ?? undefined;
	const conditionId = params.conditionId ?? undefined;

	if (!client || !normalizedAddress || (!positionId && !conditionId)) {
		return null;
	}

	try {
		const response = await client.trader.getTraderComboPnl({
			address: normalizedAddress,
			...(conditionId
				? { condition_id: conditionId }
				: positionId
					? { position_id: positionId }
					: {}),
		});
		return response.data ?? null;
	} catch (error) {
		const status = readStatus(error);
		if (status === 404 || status === 400) {
			return null;
		}

		logStructError(`getTraderComboPnl:${normalizedAddress}`, error);
		return null;
	}
}
