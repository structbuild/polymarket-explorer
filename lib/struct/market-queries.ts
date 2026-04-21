export {
	getMarketBySlug,
	getTopMarkets,
	getHomeTopMarkets,
	getAllMarketSlugs,
	getPlatformCounts,
	structMarketBySlugCacheTag,
	structTopMarketsCacheTag,
	structAllMarketSlugsCacheTag,
	structPlatformCountsCacheTag,
} from "@/lib/struct/queries/markets";

export {
	defaultMarketTradesPageSize,
	getMarketTradesPage,
	getRecentTrades,
	structMarketTradesCacheTag,
} from "@/lib/struct/queries/market-trades";
export type {
	GetMarketTradesRequest,
	MarketTradesPageOptions,
} from "@/lib/struct/queries/market-trades";

export {
	getGlobalLeaderboard,
	getMarketHolders,
	getMarketHoldersHistory,
	structGlobalLeaderboardCacheTag,
	structMarketHoldersCacheTag,
	structMarketHoldersHistoryCacheTag,
} from "@/lib/struct/queries/market-holders";

export {
	getMarketChart,
	getMarketPriceJumps,
	getPositionVolumeChart,
	structMarketChartCacheTag,
	structMarketPriceJumpsCacheTag,
	structPositionVolumeChartCacheTag,
} from "@/lib/struct/queries/market-charts";

export {
	getAllTags,
	getMarketsByTag,
	getTagBySlug,
	getTagCount,
	getTagsPaginated,
	searchTags,
	structAllTagsCacheTag,
	structMarketsByTagCacheTag,
	structTagBySlugCacheTag,
} from "@/lib/struct/queries/market-tags";

export type { PaginatedResult } from "@/lib/struct/queries/_shared";
