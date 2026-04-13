import { parseAsString, parseAsStringLiteral } from "nuqs";

import {
	defaultMarketSortBy,
	defaultMarketSortDirection,
	marketSortByValues,
	marketSortDirectionValues,
} from "./market-search-params-shared";

export const marketSearchParamParsers = {
	sort_by: parseAsStringLiteral(marketSortByValues).withDefault(defaultMarketSortBy),
	sort_dir: parseAsStringLiteral(marketSortDirectionValues).withDefault(defaultMarketSortDirection),
	cursor: parseAsString.withDefault(""),
};
