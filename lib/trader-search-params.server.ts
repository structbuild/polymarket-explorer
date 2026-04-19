import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

import {
	defaultTraderPositionSortBy,
	pnlTimeframeValues,
	positivePageParserDef,
	traderPositionSortByValues,
	traderSortDirectionValues,
	traderTabValues,
} from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>(positivePageParserDef).withDefault(1);

const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
	openSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.open),
	openSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	closedSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.closed),
	closedSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	pnlTimeframe: parseAsStringLiteral(pnlTimeframeValues).withDefault("1w"),
};

export const loadTraderSearchParams = createLoader(traderSearchParamParsers);
