export {
	getMarketBySlug,
	getTopMarkets,
	getHomeTopMarkets,
	getAllMarketSlugs,
	getPlatformCounts,
} from "@/lib/struct/queries/markets";

export {
	defaultMarketTradesPageSize,
	getMarketTradesPage,
	getRecentTrades,
} from "@/lib/struct/queries/market-trades";
export type {
	GetMarketTradesRequest,
	MarketTradesPageOptions,
} from "@/lib/struct/queries/market-trades";

export {
	getGlobalLeaderboard,
	getMarketHolders,
	getMarketHoldersHistory,
} from "@/lib/struct/queries/market-holders";

export {
	getMarketChart,
	getMarketPriceJumps,
	getPositionVolumeChart,
} from "@/lib/struct/queries/market-charts";

export {
	getAllTags,
	getMarketsByTag,
	getTagBySlug,
	getTagCount,
	getTagPageCount,
	getTagsPaginated,
	searchTags,
} from "@/lib/struct/queries/market-tags";

export type { PaginatedResult } from "@/lib/struct/queries/_shared";
