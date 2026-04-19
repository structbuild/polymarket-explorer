import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

import {
	DEFAULT_MARKET_STATUS_TAB,
	defaultMarketSortBy,
	defaultMarketSortDirection,
	defaultMarketTimeframe,
	marketSortByValues,
	marketSortDirectionValues,
	marketStatusTabValues,
	marketTimeframeValues,
} from "./market-search-params-shared";

const marketSearchParamParsers = {
	sort_by: parseAsStringLiteral(marketSortByValues).withDefault(defaultMarketSortBy),
	sort_dir: parseAsStringLiteral(marketSortDirectionValues).withDefault(defaultMarketSortDirection),
	timeframe: parseAsStringLiteral(marketTimeframeValues).withDefault(defaultMarketTimeframe),
	tab: parseAsStringLiteral(marketStatusTabValues).withDefault(DEFAULT_MARKET_STATUS_TAB),
	cursor: parseAsString.withDefault(""),
};

export const loadMarketSearchParams = createLoader(marketSearchParamParsers);
