import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "./timeframes";

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

export const marketTimeframeValues = METRICS_TIMEFRAMES;
export type MarketTimeframe = MetricsTimeframeChoice;

export const marketStatusTabValues = ["open", "closed"] as const;
export type MarketStatusTab = (typeof marketStatusTabValues)[number];
export const DEFAULT_MARKET_STATUS_TAB: MarketStatusTab = "open";

export function parseMarketStatusTab(value: string | string[] | undefined): MarketStatusTab {
	const raw = Array.isArray(value) ? value[0] : value;
	return marketStatusTabValues.includes(raw as MarketStatusTab)
		? (raw as MarketStatusTab)
		: DEFAULT_MARKET_STATUS_TAB;
}

export const defaultMarketSortBy: MarketSortBy = "volume";
export const defaultMarketSortDirection: MarketSortDirection = "desc";
export const defaultMarketTimeframe: MarketTimeframe = "24h";
