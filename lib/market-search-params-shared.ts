export const marketSortByValues = [
	"volume",
	"txns",
	"unique_traders",
	"liquidity",
	"holders",
	"end_time",
] as const;

export type MarketSortBy = (typeof marketSortByValues)[number];

export const marketSortDirectionValues = ["asc", "desc"] as const;
export type MarketSortDirection = (typeof marketSortDirectionValues)[number];

export const defaultMarketSortBy: MarketSortBy = "volume";
export const defaultMarketSortDirection: MarketSortDirection = "desc";
