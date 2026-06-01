import { createParser, parseAsBoolean, parseAsStringLiteral, type inferParserType } from "nuqs";

import { POLYMARKET_CATEGORIES } from "./tag-category";
import {
	defaultTraderPositionSortBy,
	pnlAnchorValues,
	pnlTimeframeValues,
	positivePageParserDef,
	traderPositionSortByValues,
	traderSortDirectionValues,
	traderTabValues,
	unixSecondsParserDef,
} from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>(positivePageParserDef).withDefault(1);
const parseAsUnixSeconds = createParser<number>(unixSecondsParserDef);

export const pnlTimeframeParser = parseAsStringLiteral(pnlTimeframeValues).withDefault("all");
export const pnlAnchorParser = parseAsStringLiteral(pnlAnchorValues);
export const pnlFromParser = parseAsUnixSeconds;
export const pnlToParser = parseAsUnixSeconds;
export const pnlFillGapsParser = parseAsBoolean.withDefault(true);

export const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
	categoriesPage: parseAsPositivePage,
	marketsPage: parseAsPositivePage,
	winsPage: parseAsPositivePage,
	lossesPage: parseAsPositivePage,
	openSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.open),
	openSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	closedSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.closed),
	closedSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	positionsCategory: parseAsStringLiteral(POLYMARKET_CATEGORIES),
	pnlTimeframe: pnlTimeframeParser,
	pnlAnchor: pnlAnchorParser,
	pnlFrom: pnlFromParser,
	pnlTo: pnlToParser,
	pnlFillGaps: pnlFillGapsParser,
};

export type TraderSearchParams = inferParserType<typeof traderSearchParamParsers>;
