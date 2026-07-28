import { createLoader, createParser, parseAsBoolean, parseAsStringLiteral } from "nuqs/server";

import { POLYMARKET_CATEGORIES } from "./tag-category";
import {
	defaultTraderCategorySortBy,
	defaultTraderComboSortBy,
	defaultTraderComboStatusFilter,
	defaultTraderMarketSortBy,
	defaultTraderPositionSortBy,
	pnlAnchorValues,
	pnlTimeframeValues,
	positivePageParserDef,
	traderCategorySortByValues,
	traderComboSortByValues,
	traderComboStatusFilterValues,
	traderMarketSortByValues,
	traderPositionSortByValues,
	traderExitModeValues,
	traderComboFilterValues,
	traderSortDirectionValues,
	traderTabValues,
	unixSecondsParserDef,
} from "./trader-search-params-shared";

const parseAsPositivePage = createParser<number>(positivePageParserDef).withDefault(1);
const parseAsUnixSeconds = createParser<number>(unixSecondsParserDef);

const traderSearchParamParsers = {
	tab: parseAsStringLiteral(traderTabValues).withDefault("active"),
	openPage: parseAsPositivePage,
	closedPage: parseAsPositivePage,
	activityPage: parseAsPositivePage,
	categoriesPage: parseAsPositivePage,
	marketsPage: parseAsPositivePage,
	combosPage: parseAsPositivePage,
	winsPage: parseAsPositivePage,
	lossesPage: parseAsPositivePage,
	highlights: parseAsStringLiteral(traderExitModeValues).withDefault("wins"),
	openSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.open),
	openSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	closedSortBy: parseAsStringLiteral(traderPositionSortByValues).withDefault(defaultTraderPositionSortBy.closed),
	closedSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	categoriesSortBy: parseAsStringLiteral(traderCategorySortByValues).withDefault(defaultTraderCategorySortBy),
	categoriesSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	marketsSortBy: parseAsStringLiteral(traderMarketSortByValues).withDefault(defaultTraderMarketSortBy),
	marketsSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	combosSortBy: parseAsStringLiteral(traderComboSortByValues).withDefault(defaultTraderComboSortBy),
	combosSortDirection: parseAsStringLiteral(traderSortDirectionValues).withDefault("desc"),
	combosStatus: parseAsStringLiteral(traderComboStatusFilterValues).withDefault(defaultTraderComboStatusFilter),
	positionsCategory: parseAsStringLiteral(POLYMARKET_CATEGORIES),
	positionsCombo: parseAsStringLiteral(traderComboFilterValues).withDefault("all"),
	pnlTimeframe: parseAsStringLiteral(pnlTimeframeValues).withDefault("all"),
	pnlAnchor: parseAsStringLiteral(pnlAnchorValues),
	pnlFrom: parseAsUnixSeconds,
	pnlTo: parseAsUnixSeconds,
	pnlFillGaps: parseAsBoolean.withDefault(false),
};

export const loadTraderSearchParams = createLoader(traderSearchParamParsers);
