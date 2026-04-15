import { parseAsString, parseAsStringLiteral } from "nuqs";

import {
	defaultMarketSortBy,
	defaultMarketSortDirection,
	defaultMarketTimeframe,
	marketSortByValues,
	marketSortDirectionValues,
	marketTimeframeValues,
} from "./market-search-params-shared";

export const marketSearchParamParsers = {
	sort_by: parseAsStringLiteral(marketSortByValues).withDefault(defaultMarketSortBy),
	sort_dir: parseAsStringLiteral(marketSortDirectionValues).withDefault(defaultMarketSortDirection),
	timeframe: parseAsStringLiteral(marketTimeframeValues).withDefault(defaultMarketTimeframe),
	cursor: parseAsString.withDefault(""),
};
