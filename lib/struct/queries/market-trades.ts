import "server-only";

import type { StructClient, Trade } from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	emptyOffsetPage,
	shortRevalidateSeconds,
} from "@/lib/struct/queries/_shared";
import type { PaginatedResource } from "@/lib/struct/types";

const structMarketCacheVersion = "v2";
export const structMarketTradesCacheTag = `struct-market-trades-${structMarketCacheVersion}`;

export const defaultMarketTradesPageSize = 25;

export type GetMarketTradesRequest = NonNullable<Parameters<StructClient["markets"]["getTrades"]>[0]>;
export type MarketTradesPageOptions = Omit<GetMarketTradesRequest, "condition_ids">;

const getMarketTradesPageCached = unstable_cache(
	async (conditionId: string, options?: MarketTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
		const client = getStructClient();
		const limit = options?.limit ?? defaultMarketTradesPageSize;

		if (!client) {
			return emptyOffsetPage<Trade>(limit);
		}

		const offset = options?.offset ?? 0;
		const { limit: _limit, offset: _offset, sort_desc, trade_types, ...restOptions } = (options ?? {}) as MarketTradesPageOptions;

		try {
			const response = await client.markets.getTrades({
				condition_ids: conditionId,
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

			logStructError(`getMarketTradesPage:${conditionId}`, error);
			return emptyOffsetPage<Trade>(limit);
		}
	},
	[structMarketTradesCacheTag],
	{ revalidate: shortRevalidateSeconds, tags: [structMarketTradesCacheTag] },
);

export const getMarketTradesPage = cache(
	async (conditionId: string, options?: MarketTradesPageOptions): Promise<PaginatedResource<Trade, number>> => {
		return getMarketTradesPageCached(conditionId, options);
	},
);

export async function getRecentTrades(limit: number = 10): Promise<Trade[]> {
	const client = getStructClient();

	if (!client) {
		return [];
	}

	try {
		const response = await client.markets.getTrades({
			limit,
			sort_desc: true,
			trade_types: "OrderFilled,OrdersMatched",
		});
		return response.data;
	} catch (error) {
		logStructError("getRecentTrades", error);
		return [];
	}
}
