import { createParser, parseAsStringLiteral, type inferParserType } from "nuqs";

import {
	defaultTraderPositionSortBy,
	pnlTimeframeValues,
	positivePageParserDef,
	traderPositionSortByValues,
	traderSortDirectionValues,
	traderTabValues,
} from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>(positivePageParserDef).withDefault(1);

export const pnlTimeframeParser = parseAsStringLiteral(pnlTimeframeValues).withDefault("all");

export const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
	openSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.open),
	openSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	closedSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.closed),
	closedSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	pnlTimeframe: pnlTimeframeParser,
};

export type TraderSearchParams = inferParserType<typeof traderSearchParamParsers>;
