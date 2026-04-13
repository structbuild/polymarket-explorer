import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

import {
	defaultMarketSortBy,
	defaultMarketSortDirection,
	marketSortByValues,
	marketSortDirectionValues,
} from "./market-search-params-shared";

const marketSearchParamParsers = {
	sort_by: parseAsStringLiteral(marketSortByValues).withDefault(defaultMarketSortBy),
	sort_dir: parseAsStringLiteral(marketSortDirectionValues).withDefault(defaultMarketSortDirection),
	cursor: parseAsString.withDefault(""),
};

export const loadMarketSearchParams = createLoader(marketSearchParamParsers);
